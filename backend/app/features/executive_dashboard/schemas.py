from enum import StrEnum

from pydantic import BaseModel, Field

from app.features.revenue.schemas import PeriodWindow


class IndicatorUnit(StrEnum):
    """Unidade do valor do indicador; a formatação fica no frontend."""

    RS = "RS"
    KWH = "KWH"
    RS_KWH = "RS_KWH"
    UCS = "UCS"
    PCT = "PCT"
    NOTA = "NOTA"
    HORAS = "HORAS"
    VEZES = "VEZES"


class IndicatorDirection(StrEnum):
    """Sentido em que o indicador é bom para a empresa."""

    MAIOR_MELHOR = "MAIOR_MELHOR"
    MENOR_MELHOR = "MENOR_MELHOR"
    NEUTRO = "NEUTRO"


class IndicatorEvaluation(StrEnum):
    """Leitura da variação entre a janela base e a janela atual."""

    MELHOROU = "MELHOROU"
    PIOROU = "PIOROU"
    ESTAVEL = "ESTAVEL"
    SEM_COMPARACAO = "SEM_COMPARACAO"
    INFORMATIVO = "INFORMATIVO"


class IndicatorDetailDTO(BaseModel):
    """Valor de apoio de um indicador nas duas janelas, por exemplo o valor vencido em reais da inadimplência."""

    titulo: str
    unidade: IndicatorUnit
    base: float | None = None
    atual: float | None = None


class IndicatorDTO(BaseModel):
    """Um indicador do Painel com o valor das duas janelas, a variação e a avaliação."""

    id: str
    titulo: str
    unidade: IndicatorUnit
    base: float | None = None
    atual: float | None = None
    variacao_pct: float | None = Field(default=None, description="(atual - base) / base, em %; vazia com base zero")
    variacao_pp: float | None = Field(
        default=None, description="atual - base em pontos percentuais; só nos indicadores em % (unidade PCT)"
    )
    sentido: IndicatorDirection
    avaliacao: IndicatorEvaluation
    explicacao: str
    detalhe: IndicatorDetailDTO | None = Field(default=None, description="Valor de apoio exibido abaixo do indicador")
    aviso: str | None = None


class IndicatorGroupDTO(BaseModel):
    """Indicadores de uma área do negócio (comercial, cobrança, rede, atendimento ou medição)."""

    id: str
    titulo: str
    indicadores: list[IndicatorDTO]


class DashboardIndicatorsDTO(BaseModel):
    """Indicadores do Painel do Diretor comparando a janela base com a janela atual."""

    base: PeriodWindow
    atual: PeriodWindow
    periodo_disponivel: PeriodWindow | None = Field(
        default=None, description="Primeira e última competência com faturamento"
    )
    grupos: list[IndicatorGroupDTO]


class LossesSnapshotDTO(BaseModel):
    """Retrato atual da Fila de Perdas, sem comparação entre períodos."""

    competencia_referencia: str | None = Field(default=None, description="Competência em que a fila foi calculada")
    competencia_fixada: bool = Field(
        default=False, description="A competência foi fixada na configuração (demonstração), e não é a mais recente"
    )
    ucs_na_fila: int = Field(description="UCs suspeitas na fila de inspeção, de qualquer chance de acerto")
    ucs_prioritarias: int = Field(description="UCs da fila com chance de acerto na faixa prioritária")
    energia_prioritaria_kwh_mes: float = Field(description="Energia recuperável das UCs prioritárias, em kWh/mês")
    valor_prioritario_rs_ano: float = Field(description="Valor por ano se todas as UCs prioritárias confirmarem")
    retorno_esperado_rs_ano: float = Field(
        description="Valor por ano das UCs prioritárias ponderado pela chance de acerto de cada uma"
    )
    taxa_acerto_pct: float = Field(description="Inspeções que confirmaram irregularidade, em %")
    inspecoes_avaliadas: int | None = Field(default=None, description="Inspeções usadas na taxa; vazia sem histórico")
