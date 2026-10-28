"""Contrato da nova tela Fila de Inspeção: score 0-100, situação da UC, filtros, resumo e opções de filtro."""

import pytest
from httpx import AsyncClient
from sqlalchemy import create_engine, text

from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import SuspicionFilters, build_windows
from app.features.loss_management.queue_query import suspicious_profiles_query
from app.features.loss_management.queue_summary import FieldHitRate, hit_rate_dto
from app.features.loss_management.schemas import (
    InspectionStatus,
    QueueSituation,
    SuspicionReason,
    SuspiciousUnitsFilterDTO,
)
from app.features.loss_management.scoring import (
    TARIFA_MEDIA_RS_KWH,
    TAXA_ACERTO_GERAL,
    ConsumptionProfile,
    QueueCandidates,
    build_suspicious_unit,
    rank_suspicious_units,
)
from app.features.loss_management.service import LossService
from app.main import app
from tests.test_loss_router import BASE_URL, auth_headers, open_client


def make_profile(id_uc: str, base_kwh: float, recent_kwh: float, zero_months: int = 0) -> ConsumptionProfile:
    return ConsumptionProfile(
        id_uc=id_uc,
        municipio="Recife",
        bairro="Boa Viagem",
        classe_consumo="Residencial",
        consumo_base_kwh=base_kwh,
        consumo_recente_kwh=recent_kwh,
        meses_zerados=zero_months,
    )


BIG_DROP = make_profile("UC_GRANDE", base_kwh=300, recent_kwh=50)  # kWh esperado 750 x 0,93 = 697,5
SMALL_DROP = make_profile("UC_MEDIA", base_kwh=200, recent_kwh=80)  # kWh esperado 360 x 0,93 = 334,8
ZERO_ONLY = make_profile("UC_ZERADA", base_kwh=100, recent_kwh=90, zero_months=1)  # 30 x 0,627 = 18,8


# --- contrato de cada item da fila -------------------------------------------------------------------------------


def test_reference_tariff_matches_the_design():
    assert pytest.approx(0.714) == TARIFA_MEDIA_RS_KWH


def test_unit_exposes_monthly_energy_and_annual_value():
    unit = build_suspicious_unit(BIG_DROP)

    assert unit is not None
    assert unit.kwh_mes_recuperavel == pytest.approx(250.0)
    assert unit.valor_ano_rs == pytest.approx(250.0 * 12 * 0.714)
    assert unit.kwh_estimado_recuperar == pytest.approx(750.0)
    assert unit.valor_estimado_recuperar_rs == pytest.approx(750.0 * 0.714)


def test_unit_starts_in_the_queue_without_an_order():
    unit = build_suspicious_unit(BIG_DROP)

    assert unit is not None
    assert unit.situacao == QueueSituation.NA_FILA


# --- score 0 a 100: kWh esperado relativo ao topo da fila ---------------------------------------------------------


def test_score_is_the_expected_kwh_relative_to_the_top_of_the_queue():
    ranked = rank_suspicious_units([SMALL_DROP, BIG_DROP], limit=10)

    assert [(unit.id_uc, unit.score) for unit in ranked] == [("UC_GRANDE", 100), ("UC_MEDIA", 48)]


def test_score_is_never_below_zero_or_above_one_hundred():
    ranked = rank_suspicious_units([BIG_DROP, SMALL_DROP, ZERO_ONLY], limit=10)

    assert all(0 <= unit.score <= 100 for unit in ranked)


def test_motive_filter_keeps_only_units_with_that_motive():
    ranked = rank_suspicious_units([BIG_DROP, ZERO_ONLY], limit=10, reason=SuspicionReason.LEITURA_ZERADA)

    assert [unit.id_uc for unit in ranked] == ["UC_ZERADA"]


def test_score_does_not_change_when_a_filter_hides_the_top_unit():
    ranked = rank_suspicious_units([BIG_DROP, ZERO_ONLY], limit=10, reason=SuspicionReason.LEITURA_ZERADA)

    assert ranked[0].score == 3  # 18,8 / 697,5, e não 100 só porque a maior saiu da lista


def test_limit_is_applied_after_the_filters():
    profiles = [BIG_DROP, SMALL_DROP, ZERO_ONLY]

    ranked = rank_suspicious_units(profiles, limit=1, reason=SuspicionReason.LEITURA_ZERADA)

    assert [unit.id_uc for unit in ranked] == ["UC_ZERADA"]


# --- situação da UC a partir das ordens ativas ---------------------------------------------------------------------


class FakeQueueRepository:
    def __init__(self, candidates: QueueCandidates) -> None:
        self.candidates = candidates

    async def fetch_consumption_profiles(self, filters: SuspicionFilters) -> QueueCandidates:
        del filters
        return self.candidates


async def test_units_with_an_active_order_are_marked_by_the_order_status():
    candidates = QueueCandidates(
        profiles=[BIG_DROP, SMALL_DROP, ZERO_ONLY],
        field_history_applied=True,
        active_orders={"UC_GRANDE": InspectionStatus.GERADA, "UC_MEDIA": InspectionStatus.PENDENTE},
    )
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]

    queue = await service.list_suspicious_units(SuspiciousUnitsFilterDTO())

    situations = {unit.id_uc: unit.situacao for unit in queue.itens}
    assert situations == {
        "UC_GRANDE": QueueSituation.ORDEM_GERADA,
        "UC_MEDIA": QueueSituation.EM_CAMPO,
        "UC_ZERADA": QueueSituation.NA_FILA,
    }


async def test_service_applies_the_motive_filter():
    candidates = QueueCandidates(profiles=[BIG_DROP, SMALL_DROP, ZERO_ONLY], field_history_applied=True)
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]
    queue_filter = SuspiciousUnitsFilterDTO(motivo=SuspicionReason.QUEDA_SUBITA)

    queue = await service.list_suspicious_units(queue_filter)

    assert [unit.id_uc for unit in queue.itens] == ["UC_GRANDE", "UC_MEDIA"]


async def test_queue_reports_the_total_before_the_limit_cut():
    candidates = QueueCandidates(profiles=[BIG_DROP, SMALL_DROP, ZERO_ONLY], field_history_applied=True)
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]

    queue = await service.list_suspicious_units(SuspiciousUnitsFilterDTO(limit=1))

    assert (len(queue.itens), queue.total) == (1, 3)


async def test_queue_total_respects_the_filters():
    candidates = QueueCandidates(profiles=[BIG_DROP, SMALL_DROP, ZERO_ONLY], field_history_applied=True)
    service = LossService(repository=FakeQueueRepository(candidates))  # type: ignore[arg-type]

    queue = await service.list_suspicious_units(SuspiciousUnitsFilterDTO(motivo=SuspicionReason.LEITURA_ZERADA))

    assert queue.total == 1


# --- a consulta da fila passa a trazer UCs com ordem ativa ---------------------------------------------------------

ACTIVE_ORDER_FIXTURE_STATEMENTS = (
    "CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)",
    (
        "CREATE TABLE dim_unidade_consumidora "
        "(id_uc TEXT, municipio TEXT, bairro TEXT, classe_consumo TEXT, possui_gd BOOLEAN)"
    ),
    "CREATE TABLE fato_inspecoes_perdas (id_uc TEXT, data_inspecao TEXT)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_ORDEM', 'Recife', 'Centro', 'Residencial', 0)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_LIVRE', 'Recife', 'Centro', 'Residencial', 0)",
    "INSERT INTO dim_unidade_consumidora VALUES ('UC_CONCLUIDA', 'Recife', 'Centro', 'Residencial', 0)",
    (
        "INSERT INTO fato_medicao VALUES "
        "('UC_ORDEM', '2025-06', 300), ('UC_ORDEM', '2025-11', 50), ('UC_ORDEM', '2025-12', 50), "
        "('UC_ORDEM', '2026-01', 50), ('UC_LIVRE', '2025-06', 300), ('UC_LIVRE', '2025-11', 50), "
        "('UC_LIVRE', '2025-12', 50), ('UC_LIVRE', '2026-01', 50), ('UC_CONCLUIDA', '2025-06', 300), "
        "('UC_CONCLUIDA', '2025-11', 50), ('UC_CONCLUIDA', '2025-12', 50), ('UC_CONCLUIDA', '2026-01', 50)"
    ),
    (
        "INSERT INTO ordem_inspecao (id_uc, status, kwh_estimado, criado_por, criado_em, atualizado_em) VALUES "
        "('UC_ORDEM', 'gerada', 0, 'x', '2026-01-10 00:00:00', '2026-01-10 00:00:00'), "
        "('UC_CONCLUIDA', 'concluida', 0, 'x', '2025-12-10 00:00:00', '2025-12-10 00:00:00')"
    ),
)


def test_queue_query_keeps_units_with_an_active_order_but_not_recently_completed_ones():
    engine = create_engine("sqlite://")
    InspectionOrder.__table__.create(engine)
    with engine.begin() as connection:
        for ddl_statement in ACTIVE_ORDER_FIXTURE_STATEMENTS:
            connection.execute(text(ddl_statement))
        query = suspicious_profiles_query(build_windows("2026-01"), SuspicionFilters(limiar_queda=0.5))

        candidate_ids = sorted(row.id_uc for row in connection.execute(query))

    assert candidate_ids == ["UC_LIVRE", "UC_ORDEM"]


# --- endpoints (banco em memória com o seed de test_loss_router) ---------------------------------------------------


@pytest.fixture
async def client():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def test_queue_marks_a_unit_after_its_order_is_generated(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")
    await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    units = {unit["id_uc"]: unit for unit in response.json()["itens"]}
    assert units["UC_FRAUDE"]["situacao"] == "ordem_gerada"
    assert units["UC_INSPECAO_ANTIGA"]["situacao"] == "na_fila"
    assert units["UC_FRAUDE"]["score"] == 100


async def test_queue_accepts_the_motive_query_param(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers, params={"motivo": "leitura_zerada"})

    assert [unit["id_uc"] for unit in response.json()["itens"]] == ["UC_ZERADA"]


async def test_summary_reports_capacity_selected_energy_and_expected_return(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")
    await client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_FRAUDE"})

    response = await client.get(
        f"{BASE_URL}/queue-summary", headers=headers, params=[("ucs", "UC_INSPECAO_ANTIGA"), ("ucs", "UC_FRAUDE")]
    )

    assert response.status_code == 200
    summary = response.json()
    assert summary["capacidade_total"] == 200
    assert summary["capacidade_programada"] == 1
    # UC_FRAUDE já tem ordem e não conta como selecionada; UC_INSPECAO_ANTIGA: déficit de 150 kWh/mês.
    assert summary["selecionadas"] == 1
    assert summary["kwh_mes_selecionadas"] == pytest.approx(150.0)
    assert summary["valor_ano_selecionadas_rs"] == pytest.approx(150.0 * 12 * 0.714)
    assert summary["tarifa_rs_kwh"] == pytest.approx(0.714)
    assert summary["taxa_acerto"] == {
        "inspecoes_total": 2,
        "irregularidades_confirmadas": 1,
        "taxa": 0.5,
        "periodo_inicio": "2023-05",
        "periodo_fim": "2025-08",
    }
    assert summary["retorno_esperado_kwh_mes"] == pytest.approx(75.0)


async def test_summary_without_selection_has_zero_energy(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/queue-summary", headers=headers)

    summary = response.json()
    assert (summary["selecionadas"], summary["kwh_mes_selecionadas"], summary["capacidade_programada"]) == (0, 0, 0)


async def test_queue_filters_list_available_municipalities_and_classes(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/queue-filters", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"municipios": ["Recife"], "classes": ["Residencial"]}


async def test_new_endpoints_are_forbidden_for_other_roles(client: AsyncClient):
    headers = await auth_headers(client, "atendimento@venergy.com")

    summary = await client.get(f"{BASE_URL}/queue-summary", headers=headers)
    filters = await client.get(f"{BASE_URL}/queue-filters", headers=headers)

    assert (summary.status_code, filters.status_code) == (403, 403)


def test_ranking_without_limit_returns_every_unit_and_an_empty_queue_has_no_score():
    assert len(rank_suspicious_units([BIG_DROP, SMALL_DROP, ZERO_ONLY], limit=None)) == 3
    assert rank_suspicious_units([], limit=None) == []


@pytest.mark.parametrize("rate", [None, FieldHitRate(total=0, confirmed=0, first_date=None, last_date=None)])
def test_hit_rate_without_history_falls_back_to_the_measured_general_rate(rate):
    result = hit_rate_dto(rate)

    assert (result.taxa, result.inspecoes_total, result.periodo_inicio) == (TAXA_ACERTO_GERAL, None, None)


async def test_summary_ignores_units_that_left_the_queue(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/queue-summary", headers=headers, params=[("ucs", "UC_NORMAL")])

    assert (response.json()["selecionadas"], response.json()["kwh_mes_selecionadas"]) == (0, 0)


async def test_summary_rejects_a_selection_larger_than_twice_the_monthly_capacity(client: AsyncClient):
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(
        f"{BASE_URL}/queue-summary", headers=headers, params=[("ucs", f"UC{index}") for index in range(401)]
    )

    assert response.status_code == 422
