"""Testes do repositório de qualidade da rede com SQLite em memória (sem o v_energy.db)."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.grid_quality.repository import GridQualityRepository
from app.shared.exceptions import DatabaseReadError

# Só as colunas do contrato de fato_qualidade_alimentador.
CREATE_TABLE_SQL = (
    "CREATE TABLE fato_qualidade_alimentador (id_alimentador TEXT, competencia TEXT, "
    "dec_apurado_horas REAL, fec_apurado_vezes REAL, dec_limite_aneel REAL, fec_limite_aneel REAL, "
    "violou_meta BOOLEAN)"
)
INSERT_SQL = (
    "INSERT INTO fato_qualidade_alimentador VALUES "
    "(:id_alimentador, :competencia, :dec_apurado, :fec_apurado, :dec_limite, :fec_limite, 0)"
)
FEEDER_ID = "ALIM-TESTE-01"


def seed_row(id_alimentador, competencia, dec_apurado, fec_apurado, dec_limite=10.0, fec_limite=5.0):
    """Monta uma linha fictícia da tabela do contrato."""
    return {
        "id_alimentador": id_alimentador,
        "competencia": competencia,
        "dec_apurado": dec_apurado,
        "fec_apurado": fec_apurado,
        "dec_limite": dec_limite,
        "fec_limite": fec_limite,
    }


# Valores fictícios; as duas últimas linhas não têm apuração completa e devem ser ignoradas.
SEED_ROWS = [
    seed_row(FEEDER_ID, "2000-01", 1.0, 1.0),
    seed_row(FEEDER_ID, "2000-02", 2.0, 2.0),
    seed_row(FEEDER_ID, "2000-03", 3.0, 3.0),
    seed_row("ALIM-TESTE-02", "2000-03", 4.0, 4.0, dec_limite=None, fec_limite=None),
    seed_row("ALIM-TESTE-03", "2000-03", None, 4.0),
    seed_row("ALIM-TESTE-04", "2000-04", None, None),
]

READ_CALLS = {
    "latest": lambda repository: repository.fetch_latest_competencia(),
    "rows": lambda repository: repository.fetch_rows("2000-03"),
    "history": lambda repository: repository.fetch_history(FEEDER_ID, 3),
}


@pytest.fixture
async def engine():
    """Engine SQLite assíncrona em memória, com conexão única, sem tabelas."""
    test_engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    yield test_engine
    await test_engine.dispose()


@pytest.fixture
async def seeded_repository(engine):
    """Repositório sobre a tabela do contrato populada com valores fictícios."""
    async with engine.begin() as connection:
        await connection.execute(text(CREATE_TABLE_SQL))
        await connection.execute(text(INSERT_SQL), SEED_ROWS)
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield GridQualityRepository(session)


@pytest.fixture
async def repository_without_table(engine):
    """Repositório sobre um banco em que a tabela Gold não existe."""
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield GridQualityRepository(session)


async def test_ultima_competencia_ignora_apuracao_incompleta(seeded_repository):
    assert await seeded_repository.fetch_latest_competencia() == "2000-03"


async def test_linhas_da_competencia_trazem_limites_com_nomes_neutros(seeded_repository):
    rows = await seeded_repository.fetch_rows("2000-03")
    rows_by_id = {row.id_alimentador: row for row in rows}

    assert sorted(rows_by_id) == [FEEDER_ID, "ALIM-TESTE-02"]
    assert rows_by_id[FEEDER_ID].dec_limite_horas == pytest.approx(10.0)
    assert rows_by_id[FEEDER_ID].fec_limite_vezes == pytest.approx(5.0)
    assert rows_by_id["ALIM-TESTE-02"].dec_limite_horas is None


async def test_historico_limita_a_n_meses_em_ordem_cronologica(seeded_repository):
    history = await seeded_repository.fetch_history(FEEDER_ID, 2)

    assert [row.competencia for row in history] == ["2000-02", "2000-03"]


async def test_historico_de_alimentador_inexistente_e_vazio(seeded_repository):
    assert await seeded_repository.fetch_history("ALIM-TESTE-99", 5) == []


@pytest.mark.parametrize("read_call", list(READ_CALLS.values()), ids=list(READ_CALLS))
async def test_tabela_ausente_vira_database_read_error_citando_a_tabela(repository_without_table, read_call):
    with pytest.raises(DatabaseReadError, match="fato_qualidade_alimentador"):
        await read_call(repository_without_table)
