"""Serviço Pure Python da Visão 360: consolida cadastro, consumo YoY, faturas e eventos de uma UC."""

from typing import Protocol

from app.features.customer360.consumption_analysis import (
    JANELA_MESES,
    build_monthly_comparison,
    diagnose_high_bill,
    latest_competencia,
)
from app.features.customer360.exceptions import CustomerNotFoundError
from app.features.customer360.payment_behavior import summarize_punctuality
from app.features.customer360.schemas import (
    CustomerEventTimelineDTO,
    CustomerHistoryDTO,
    CustomerSearchResultDTO,
    CustomerSummaryDTO,
    FeederQualityMonthDTO,
    HighBillDiagnosisDTO,
    InvoiceDTO,
    MeasurementDTO,
    MonthlyComparisonDTO,
    ServiceTicketDTO,
)
from app.features.customer360.search_terms import (
    PrefixRange,
    is_searchable,
    normalize_id_uc,
    normalize_meter,
    prefix_range,
)
from app.features.customer360.yoy_totals import summarize_window

STATUS_EM_ABERTO = frozenset({"ABERTA", "VENCIDA"})


class Customer360Reader(Protocol):
    """Leituras que o serviço precisa; implementado por `Customer360Repository` e por dublês de teste."""

    async def fetch_unit(self, id_uc: str) -> CustomerSummaryDTO | None: ...
    async def unit_exists(self, id_uc: str) -> bool: ...
    async def fetch_measurements(self, id_uc: str) -> list[MeasurementDTO]: ...
    async def fetch_invoices(self, id_uc: str) -> list[InvoiceDTO]: ...
    async def fetch_feeder_quality(self, id_alimentador: str, limite_meses: int) -> list[FeederQualityMonthDTO]: ...
    async def fetch_service_tickets(self, id_uc: str) -> list[ServiceTicketDTO]: ...
    async def search_units(
        self, uc_range: PrefixRange, meter_range: PrefixRange, limite: int
    ) -> list[CustomerSearchResultDTO]: ...


class Customer360Service:
    """Regras da tela única de atendimento, sem dependência de framework HTTP."""

    def __init__(self, repository: Customer360Reader) -> None:
        self.repository = repository

    async def search(self, typed_text: str, limite: int) -> list[CustomerSearchResultDTO]:
        """Sugere UCs enquanto o atendente digita, pelo começo do número da UC ou do medidor.

        Args:
            typed_text: Texto digitado em qualquer formato (ex: `10000`, `uc 100`, `MD5000`).
            limite: Quantidade máxima de sugestões.

        Returns:
            Sugestões em ordem de número; vazio se o texto tiver menos de 3 caracteres úteis.
        """
        if not is_searchable(typed_text):
            return []
        uc_range = prefix_range(normalize_id_uc(typed_text))
        meter_range = prefix_range(normalize_meter(typed_text))
        return await self.repository.search_units(uc_range, meter_range, limite)

    async def get_summary(self, id_uc: str) -> CustomerSummaryDTO:
        """Busca o cadastro da UC.

        Args:
            id_uc: Identificador da unidade consumidora (ex: `UC100000`).

        Returns:
            Cadastro com medidor ativo, alimentador e geração solar.

        Raises:
            CustomerNotFoundError: A UC não existe em `dim_unidade_consumidora`.
        """
        unit = await self.repository.fetch_unit(normalize_id_uc(id_uc))
        if unit is None:
            raise CustomerNotFoundError(id_uc)
        return unit

    async def get_history(self, id_uc: str) -> CustomerHistoryDTO:
        """Monta o consumo YoY, as faturas e o diagnóstico de conta alta da UC.

        A janela tem 12 meses e termina na competência mais recente com leitura da própria UC.

        Args:
            id_uc: Identificador da unidade consumidora.

        Returns:
            Meses comparados ao ano anterior, diagnóstico (None sem leituras), faturas e valor em aberto.

        Raises:
            CustomerNotFoundError: A UC não existe no cadastro.
        """
        normalized_id = normalize_id_uc(id_uc)
        if not await self.repository.unit_exists(normalized_id):
            raise CustomerNotFoundError(id_uc)
        measurements = await self.repository.fetch_measurements(normalized_id)
        invoices = await self.repository.fetch_invoices(normalized_id)
        invoices_by_month = {invoice.competencia: invoice for invoice in invoices}
        monthly_comparison, diagnosis = _analyze_consumption(measurements, invoices_by_month)
        open_invoices = [invoice for invoice in invoices if invoice.status_pagamento in STATUS_EM_ABERTO]
        open_amount = sum(invoice.valor_total_rs or 0.0 for invoice in open_invoices)
        return CustomerHistoryDTO(
            id_uc=normalized_id,
            competencia_referencia=diagnosis.competencia_referencia if diagnosis else None,
            meses=monthly_comparison,
            resumo_12_meses=summarize_window(monthly_comparison),
            diagnostico=diagnosis,
            faturas=invoices,
            faturas_em_aberto=open_invoices,
            valor_em_aberto_rs=round(open_amount, 2),
            pontualidade=summarize_punctuality(invoices),
        )

    async def get_events(self, id_uc: str) -> CustomerEventTimelineDTO:
        """Reúne a continuidade do alimentador da UC e os chamados abertos por ela.

        Args:
            id_uc: Identificador da unidade consumidora.

        Returns:
            DEC/FEC dos últimos 12 meses do alimentador (mais recente primeiro) e chamados.

        Raises:
            CustomerNotFoundError: A UC não existe no cadastro.
        """
        unit = await self.get_summary(id_uc)
        feeder_quality = (
            await self.repository.fetch_feeder_quality(unit.alimentador, JANELA_MESES) if unit.alimentador else []
        )
        tickets = await self.repository.fetch_service_tickets(unit.id_uc)
        return CustomerEventTimelineDTO(
            id_uc=unit.id_uc,
            alimentador=unit.alimentador,
            qualidade_alimentador=feeder_quality,
            chamados=tickets,
        )


def _analyze_consumption(
    measurements: list[MeasurementDTO], invoices_by_month: dict[str, InvoiceDTO]
) -> tuple[list[MonthlyComparisonDTO], HighBillDiagnosisDTO | None]:
    reference = latest_competencia(measurements)
    if reference is None:
        return [], None
    measurements_by_month = {measurement.competencia: measurement for measurement in measurements}
    monthly_comparison = build_monthly_comparison(reference, measurements_by_month, invoices_by_month)
    return monthly_comparison, diagnose_high_bill(monthly_comparison[-1], invoices_by_month)
