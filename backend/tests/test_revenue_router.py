import pytest
from httpx import AsyncClient

from tests.revenue_seed import seeded_client

URL = "/api/v1/revenue/decomposition"
KPIS_URL = "/api/v1/revenue/kpis"
BREAKDOWN_URL = "/api/v1/revenue/breakdown"
HISTORY_URL = "/api/v1/revenue/history"
HISTORY_PARAMS = {"municipio": "RECIFE", "bairro": "BOA VIAGEM", "competencia_fim": "2026-06"}
WINDOWS = {"base_inicio": "2022-07", "base_fim": "2023-06", "atual_inicio": "2025-07", "atual_fim": "2026-06"}
DIRECTOR_EMAIL = "diretor@venergy.com"


async def login(http_client: AsyncClient, email: str) -> dict[str, str]:
    response = await http_client.post("/api/v1/auth/login", json={"email": email, "senha": "venergy123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
async def client():
    async with seeded_client() as http_client:
        yield http_client


@pytest.fixture
async def director_headers(client):
    return await login(client, DIRECTOR_EMAIL)


async def test_director_gets_total_decomposition_from_seed(client, director_headers):
    response = await client.get(URL, params=WINDOWS, headers=director_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["receita_base_rs"] == pytest.approx(65040.0)
    assert body["receita_atual_rs"] == pytest.approx(62452.8)
    assert body["variacao_rs"] == pytest.approx(-2587.2)
    assert body["efeito_preco_rs"] == pytest.approx(1824.0)
    assert body["efeito_cruzado_rs"] == pytest.approx(-19.2)
    assert len(body["segmentos"]) == 4
    effect_names = ("efeito_preco_rs", "efeito_volume_rs", "efeito_mix_rs", "efeito_cruzado_rs")
    effects_total = sum(body[effect_name] for effect_name in effect_names)
    assert effects_total == pytest.approx(body["variacao_rs"], abs=0.05)


async def test_filter_by_neighborhood_returns_single_segment(client, director_headers):
    params = {**WINDOWS, "bairro": "VARADOURO"}

    response = await client.get(URL, params=params, headers=director_headers)

    assert response.status_code == 200
    body = response.json()
    assert [segment["bairro"] for segment in body["segmentos"]] == ["VARADOURO"]
    assert body["efeito_preco_rs"] == pytest.approx(384.0)
    assert body["efeito_volume_rs"] == pytest.approx(768.0)
    assert body["efeito_cruzado_rs"] == pytest.approx(76.8)
    assert body["efeito_mix_rs"] == pytest.approx(0.0)


async def test_returns_404_when_filters_match_no_billing(client, director_headers):
    params = {**WINDOWS, "bairro": "BAIRRO INEXISTENTE"}

    response = await client.get(URL, params=params, headers=director_headers)

    assert response.status_code == 404


async def test_returns_400_when_windows_overlap(client, director_headers):
    params = {**WINDOWS, "atual_inicio": "2023-01", "atual_fim": "2023-12"}

    response = await client.get(URL, params=params, headers=director_headers)

    assert response.status_code == 400


async def test_returns_422_when_competencia_has_wrong_format(client, director_headers):
    params = {**WINDOWS, "base_inicio": "2022-7"}

    response = await client.get(URL, params=params, headers=director_headers)

    assert response.status_code == 422


async def test_kpis_return_executive_indicators_from_seed(client, director_headers):
    response = await client.get(KPIS_URL, params=WINDOWS, headers=director_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["faturamento_rs"] == {"base": 65040.0, "atual": 62452.8, "variacao_pct": -4.0}
    assert body["volume_kwh"] == {"base": 106800.0, "atual": 100560.0, "variacao_pct": -5.8}
    assert body["ticket_medio_rs"]["base"] == pytest.approx(1084.0)
    assert body["ucs_ativas"]["atual"] == 5


async def test_kpis_return_404_when_filters_match_no_billing(client, director_headers):
    params = {**WINDOWS, "municipio": "CIDADE INEXISTENTE"}

    response = await client.get(KPIS_URL, params=params, headers=director_headers)

    assert response.status_code == 404


@pytest.mark.parametrize("url", [URL, KPIS_URL, BREAKDOWN_URL])
async def test_kpis_and_breakdown_require_director(client, url):
    assert (await client.get(url, params=WINDOWS)).status_code == 401
    operacao_headers = await login(client, "operacao@venergy.com")
    assert (await client.get(url, params=WINDOWS, headers=operacao_headers)).status_code == 403


async def test_breakdown_ranks_neighborhoods_by_largest_volume_loss(client, director_headers):
    response = await client.get(BREAKDOWN_URL, params=WINDOWS, headers=director_headers)

    assert response.status_code == 200
    body = response.json()
    assert [item["bairro"] for item in body["items"]] == ["CASA AMARELA", "BOA VIAGEM", "PIEDADE", "VARADOURO"]
    assert body["items"][0]["efeito_volume_rs"] == pytest.approx(-4200.0)
    assert body["total"] == 4
    assert body["total_pages"] == 1


async def test_breakdown_by_city_and_class(client, director_headers):
    by_city = await client.get(BREAKDOWN_URL, params={**WINDOWS, "nivel": "municipio"}, headers=director_headers)
    by_class = await client.get(BREAKDOWN_URL, params={**WINDOWS, "nivel": "classe_consumo"}, headers=director_headers)

    cities = [item["municipio"] for item in by_city.json()["items"]]
    classes = sorted(item["classe_consumo"] for item in by_class.json()["items"])
    assert cities[0] == "RECIFE"
    assert by_city.json()["total"] == 3
    assert classes == ["Comercial", "Industrial", "Residencial"]


async def test_breakdown_paginates_and_sorts_descending(client, director_headers):
    params = {**WINDOWS, "page": 2, "page_size": 3, "ordem": "desc"}

    response = await client.get(BREAKDOWN_URL, params=params, headers=director_headers)

    body = response.json()
    assert response.status_code == 200
    assert body["page"] == 2
    assert body["total_pages"] == 2
    assert [item["bairro"] for item in body["items"]] == ["CASA AMARELA"]


@pytest.mark.parametrize("extra", [{"nivel": "rua"}, {"ordenar_por": "nome"}, {"page": 0}, {"page_size": 101}])
async def test_breakdown_returns_422_for_invalid_query(client, director_headers, extra):
    response = await client.get(BREAKDOWN_URL, params={**WINDOWS, **extra}, headers=director_headers)

    assert response.status_code == 422


async def test_history_returns_continuous_monthly_series_with_gaps_filled(client, director_headers):
    response = await client.get(HISTORY_URL, params=HISTORY_PARAMS, headers=director_headers)

    assert response.status_code == 200
    points = response.json()["pontos"]
    assert len(points) == 24
    assert points[0]["competencia"] == "2024-07"
    assert points[0]["volume_kwh"] == pytest.approx(0.0)
    assert points[0]["tarifa_media_rs_kwh"] is None
    assert points[-1]["competencia"] == "2026-06"
    assert points[-1]["volume_kwh"] == pytest.approx(1400.0)
    assert points[-1]["receita_rs"] == pytest.approx(1232.0)
    assert points[-1]["tarifa_media_rs_kwh"] == pytest.approx(0.88)


async def test_history_respects_months_and_class_filter(client, director_headers):
    params = {**HISTORY_PARAMS, "meses": 12, "classe_consumo": "Residencial"}

    response = await client.get(HISTORY_URL, params=params, headers=director_headers)

    body = response.json()
    assert response.status_code == 200
    assert len(body["pontos"]) == 12
    assert body["classe_consumo"] == "Residencial"


async def test_history_returns_404_for_unknown_neighborhood(client, director_headers):
    params = {**HISTORY_PARAMS, "bairro": "BAIRRO INEXISTENTE"}

    response = await client.get(HISTORY_URL, params=params, headers=director_headers)

    assert response.status_code == 404


async def test_history_requires_director(client):
    assert (await client.get(HISTORY_URL, params=HISTORY_PARAMS)).status_code == 401
    operacao_headers = await login(client, "operacao@venergy.com")
    assert (await client.get(HISTORY_URL, params=HISTORY_PARAMS, headers=operacao_headers)).status_code == 403


@pytest.mark.parametrize(
    "extra", [{"meses": 0}, {"meses": 61}, {"competencia_fim": "2026-6"}]
)
async def test_history_returns_422_for_invalid_query(client, director_headers, extra):
    response = await client.get(HISTORY_URL, params={**HISTORY_PARAMS, **extra}, headers=director_headers)

    assert response.status_code == 422


async def test_history_returns_422_without_neighborhood(client, director_headers):
    params = {"competencia_fim": "2026-06"}

    response = await client.get(HISTORY_URL, params=params, headers=director_headers)

    assert response.status_code == 422
