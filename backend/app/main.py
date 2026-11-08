"""Ponto de entrada principal da API FastAPI do V-Energy Grid 360."""

import asyncio
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.profiler import QueryProfilerMiddleware
from app.db.session import AsyncSessionLocal, engine
from app.features.executive_dashboard.warmup import warm_up_dashboard
from app.features.loss_management.schema_upgrade import upgrade_inspection_table
from app.features.loss_management.warmup import warm_up_loss_screens
from app.shared.error_handlers import register_exception_handlers

configure_logging()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gerencia ciclo de vida dos recursos assíncronos e encerramento do pool."""
    del app
    # Tabelas operacionais escritas pela API (as tabelas Gold vêm do pipeline); cria ou atualiza colunas novas
    await upgrade_inspection_table()
    # Painel do Diretor: consultas de segundos sobre milhões de linhas, calculadas uma vez em segundo plano
    dashboard_warm_up = asyncio.create_task(warm_up_dashboard(AsyncSessionLocal, settings))
    # Gestão de perdas: backtest da Efetividade (vem do disco quando os dados não mudaram) e, depois, a Fila de
    # Inspeção e o Fora da fila, cuja primeira abertura varreria a carteira inteira
    loss_warm_up = asyncio.create_task(warm_up_loss_screens(AsyncSessionLocal, settings))
    warm_ups = (dashboard_warm_up, loss_warm_up)
    try:
        yield
    finally:
        for warm_up in warm_ups:
            warm_up.cancel()
        # Espera as tarefas terminarem antes de fechar o banco, para nenhuma consulta ficar com a conexão fechada
        await asyncio.gather(*warm_ups, return_exceptions=True)
        await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        version=settings.project_version,
        description="Plataforma de Inteligência Analítica e Operacional V-Energy Grid 360",
        lifespan=lifespan,
    )

    app.add_middleware(QueryProfilerMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/health", tags=["Saúde do Sistema"])
    async def health_check() -> dict[str, str]:
        return {
            "status": "ok",
            "service": settings.project_name,
            "version": settings.project_version,
        }

    return app


app = create_app()
