import pytest

from app.features.customer360.consumption_analysis import (
    classify_trend,
    daily_average,
    percent_change,
    shift_competencia,
)
from app.features.customer360.exceptions import CustomerNotFoundError
from app.features.customer360.schemas import (
    ConsumptionTrend,
    CustomerSearchResultDTO,
    CustomerSummaryDTO,
    FeederQualityMonthDTO,
    InvoiceDTO,
    LossInspectionDTO,
    MeasurementDTO,
    MonthlyComparisonDTO,
    ServiceTicketDTO,
    UnitOutageDTO,
    UnitOutageSummaryDTO,
)
from app.features.customer360.service import Customer360Service
from app.features.customer360.yoy_totals import summarize_window


class FakeCustomer360Repository:
    """Repositório em memória: uma única UC com medições e faturas configuráveis."""

    def __init__(
        self,
        unit: CustomerSummaryDTO | None,
        measurements: list[MeasurementDTO] | None = None,
        invoices: list[InvoiceDTO] | None = None,
    ) -> None:
        self.unit = unit
        self.measurements = measurements or []
        self.invoices = invoices or []
        self.requested_feeder: str | None = None
        self.searched_range = None
        self.searched_holder_pattern: str | None = None

    async def fetch_unit(self, id_uc: str) -> CustomerSummaryDTO | None:
        return self.unit if self.unit and self.unit.id_uc == id_uc else None

    async def unit_exists(self, id_uc: str) -> bool:
        return await self.fetch_unit(id_uc) is not None

    async def fetch_measurements(self, id_uc: str) -> list[MeasurementDTO]:
        del id_uc
        return self.measurements

    async def fetch_invoices(self, id_uc: str) -> list[InvoiceDTO]:
        del id_uc
        return self.invoices

    async def fetch_feeder_quality(self, id_alimentador: str, limite_meses: int) -> list[FeederQualityMonthDTO]:
        del limite_meses
        self.requested_feeder = id_alimentador
        return [FeederQualityMonthDTO(competencia="2026-06", dec_apurado_horas=1.5)]

    async def fetch_service_tickets(self, id_uc: str) -> list[ServiceTicketDTO]:
        del id_uc
        return [ServiceTicketDTO(id_atendimento="AT1", motivo_chamado="FATURA")]

    async def fetch_unit_outages(self, id_uc: str, limite: int) -> list[UnitOutageDTO]:
        del id_uc, limite
        return [UnitOutageDTO(id_ocorrencia="OC1", duracao_horas=2.5, causa="CLIMATICA")]

    async def fetch_unit_outage_summary(self, id_uc: str) -> UnitOutageSummaryDTO:
        del id_uc
        longest = UnitOutageDTO(id_ocorrencia="OC9", duracao_horas=9.0, causa="CLIMATICA")
        return UnitOutageSummaryDTO(total_interrupcoes=81, total_horas=132.1, mais_longa=longest)

    async def fetch_loss_inspections(self, id_uc: str) -> list[LossInspectionDTO]:
        del id_uc
        return [LossInspectionDTO(id_inspecao="INS1", irregularidade_constatada=True)]

    async def search_units(
        self, uc_range, meter_range, holder_pattern: str, limite: int
    ) -> list[CustomerSearchResultDTO]:
        del meter_range, limite
        self.searched_range = uc_range
        self.searched_holder_pattern = holder_pattern
        return [CustomerSearchResultDTO(id_uc="UC100000")]


UNIT = CustomerSummaryDTO(id_uc="UC100000", alimentador="ALM-REC-004")


def invoice(competencia: str, valor: float, bandeira: str = "VERDE", status: str = "PAGA") -> InvoiceDTO:
    return InvoiceDTO(
        id_fatura=f"FT-{competencia}",
        competencia=competencia,
        valor_total_rs=valor,
        bandeira_tarifaria=bandeira,
        status_pagamento=status,
    )


def build_service(recent_kwh: float, previous_kwh: float, invoices: list[InvoiceDTO] | None = None):
    measurements = [
        MeasurementDTO(competencia=f"2025-{month:02d}", consumo_kwh=previous_kwh) for month in range(1, 13)
    ] + [MeasurementDTO(competencia=f"2026-{month:02d}", consumo_kwh=recent_kwh) for month in range(1, 13)]
    return Customer360Service(FakeCustomer360Repository(UNIT, measurements, invoices))


@pytest.mark.parametrize(
    ("competencia", "months", "expected"),
    [("2026-06", -12, "2025-06"), ("2026-01", -1, "2025-12"), ("2025-12", 1, "2026-01"), ("2026-03", -14, "2025-01")],
)
def test_shift_competencia_crosses_year_boundaries(competencia, months, expected):
    assert shift_competencia(competencia, months) == expected


def test_percent_change_handles_missing_or_zero_base():
    assert percent_change(280.0, 200.0) == pytest.approx(40.0)
    assert percent_change(150.0, 300.0) == pytest.approx(-50.0)
    assert percent_change(100.0, 0.0) is None
    assert percent_change(None, 200.0) is None


@pytest.mark.parametrize(
    ("variation", "expected"),
    [(40.0, ConsumptionTrend.SUBIU), (10.0, ConsumptionTrend.ESTAVEL), (-10.0, ConsumptionTrend.ESTAVEL),
     (-50.0, ConsumptionTrend.CAIU), (None, ConsumptionTrend.SEM_COMPARACAO)],
)
def test_classify_trend_uses_ten_percent_threshold(variation, expected):
    assert classify_trend(variation) == expected


async def test_history_builds_twelve_months_ending_at_latest_reading():
    history = await build_service(recent_kwh=280.0, previous_kwh=200.0).get_history("UC100000")

    assert history.competencia_referencia == "2026-12"
    assert [month.competencia for month in history.meses] == [f"2026-{month:02d}" for month in range(1, 13)]
    assert history.meses[0].competencia_ano_anterior == "2025-01"
    assert history.meses[0].consumo_kwh_ano_anterior == pytest.approx(200.0)
    assert history.meses[0].variacao_consumo_pct == pytest.approx(40.0)


async def test_diagnosis_flags_consumption_increase():
    history = await build_service(recent_kwh=280.0, previous_kwh=200.0).get_history("UC100000")

    assert history.diagnostico is not None
    assert history.diagnostico.tendencia_consumo == ConsumptionTrend.SUBIU
    assert history.diagnostico.competencia_comparada == "2025-12"


async def test_diagnosis_reports_flag_change_when_consumption_is_stable():
    invoices = [invoice("2026-12", 230.0, bandeira="VERMELHA_P2"), invoice("2025-12", 160.0)]
    history = await build_service(recent_kwh=200.0, previous_kwh=200.0, invoices=invoices).get_history("UC100000")

    diagnosis = history.diagnostico
    assert diagnosis is not None
    assert diagnosis.tendencia_consumo == ConsumptionTrend.ESTAVEL
    assert diagnosis.bandeira_mudou is True
    assert (diagnosis.bandeira_ano_anterior, diagnosis.bandeira_atual) == ("VERDE", "VERMELHA_P2")
    assert history.meses[-1].variacao_valor_pct == pytest.approx(43.8)


async def test_open_invoices_include_open_and_overdue_only():
    invoices = [
        invoice("2026-12", 120.0, status="ABERTA"),
        invoice("2026-11", 80.5, status="VENCIDA"),
        invoice("2026-10", 99.0, status="PAGA"),
    ]
    history = await build_service(recent_kwh=200.0, previous_kwh=200.0, invoices=invoices).get_history("UC100000")

    assert [open_invoice.competencia for open_invoice in history.faturas_em_aberto] == ["2026-12", "2026-11"]
    assert history.valor_em_aberto_rs == pytest.approx(200.5)
    assert len(history.faturas) == 3


async def test_history_without_readings_returns_empty_window():
    service = Customer360Service(FakeCustomer360Repository(UNIT))
    history = await service.get_history("UC100000")

    assert history.meses == []
    assert history.diagnostico is None
    assert history.competencia_referencia is None


async def test_recent_unit_without_previous_year_has_no_comparison():
    measurements = [MeasurementDTO(competencia=f"2026-{month:02d}", consumo_kwh=150.0) for month in range(1, 7)]
    service = Customer360Service(FakeCustomer360Repository(UNIT, measurements))
    history = await service.get_history("UC100000")

    assert history.diagnostico is not None
    assert history.diagnostico.tendencia_consumo == ConsumptionTrend.SEM_COMPARACAO
    assert history.meses[0].consumo_kwh is None


async def test_events_query_quality_of_the_unit_feeder():
    repository = FakeCustomer360Repository(UNIT)
    events = await Customer360Service(repository).get_events("UC100000")

    assert repository.requested_feeder == "ALM-REC-004"
    assert events.alimentador == "ALM-REC-004"
    assert len(events.qualidade_alimentador) == 1
    assert events.chamados[0].motivo_chamado == "FATURA"
    assert events.interrupcoes_uc[0].causa == "CLIMATICA"
    assert events.resumo_interrupcoes_uc.total_interrupcoes == 81
    assert events.inspecoes[0].irregularidade_constatada is True


async def test_diagnosis_flags_estimated_reading_only_in_reference_month():
    measurements = [
        MeasurementDTO(competencia="2025-06", consumo_kwh=200.0, tipo_leitura="ESTIMADA"),
        MeasurementDTO(competencia="2026-06", consumo_kwh=260.0, tipo_leitura="ESTIMADA"),
    ]
    estimated = await Customer360Service(FakeCustomer360Repository(UNIT, measurements)).get_history("UC100000")
    measurements[1] = MeasurementDTO(competencia="2026-06", consumo_kwh=260.0, tipo_leitura="REAL")
    real = await Customer360Service(FakeCustomer360Repository(UNIT, measurements)).get_history("UC100000")

    assert estimated.diagnostico.leitura_estimada is True
    assert estimated.meses[-1].tipo_leitura == "ESTIMADA"
    assert real.diagnostico.leitura_estimada is False


@pytest.mark.parametrize("method_name", ["get_summary", "get_history", "get_events"])
async def test_unknown_unit_raises_not_found(method_name):
    service = Customer360Service(FakeCustomer360Repository(None))

    with pytest.raises(CustomerNotFoundError):
        await getattr(service, method_name)("UC999999")


async def test_lowercase_number_with_spaces_finds_the_unit():
    summary = await Customer360Service(FakeCustomer360Repository(UNIT)).get_summary("  uc100000 ")

    assert summary.id_uc == "UC100000"


def test_daily_average_handles_missing_or_zero_days():
    assert daily_average(240.0, 36) == pytest.approx(6.67)
    assert daily_average(240.0, 0) is None
    assert daily_average(None, 30) is None


async def test_diagnosis_separates_longer_billing_period_from_real_consumption():
    measurements = [
        MeasurementDTO(competencia="2025-06", consumo_kwh=200.0, dias_faturamento=30),
        MeasurementDTO(competencia="2026-06", consumo_kwh=240.0, dias_faturamento=36),
    ]
    service = Customer360Service(FakeCustomer360Repository(UNIT, measurements))
    diagnosis = (await service.get_history("UC100000")).diagnostico

    assert diagnosis is not None
    assert diagnosis.tendencia_consumo == ConsumptionTrend.SUBIU
    assert (diagnosis.dias_faturamento, diagnosis.dias_faturamento_ano_anterior) == (36, 30)
    assert diagnosis.media_diaria_kwh == pytest.approx(6.67)
    assert diagnosis.tendencia_media_diaria == ConsumptionTrend.ESTAVEL


async def test_diagnosis_reports_tariff_variation():
    invoices = [
        invoice("2026-12", 176.0).model_copy(update={"tarifa_aplicada_rs_kwh": 0.88}),
        invoice("2025-12", 160.0).model_copy(update={"tarifa_aplicada_rs_kwh": 0.80}),
    ]
    diagnosis = (await build_service(200.0, 200.0, invoices).get_history("UC100000")).diagnostico

    assert diagnosis is not None
    assert (diagnosis.tarifa_rs_kwh, diagnosis.tarifa_rs_kwh_ano_anterior) == (0.88, 0.80)
    assert diagnosis.variacao_tarifa_pct == pytest.approx(10.0)


async def test_history_totals_compare_twelve_months():
    history = await build_service(recent_kwh=280.0, previous_kwh=200.0).get_history("UC100000")

    totals = history.resumo_12_meses
    assert totals is not None
    assert totals.meses_comparados == 12
    assert (totals.consumo_kwh, totals.consumo_kwh_ano_anterior) == (3360.0, 2400.0)
    assert totals.variacao_consumo_pct == pytest.approx(40.0)


def test_totals_ignore_months_without_previous_year():
    recent_only = [
        MonthlyComparisonDTO(
            competencia=f"2026-{month:02d}", competencia_ano_anterior=f"2025-{month:02d}", consumo_kwh=150.0
        )
        for month in range(1, 7)
    ]

    assert summarize_window(recent_only) is None


async def test_search_ignores_short_text_and_normalizes_digits():
    repository = FakeCustomer360Repository(UNIT)
    service = Customer360Service(repository)

    assert await service.search("10", 8) == []
    assert repository.searched_range is None
    await service.search("10000", 8)
    assert repository.searched_range.start == "UC10000"
    await service.search(" maria   silva ", 8)
    assert repository.searched_holder_pattern == "%maria silva%"
