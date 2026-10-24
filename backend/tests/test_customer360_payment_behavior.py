import pytest

from app.features.customer360.payment_behavior import days_late, parse_iso_date, summarize_punctuality
from app.features.customer360.schemas import InvoiceDTO


def invoice(competencia: str, due: str | None, paid: str | None, status: str = "PAGA") -> InvoiceDTO:
    return InvoiceDTO(
        id_fatura=f"FT-{competencia}",
        competencia=competencia,
        data_vencimento=due,
        data_pagamento=paid,
        status_pagamento=status,
    )


def test_parse_iso_date_ignores_invalid_values():
    assert parse_iso_date("2026-03-20").isoformat() == "2026-03-20"
    assert parse_iso_date("2026-03-20 10:00:00").isoformat() == "2026-03-20"
    assert parse_iso_date("20/03/2026") is None
    assert parse_iso_date(None) is None


@pytest.mark.parametrize(
    ("due", "paid", "expected"),
    [("2026-03-20", "2026-03-18", 0), ("2026-03-20", "2026-03-27", 7), ("2026-03-20", None, None)],
)
def test_days_late(due, paid, expected):
    assert days_late(invoice("2026-03", due, paid)) == expected


def test_punctuality_counts_on_time_late_and_overdue():
    invoices = [
        invoice("2026-06", "2026-06-20", None, status="ABERTA"),
        invoice("2026-05", "2026-05-20", None, status="VENCIDA"),
        invoice("2026-04", "2026-04-20", "2026-04-27"),
        invoice("2026-03", "2026-03-20", "2026-03-25"),
        invoice("2026-02", "2026-02-20", "2026-02-18"),
    ]
    punctuality = summarize_punctuality(invoices)

    assert punctuality is not None
    assert punctuality.faturas_avaliadas == 5
    assert (punctuality.pagas_em_dia, punctuality.pagas_com_atraso) == (1, 2)
    assert punctuality.atraso_medio_dias == pytest.approx(6.0)
    assert punctuality.vencidas_em_aberto == 1


def test_punctuality_uses_only_the_last_twelve_invoices():
    invoices = [invoice(f"2026-{month:02d}", "2026-01-20", "2026-01-18") for month in range(1, 13)]
    old_late = invoice("2025-12", "2025-12-20", "2025-12-30")
    punctuality = summarize_punctuality([*invoices, old_late])

    assert punctuality is not None
    assert punctuality.faturas_avaliadas == 12
    assert punctuality.pagas_com_atraso == 0
    assert punctuality.atraso_medio_dias is None


def test_punctuality_without_invoices_is_none():
    assert summarize_punctuality([]) is None
