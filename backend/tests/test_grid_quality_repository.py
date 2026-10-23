"""Testes do repositório de qualidade da rede com SQLite em memória (sem o v_energy.db)."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.grid_quality.repository import GridQualityRepository
from app.features.grid_quality.rules import FeederScope
from app.shared.exceptions import DatabaseReadError

# Colunas do contrato de fato_qualidade_alimentador (ADR-003 da Fatia 02).
CREATE_TABLE_SQL = (
    "CREATE TABLE fato_qualidade_alimentador (id_alimentador TEXT, competencia TEXT, conjunto_aneel TEXT, "
    "criterio_limite TEXT, ucs_atendidas INTEGER, ucs_interrompidas INTEGER, dec_apurado_horas REAL, "
    "fec_apurado_vezes REAL, dec_acumulado_ano_horas REAL, fec_acumulado_ano_vezes REAL, "
    "dec_limite_aneel REAL, fec_limite_aneel REAL, violou_dec BOOLEAN, violou_fec BOOLEAN, violou_meta BOOLEAN)"
)
INSERT_SQL = (
    "INSERT INTO fato_qualidade_alimentador VALUES "
    "(:id_alimentador, :competencia, :conjunto, :criterio, :ucs_atendidas, :ucs_interrompidas, :dec_apurado, "
    ":fec_apurado, :dec_acumulado, :fec_acumulado, :dec_limite, :fec_limite, 0, 0, 0)"
)
FEEDER_ID = "ALIM-TESTE-01"
SAME_AS_MONTH = object()  # acumulado omitido vale o do mês (como em janeiro)


def seed_row(
    id_alimentador,
    competencia,
    dec_apurado,
    fec_apurado,
    dec_limite=10.0,
    fec_limite=5.0,
    dec_acumulado=SAME_AS_MONTH,
    fec_acumulado=SAME_AS_MONTH,
    criterio="CONJUNTO",
):
    """Monta uma linha fictícia da tabela do contrato; acumulado omitido vale o do mês."""
    return {
        "id_alimentador": id_alimentador,
        "competencia": competencia,
        "conjunto": "CONJUNTO TESTE" if criterio == "CONJUNTO" else "MEDIANA RMR",
        "criterio": criterio,
        "ucs_atendidas": 200,
        "ucs_interrompidas": 20,
        "dec_apurado": dec_apurado,
        "fec_apurado": fec_apurado,
        "dec_acumulado": dec_apurado if dec_acumulado is SAME_AS_MONTH else dec_acumulado,
        "fec_acumulado": fec_apurado if fec_acumulado is SAME_AS_MONTH else fec_acumulado,
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
    seed_row("ALIM-TESTE-05", "2000-03", 1.0, 1.0, dec_acumulado=None),
    seed_row("ALIM-TESTE-06", "2000-03", 2.0, 2.0, dec_acumulado=7.0, fec_acumulado=3.0, criterio="MEDIANA_RMR"),
    seed_row("ALIM-TESTE-07", "1999-12", 4.0, 4.0, dec_acumulado=40.0, fec_acumulado=20.0),
    seed_row("ALIM-TESTE-07", "2000-01", 2.0, 2.0),
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

    assert sorted(rows_by_id) == [FEEDER_ID, "ALIM-TESTE-02", "ALIM-TESTE-06"]
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


async def test_linhas_trazem_acumulado_no_ano_conjunto_criterio_e_ucs(seeded_repository):
    rows = await seeded_repository.fetch_rows("2000-03")
    mediana_row = {row.id_alimentador: row for row in rows}["ALIM-TESTE-06"]

    assert mediana_row.dec_acumulado_ano_horas == pytest.approx(7.0)
    assert mediana_row.fec_acumulado_ano_vezes == pytest.approx(3.0)
    assert mediana_row.dec_apurado_horas == pytest.approx(2.0)
    assert mediana_row.scope == FeederScope("MEDIANA RMR", "MEDIANA_RMR", 200, 20)


async def test_apuracao_sem_acumulado_fica_fora_das_consultas(seeded_repository):
    rows = await seeded_repository.fetch_rows("2000-03")

    assert "ALIM-TESTE-05" not in {row.id_alimentador for row in rows}


async def test_historico_na_virada_de_ano_traz_o_acumulado_de_cada_mes(seeded_repository):
    history = await seeded_repository.fetch_history("ALIM-TESTE-07", 5)

    assert [row.competencia for row in history] == ["1999-12", "2000-01"]
    assert [row.dec_acumulado_ano_horas for row in history] == [40.0, 2.0]
