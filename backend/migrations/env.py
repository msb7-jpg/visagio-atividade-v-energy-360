"""Ambiente de execução do Alembic para tabelas operacionais do V-Energy Grid 360."""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import get_settings
from app.db.base import Base
from app.features.loss_management.models import InspectionOrder

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
MANAGED_TABLES = frozenset({InspectionOrder.__tablename__, *target_metadata.tables.keys()})


def _get_sync_database_url() -> str:
    """Converte a URL assíncrona da aplicação para o driver síncrono usado pelo Alembic."""
    configured_url = config.get_main_option("sqlalchemy.url")
    if configured_url and configured_url != "sqlite:///./v_energy.db":
        return configured_url.replace("sqlite+aiosqlite://", "sqlite://")
    return get_settings().database_url.replace("sqlite+aiosqlite://", "sqlite://")


def include_object(
    _object: object,
    name: str | None,
    type_: str,
    _reflected: bool,
    _compare_to: object,
) -> bool:
    """Filtra o escopo do Alembic apenas para tabelas operacionais do ORM, ignorando a Gold."""
    if type_ == "table":
        return name in MANAGED_TABLES
    return True


def run_migrations_offline() -> None:
    """Executa migrações em modo offline (geração de SQL sem conexão ativa)."""
    context.configure(
        url=_get_sync_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Executa migrações em modo online conectando ao SQLite local."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = _get_sync_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
