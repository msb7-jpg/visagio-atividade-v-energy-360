"""Consultas SQLAlchemy Core portáveis sobre as tabelas Gold de cadastro, medição e inspeções.

As tabelas Gold pertencem ao pipeline (Fatias 01 e 02), por isso são declaradas com
`table()`/`column()` leves: não entram no `Base.metadata` e nunca são criadas pela API.
"""

from dataclasses import dataclass
from datetime import date

from sqlalchemy import (
    Boolean,
    Float,
    Label,
    Select,
    String,
    Subquery,
    and_,
    case,
    column,
    func,
    select,
    table,
)

from app.features.loss_management.schemas import InspectionStatus

MESES_JANELA_RECENTE = 3
MESES_JANELA_BASE = 12
MESES_POR_ANO = 12

COMPLETED_STATUS = InspectionStatus.CONCLUIDA.value

fato_medicao = table(
    "fato_medicao",
    column("id_uc", String),
    column("competencia", String),
    column("consumo_kwh", Float),
)

dim_unidade_consumidora = table(
    "dim_unidade_consumidora",
    column("id_uc", String),
    column("municipio", String),
    column("bairro", String),
    column("classe_consumo", String),
    column("possui_gd", Boolean),
)

fato_faturamento = table(
    "fato_faturamento",
    column("competencia", String),
    column("valor_total_rs", Float),
    column("consumo_faturado_kwh", Float),
)

fato_inspecoes_perdas = table(
    "fato_inspecoes_perdas",
    column("id_uc", String),
    column("id_inspetor", String),
    column("data_inspecao", String),
    column("irregularidade_constatada", Boolean),
)


@dataclass(frozen=True, slots=True)
class ConsumptionWindows:
    """Competências ('YYYY-MM') que delimitam a janela base e a janela recente (inclusive nas pontas)."""

    inicio_base: str
    inicio_recente: str
    fim_recente: str  # competência de referência: leituras posteriores ainda não existiam para a análise


@dataclass(frozen=True, slots=True)
class SuspicionFilters:
    """Critérios da fila: limiar de queda e filtros opcionais da tela."""

    limiar_queda: float
    municipio: str | None = None
    bairro: str | None = None
    classe: str | None = None


def shift_competencia(competencia: str, months: int) -> str:
    """Desloca uma competência em N meses, tratando a virada de ano.

    Args:
        competencia: Competência no formato 'YYYY-MM'.
        months: Quantidade de meses a deslocar (negativo volta no tempo).

    Returns:
        A competência deslocada, no formato 'YYYY-MM'.
    """
    year_text, month_text = competencia.split("-")
    original_month_index = int(year_text) * MESES_POR_ANO + int(month_text) - 1
    shifted_month_index = original_month_index + months
    shifted_year, shifted_month_zero_based = divmod(shifted_month_index, MESES_POR_ANO)
    shifted_month = shifted_month_zero_based + 1
    return f"{shifted_year:04d}-{shifted_month:02d}"


def build_windows(ultima_competencia: str) -> ConsumptionWindows:
    """Calcula as janelas recente (3 últimas competências) e base (12 anteriores a ela).

    Args:
        ultima_competencia: Competência mais recente com medição ('YYYY-MM').

    Returns:
        Início das janelas base e recente.
    """
    meses_antes_da_ultima = MESES_JANELA_RECENTE - 1
    inicio_recente = shift_competencia(ultima_competencia, -meses_antes_da_ultima)
    inicio_base = shift_competencia(inicio_recente, -MESES_JANELA_BASE)
    return ConsumptionWindows(
        inicio_base=inicio_base, inicio_recente=inicio_recente, fim_recente=ultima_competencia
    )


def inspection_cutoff_date(windows: ConsumptionWindows) -> date:
    """Data a partir da qual uma inspeção já verificou o sinal de queda atual.

    Args:
        windows: Janelas de análise da fila.

    Returns:
        Primeiro dia da janela base (início da janela de análise).
    """
    year_text, month_text = windows.inicio_base.split("-")
    return date(int(year_text), int(month_text), 1)


def latest_competencia_query() -> Select[str | None]:
    """Consulta a competência mais recente disponível em `fato_medicao`.

    Returns:
        SELECT que devolve a maior competência ('YYYY-MM'), ou NULL sem medições.
    """
    return select(func.max(fato_medicao.c.competencia))


def _consumption_aggregates(windows: ConsumptionWindows) -> list[Label]:
    """Colunas agregadas por UC: média das duas janelas e quantidade de meses zerados na recente."""
    competencia = fato_medicao.c.competencia
    consumo_kwh = fato_medicao.c.consumo_kwh
    is_base = competencia < windows.inicio_recente
    is_recent = competencia >= windows.inicio_recente
    is_zero_recent = and_(is_recent, consumo_kwh == 0)
    return [
        func.avg(case((is_base, consumo_kwh))).label("consumo_base_kwh"),
        func.avg(case((is_recent, consumo_kwh))).label("consumo_recente_kwh"),
        func.sum(case((is_zero_recent, 1), else_=0)).label("meses_zerados"),
    ]


def consumption_subquery(windows: ConsumptionWindows, id_uc: str | None = None) -> Subquery:
    """Agrega o consumo por UC nas duas janelas e conta meses zerados na recente.

    Leituras com consumo negativo são inválidas (troca de medidor ou sinal invertido na origem) e ficam de
    fora: entrariam na média e criariam uma queda súbita falsa. Na base bruta do case, 81 de 81 UCs da fila
    tinham um consumo negativo na janela recente.

    Args:
        windows: Janelas base e recente.
        id_uc: Restringe a agregação a uma única UC; None agrega todas.

    Returns:
        Subquery `consumo` com `id_uc`, `consumo_base_kwh`, `consumo_recente_kwh` e `meses_zerados`.
    """
    competencia = fato_medicao.c.competencia
    consumo_kwh = fato_medicao.c.consumo_kwh
    unit_condition = [fato_medicao.c.id_uc == id_uc] if id_uc is not None else []
    return (
        select(fato_medicao.c.id_uc, *_consumption_aggregates(windows))
        .where(
            competencia >= windows.inicio_base,
            competencia <= windows.fim_recente,
            consumo_kwh >= 0,
            *unit_condition,
        )
        .group_by(fato_medicao.c.id_uc)
        .subquery("consumo")
    )


def registered_unit_query(id_uc: str, windows: ConsumptionWindows | None) -> Select:
    """Busca a UC no cadastro com seu consumo agregado, mesmo que ela não tenha medições.

    Args:
        id_uc: Identificador da unidade consumidora.
        windows: Janelas de análise; None quando ainda não há medições.

    Returns:
        SELECT com cadastro, `possui_gd` e, havendo janelas, o consumo agregado (NULL sem medição).
    """
    uc = dim_unidade_consumidora
    unit_columns = (uc.c.id_uc, uc.c.municipio, uc.c.bairro, uc.c.classe_consumo, uc.c.possui_gd)
    if windows is None:
        return select(*unit_columns).where(uc.c.id_uc == id_uc)
    consumo = consumption_subquery(windows, id_uc)
    return (
        select(*unit_columns, consumo.c.consumo_base_kwh, consumo.c.consumo_recente_kwh, consumo.c.meses_zerados)
        .outerjoin_from(uc, consumo, uc.c.id_uc == consumo.c.id_uc)
        .where(uc.c.id_uc == id_uc)
    )
