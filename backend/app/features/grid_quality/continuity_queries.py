"""Consultas SQLAlchemy Core da Continuidade sobre `fato_ocorrencias_rede` e `dim_unidade_consumidora` (Gold).

As tabelas pertencem ao pipeline: declaradas com `table()`/`column()`, fora do `Base.metadata`.
O escopo (município) é resolvido em UM ponto, `scope_query`: devolve os alimentadores
do escopo e as demais consultas só filtram por `id_alimentador`, sem JOIN nas 180 mil ocorrências.
"""

from collections.abc import Collection

from sqlalchemy import ColumnElement, Float, Select, String, column, func, select, table

from app.features.grid_quality.queries import fato_qualidade_alimentador

fato_ocorrencias_rede = table(
    "fato_ocorrencias_rede",
    column("id_alimentador", String),
    column("tipo_ocorrencia", String),
    column("id_uc", String),
    column("causa", String),
    column("duracao_horas", Float),
    column("competencia", String),
)
dim_unidade_consumidora = table(
    "dim_unidade_consumidora",
    column("id_uc", String),
    column("nome_titular", String),
    column("alimentador", String),
    column("municipio", String),
    column("bairro", String),
)

_occurrences = fato_ocorrencias_rede


def _uc_hours() -> ColumnElement:
    return func.sum(_occurrences.c.duracao_horas)


def scope_query(municipality_key: str | None) -> Select:
    """Alimentadores do escopo com o município de cada um (cada alimentador pertence a um município).

    Args:
        municipality_key: Município no formato do banco (MAIÚSCULAS, sem acento); None traz a rede inteira.

    Returns:
        SELECT com `alimentador` e `municipio`, um por alimentador.
    """
    query = select(
        dim_unidade_consumidora.c.alimentador, func.min(dim_unidade_consumidora.c.municipio).label("municipio")
    ).group_by(dim_unidade_consumidora.c.alimentador)
    if municipality_key is not None:
        query = query.where(dim_unidade_consumidora.c.municipio == municipality_key)
    return query


def feeder_ucs_query() -> Select:
    """UCs atendidas por alimentador, uma vez por alimentador (o valor é constante ao longo da série)."""
    quality = fato_qualidade_alimentador
    return select(quality.c.id_alimentador, func.max(quality.c.ucs_atendidas).label("ucs_atendidas")).group_by(
        quality.c.id_alimentador
    )


def monthly_feeder_query(cause: str | None = None) -> Select:
    """UC-horas (soma de duracao_horas) e ocorrências por alimentador e competência, na rede inteira.

    Args:
        cause: Causa no formato do banco; None não filtra por causa.
    """
    query = select(
        _occurrences.c.id_alimentador,
        _occurrences.c.competencia,
        _uc_hours().label("uc_hours"),
        func.count().label("occurrences"),
    ).group_by(_occurrences.c.id_alimentador, _occurrences.c.competencia)
    return query if cause is None else query.where(_occurrences.c.causa == cause)


def causes_query() -> Select:
    """Causas distintas registradas nas ocorrências (valores do banco)."""
    return select(_occurrences.c.causa).distinct()


def cause_hours_query(competencias: Collection[str], feeder_ids: Collection[str]) -> Select:
    """UC-horas por causa nas competências e alimentadores informados."""
    return (
        select(_occurrences.c.causa, _uc_hours().label("uc_hours"))
        .where(_occurrences.c.competencia.in_(competencias), _occurrences.c.id_alimentador.in_(feeder_ids))
        .group_by(_occurrences.c.causa)
    )


def type_count_query(competencias: Collection[str], feeder_ids: Collection[str], cause: str | None = None) -> Select:
    """Quantidade de ocorrências por tipo nas competências e alimentadores informados (e na causa, se houver)."""
    query = (
        select(_occurrences.c.tipo_ocorrencia, func.count().label("occurrences"))
        .where(_occurrences.c.competencia.in_(competencias), _occurrences.c.id_alimentador.in_(feeder_ids))
        .group_by(_occurrences.c.tipo_ocorrencia)
    )
    return query if cause is None else query.where(_occurrences.c.causa == cause)


def latest_competencias_query(meses: int) -> Select:
    """As últimas `meses` competências da série de ocorrências, da mais recente para a mais antiga."""
    return (
        select(_occurrences.c.competencia)
        .group_by(_occurrences.c.competencia)
        .order_by(_occurrences.c.competencia.desc())
        .limit(meses)
    )


def affected_customers_query(feeder_id: str, competencias: Collection[str], limite: int) -> Select:
    """UCs de um alimentador com mais horas sem energia nas competências informadas."""
    customers = dim_unidade_consumidora
    uc_hours = _uc_hours().label("uc_hours")
    return (
        select(
            _occurrences.c.id_uc,
            customers.c.nome_titular,
            customers.c.bairro,
            customers.c.municipio,
            uc_hours,
            func.count().label("occurrences"),
        )
        .join(customers, customers.c.id_uc == _occurrences.c.id_uc)
        .where(_occurrences.c.id_alimentador == feeder_id, _occurrences.c.competencia.in_(competencias))
        .group_by(_occurrences.c.id_uc, customers.c.nome_titular, customers.c.bairro, customers.c.municipio)
        .order_by(uc_hours.desc(), _occurrences.c.id_uc)
        .limit(limite)
    )
