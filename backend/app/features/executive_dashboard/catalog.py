"""Catálogo dos indicadores do Painel do Diretor, agrupados pela área do negócio."""

from dataclasses import dataclass

from app.features.executive_dashboard.indicators import (
    DetailSpec,
    IndicatorSpec,
    PeriodSnapshots,
    WindowSnapshot,
    build_indicator,
    percent,
)
from app.features.executive_dashboard.schemas import IndicatorDirection, IndicatorGroupDTO, IndicatorUnit
from app.features.revenue.kpis import average_tariff, safe_ratio

MAIOR = IndicatorDirection.MAIOR_MELHOR
MENOR = IndicatorDirection.MENOR_MELHOR
NEUTRO = IndicatorDirection.NEUTRO


@dataclass(frozen=True, slots=True)
class GroupSpec:
    """Área do negócio e os indicadores que a representam no Painel."""

    id: str
    titulo: str
    indicadores: tuple[IndicatorSpec, ...]


def overdue_rate(snapshot: WindowSnapshot) -> float | None:
    """Valor vencido sem pagamento sobre o valor faturado, em %."""
    return percent(snapshot.areas.valor_vencido_rs, snapshot.areas.valor_faturado_rs)


def outage_hours_per_unit(snapshot: WindowSnapshot) -> float | None:
    """Horas sem energia somadas de todas as UCs, divididas pelas UCs ativas (DEC da área)."""
    return safe_ratio(snapshot.areas.horas_interrompidas, snapshot.revenue.ucs_ativas)


def outages_per_unit(snapshot: WindowSnapshot) -> float | None:
    """Interrupções somadas de todas as UCs, divididas pelas UCs ativas (FEC da área)."""
    return safe_ratio(snapshot.areas.interrupcoes, snapshot.revenue.ucs_ativas)


def estimated_reading_rate(snapshot: WindowSnapshot) -> float | None:
    """Leituras estimadas sobre o total de leituras, em %."""
    return percent(snapshot.areas.leituras_estimadas, snapshot.areas.leituras)


GROUPS = (
    GroupSpec("comercial", "Comercial", (
        IndicatorSpec(
            "faturamento", "Faturamento", IndicatorUnit.RS, MAIOR,
            "Soma do valor total das faturas emitidas no período.",
            lambda snapshot: snapshot.revenue.receita_rs,
        ),
        IndicatorSpec(
            "energia_faturada", "Energia faturada", IndicatorUnit.KWH, MAIOR,
            "Soma do consumo faturado (kWh) nas faturas do período.",
            lambda snapshot: snapshot.revenue.volume_kwh,
        ),
        IndicatorSpec(
            "tarifa_media", "Tarifa média", IndicatorUnit.RS_KWH, NEUTRO,
            "Faturamento dividido pela energia faturada. Já inclui reajuste, bandeira e tributos.",
            lambda snapshot: average_tariff(snapshot.revenue),
        ),
        IndicatorSpec(
            "ucs_ativas", "UCs ativas", IndicatorUnit.UCS, MAIOR,
            "Unidades consumidoras com pelo menos uma fatura no período.",
            lambda snapshot: snapshot.revenue.ucs_ativas,
        ),
    )),
    GroupSpec("cobranca", "Cobrança", (
        IndicatorSpec(
            "inadimplencia", "Inadimplência", IndicatorUnit.PCT, MENOR,
            "Valor das faturas vencidas e não pagas dividido pelo valor faturado no período. A variação é a "
            "diferença em pontos percentuais: de 3,55% para 3,60% é +0,05 ponto percentual.",
            overdue_rate,
            detalhe=DetailSpec(
                "Valor vencido", IndicatorUnit.RS, lambda snapshot: snapshot.areas.valor_vencido_rs
            ),
        ),
    )),
    GroupSpec("rede", "Rede", (
        IndicatorSpec(
            "dec_area", "Horas sem energia por cliente", IndicatorUnit.HORAS, MENOR,
            "Horas de interrupção somadas de todas as UCs, divididas pelas UCs ativas (DEC da área).",
            outage_hours_per_unit, afetado_pelo_temporal=True,
        ),
        IndicatorSpec(
            "fec_area", "Interrupções por cliente", IndicatorUnit.VEZES, MENOR,
            "Interrupções somadas de todas as UCs, divididas pelas UCs ativas (FEC da área).",
            outages_per_unit, afetado_pelo_temporal=True,
        ),
    )),
    GroupSpec("atendimento", "Atendimento", (
        IndicatorSpec(
            "satisfacao", "Satisfação média", IndicatorUnit.NOTA, MAIOR,
            "Média das notas de 1 a 5 dos chamados abertos no período. Chamados sem nota ficam de fora.",
            lambda snapshot: snapshot.areas.nota_media_csat,
        ),
        IndicatorSpec(
            "tempo_resolucao", "Tempo médio de resolução", IndicatorUnit.HORAS, MENOR,
            "Média das horas entre a abertura e o fechamento dos chamados abertos no período.",
            lambda snapshot: snapshot.areas.tempo_medio_resolucao_h,
        ),
    )),
    GroupSpec("medicao", "Medição", (
        IndicatorSpec(
            "leituras_estimadas", "Leituras estimadas", IndicatorUnit.PCT, MENOR,
            "Leituras fechadas pela média, sem acesso ao medidor, sobre o total de leituras do período. "
            "A variação é a diferença em pontos percentuais.",
            estimated_reading_rate,
        ),
        IndicatorSpec(
            "clientes_painel_solar", "Clientes com painel solar", IndicatorUnit.UCS, NEUTRO,
            "UCs com geração solar ligada até o fim do período. A energia gerada reduz a energia faturada.",
            lambda snapshot: snapshot.areas.ucs_com_gd,
        ),
    )),
)


def build_groups(snapshots: PeriodSnapshots) -> list[IndicatorGroupDTO]:
    """Monta todos os grupos do Painel a partir dos totais das duas janelas.

    Args:
        snapshots: Totais da janela base e da janela atual.

    Returns:
        Um grupo por área, com os indicadores na ordem do catálogo.
    """
    return [
        IndicatorGroupDTO(
            id=group.id,
            titulo=group.titulo,
            indicadores=[build_indicator(spec, snapshots) for spec in group.indicadores],
        )
        for group in GROUPS
    ]
