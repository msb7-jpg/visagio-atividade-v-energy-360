"""Gerenciamento de conexões assíncronas e síncronas read-only do banco SQLite em WAL mode."""

import sqlite3
from collections.abc import AsyncIterator, Generator
from contextlib import contextmanager, suppress
from pathlib import Path
from typing import Any

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings
from app.core.profiler import setup_query_profiler
from app.shared.exceptions import DatabaseReadError

settings = get_settings()


def get_db_path() -> Path:
    """Retorna o caminho validado para o arquivo sqlite."""
    url = settings.database_url
    raw_path = url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
    path = Path(raw_path).resolve()
    if not path.exists():
        # Cria banco vazio se ainda não existir para permitir consultas
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path.as_posix())
        conn.close()
    return path


@contextmanager
def get_readonly_db_connection() -> Generator[sqlite3.Connection, None, None]:
    """Context manager que abre uma conexão SQLite estritamente READ-ONLY (mode=ro)."""
    db_path = get_db_path()
    uri = f"file:{db_path.as_posix()}?mode=ro"
    try:
        conn = sqlite3.connect(uri, uri=True, timeout=10.0)
        conn.row_factory = sqlite3.Row
        yield conn
    except sqlite3.OperationalError as e:
        raise DatabaseReadError(f"Erro ao acessar banco analítico em modo read-only: {e}") from e
    finally:
        with suppress(Exception):
            conn.close()


def configure_sqlite_pragmas(async_engine: AsyncEngine) -> None:
    """Configura pragmas de alta concorrência e WAL no SQLite."""

    @event.listens_for(async_engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection: Any, connection_record: Any) -> None:
        del connection_record
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON;")
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.close()


engine = create_async_engine(settings.database_url, echo=False)
configure_sqlite_pragmas(engine)
setup_query_profiler(engine)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    """Dependency FastAPI para fornecer uma sessão assíncrona por request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
