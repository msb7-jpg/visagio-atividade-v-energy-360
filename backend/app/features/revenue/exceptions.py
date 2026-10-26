from app.features.revenue.schemas import NeighborhoodHistoryRequest, PeriodWindow
from app.shared.exceptions import BadRequestException, NotFoundException


class RevenueDataNotFoundError(NotFoundException):
    """Nenhum faturamento encontrado para as janelas e filtros pedidos."""

    def __init__(self, base: PeriodWindow, current: PeriodWindow):
        super().__init__(
            "Nenhum dado de faturamento encontrado para a janela base "
            f"{base.competencia_inicio} a {base.competencia_fim} e a janela atual "
            f"{current.competencia_inicio} a {current.competencia_fim}."
        )


class InvalidPeriodError(BadRequestException):
    """A janela base e a janela atual se sobrepõem ou estão fora de ordem."""

    def __init__(self, base: PeriodWindow, current: PeriodWindow):
        super().__init__(
            f"A janela base ({base.competencia_inicio} a {base.competencia_fim}) deve terminar antes do "
            f"início da janela atual ({current.competencia_inicio} a {current.competencia_fim})."
        )


class NeighborhoodHistoryNotFoundError(NotFoundException):
    """Nenhum faturamento do bairro na janela pedida."""

    def __init__(self, request: NeighborhoodHistoryRequest):
        super().__init__(
            f"Nenhum faturamento encontrado para {request.bairro} ({request.municipio}) "
            f"nos {request.meses} meses até {request.competencia_fim}."
        )