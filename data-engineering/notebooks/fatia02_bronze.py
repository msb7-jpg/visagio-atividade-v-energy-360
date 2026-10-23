# Databricks notebook source
# MAGIC %md
# MAGIC # Fatia 02 — Landing ➜ Bronze (Faturamento, Rede & Atendimento)
# MAGIC
# MAGIC **Dono:** Ryei Estevan
# MAGIC
# MAGIC Ingere as 4 fontes da Fatia 02 **sem alterar conteúdo** (regra Bronze):
# MAGIC
# MAGIC | Fonte | Formato | Tabela Delta |
# MAGIC |---|---|---|
# MAGIC | `faturas.csv` | CSV `;` (mainframe) | `bronze_faturas` |
# MAGIC | `ocorrencias_rede.csv` | CSV `,` | `bronze_ocorrencias_rede` |
# MAGIC | `atendimentos.json` | JSON array multilinha | `bronze_atendimentos` |
# MAGIC | `inspecoes.xlsx` | Excel, 3 abas | `bronze_inspecoes` |
# MAGIC | `aneel_limites_continuidade.csv` | CSV `;` (ANEEL) | `bronze_aneel_limites` |
# MAGIC
# MAGIC Todas as colunas de origem são lidas como texto (exceto a estrutura aninhada do JSON),
# MAGIC e cada tabela recebe `_ingested_at` e `_source_file`.

# COMMAND ----------

# MAGIC %pip install openpyxl==3.1.5 --quiet

# COMMAND ----------

from pyspark.sql import DataFrame
from pyspark.sql import functions as F

CATALOG = "visagio_atividade_v_energy_360"
SCHEMA = "bronze"
LANDING_PATH = f"/Volumes/{CATALOG}/{SCHEMA}/landing"

# COMMAND ----------


def add_audit_columns(raw_df: DataFrame) -> DataFrame:
    """Anexa metadados técnicos obrigatórios da camada Bronze."""
    return raw_df.withColumn("_ingested_at", F.current_timestamp()).withColumn(
        "_source_file", F.col("_metadata.file_path")
    )


def save_bronze(bronze_df: DataFrame, table_name: str) -> None:
    full_name = f"{CATALOG}.{SCHEMA}.{table_name}"
    (
        bronze_df.write.format("delta")
        .mode("overwrite")
        .option("overwriteSchema", "true")
        .saveAsTable(full_name)
    )
    print(f"✓ {full_name}: {spark.table(full_name).count():,} linhas")


def read_delimited(file_name: str, separator: str) -> DataFrame:
    return (
        spark.read.option("header", "true")
        .option("inferSchema", "false")
        .option("sep", separator)
        .csv(f"{LANDING_PATH}/{file_name}")
    )


# COMMAND ----------

# MAGIC %md ## Faturas e Ocorrências de Rede (CSV)

# COMMAND ----------

save_bronze(add_audit_columns(read_delimited("faturas.csv", ";")), "bronze_faturas")
save_bronze(
    add_audit_columns(read_delimited("ocorrencias_rede.csv", ",")),
    "bronze_ocorrencias_rede",
)

# COMMAND ----------

# MAGIC %md ## Atendimentos (JSON aninhado — `historico` preservado como Array<Struct>)

# COMMAND ----------

atendimentos_df = spark.read.option("multiLine", "true").json(
    f"{LANDING_PATH}/atendimentos.json"
)
save_bronze(add_audit_columns(atendimentos_df), "bronze_atendimentos")

# COMMAND ----------

# MAGIC %md ## Inspeções (Excel — 3 abas empilhadas, aba de origem em `_source_sheet`)
# MAGIC
# MAGIC Spark não lê `.xlsx` nativamente no Serverless, então cada aba é lida com pandas
# MAGIC como texto puro (`dtype=str`) para não converter datas nem decimais com vírgula.

# COMMAND ----------

import pandas as pd

inspecoes_path = f"{LANDING_PATH}/inspecoes.xlsx"
sheets_by_name = pd.read_excel(inspecoes_path, sheet_name=None, dtype=str)
inspecoes_pdf = pd.concat(
    [sheet_pdf.assign(_source_sheet=sheet_name) for sheet_name, sheet_pdf in sheets_by_name.items()],
    ignore_index=True,
)
inspecoes_df = (
    spark.createDataFrame(inspecoes_pdf.astype(object).where(inspecoes_pdf.notna(), None))
    .withColumn("_ingested_at", F.current_timestamp())
    .withColumn("_source_file", F.lit(inspecoes_path))
)
save_bronze(inspecoes_df, "bronze_inspecoes")

# COMMAND ----------

# MAGIC %md ## Limites ANEEL de DEC/FEC (fonte externa — ADR-003)
# MAGIC
# MAGIC `indicadores-continuidade-coletivos-limite.csv` do Portal de Dados Abertos da ANEEL,
# MAGIC com os limites anuais por conjunto elétrico de todas as distribuidoras.

# COMMAND ----------

save_bronze(
    add_audit_columns(read_delimited("aneel_limites_continuidade.csv", ";")),
    "bronze_aneel_limites",
)

# COMMAND ----------

# MAGIC %md ## Verificação rápida

# COMMAND ----------

BRONZE_TABLES = [
    "bronze_faturas",
    "bronze_ocorrencias_rede",
    "bronze_atendimentos",
    "bronze_inspecoes",
    "bronze_aneel_limites",
]
for table_name in BRONZE_TABLES:
    spark.table(f"{CATALOG}.{SCHEMA}.{table_name}").printSchema()
