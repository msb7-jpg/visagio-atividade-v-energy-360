# Databricks notebook source
# MAGIC %md
# MAGIC # Fatia 02 — Testes de Qualidade da Gold
# MAGIC
# MAGIC **Dono:** Ryei Estevan
# MAGIC
# MAGIC Roda no job **depois da Gold e antes da exportação para o SQLite**. Cada teste é uma
# MAGIC consulta que conta as linhas que violam uma regra: **0 = aprovado**. Se algum teste
# MAGIC falhar, o notebook levanta erro, o job para e o portal continua com os últimos dados bons.
# MAGIC
# MAGIC Regras: `docs/planning/ryei_estevan/faturamento_rede_atendimento.md` (Fase 5) e
# MAGIC `docs/DECISOES.md` (ADR-001 a ADR-003).

# COMMAND ----------

from pyspark.sql import functions as F

CATALOG = "visagio_atividade_v_energy_360"
SILVER = f"{CATALOG}.silver"

spark.sql(f"USE {CATALOG}.gold")


def duplicated_ids_sql(table_name: str, id_column: str) -> str:
    return f"""
    SELECT count(*) FROM (
        SELECT {id_column} FROM {table_name} GROUP BY {id_column} HAVING count(*) > 1
    )"""


def row_count_gap_sql(gold_table: str, expected_count_sql: str) -> str:
    """Viola quando a Gold perdeu ou ganhou linhas em relação à Silver de origem."""
    return f"SELECT abs((SELECT count(*) FROM {gold_table}) - ({expected_count_sql}))"


# COMMAND ----------

# MAGIC %md ## Catálogo de testes
# MAGIC Cada entrada: (tabela, descrição da regra, SQL que conta as violações).

# COMMAND ----------

QUALITY_TESTS = [
    # fato_faturamento
    (
        "fato_faturamento",
        "valor_total = valor_energia + tributos (tolerância de 1 centavo)",
        """SELECT count(*) FROM fato_faturamento
           WHERE abs(valor_total_rs - valor_energia_rs - tributos_rs) > 0.01""",
    ),
    (
        "fato_faturamento",
        "Nenhuma fatura de UC fora do cadastro (órfã)",
        f"""SELECT count(*) FROM fato_faturamento f
            LEFT ANTI JOIN {SILVER}.silver_uc_alimentador uc ON uc.id_uc = f.id_uc""",
    ),
    (
        "fato_faturamento",
        "Valores monetários e datas de emissão/vencimento não nulos",
        """SELECT count(*) FROM fato_faturamento
           WHERE valor_total_rs IS NULL OR data_emissao IS NULL OR data_vencimento IS NULL""",
    ),
    (
        "fato_faturamento",
        "Tarifa aplicada só existe com consumo positivo",
        """SELECT count(*) FROM fato_faturamento
           WHERE tarifa_aplicada_rs_kwh IS NOT NULL AND NOT consumo_faturado_kwh > 0""",
    ),
    ("fato_faturamento", "id_fatura único", duplicated_ids_sql("fato_faturamento", "id_fatura")),
    (
        "fato_faturamento",
        "Mesma quantidade de faturas de UCs cadastradas da Silver",
        row_count_gap_sql(
            "fato_faturamento",
            f"SELECT count(*) FROM {SILVER}.silver_faturas WHERE fl_uc_cadastrada",
        ),
    ),
    # fato_qualidade_alimentador
    (
        "fato_qualidade_alimentador",
        "DEC >= 0 e FEC >= 0 (mensal e acumulado no ano)",
        """SELECT count(*) FROM fato_qualidade_alimentador
           WHERE NOT (dec_apurado_horas >= 0 AND fec_apurado_vezes >= 0
                      AND dec_acumulado_ano_horas >= 0 AND fec_acumulado_ano_vezes >= 0)""",
    ),
    (
        "fato_qualidade_alimentador",
        "Limite ANEEL de DEC e FEC preenchido em todas as linhas (ADR-003)",
        """SELECT count(*) FROM fato_qualidade_alimentador
           WHERE dec_limite_aneel IS NULL OR fec_limite_aneel IS NULL""",
    ),
    (
        "fato_qualidade_alimentador",
        "Todo alimentador tem UCs atendidas (C_total > 0)",
        "SELECT count(*) FROM fato_qualidade_alimentador WHERE NOT ucs_atendidas > 0",
    ),
    (
        "fato_qualidade_alimentador",
        "Grade completa: alimentadores × competências, sem repetição",
        """SELECT abs(count(*) - count(DISTINCT id_alimentador) * count(DISTINCT competencia))
                  + count(*) - count(DISTINCT id_alimentador, competencia)
           FROM fato_qualidade_alimentador""",
    ),
    (
        "fato_qualidade_alimentador",
        "Toda UC interrompida da Silver foi contada no FEC",
        f"""SELECT abs((SELECT sum(ucs_interrompidas) FROM fato_qualidade_alimentador)
                       - (SELECT count(*) FROM {SILVER}.silver_ocorrencias_rede))""",
    ),
    # fato_atendimentos
    (
        "fato_atendimentos",
        "CSAT nulo ou entre 1 e 5 (ADR-001)",
        """SELECT count(*) FROM fato_atendimentos
           WHERE nota_csat IS NOT NULL AND nota_csat NOT BETWEEN 1.0 AND 5.0""",
    ),
    (
        "fato_atendimentos",
        "Tempo de resolução nunca negativo",
        "SELECT count(*) FROM fato_atendimentos WHERE tempo_resolucao_horas < 0",
    ),
    ("fato_atendimentos", "Protocolo único", duplicated_ids_sql("fato_atendimentos", "id_atendimento")),
    (
        "fato_atendimentos",
        "Mesma quantidade de protocolos da Silver",
        row_count_gap_sql("fato_atendimentos", f"SELECT count(*) FROM {SILVER}.silver_atendimentos"),
    ),
    # fato_inspecoes_perdas
    (
        "fato_inspecoes_perdas",
        "Data da inspeção dentro da campanha (ago–dez/2025)",
        """SELECT count(*) FROM fato_inspecoes_perdas
           WHERE data_inspecao IS NULL
              OR data_inspecao NOT BETWEEN DATE'2025-08-01' AND DATE'2025-12-31'""",
    ),
    (
        "fato_inspecoes_perdas",
        "kWh recuperado nunca negativo",
        "SELECT count(*) FROM fato_inspecoes_perdas WHERE kwh_recuperado < 0",
    ),
    ("fato_inspecoes_perdas", "id_inspecao único", duplicated_ids_sql("fato_inspecoes_perdas", "id_inspecao")),
    (
        "fato_inspecoes_perdas",
        "Mesma quantidade de inspeções da Silver",
        row_count_gap_sql("fato_inspecoes_perdas", f"SELECT count(*) FROM {SILVER}.silver_inspecoes"),
    ),
]

# COMMAND ----------

# MAGIC %md ## Execução

# COMMAND ----------

test_results = []
for table_name, rule_description, violations_sql in QUALITY_TESTS:
    violation_count = spark.sql(violations_sql).collect()[0][0]
    test_results.append((table_name, rule_description, int(violation_count)))

display(
    spark.createDataFrame(test_results, "tabela string, regra string, violacoes long").withColumn(
        "status", F.expr("CASE WHEN violacoes = 0 THEN 'APROVADO' ELSE 'REPROVADO' END")
    )
)

failed_tests = [result for result in test_results if result[2] > 0]
print(f"{len(test_results) - len(failed_tests)}/{len(test_results)} testes aprovados")
if failed_tests:
    failure_lines = "\n".join(
        f"- {table_name}: {rule_description} ({violation_count:,} violações)"
        for table_name, rule_description, violation_count in failed_tests
    )
    raise AssertionError(f"Testes de qualidade reprovados:\n{failure_lines}")
