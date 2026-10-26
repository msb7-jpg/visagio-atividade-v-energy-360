# Databricks notebook source
# MAGIC %md
# MAGIC # Fatia 02 — Gold ➜ SQLite (`v_energy.db`)
# MAGIC
# MAGIC **Dono:** Ryei Estevan
# MAGIC
# MAGIC O `Silver_to_Gold` da Fatia 01 recria `v_energy.db` no Volume `gold.exports` com as tabelas
# MAGIC de cadastro e medição. Este notebook roda **depois dele e dos testes de qualidade** e
# MAGIC acrescenta as 4 tabelas da Fatia 02 ao mesmo arquivo, sem tocar nas tabelas da Fatia 01.
# MAGIC
# MAGIC Tipos seguem o contrato usado pelo backend: datas e competências como texto ISO
# MAGIC (`yyyy-MM-dd`, `yyyy-MM`), decimais como `REAL` e booleanos como `0/1`.

# COMMAND ----------

import os
import shutil
import sqlite3
from datetime import date, datetime
from decimal import Decimal

CATALOG = "visagio_atividade_v_energy_360"
GOLD = f"{CATALOG}.gold"
VOLUME_DB_PATH = f"/Volumes/{CATALOG}/gold/exports/v_energy.db"
LOCAL_DB_PATH = "/tmp/v_energy_fatia02.db"
BATCH_SIZE = 50_000

# COMMAND ----------

# MAGIC %md ## Contrato das tabelas (DDL)

# COMMAND ----------

TABLE_DDL = {
    "fato_faturamento": """
        CREATE TABLE fato_faturamento (
            id_fatura TEXT PRIMARY KEY,
            id_uc TEXT NOT NULL,
            competencia TEXT NOT NULL,
            valor_energia_rs REAL,
            tributos_rs REAL,
            valor_total_rs REAL,
            consumo_faturado_kwh REAL,
            bandeira_tarifaria TEXT,
            tarifa_aplicada_rs_kwh REAL,
            data_emissao TEXT,
            data_vencimento TEXT,
            data_pagamento TEXT,
            status_pagamento TEXT,
            FOREIGN KEY (id_uc) REFERENCES dim_unidade_consumidora(id_uc)
        )""",
    "fato_qualidade_alimentador": """
        CREATE TABLE fato_qualidade_alimentador (
            id_alimentador TEXT NOT NULL,
            competencia TEXT NOT NULL,
            conjunto_aneel TEXT,
            criterio_limite TEXT,
            ucs_atendidas INTEGER,
            ucs_interrompidas INTEGER,
            dec_apurado_horas REAL,
            fec_apurado_vezes REAL,
            dec_acumulado_ano_horas REAL,
            fec_acumulado_ano_vezes REAL,
            dec_limite_aneel REAL,
            fec_limite_aneel REAL,
            violou_dec BOOLEAN,
            violou_fec BOOLEAN,
            violou_meta BOOLEAN,
            PRIMARY KEY (id_alimentador, competencia)
        )""",
    "fato_atendimentos": """
        CREATE TABLE fato_atendimentos (
            id_atendimento TEXT PRIMARY KEY,
            id_uc TEXT,
            numero_protocolo TEXT,
            motivo_chamado TEXT,
            submotivo_chamado TEXT,
            canal_atendimento TEXT,
            data_abertura TEXT,
            data_fechamento TEXT,
            status_chamado TEXT,
            tempo_resolucao_horas REAL,
            qtd_tratativas INTEGER,
            nota_csat REAL
        )""",
    "fato_inspecoes_perdas": """
        CREATE TABLE fato_inspecoes_perdas (
            id_inspecao TEXT PRIMARY KEY,
            id_uc TEXT,
            data_inspecao TEXT,
            id_inspetor TEXT,
            irregularidade_constatada BOOLEAN,
            tipo_irregularidade TEXT,
            kwh_recuperado REAL
        )""",
}

ANALYTIC_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_fato_fat_uc ON fato_faturamento(id_uc);",
    "CREATE INDEX IF NOT EXISTS idx_fato_fat_comp ON fato_faturamento(competencia);",
    "CREATE INDEX IF NOT EXISTS idx_fato_qualidade_alim ON fato_qualidade_alimentador(id_alimentador);",
    "CREATE INDEX IF NOT EXISTS idx_fato_qualidade_comp ON fato_qualidade_alimentador(competencia);",
    "CREATE INDEX IF NOT EXISTS idx_fato_atend_uc ON fato_atendimentos(id_uc);",
    "CREATE INDEX IF NOT EXISTS idx_fato_inspecoes_uc ON fato_inspecoes_perdas(id_uc);",
]

# COMMAND ----------

# MAGIC %md ## Carga

# COMMAND ----------


def to_sqlite_value(cell_value):
    if isinstance(cell_value, bool):
        return int(cell_value)
    if isinstance(cell_value, Decimal):
        return float(cell_value)
    if isinstance(cell_value, datetime):
        return cell_value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(cell_value, date):
        return cell_value.isoformat()
    return cell_value


def load_table(connection: sqlite3.Connection, table_name: str) -> int:
    table_columns = [row[1] for row in connection.execute(f"PRAGMA table_info({table_name})")]
    placeholders = ", ".join("?" for _ in table_columns)
    insert_sql = f"INSERT INTO {table_name} ({', '.join(table_columns)}) VALUES ({placeholders})"

    loaded_rows, batch = 0, []
    for spark_row in spark.table(f"{GOLD}.{table_name}").select(*table_columns).toLocalIterator():
        batch.append(tuple(to_sqlite_value(cell_value) for cell_value in spark_row))
        if len(batch) >= BATCH_SIZE:
            connection.executemany(insert_sql, batch)
            loaded_rows += len(batch)
            batch = []
    if batch:
        connection.executemany(insert_sql, batch)
        loaded_rows += len(batch)
    return loaded_rows


if not os.path.exists(VOLUME_DB_PATH):
    raise FileNotFoundError(f"{VOLUME_DB_PATH} não existe. Rode o Silver_to_Gold da Fatia 01 antes.")

# SQLite com WAL não funciona bem direto no Volume: trabalha numa cópia local
for suffix in ("", "-wal", "-shm"):
    if os.path.exists(LOCAL_DB_PATH + suffix):
        os.remove(LOCAL_DB_PATH + suffix)
shutil.copy(VOLUME_DB_PATH, LOCAL_DB_PATH)

connection = sqlite3.connect(LOCAL_DB_PATH)
connection.execute("PRAGMA journal_mode=WAL;")
connection.execute("PRAGMA synchronous=NORMAL;")
connection.execute("PRAGMA foreign_keys=ON;")

load_report = []
for table_name, create_sql in TABLE_DDL.items():
    connection.execute(f"DROP TABLE IF EXISTS {table_name}")
    connection.execute(create_sql)
    sqlite_rows = load_table(connection, table_name)
    gold_rows = spark.table(f"{GOLD}.{table_name}").count()
    load_report.append((table_name, gold_rows, sqlite_rows))
    print(f"✓ {table_name}: {sqlite_rows:,} linhas (Gold: {gold_rows:,})")

for index_statement in ANALYTIC_INDEXES:
    connection.execute(index_statement)
connection.commit()

# COMMAND ----------

# MAGIC %md ## Verificação e publicação no Volume

# COMMAND ----------

count_mismatches = [report for report in load_report if report[1] != report[2]]
fk_violations = connection.execute("PRAGMA foreign_key_check;").fetchall()
integrity_status = connection.execute("PRAGMA integrity_check;").fetchone()[0]
print(f"Violações de FK: {len(fk_violations)} · integrity_check: {integrity_status}")

if count_mismatches or fk_violations or integrity_status != "ok":
    connection.close()
    raise AssertionError(
        f"Exportação reprovada: contagens divergentes={count_mismatches}, "
        f"violações de FK={len(fk_violations)}, integrity_check={integrity_status}"
    )

connection.execute("PRAGMA wal_checkpoint(TRUNCATE);")
connection.close()
shutil.copy(LOCAL_DB_PATH, VOLUME_DB_PATH)
print(f"Banco publicado em {VOLUME_DB_PATH}")
