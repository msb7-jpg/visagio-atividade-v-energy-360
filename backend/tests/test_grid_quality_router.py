"""Testes das rotas /quality com app mínimo, serviço substituído e RBAC real (401, 403, 200, 404)."""

from datetime import UTC, datetime, timedelta

import jwt
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.core.constants import UserRole
from app.features.grid_quality.dependencies import get_grid_quality_service
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
ROUTES = ["/quality/indicators", "/quality/feeders", f"/quality/feeders/{FEEDER_ID}/history"]

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
    dec_limite_horas=10.0,
    fec_limite_vezes=5.0,
    delta_dec_horas=2.0,
    status=QualityStatus.VIOLACAO,
)
TIME_SERIES = FeederTimeSeriesDTO(
    id_alimentador=FEEDER_ID,
    pontos=[
        FeederTimeSeriesPointDTO(
            competencia="2000-01",
            dec_apurado_horas=12.0,
            fec_apurado_vezes=6.0,
            dec_limite_horas=10.0,
            fec_limite_vezes=5.0,
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

    async def get_feeder_history(self, id_alimentador, meses=24):
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
    async with AsyncClient(transport=ASGITransport(app=quality_app), base_url="http://test") as http_client:
        yield http_client


@pytest.mark.parametrize("route", ROUTES)
async def test_sem_token_retorna_401(client, route):
    assert (await client.get(route)).status_code == 401


@pytest.mark.parametrize("route", ROUTES)
async def test_token_invalido_retorna_401(client, route):
    response = await client.get(route, headers={"Authorization": "Bearer token.invalido"})

    assert response.status_code == 401


@pytest.mark.parametrize("route", ROUTES)
async def test_atendente_recebe_403_em_todas_as_rotas(client, route):
    response = await client.get(route, headers=bearer_for_role(UserRole.ATENDENTE))

    assert response.status_code == 403


@pytest.mark.parametrize(
    ("role", "expected_status"),
    [
        (UserRole.DIRETOR, 200),
        (UserRole.GERENTE_OPERACAO, 200),
        (UserRole.GERENTE_PERDAS, 403),
        (UserRole.GERENTE_ATENDIMENTO, 403),
        (UserRole.ATENDENTE, 403),
    ],
)
async def test_matriz_de_papeis_nos_indicadores(client, role, expected_status):
    response = await client.get("/quality/indicators", headers=bearer_for_role(role))

    assert response.status_code == expected_status


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


async def test_historico_usa_24_meses_por_padrao(client, stub_service):
    response = await client.get(f"/quality/feeders/{FEEDER_ID}/history", headers=bearer_for_role(UserRole.DIRETOR))

    assert response.status_code == 200
    assert stub_service.calls == [("history", FEEDER_ID, 24)]


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
    ],
    ids=["competencia_mes_13", "competencia_texto", "status_invalido", "meses_zero", "meses_acima_de_48"],
)
async def test_parametros_invalidos_retornam_422(client, invalid_query):
    route, params = invalid_query

    response = await client.get(route, params=params, headers=bearer_for_role(UserRole.DIRETOR))

    assert response.status_code == 422
