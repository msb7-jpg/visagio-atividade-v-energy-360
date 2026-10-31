"""Detalhe de uma UC da Fila de Inspeção: identificação, motivo, conta do score, 12 meses e inspeções anteriores."""

from datetime import date, timedelta

import pytest
from sqlalchemy import text

from app.db.session import get_db
from app.features.loss_management.detail_repository import UnitDetailRepository
from app.features.loss_management.detail_schemas import PriorInspectionDTO, PriorInspectionSource
from app.features.loss_management.schemas import SuspicionReason
from app.features.loss_management.scoring import ConsumptionProfile, detect_reasons
from app.features.loss_management.unit_detail import (
    explain_reasons,
    fill_monthly_series,
    series_competencias,
    sort_prior_inspections,
)
from app.main import app
from tests.test_loss_router import BASE_URL, COMPETENCIAS, auth_headers, open_client

DETAIL_URL = f"{BASE_URL}/suspicious-units"
LAST_TWELVE_COMPETENCIAS = COMPETENCIAS[-12:]
QUEUED_UNITS = ["UC_FRAUDE", "UC_INSPECAO_ANTIGA", "UC_ZERADA"]


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def run_sql(statement: str) -> None:
    async for session in app.dependency_overrides[get_db]():
        await session.execute(text(statement))
        await session.commit()


async def get_detail(client, id_uc: str, email: str = "perdas@venergy.com"):
    headers = await auth_headers(client, email)
    return await client.get(f"{DETAIL_URL}/{id_uc}", headers=headers)


async def open_order(client, id_uc: str) -> int:
    headers = await auth_headers(client, "perdas@venergy.com")
    created = await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": id_uc})
    return created.json()["id_inspecao"]


async def move_order(client, id_inspecao: int, payload: dict) -> None:
    headers = await auth_headers(client, "perdas@venergy.com")
    response = await client.patch(f"{BASE_URL}/inspections/{id_inspecao}", headers=headers, json=payload)
    assert response.status_code == 200


async def test_detail_of_a_queued_unit_has_identification_and_reason(client):
    response = await get_detail(client, "UC_FRAUDE")

    assert response.status_code == 200
    detail = response.json()
    assert (detail["id_uc"], detail["municipio"], detail["bairro"], detail["classe_consumo"]) == (
        "UC_FRAUDE", "Recife", "Centro", "Residencial",
    )
    assert (detail["situacao"], detail["motivos"], detail["competencia_referencia"]) == (
        "na_fila", ["queda_subita"], "2026-01",
    )
    # Razões recente/base do seed: 0,133; 0,167; 0,2; 0,25; 0,833 e 1,0 (a UC sem leitura recente fica de fora).
    # Mediana = (0,2 + 0,25) / 2 = 0,225; queda da UC_FRAUDE além da carteira = 1 - 0,1667 / 0,225 = 26%.
    assert detail["motivo_resumo"] == (
        "Consumo médio de 50 kWh/mês nas 3 últimas competências, 83% abaixo da média de 300 kWh/mês "
        "do período anterior (até 12 competências). Descontada a variação da carteira (mediana em 22% do "
        "consumo base), a queda da UC é de 26%; nessa situação, 93% das inspeções históricas acharam "
        "irregularidade."
    )


@pytest.mark.parametrize("id_uc", QUEUED_UNITS)
async def test_score_breakdown_matches_the_queue_list(client, id_uc):
    headers = await auth_headers(client, "perdas@venergy.com")
    queue = (await client.get(DETAIL_URL, headers=headers)).json()["itens"]
    listed_unit = next(unit for unit in queue if unit["id_uc"] == id_uc)
    top_expected_kwh = queue[0]["kwh_estimado_recuperar"] * queue[0]["probabilidade_acerto"]

    breakdown = (await get_detail(client, id_uc)).json()["decomposicao_score"]

    assert breakdown["kwh_janela_recuperavel"] == listed_unit["kwh_estimado_recuperar"]
    assert breakdown["kwh_mes_recuperavel"] == listed_unit["kwh_mes_recuperavel"]
    assert breakdown["probabilidade_acerto"] == listed_unit["probabilidade_acerto"]
    assert breakdown["kwh_esperado"] == pytest.approx(
        breakdown["kwh_janela_recuperavel"] * breakdown["probabilidade_acerto"]
    )
    assert breakdown["maior_kwh_esperado_fila"] == pytest.approx(top_expected_kwh)
    assert breakdown["score"] == listed_unit["score"]
    assert round(breakdown["kwh_esperado"] / breakdown["maior_kwh_esperado_fila"] * 100) == breakdown["score"]


async def test_top_of_the_queue_has_score_100_and_equals_its_own_expected_kwh(client):
    breakdown = (await get_detail(client, "UC_FRAUDE")).json()["decomposicao_score"]

    assert breakdown["score"] == 100
    assert breakdown["meses_janela_recuperacao"] == 3
    assert breakdown["kwh_esperado"] == pytest.approx(breakdown["maior_kwh_esperado_fila"])


async def test_monthly_consumption_has_twelve_ordered_months_ending_at_the_reference(client):
    detail = (await get_detail(client, "UC_FRAUDE")).json()

    months = [point["competencia"] for point in detail["consumo_mensal"]]
    assert months == LAST_TWELVE_COMPETENCIAS
    assert months == sorted(months)
    assert months[-1] == detail["competencia_referencia"]
    assert {point["consumo_kwh"] for point in detail["consumo_mensal"][:-3]} == {300.0}


async def test_month_without_reading_or_with_invalid_reading_is_null_not_zero(client):
    await run_sql("DELETE FROM fato_medicao WHERE id_uc = 'UC_FRAUDE' AND competencia = '2025-06'")
    await run_sql("UPDATE fato_medicao SET consumo_kwh = -5 WHERE id_uc = 'UC_FRAUDE' AND competencia = '2025-07'")

    detail = (await get_detail(client, "UC_FRAUDE")).json()

    consumption_by_month = {point["competencia"]: point["consumo_kwh"] for point in detail["consumo_mensal"]}
    assert consumption_by_month["2025-06"] is None
    assert consumption_by_month["2025-07"] is None
    assert consumption_by_month["2025-05"] == pytest.approx(300.0)
    assert len(detail["consumo_mensal"]) == 12


async def test_zero_reading_stays_zero_in_the_series(client):
    detail = (await get_detail(client, "UC_ZERADA")).json()

    consumption_by_month = {point["competencia"]: point["consumo_kwh"] for point in detail["consumo_mensal"]}
    assert consumption_by_month["2025-12"] == pytest.approx(0.0)
    assert detail["motivos"] == ["leitura_zerada"]
    assert detail["motivo_resumo"] == "1 mês com leitura zerada nas 3 últimas competências."


async def test_unit_without_previous_inspection_has_an_empty_list(client):
    detail = (await get_detail(client, "UC_FRAUDE")).json()

    assert detail["inspecoes_anteriores"] == []


async def test_unit_with_previous_field_inspection_lists_date_result_and_inspector(client):
    detail = (await get_detail(client, "UC_INSPECAO_ANTIGA")).json()

    assert detail["inspecoes_anteriores"] == [
        {
            "origem": "historico_campo",
            "data_inspecao": "2023-05-02",
            "irregularidade_constatada": False,
            "inspetor": "INSP-001",
        }
    ]


async def test_detail_works_when_the_field_history_table_does_not_exist():
    engine, http_client = await open_client(with_gold_tables=True, with_field_history=False)
    async with http_client:
        response = await get_detail(http_client, "UC_FRAUDE")
    app.dependency_overrides.clear()
    await engine.dispose()

    assert response.status_code == 200
    assert response.json()["inspecoes_anteriores"] == []


async def test_unknown_unit_is_404_with_a_registry_message(client):
    response = await get_detail(client, "UC_QUE_NAO_EXISTE")

    assert response.status_code == 404
    assert "não encontrada no cadastro" in response.json()["detail"]


@pytest.mark.parametrize("id_uc", ["UC_NORMAL", "UC_SOLAR", "UC_INSPECIONADA", "UC_SEM_LEITURA"])
async def test_registered_unit_outside_the_queue_is_404_with_a_queue_message(client, id_uc):
    response = await get_detail(client, id_uc)

    assert response.status_code == 404
    assert "não está na fila de inspeção" in response.json()["detail"]


async def test_unit_with_active_order_opens_with_the_order_situation(client):
    id_inspecao = await open_order(client, "UC_FRAUDE")
    generated = (await get_detail(client, "UC_FRAUDE")).json()["situacao"]

    await move_order(client, id_inspecao, {"status": "pendente"})
    in_field = (await get_detail(client, "UC_FRAUDE")).json()["situacao"]

    assert (generated, in_field) == ("ordem_gerada", "em_campo")


async def test_unit_with_completed_order_leaves_the_queue_and_is_404(client):
    id_inspecao = await open_order(client, "UC_FRAUDE")
    await move_order(client, id_inspecao, {"status": "pendente"})
    await move_order(client, id_inspecao, {"status": "concluida", "irregularidade_constatada": True})

    response = await get_detail(client, "UC_FRAUDE")

    assert response.status_code == 404


async def test_unit_with_cancelled_order_returns_to_the_queue_and_opens(client):
    id_inspecao = await open_order(client, "UC_FRAUDE")
    await move_order(
        client,
        id_inspecao,
        {"status": "cancelada", "motivo_cancelamento": "outro", "justificativa_cancelamento": "Teste"},
    )

    response = await get_detail(client, "UC_FRAUDE")

    assert response.status_code == 200
    assert response.json()["situacao"] == "na_fila"


@pytest.mark.parametrize("reason", ["cliente_regularizou", "endereco_nao_localizado"])
async def test_unit_cancelled_for_a_reason_that_makes_a_new_visit_useless_is_404(client, reason):
    id_inspecao = await open_order(client, "UC_FRAUDE")
    await move_order(client, id_inspecao, {"status": "cancelada", "motivo_cancelamento": reason})

    response = await get_detail(client, "UC_FRAUDE")

    assert response.status_code == 404
    assert "não está na fila de inspeção" in response.json()["detail"]


@pytest.mark.parametrize("reason", ["ordem_duplicada", "repriorizacao_equipe"])
async def test_unit_cancelled_for_a_reason_that_keeps_the_suspicion_returns_to_the_queue(client, reason):
    id_inspecao = await open_order(client, "UC_FRAUDE")
    await move_order(client, id_inspecao, {"status": "cancelada", "motivo_cancelamento": reason})

    response = await get_detail(client, "UC_FRAUDE")

    assert response.status_code == 200
    assert response.json()["situacao"] == "na_fila"


async def test_completed_portal_order_is_listed_as_a_previous_inspection(client):
    inspection_day = date.today() - timedelta(days=1)
    id_inspecao = await open_order(client, "UC_FRAUDE")
    await move_order(client, id_inspecao, {"status": "pendente"})
    await move_order(
        client,
        id_inspecao,
        {
            "status": "concluida",
            "irregularidade_constatada": True,
            "inspetor": "INSP-007",
            "data_inspecao": inspection_day.isoformat(),
        },
    )

    async for session in app.dependency_overrides[get_db]():
        inspections = await UnitDetailRepository(session).fetch_prior_inspections("UC_FRAUDE", None)

    assert inspections == [
        PriorInspectionDTO(
            origem=PriorInspectionSource.ORDEM_PORTAL,
            data_inspecao=inspection_day,
            irregularidade_constatada=True,
            inspetor="INSP-007",
        )
    ]


def make_profile(base_kwh: float, recent_kwh: float, zero_months: int = 0) -> ConsumptionProfile:
    return ConsumptionProfile(
        id_uc="UC_X",
        municipio=None,
        bairro=None,
        classe_consumo=None,
        consumo_base_kwh=base_kwh,
        consumo_recente_kwh=recent_kwh,
        meses_zerados=zero_months,
    )


def test_reason_text_uses_brazilian_thousands_separator_and_both_reasons():
    profile = make_profile(1500.0, 1000.0, zero_months=2)
    reasons = [SuspicionReason.QUEDA_MODERADA, SuspicionReason.LEITURA_ZERADA]

    sentence = explain_reasons(profile, reasons, portfolio_ratio=0.8)

    assert sentence == (
        "Consumo médio de 1.000 kWh/mês nas 3 últimas competências, 33% abaixo da média de 1.500 kWh/mês "
        "do período anterior (até 12 competências). Descontada a variação da carteira (mediana em 80% do "
        "consumo base), a queda da UC é de 17%; nessa situação, 8% das inspeções históricas acharam "
        "irregularidade. 2 meses com leitura zerada nas 3 últimas competências."
    )


@pytest.mark.parametrize(
    ("base_kwh", "recent_kwh", "portfolio_ratio", "relative_drop", "hit_percent"),
    [
        (300.0, 150.0, 1.0, 50, 93),
        (300.0, 200.0, 1.0, 33, 92),
        (300.0, 230.0, 1.0, 23, 92),
        (300.0, 230.0, 0.9, 15, 8),
    ],
)
def test_reason_text_discounts_the_portfolio_and_gives_the_historical_hit_rate(
    base_kwh, recent_kwh, portfolio_ratio, relative_drop, hit_percent
):
    profile = make_profile(base_kwh, recent_kwh)

    sentence = explain_reasons(profile, detect_reasons(profile), portfolio_ratio=portfolio_ratio)

    assert f"a queda da UC é de {relative_drop}%; nessa situação, {hit_percent}% das inspeções históricas" in sentence


def test_series_crosses_the_year_boundary_and_keeps_twelve_months():
    competencias = series_competencias("2026-02")

    assert competencias[0] == "2025-03"
    assert competencias[-1] == "2026-02"
    assert len(competencias) == 12


def test_fill_series_turns_missing_months_into_none():
    series = fill_monthly_series(["2026-01", "2026-02", "2026-03"], {"2026-01": 10.0, "2026-03": 0.0})

    assert [point.consumo_kwh for point in series] == [10.0, None, 0.0]


def make_inspection(inspection_date: date | None) -> PriorInspectionDTO:
    return PriorInspectionDTO(
        origem=PriorInspectionSource.ORDEM_PORTAL,
        data_inspecao=inspection_date,
        irregularidade_constatada=None,
        inspetor=None,
    )


def test_prior_inspections_are_sorted_newest_first_with_undated_last():
    inspections = [make_inspection(None), make_inspection(date(2025, 1, 1)), make_inspection(date(2025, 6, 1))]

    ordered = sort_prior_inspections(inspections)

    assert [item.data_inspecao for item in ordered] == [date(2025, 6, 1), date(2025, 1, 1), None]
