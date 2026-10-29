import pytest
from httpx import AsyncClient

from tests.executive_dashboard_seed import seeded_client

INDICATORS_URL = "/api/v1/dashboard/indicators"
LOSSES_URL = "/api/v1/dashboard/losses"
WINDOWS = {"base_inicio": "2022-07", "base_fim": "2023-06", "atual_inicio": "2025-07", "atual_fim": "2026-06"}
DIRECTOR_EMAIL = "diretor@venergy.com"
SEEDED_TARIFF_RS_KWH = 0.9  # valor_total_rs / consumo_faturado_kwh das faturas semeadas


async def login(http_client: AsyncClient, email: str) -> dict[str, str]:
    response = await http_client.post("/api/v1/auth/login", json={"email": email, "senha": "venergy123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def indicators_by_id(body: dict) -> dict[str, dict]:
    return {indicator["id"]: indicator for group in body["grupos"] for indicator in group["indicadores"]}


@pytest.fixture
async def client():
    async with seeded_client() as http_client:
        yield http_client


@pytest.fixture
async def director_headers(client):
    return await login(client, DIRECTOR_EMAIL)


async def test_returns_401_without_token(client):
    assert (await client.get(INDICATORS_URL)).status_code == 401
    assert (await client.get(LOSSES_URL)).status_code == 401


async def test_returns_403_for_profiles_other_than_director(client):
    headers = await login(client, "operacao@venergy.com")

    assert (await client.get(INDICATORS_URL, headers=headers)).status_code == 403
    assert (await client.get(LOSSES_URL, headers=headers)).status_code == 403


async def test_defaults_to_case_periods_and_lists_all_groups(client, director_headers):
    response = await client.get(INDICATORS_URL, headers=director_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["base"] == {"competencia_inicio": "2022-07", "competencia_fim": "2023-06"}
    assert body["atual"] == {"competencia_inicio": "2025-07", "competencia_fim": "2026-06"}
    assert body["periodo_disponivel"] == {"competencia_inicio": "2022-07", "competencia_fim": "2026-06"}
    assert [group["id"] for group in body["grupos"]] == ["comercial", "cobranca", "rede", "atendimento", "medicao"]


async def test_commercial_indicators_match_revenue_kpis(client, director_headers):
    dashboard = indicators_by_id((await client.get(INDICATORS_URL, headers=director_headers)).json())
    kpis = (await client.get("/api/v1/revenue/kpis", params=WINDOWS, headers=director_headers)).json()

    pairs = {
        "faturamento": "faturamento_rs",
        "energia_faturada": "volume_kwh",
        "tarifa_media": "tarifa_media_rs_kwh",
        "ucs_ativas": "ucs_ativas",
    }
    for indicator_id, kpi_name in pairs.items():
        assert dashboard[indicator_id]["base"] == pytest.approx(kpis[kpi_name]["base"])
        assert dashboard[indicator_id]["atual"] == pytest.approx(kpis[kpi_name]["atual"])
        assert dashboard[indicator_id]["variacao_pct"] == pytest.approx(kpis[kpi_name]["variacao_pct"])
    assert dashboard["faturamento"]["base"] == pytest.approx(1920.0)
    assert dashboard["faturamento"]["atual"] == pytest.approx(3024.0)
    assert dashboard["faturamento"]["avaliacao"] == "MELHOROU"
    assert dashboard["tarifa_media"]["avaliacao"] == "INFORMATIVO"


async def test_area_indicators_from_seed(client, director_headers):
    indicators = indicators_by_id((await client.get(INDICATORS_URL, headers=director_headers)).json())

    expected = {
        "inadimplencia": (4.17, 5.95, 42.9, "PIOROU"),
        "dec_area": (2.0, 4.5, 125.0, "PIOROU"),
        "fec_area": (1.0, 1.5, 50.0, "PIOROU"),
        "satisfacao": (4.0, 3.5, -12.5, "PIOROU"),
        "tempo_resolucao": (15.0, 30.0, 100.0, "PIOROU"),
        "leituras_estimadas": (25.0, 8.33, -66.7, "MELHOROU"),
    }
    for indicator_id, (base, atual, variacao_pct, avaliacao) in expected.items():
        indicator = indicators[indicator_id]
        assert indicator["base"] == pytest.approx(base), indicator_id
        assert indicator["atual"] == pytest.approx(atual), indicator_id
        assert indicator["variacao_pct"] == pytest.approx(variacao_pct), indicator_id
        assert indicator["avaliacao"] == avaliacao, indicator_id
    assert indicators["inadimplencia"]["variacao_pp"] == pytest.approx(1.79)
    assert indicators["leituras_estimadas"]["variacao_pp"] == pytest.approx(-16.67)
    assert indicators["satisfacao"]["variacao_pp"] is None
    assert indicators["inadimplencia"]["detalhe"] == {
        "titulo": "Valor vencido", "unidade": "RS", "base": 80.0, "atual": 180.0
    }
    assert indicators["satisfacao"]["detalhe"] is None


async def test_solar_panels_have_no_variation_when_base_is_zero(client, director_headers):
    solar = indicators_by_id((await client.get(INDICATORS_URL, headers=director_headers)).json())[
        "clientes_painel_solar"
    ]

    assert (solar["base"], solar["atual"], solar["variacao_pct"]) == (0.0, 1.0, None)
    assert solar["avaliacao"] == "INFORMATIVO"


async def test_storm_warning_only_when_period_contains_july_2025(client, director_headers):
    with_storm = indicators_by_id((await client.get(INDICATORS_URL, headers=director_headers)).json())
    params = {**WINDOWS, "atual_inicio": "2025-08"}
    without_storm = indicators_by_id(
        (await client.get(INDICATORS_URL, params=params, headers=director_headers)).json()
    )

    assert "temporal" in with_storm["dec_area"]["aviso"]
    assert "temporal" in with_storm["fec_area"]["aviso"]
    assert with_storm["faturamento"]["aviso"] is None
    assert without_storm["dec_area"]["aviso"] is None


async def test_returns_400_for_overlapping_windows(client, director_headers):
    params = {**WINDOWS, "base_fim": "2025-08"}

    response = await client.get(INDICATORS_URL, params=params, headers=director_headers)

    assert response.status_code == 400


async def test_returns_404_without_billing_in_both_windows(client, director_headers):
    params = {"base_inicio": "2019-01", "base_fim": "2019-12", "atual_inicio": "2020-01", "atual_fim": "2020-12"}

    response = await client.get(INDICATORS_URL, params=params, headers=director_headers)

    assert response.status_code == 404


async def test_returns_422_for_malformed_competencia(client, director_headers):
    response = await client.get(INDICATORS_URL, params={**WINDOWS, "base_inicio": "2022-13"}, headers=director_headers)

    assert response.status_code == 422


async def test_missing_gold_table_returns_database_error_naming_it():
    async with seeded_client(skip_table="fato_atendimentos") as http_client:
        headers = await login(http_client, DIRECTOR_EMAIL)
        response = await http_client.get(INDICATORS_URL, headers=headers)

    assert response.status_code == 500
    assert response.json()["error_type"] == "DatabaseReadError"
    assert "fato_atendimentos" in response.json()["detail"]


async def test_losses_snapshot_uses_loss_queue_ranking(client, director_headers):
    response = await client.get(LOSSES_URL, headers=director_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["competencia_referencia"] == "2026-06"
    assert body["competencia_fixada"] is False
    assert body["ucs_na_fila"] == 1
    assert body["energia_recuperavel_kwh_mes"] == pytest.approx(70.0)
    assert body["valor_recuperavel_rs_ano"] == pytest.approx(70.0 * 12 * SEEDED_TARIFF_RS_KWH)
    assert body["taxa_acerto_pct"] == pytest.approx(50.0)
    assert body["inspecoes_avaliadas"] == 2
