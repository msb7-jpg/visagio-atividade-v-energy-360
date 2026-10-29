"""Tarifa média da Fila de Inspeção: receita ÷ energia faturada dos últimos 12 meses (decisão P4)."""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.loss_management.repository import LossRepository
from app.features.loss_management.tariff import AverageTariff, compute_average_tariff
from app.main import app
from app.shared.exceptions import DatabaseReadError
from tests.loss_tariff import TARIFF_RS_KWH
from tests.test_loss_router import BASE_URL, auth_headers, open_client

BILLING_DDL = "CREATE TABLE fato_faturamento (competencia TEXT, valor_total_rs REAL, consumo_faturado_kwh REAL)"
INSERT_BILLING = "INSERT INTO fato_faturamento VALUES (:competencia, :valor_total_rs, :consumo_faturado_kwh)"


def invoice(competencia: str, revenue_rs: float, energy_kwh: float) -> dict[str, object]:
    return {"competencia": competencia, "valor_total_rs": revenue_rs, "consumo_faturado_kwh": energy_kwh}


async def tariff_from(invoices: list[dict[str, object]] | None) -> AverageTariff:
    """Calcula a tarifa num banco novo; `invoices=None` deixa a tabela inexistente."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    try:
        async with engine.begin() as connection:
            if invoices is not None:
                await connection.execute(text(BILLING_DDL))
                if invoices:
                    await connection.execute(text(INSERT_BILLING), invoices)
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            return await LossRepository(session).fetch_average_tariff()
    finally:
        await engine.dispose()


def test_tariff_is_revenue_divided_by_energy_with_the_period():
    result = compute_average_tariff(750.0, 1000.0, "2025-02", "2026-01")

    assert result == AverageTariff(rs_per_kwh=0.75, period_start="2025-02", period_end="2026-01")


@pytest.mark.parametrize(("revenue", "energy"), [(None, None), (100.0, None), (100.0, 0.0), (None, 500.0)])
def test_tariff_without_billed_energy_is_an_explicit_error(revenue, energy):
    with pytest.raises(DatabaseReadError, match="não é possível calcular a tarifa"):
        compute_average_tariff(revenue, energy, "2025-02", "2026-01")


async def test_tariff_is_weighted_by_consumption_not_a_simple_average():
    # Faixa pequena a R$ 1,00/kWh e faixa grande a R$ 0,50/kWh: média simples 0,75; ponderada 600/1100 = 0,5455.
    invoices = [invoice("2026-01", 100.0, 100.0), invoice("2026-01", 500.0, 1000.0)]

    result = await tariff_from(invoices)

    assert result.rs_per_kwh == pytest.approx(600.0 / 1100.0, abs=1e-4)
    assert result.rs_per_kwh != pytest.approx(0.75, abs=0.01)


async def test_tariff_uses_only_the_twelve_months_up_to_the_latest_billing():
    invoices = [
        invoice("2025-01", 9999.0, 1.0),  # 13 meses antes: fora da janela
        invoice("2025-02", 300.0, 500.0),  # primeiro mês da janela
        invoice("2026-01", 450.0, 500.0),
    ]

    result = await tariff_from(invoices)

    assert (result.rs_per_kwh, result.period_start, result.period_end) == (0.75, "2025-02", "2026-01")


async def test_tariff_rounds_to_four_decimals():
    result = await tariff_from([invoice("2026-01", 1.0, 3.0)])

    assert result.rs_per_kwh == pytest.approx(0.3333)


async def test_tariff_on_an_empty_table_is_an_error_and_not_a_fallback():
    with pytest.raises(DatabaseReadError, match="Não há faturas"):
        await tariff_from([])


async def test_tariff_without_the_billing_table_is_an_error():
    with pytest.raises(DatabaseReadError, match="Falha ao calcular a tarifa"):
        await tariff_from(None)


async def test_tariff_is_cached_per_database_for_the_day():
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    try:
        async with engine.begin() as connection:
            await connection.execute(text(BILLING_DDL))
            await connection.execute(text(INSERT_BILLING), [invoice("2026-01", 750.0, 1000.0)])
        async with async_sessionmaker(engine, expire_on_commit=False)() as session:
            first = await LossRepository(session).fetch_average_tariff()
            await session.execute(text("DELETE FROM fato_faturamento"))
            second = await LossRepository(session).fetch_average_tariff()
    finally:
        await engine.dispose()

    assert second == first


@pytest.fixture
async def seeded():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        yield engine, http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def test_summary_exposes_the_tariff_and_its_period(seeded):
    _, client = seeded
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/queue-summary", headers=headers)

    summary = response.json()
    assert summary["tarifa_rs_kwh"] == TARIFF_RS_KWH
    assert (summary["tarifa_periodo_inicio"], summary["tarifa_periodo_fim"]) == ("2025-02", "2026-01")


async def test_queue_values_in_reais_use_the_calculated_tariff(seeded):
    _, client = seeded
    headers = await auth_headers(client, "perdas@venergy.com")

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    unit = next(item for item in response.json()["itens"] if item["id_uc"] == "UC_FRAUDE")
    assert unit["valor_ano_rs"] == pytest.approx(unit["kwh_mes_recuperavel"] * 12 * TARIFF_RS_KWH, abs=0.01)


async def test_queue_reports_a_clear_error_when_billing_is_empty(seeded):
    engine, client = seeded
    headers = await auth_headers(client, "perdas@venergy.com")
    async with engine.begin() as connection:
        await connection.execute(text("DELETE FROM fato_faturamento"))

    response = await client.get(f"{BASE_URL}/suspicious-units", headers=headers)

    assert response.status_code == 500
    assert "Não há faturas" in response.text
