"""Regras puras de pontualidade de pagamento da UC, a partir do vencimento e do pagamento das faturas."""

from datetime import date

from app.features.customer360.schemas import InvoiceDTO, PaymentPunctualityDTO

FATURAS_AVALIADAS = 12
STATUS_VENCIDA = "VENCIDA"


def parse_iso_date(text: str | None) -> date | None:
    """Converte uma data 'YYYY-MM-DD' (ou data e hora) em `date`, ignorando valores inválidos.

    Args:
        text: Data vinda do banco, ou None.

    Returns:
        A data, ou None quando ausente ou fora do formato.
    """
    if not text:
        return None
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return None


def days_late(invoice: InvoiceDTO) -> int | None:
    """Dias entre o vencimento e o pagamento de uma fatura paga.

    Args:
        invoice: Fatura com datas de vencimento e de pagamento.

    Returns:
        Dias de atraso (0 quando paga até o vencimento), ou None se a fatura não foi paga ou falta data.
    """
    due_date = parse_iso_date(invoice.data_vencimento)
    paid_date = parse_iso_date(invoice.data_pagamento)
    if due_date is None or paid_date is None:
        return None
    return max(0, (paid_date - due_date).days)


def summarize_punctuality(invoices: list[InvoiceDTO]) -> PaymentPunctualityDTO | None:
    """Resume como a UC pagou as últimas 12 faturas, para o atendente avaliar uma negociação.

    Args:
        invoices: Faturas da UC, da competência mais recente para a mais antiga.

    Returns:
        Contagem de faturas pagas em dia e com atraso, atraso médio e vencidas em aberto; None sem faturas avaliáveis.
        `faturas_avaliadas` conta só as faturas com desfecho conhecido (pagas com datas válidas ou vencidas),
        então é sempre a soma de em dia, com atraso e vencidas; faturas ainda a vencer ficam de fora.
    """
    recent_invoices = invoices[:FATURAS_AVALIADAS]
    if not recent_invoices:
        return None
    delays = [delay for invoice in recent_invoices if (delay := days_late(invoice)) is not None]
    late_delays = [delay for delay in delays if delay > 0]
    overdue_count = sum(1 for invoice in recent_invoices if invoice.status_pagamento == STATUS_VENCIDA)
    if not delays and overdue_count == 0:
        return None
    average_delay = round(sum(late_delays) / len(late_delays), 1) if late_delays else None
    return PaymentPunctualityDTO(
        faturas_avaliadas=len(delays) + overdue_count,
        pagas_em_dia=len(delays) - len(late_delays),
        pagas_com_atraso=len(late_delays),
        atraso_medio_dias=average_delay,
        vencidas_em_aberto=overdue_count,
    )
