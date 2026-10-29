"""Tarifa conhecida dos testes da Fila de Inspeção: faturas semeadas em `fato_faturamento` e o resultado esperado."""

from app.features.loss_management.tariff import AverageTariff

TARIFF_RS_KWH = 0.75
TEST_TARIFF = AverageTariff(rs_per_kwh=TARIFF_RS_KWH, period_start="2025-02", period_end="2026-01")

# Janela de 12 meses terminando em 2026-01. A fatura de 2024-12 está fora dela e não pode entrar na média.
BILLING_ROWS = [
    {"competencia": "2025-02", "valor_total_rs": 300.0, "consumo_faturado_kwh": 500.0},
    {"competencia": "2026-01", "valor_total_rs": 450.0, "consumo_faturado_kwh": 500.0},
    {"competencia": "2024-12", "valor_total_rs": 99999.0, "consumo_faturado_kwh": 1.0},
]
