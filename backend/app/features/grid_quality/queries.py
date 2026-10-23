"""Consultas SQLAlchemy Core sobre `fato_qualidade_alimentador` (Gold).

Único módulo que conhece o nome da tabela e das colunas do contrato do pipeline. Se o contrato
mudar, a troca acontece aqui. A tabela pertence ao pipeline: é declarada com `table()`/`column()`,
fora do `Base.metadata`, e nunca é criada pela API.
"""

from sqlalchemy import Float, Integer, Select, String, and_, column, func, select, table

TABLE_NAME = "fato_qualidade_alimentador"

fato_qualidade_alimentador = table(
    TABLE_NAME,
    column("id_alimentador", String),
    column("competencia", String),
    column("conjunto_aneel", String),
    column("criterio_limite", String),
    column("ucs_atendidas", Integer),
    column("ucs_interrompidas", Integer),
    column("dec_apurado_horas", Float),
    column("fec_apurado_vezes", Float),
    column("dec_acumulado_ano_horas", Float),
    column("fec_acumulado_ano_vezes", Float),
    column("dec_limite_aneel", Float),
    column("fec_limite_aneel", Float),
)

_quality = fato_qualidade_alimentador
# Sem DEC/FEC do mês e acumulado no ano a apuração não pode ser classificada e fica fora das consultas.
_has_apuracao = and_(
    _quality.c.dec_apurado_horas.is_not(None),
    _quality.c.fec_apurado_vezes.is_not(None),
    _quality.c.dec_acumulado_ano_horas.is_not(None),
    _quality.c.fec_acumulado_ano_vezes.is_not(None),
)
_feeder_columns = (
    _quality.c.id_alimentador,
    _quality.c.competencia,
    _quality.c.dec_apurado_horas,
    _quality.c.fec_apurado_vezes,
    _quality.c.dec_acumulado_ano_horas,
    _quality.c.fec_acumulado_ano_vezes,
    _quality.c.conjunto_aneel,
    _quality.c.criterio_limite,
    _quality.c.ucs_atendidas,
    _quality.c.ucs_interrompidas,
    _quality.c.dec_limite_aneel.label("dec_limite_horas"),
    _quality.c.fec_limite_aneel.label("fec_limite_vezes"),
)


def latest_competencia_query() -> Select:
    """Consulta a competência mais recente com apuração de DEC e FEC.

    Returns:
        SELECT que devolve a maior competência ('YYYY-MM'), ou NULL sem apurações.
    """
    return select(func.max(_quality.c.competencia)).where(_has_apuracao)


def competencia_rows_query(competencia: str) -> Select:
    """Consulta as apurações de todos os alimentadores em uma competência.

    Args:
        competencia: Competência no formato 'YYYY-MM'.

    Returns:
        SELECT com id, competência, DEC/FEC do mês e acumulados no ano, conjunto, UCs e limites anuais.
    """
    return select(*_feeder_columns).where(_quality.c.competencia == competencia, _has_apuracao)


def feeder_history_query(id_alimentador: str, meses: int) -> Select:
    """Consulta as últimas apurações de um alimentador, da mais recente para a mais antiga.

    Assume uma apuração por mês por alimentador (chave id_alimentador + competencia).

    Args:
        id_alimentador: Identificador do alimentador.
        meses: Quantidade máxima de competências a devolver.

    Returns:
        SELECT limitado a `meses` linhas, ordenado por competência decrescente.
    """
    return (
        select(*_feeder_columns)
        .where(_quality.c.id_alimentador == id_alimentador, _has_apuracao)
        .order_by(_quality.c.competencia.desc())
        .limit(meses)
    )
