from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.revenue.decomposition import SegmentTotals
from app.features.revenue.kpis import PeriodTotals, WindowTotals
from app.features.revenue.schemas import PeriodWindow, RevenueFilters
from app.shared.exceptions import DatabaseReadError

SEGMENT_TOTALS_SQL = text("""
SELECT
    d.classe_consumo AS classe_consumo,
    d.municipio AS municipio,
    d.bairro AS bairro,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :base_inicio AND :base_fim
                      THEN f.consumo_faturado_kwh END), 0) AS volume_base_kwh,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :base_inicio AND :base_fim
                      THEN f.valor_total_rs END), 0) AS receita_base_rs,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :atual_inicio AND :atual_fim
                      THEN f.consumo_faturado_kwh END), 0) AS volume_atual_kwh,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :atual_inicio AND :atual_fim
                      THEN f.valor_total_rs END), 0) AS receita_atual_rs
FROM fato_faturamento AS f
JOIN dim_unidade_consumidora AS d ON d.id_uc = f.id_uc
WHERE (f.competencia BETWEEN :base_inicio AND :base_fim OR f.competencia BETWEEN :atual_inicio AND :atual_fim)
  AND (:municipio IS NULL OR d.municipio = :municipio)
  AND (:bairro IS NULL OR d.bairro = :bairro)
  AND (:classe_consumo IS NULL OR d.classe_consumo = :classe_consumo)
GROUP BY d.classe_consumo, d.municipio, d.bairro
ORDER BY d.municipio, d.bairro, d.classe_consumo
""")

PERIOD_TOTALS_SQL = text("""
SELECT
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :base_inicio AND :base_fim
                      THEN f.valor_total_rs END), 0) AS receita_base_rs,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :base_inicio AND :base_fim
                      THEN f.consumo_faturado_kwh END), 0) AS volume_base_kwh,
    COUNT(CASE WHEN f.competencia BETWEEN :base_inicio AND :base_fim THEN 1 END) AS faturas_base,
    COUNT(DISTINCT CASE WHEN f.competencia BETWEEN :base_inicio AND :base_fim THEN f.id_uc END) AS ucs_base,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :atual_inicio AND :atual_fim
                      THEN f.valor_total_rs END), 0) AS receita_atual_rs,
    COALESCE(SUM(CASE WHEN f.competencia BETWEEN :atual_inicio AND :atual_fim
                      THEN f.consumo_faturado_kwh END), 0) AS volume_atual_kwh,
    COUNT(CASE WHEN f.competencia BETWEEN :atual_inicio AND :atual_fim THEN 1 END) AS faturas_atual,
    COUNT(DISTINCT CASE WHEN f.competencia BETWEEN :atual_inicio AND :atual_fim THEN f.id_uc END) AS ucs_atual
FROM fato_faturamento AS f
JOIN dim_unidade_consumidora AS d ON d.id_uc = f.id_uc
WHERE (f.competencia BETWEEN :base_inicio AND :base_fim OR f.competencia BETWEEN :atual_inicio AND :atual_fim)
  AND (:municipio IS NULL OR d.municipio = :municipio)
  AND (:bairro IS NULL OR d.bairro = :bairro)
  AND (:classe_consumo IS NULL OR d.classe_consumo = :classe_consumo)
""")


def build_params(base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters) -> dict[str, str | None]:
    """Parâmetros nomeados das consultas, sempre ligados por bind (nunca concatenados no SQL)."""
    return {
        "base_inicio": base.competencia_inicio,
        "base_fim": base.competencia_fim,
        "atual_inicio": current.competencia_inicio,
        "atual_fim": current.competencia_fim,
        "municipio": filters.municipio,
        "bairro": filters.bairro,
        "classe_consumo": filters.classe_consumo,
    }


class RevenueRepository:
    """Leitura somente das tabelas Gold necessárias para decompor a receita."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def fetch_segment_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> list[SegmentTotals]:
        """Soma volume e receita por classe, município e bairro nas janelas base e atual.

        Args:
            base: Janela de referência.
            current: Janela comparada.
            filters: Recortes opcionais por município, bairro e classe.

        Returns:
            Um item por segmento que teve faturamento em alguma das duas janelas.

        Raises:
            DatabaseReadError: Se as tabelas Gold não existirem ou a leitura falhar.
        """
        try:
            result = await self.session.execute(SEGMENT_TOTALS_SQL, build_params(base, current, filters))
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler o faturamento agregado: {error.orig}") from error
        return [SegmentTotals(**row) for row in result.mappings()]

    async def fetch_period_totals(
        self, base: PeriodWindow, current: PeriodWindow, filters: RevenueFilters
    ) -> PeriodTotals:
        """Soma receita, volume, faturas e UCs distintas nas janelas base e atual.

        Args:
            base: Janela de referência.
            current: Janela comparada.
            filters: Recortes opcionais por município, bairro e classe.

        Returns:
            Totais gerais das duas janelas; sem faturamento, todos os valores são zero.

        Raises:
            DatabaseReadError: Se as tabelas Gold não existirem ou a leitura falhar.
        """
        try:
            result = await self.session.execute(PERIOD_TOTALS_SQL, build_params(base, current, filters))
        except OperationalError as error:
            raise DatabaseReadError(f"Falha ao ler os totais de faturamento: {error.orig}") from error
        row = result.mappings().one()
        return PeriodTotals(
            base=WindowTotals(row["receita_base_rs"], row["volume_base_kwh"], row["faturas_base"], row["ucs_base"]),
            current=WindowTotals(
                row["receita_atual_rs"], row["volume_atual_kwh"], row["faturas_atual"], row["ucs_atual"]
            ),
        )