"""Consultas às tabelas Gold de cadastro, medição, faturamento, rede e atendimento de uma UC."""

from collections.abc import Mapping

from sqlalchemy import TextClause, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.customer360.schemas import (
    CustomerSearchResultDTO,
    CustomerSummaryDTO,
    FeederQualityMonthDTO,
    InvoiceDTO,
    MeasurementDTO,
    ServiceTicketDTO,
)
from app.features.customer360.search_terms import PrefixRange
from app.shared.exceptions import DatabaseReadError

UNIT_SQL = text("SELECT * FROM dim_unidade_consumidora WHERE id_uc = :id_uc")

UNIT_EXISTS_SQL = text("SELECT 1 AS existe FROM dim_unidade_consumidora WHERE id_uc = :id_uc LIMIT 1")

SEARCH_SQL = text("""
SELECT *
FROM dim_unidade_consumidora
WHERE (id_uc >= :uc_start AND id_uc < :uc_end)
   OR (numero_medidor_ativo >= :meter_start AND numero_medidor_ativo < :meter_end)
ORDER BY id_uc
LIMIT :limite
""")

MEASUREMENTS_SQL = text("""
SELECT competencia, consumo_kwh, dias_faturamento
FROM fato_medicao
WHERE id_uc = :id_uc
ORDER BY competencia
""")

INVOICES_SQL = text("""
SELECT id_fatura, competencia, data_vencimento, data_pagamento, valor_total_rs,
       consumo_faturado_kwh, bandeira_tarifaria, tarifa_aplicada_rs_kwh, status_pagamento
FROM fato_faturamento
WHERE id_uc = :id_uc
ORDER BY competencia DESC
""")

FEEDER_QUALITY_SQL = text("""
SELECT competencia, dec_apurado_horas, fec_apurado_vezes, dec_limite_aneel, fec_limite_aneel, violou_meta
FROM fato_qualidade_alimentador
WHERE id_alimentador = :id_alimentador
ORDER BY competencia DESC
LIMIT :limite_meses
""")

SERVICE_TICKETS_SQL = text("""
SELECT id_atendimento, numero_protocolo, motivo_chamado, data_abertura, status_chamado, nota_csat
FROM fato_atendimentos
WHERE id_uc = :id_uc
ORDER BY data_abertura DESC
""")


class Customer360Repository:
    """Leitura somente das tabelas Gold necessárias para a tela única de atendimento."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_unit(self, id_uc: str) -> CustomerSummaryDTO | None:
        """Cadastro completo da UC, ou None se ela não existir."""
        rows = await self._fetch_rows(UNIT_SQL, {"id_uc": id_uc}, "dim_unidade_consumidora")
        return CustomerSummaryDTO.model_validate(rows[0]) if rows else None

    async def unit_exists(self, id_uc: str) -> bool:
        """Verifica a existência da UC sem carregar o cadastro."""
        rows = await self._fetch_rows(UNIT_EXISTS_SQL, {"id_uc": id_uc}, "dim_unidade_consumidora")
        return bool(rows)

    async def search_units(
        self, uc_range: PrefixRange, meter_range: PrefixRange, limite: int
    ) -> list[CustomerSearchResultDTO]:
        """UCs cujo número ou medidor começa com o texto buscado, em ordem de número."""
        params = {
            "uc_start": uc_range.start,
            "uc_end": uc_range.end,
            "meter_start": meter_range.start,
            "meter_end": meter_range.end,
            "limite": limite,
        }
        rows = await self._fetch_rows(SEARCH_SQL, params, "dim_unidade_consumidora")
        return [CustomerSearchResultDTO.model_validate(row) for row in rows]

    async def fetch_measurements(self, id_uc: str) -> list[MeasurementDTO]:
        """Consumo medido por competência, em ordem cronológica."""
        rows = await self._fetch_rows(MEASUREMENTS_SQL, {"id_uc": id_uc}, "fato_medicao")
        return [MeasurementDTO.model_validate(row) for row in rows]

    async def fetch_invoices(self, id_uc: str) -> list[InvoiceDTO]:
        """Faturas da UC, da competência mais recente para a mais antiga."""
        rows = await self._fetch_rows(INVOICES_SQL, {"id_uc": id_uc}, "fato_faturamento")
        return [InvoiceDTO.model_validate(row) for row in rows]

    async def fetch_feeder_quality(self, id_alimentador: str, limite_meses: int) -> list[FeederQualityMonthDTO]:
        """DEC/FEC das últimas `limite_meses` competências do alimentador, mais recente primeiro."""
        params = {"id_alimentador": id_alimentador, "limite_meses": limite_meses}
        rows = await self._fetch_rows(FEEDER_QUALITY_SQL, params, "fato_qualidade_alimentador")
        return [FeederQualityMonthDTO.model_validate(row) for row in rows]

    async def fetch_service_tickets(self, id_uc: str) -> list[ServiceTicketDTO]:
        """Chamados abertos pela UC, mais recente primeiro."""
        rows = await self._fetch_rows(SERVICE_TICKETS_SQL, {"id_uc": id_uc}, "fato_atendimentos")
        return [ServiceTicketDTO.model_validate(row) for row in rows]

    async def _fetch_rows(
        self, query: TextClause, params: Mapping[str, str | int], table_name: str
    ) -> list[Mapping[str, object]]:
        try:
            result = await self.session.execute(query, params)
        except OperationalError as e:
            raise DatabaseReadError(f"Tabela Gold '{table_name}' indisponível no banco analítico.") from e
        return list(result.mappings().all())
