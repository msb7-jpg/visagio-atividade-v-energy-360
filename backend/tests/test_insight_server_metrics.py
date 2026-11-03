"""O insight usa as métricas que o servidor calcula no banco, nunca as enviadas pela tela."""

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.features.auth.schemas import UserDTO
from app.features.chat import router as chat_router
from app.features.chat.insight_metrics import server_metrics
from app.features.chat.schemas import ProactiveInsightsRequest, ProactiveInsightsResponse
from app.features.customer360.dependencies import get_customer360_service
from app.shared.exceptions import BadRequestException, ForbiddenException
from tests.customer360_seed import seed_customer360_tables

ATTENDANT = UserDTO(id="user-atendimento", email="atendimento@venergy.com", nome="Camila", role="atendente")


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        await seed_customer360_tables(connection)
    async with async_sessionmaker(engine, expire_on_commit=False)() as db_session:
        yield db_session
    await engine.dispose()


async def test_customer_metrics_come_from_the_database(session):
    metrics = await server_metrics("customer360", {"id_uc": "UC100003"}, ATTENDANT, session, get_settings())

    history = await get_customer360_service(session).get_history("UC100003")
    assert metrics["faturas_em_aberto"] == len(history.faturas_em_aberto)
    assert metrics["valor_em_aberto_rs"] == history.valor_em_aberto_rs
    assert metrics["leitura_estimada"] == "sim"
    assert metrics["possui_painel_solar"] == "não"


async def test_route_replaces_the_numbers_sent_by_the_screen(session, monkeypatch):
    received = {}

    async def capture(request):  # ruff: ignore[unused-async]
        received.update(request.metricas)
        return ProactiveInsightsResponse(insights=["ok"], resumo_executivo="ok")

    monkeypatch.setattr(chat_router, "resolve_configured_provider", lambda requested=None: "mock")
    monkeypatch.setattr(chat_router, "generate_proactive_insights_service", capture)
    request = ProactiveInsightsRequest(
        context="customer360", filtros={"id_uc": "UC100003"}, metricas={"faturas_em_aberto": 999, "valor_inventado": 1}
    )

    await chat_router.generate_proactive_insights(request, ATTENDANT, session, get_settings())

    assert "valor_inventado" not in received
    assert received["faturas_em_aberto"] != 999


@pytest.mark.parametrize(
    ("context", "filters", "error"),
    [
        ("executive", {}, ForbiddenException),
        ("customer360", {}, BadRequestException),
        ("tela_sem_insight", {}, BadRequestException),
    ],
    ids=["painel_so_para_diretor", "visao360_sem_uc", "tela_desconhecida"],
)
async def test_refuses_screens_the_profile_cannot_see_or_without_insight(session, context, filters, error):
    with pytest.raises(error):
        await server_metrics(context, filters, ATTENDANT, session, get_settings())
