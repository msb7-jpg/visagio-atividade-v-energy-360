"""Ponto de entrada principal da API FastAPI do V-Energy Grid 360."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.profiler import QueryProfilerMiddleware
from app.db.session import engine
from app.features.loss_management.schema_upgrade import upgrade_inspection_table
from app.shared.error_handlers import register_exception_handlers

configure_logging()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Gerencia ciclo de vida dos recursos assíncronos e encerramento do pool."""
    del app
    # Tabelas operacionais escritas pela API (as tabelas Gold vêm do pipeline); cria ou atualiza colunas novas
    await upgrade_inspection_table()
    try:
        yield
    finally:
        await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        version=settings.project_version,
        description="Plataforma de Inteligência Analítica e Operacional V-Energy Grid 360",
        lifespan=lifespan,
    )

    # Middlewares
    app.add_middleware(QueryProfilerMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Handlers de Exceção
    register_exception_handlers(app)

    # Rotas
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
