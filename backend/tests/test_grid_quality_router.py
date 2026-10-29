"""Testes das rotas /quality com app mínimo, serviço substituído e RBAC real (401, 403, 200, 404)."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.core.constants import UserRole
from app.features.grid_quality.continuity_schemas import (
    AffectedCustomerDTO,
    ContinuityKpisDTO,
    ContinuitySnapshotDTO,
    PeriodComparisonDTO,
)
from app.features.grid_quality.dependencies import get_continuity_service, get_grid_quality_service
from app.features.grid_quality.router import router
from app.features.grid_quality.schemas import (
    FeederRankingDTO,
    FeederTimeSeriesDTO,
    FeederTimeSeriesPointDTO,
    QualityIndicatorsDTO,
    QualityStatus,
)
from app.shared.error_handlers import register_exception_handlers
from app.shared.exceptions import NotFoundException

FEEDER_ID = "ALIM-TESTE-01"
MISSING_FEEDER_ID = "ALIM-TESTE-99"
ROUTES = [
    "/quality/indicators",
    "/quality/feeders",
    f"/quality/feeders/{FEEDER_ID}/history",
    "/quality/continuity",
    f"/quality/feeders/{FEEDER_ID}/customers",
]
AFFECTED_CUSTOMER = AffectedCustomerDTO(
    id_uc="UC-TESTE-01",
    nome_titular="TITULAR TESTE",
    bairro="CENTRO",
    municipio="RECIFE",
    horas_sem_energia=8.0,
    ocorrencias=2,
)
COMPARISON = PeriodComparisonDTO(current=2.0, previous=1.0, change_percent=100.0)
CONTINUITY = ContinuitySnapshotDTO(
    kpis=ContinuityKpisDTO(dec=COMPARISON, fec=COMPARISON, interruptions=COMPARISON, average_duration_hours=COMPARISON),
    event=None,
    municipalities=[],
    feeders=[],
    causes=[],
    types=[],
)

# Valores fictícios e redondos: não representam nenhum dado do case.
INDICATORS = QualityIndicatorsDTO(
    competencia="2000-01",
    dec_medio_horas=10.0,
    fec_medio_vezes=5.0,
    total_alimentadores=2,
    alimentadores_em_violacao=1,
    percentual_violacao=50.0,
)
RANKING_ENTRY = FeederRankingDTO(
    id_alimentador=FEEDER_ID,
    competencia="2000-01",
    dec_apurado_horas=12.0,
    fec_apurado_vezes=6.0,
    dec_acumulado_ano_horas=12.0,
    fec_acumulado_ano_vezes=6.0,
    dec_limite_horas=10.0,
    fec_limite_vezes=5.0,
    delta_dec_horas=2.0,
    status=QualityStatus.VIOLACAO,
    conjunto_aneel="MEDIANA RMR",
    criterio_limite="MEDIANA_RMR",
    ucs_atendidas=200,
)
TIME_SERIES = FeederTimeSeriesDTO(
    id_alimentador=FEEDER_ID,
    pontos=[
        FeederTimeSeriesPointDTO(
            competencia="2000-01",
            dec_apurado_horas=12.0,
            fec_apurado_vezes=6.0,
            dec_acumulado_ano_horas=12.0,
            fec_acumulado_ano_vezes=6.0,
            dec_limite_horas=10.0,
            fec_limite_vezes=5.0,
            conjunto_aneel="MEDIANA RMR",
            criterio_limite="MEDIANA_RMR",
            ucs_atendidas=200,
        )
    ],
)


class StubQualityService:
    """Serviço fictício que devolve respostas fixas e registra os parâmetros recebidos."""

    def __init__(self) -> None:
        self.calls: list[tuple] = []

    async def get_indicators(self, competencia=None):
        """Registra o pedido e devolve indicadores fixos."""
        self.calls.append(("indicators", competencia))
        return INDICATORS

    async def list_feeders(self, competencia=None, status=None):
        """Registra o pedido e devolve um ranking fixo."""
        self.calls.append(("feeders", competencia, status))
        return [RANKING_ENTRY]

    async def get_snapshot(self, municipio=None, incluir_evento=True):
        """Registra o pedido e devolve uma Continuidade fixa."""
        self.calls.append(("continuity", municipio, incluir_evento))
        return CONTINUITY

    async def get_affected_customers(self, id_alimentador, meses=12, limite=10):
        """Registra o pedido e devolve um ranking fixo de clientes."""
        self.calls.append(("customers", id_alimentador, meses, limite))
        return [AFFECTED_CUSTOMER]

    async def get_feeder_history(self, id_alimentador, meses=48):
        """Registra o pedido; levanta NotFoundException para o alimentador inexistente."""
        self.calls.append(("history", id_alimentador, meses))
        if id_alimentador == MISSING_FEEDER_ID:
            raise NotFoundException(f"Alimentador '{id_alimentador}' sem dados de qualidade.")
        return TIME_SERIES


def bearer_for_role(role: UserRole) -> dict[str, str]:
    """Gera o cabeçalho Authorization com um JWT assinado direto, sem login."""
    settings = get_settings()
    claims = {
        "sub": f"user-{role.value}",
        "email": f"{role.value}@venergy.com",
        "nome": role.value,
        "role": role.value,
        "exp": datetime.now(UTC) + timedelta(minutes=5),
    }
    token = jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def stub_service():
    """Serviço fictício compartilhado entre a rota e o teste."""
    return StubQualityService()


@pytest.fixture
async def client(stub_service):
    """Cliente HTTP sobre um app mínimo com o router de qualidade e o serviço substituído."""
    quality_app = FastAPI()
    register_exception_handlers(quality_app)
    quality_app.include_router(router)
    quality_app.dependency_overrides[get_grid_quality_service] = lambda: stub_service
    quality_app.dependency_overrides[get_continuity_service] = lambda: stub_service
    async with AsyncClient(transport=ASGITransport(app=quality_app), base_url="http://test") as http_client:
        yield http_client


@pytest.mark.parametrize("route", ROUTES)
async def test_sem_token_retorna_401(client, route):
    assert (await client.get(route)).status_code == 401


@pytest.mark.parametrize("route", ROUTES)
@pytest.mark.parametrize(
    ("role", "expected_status"),
    [(UserRole.DIRETOR, 200), (UserRole.GERENTE_OPERACAO, 200), (UserRole.ATENDENTE, 403)],
)
async def test_matriz_de_papeis_em_todas_as_rotas(client, route, role, expected_status):
    response = await client.get(route, headers=bearer_for_role(role))

    assert response.status_code == expected_status


async def test_continuidade_repassa_filtros_e_responde_em_camel_case(client, stub_service):
    response = await client.get(
        "/quality/continuity",
        params={"municipio": "Recife", "incluir_evento": "false"},
        headers=bearer_for_role(UserRole.GERENTE_OPERACAO),
    )

    assert response.status_code == 200
    assert response.json()["kpis"]["averageDurationHours"]["changePercent"] == pytest.approx(100.0)
    assert response.json()["event"] is None
    assert stub_service.calls == [("continuity", "Recife", False)]


async def test_continuidade_inclui_o_evento_por_padrao(client, stub_service):
    await client.get("/quality/continuity", headers=bearer_for_role(UserRole.DIRETOR))

    assert stub_service.calls == [("continuity", None, True)]


async def test_clientes_usam_12_meses_e_10_clientes_por_padrao(client, stub_service):
    response = await client.get(f"/quality/feeders/{FEEDER_ID}/customers", headers=bearer_for_role(UserRole.DIRETOR))

    assert response.status_code == 200
    assert response.json() == [AFFECTED_CUSTOMER.model_dump()]
    assert stub_service.calls == [("customers", FEEDER_ID, 12, 10)]


async def test_clientes_repassam_meses_e_limite(client, stub_service):
    await client.get(
        f"/quality/feeders/{FEEDER_ID}/customers",
        params={"meses": 48, "limite": 50},
        headers=bearer_for_role(UserRole.GERENTE_OPERACAO),
    )

    assert stub_service.calls == [("customers", FEEDER_ID, 48, 50)]


async def test_indicadores_devolvem_o_payload_do_servico(client, stub_service):
    response = await client.get("/quality/indicators", headers=bearer_for_role(UserRole.GERENTE_OPERACAO))

    assert response.json() == INDICATORS.model_dump()
    assert stub_service.calls == [("indicators", None)]


async def test_ranking_repassa_competencia_e_status_ao_servico(client, stub_service):
    response = await client.get(
        "/quality/feeders",
        params={"competencia": "2000-01", "status": "violacao"},
        headers=bearer_for_role(UserRole.DIRETOR),
    )

    assert response.status_code == 200
    assert response.json()[0]["id_alimentador"] == FEEDER_ID
    assert stub_service.calls == [("feeders", "2000-01", QualityStatus.VIOLACAO)]


async def test_historico_usa_48_meses_por_padrao(client, stub_service):
    response = await client.get(f"/quality/feeders/{FEEDER_ID}/history", headers=bearer_for_role(UserRole.DIRETOR))

    assert response.status_code == 200
    assert stub_service.calls == [("history", FEEDER_ID, 48)]


async def test_historico_de_alimentador_inexistente_retorna_404(client):
    response = await client.get(
        f"/quality/feeders/{MISSING_FEEDER_ID}/history", headers=bearer_for_role(UserRole.DIRETOR)
    )

    assert response.status_code == 404
    assert response.json()["error_type"] == "NotFoundException"


@pytest.mark.parametrize(
    "invalid_query",
    [
        ("/quality/indicators", {"competencia": "2000-13"}),
        ("/quality/indicators", {"competencia": "abc"}),
        ("/quality/feeders", {"status": "inexistente"}),
        (f"/quality/feeders/{FEEDER_ID}/history", {"meses": 0}),
        (f"/quality/feeders/{FEEDER_ID}/history", {"meses": 49}),
        (f"/quality/feeders/{FEEDER_ID}/customers", {"meses": 0}),
        (f"/quality/feeders/{FEEDER_ID}/customers", {"meses": 49}),
        (f"/quality/feeders/{FEEDER_ID}/customers", {"limite": 0}),
        (f"/quality/feeders/{FEEDER_ID}/customers", {"limite": 51}),
    ],
    ids=[
        "competencia_mes_13",
        "competencia_texto",
        "status_invalido",
        "meses_zero",
        "meses_acima_de_48",
        "clientes_meses_zero",
        "clientes_meses_acima_de_48",
        "clientes_limite_zero",
        "clientes_limite_acima_de_50",
    ],
)
async def test_parametros_invalidos_retornam_422(client, invalid_query):
    route, params = invalid_query

    response = await client.get(route, params=params, headers=bearer_for_role(UserRole.DIRETOR))

    assert response.status_code == 422


async def test_ranking_e_historico_expoem_os_campos_do_acumulado_no_ano(client):
    headers = bearer_for_role(UserRole.DIRETOR)

    ranking_entry = (await client.get("/quality/feeders", headers=headers)).json()[0]
    history_point = (await client.get(f"/quality/feeders/{FEEDER_ID}/history", headers=headers)).json()["pontos"][0]

    for payload in (ranking_entry, history_point):
        assert payload["dec_acumulado_ano_horas"] == pytest.approx(12.0)
        assert payload["fec_acumulado_ano_vezes"] == pytest.approx(6.0)
        assert payload["criterio_limite"] == "MEDIANA_RMR"
        assert payload["ucs_atendidas"] == 200
