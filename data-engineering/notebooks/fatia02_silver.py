# Databricks notebook source
# MAGIC %md
# MAGIC # Fatia 02 — Bronze ➜ Silver (Faturamento, Rede & Atendimento)
# MAGIC
# MAGIC **Dono:** Ryei Estevan
# MAGIC
# MAGIC Higienização e padronização das fontes da Fatia 02. Decisões documentadas em
# MAGIC `docs/DECISOES.md` (ADR-001 a ADR-003) e achados de qualidade no changelog da fatia.
# MAGIC
# MAGIC | Tabela Silver | Origem | Grão |
# MAGIC |---|---|---|
# MAGIC | `silver_uc_alimentador` | `silver_unidades_consumidoras` da Fatia 01 (ADR-002) | 1 UC |
# MAGIC | `silver_faturas` | `bronze_faturas` | 1 fatura |
# MAGIC | `silver_ocorrencias_rede` | `bronze_ocorrencias_rede` | 1 UC interrompida por ocorrência |
# MAGIC | `silver_atendimentos` | `bronze_atendimentos` | 1 protocolo |
# MAGIC | `silver_atendimentos_tratativas` | `bronze_atendimentos.historico` (explode) | 1 tratativa |
# MAGIC | `silver_inspecoes` | `bronze_inspecoes` (3 abas) | 1 inspeção |
# MAGIC | `silver_aneel_limites` | `bronze_aneel_limites` (Neoenergia PE) | conjunto × indicador × ano |

# COMMAND ----------

CATALOG = "visagio_atividade_v_energy_360"
BRONZE = f"{CATALOG}.bronze"

spark.sql(f"USE {CATALOG}.silver")

# COMMAND ----------


def br_decimal_sql(raw_column: str) -> str:
    """Converte '242.56', '0,00' e 'R$ 1.000,11' em DECIMAL(18,4)."""
    without_currency = rf"regexp_replace(trim({raw_column}), '^R\\$\\s*', '')"
    return f"""try_cast(CASE WHEN {without_currency} LIKE '%,%'
        THEN replace(replace({without_currency}, '.', ''), ',', '.')
        ELSE {without_currency} END AS DECIMAL(18,4))"""


def mixed_date_sql(raw_column: str, is_plausible) -> str:
    """Lê datas ISO, dd/MM/yyyy, dd.MM.yyyy e dd-MM-yyyy.

    Os formatos não ISO aparecem ora com dia primeiro, ora com mês primeiro.
    Escolhe-se o candidato que `is_plausible` aceita; sem desempate, dia primeiro.
    """
    dashed = rf"regexp_replace(trim({raw_column}), '[./]', '-')"
    day_first = f"try_to_date({dashed}, 'dd-MM-yyyy')"
    month_first = f"try_to_date({dashed}, 'MM-dd-yyyy')"
    return f"""CASE
        WHEN trim({raw_column}) RLIKE '^[0-9]{{4}}-' THEN try_to_date(trim({raw_column}), 'yyyy-MM-dd')
        WHEN {is_plausible(day_first)} THEN {day_first}
        WHEN {is_plausible(month_first)} THEN {month_first}
        ELSE coalesce({day_first}, {month_first}) END"""


def save_silver(select_sql: str, table_name: str) -> None:
    spark.sql(f"CREATE OR REPLACE TABLE {table_name} AS {select_sql}")
    print(f"✓ {table_name}: {spark.table(table_name).count():,} linhas")


# COMMAND ----------

# MAGIC %md ## Base UC → alimentador (ADR-002)
# MAGIC Lida da Silver de cadastro da Fatia 01 (Renan), que já remove o cabeçalho
# MAGIC repetido, os 200 registros `TESTE*` e as duplicatas.

# COMMAND ----------

save_silver(
    f"""
    SELECT id_uc, alimentador AS id_alimentador, municipio
    FROM silver_unidades_consumidoras
    """,
    "silver_uc_alimentador",
)

# COMMAND ----------

# MAGIC %md ## Faturas
# MAGIC - Cabeçalhos repetidos no meio do arquivo são descartados.
# MAGIC - `valor_total` vem em dois formatos (`242.56` e `R$ 1.000,11`).
# MAGIC - Datas de emissão em 4 formatos; o candidato coerente com `mes_referencia` vence.
# MAGIC - `status_pagamento` é recalculado pelas datas (a origem traz `EM ABERTO` com pagamento registrado).
# MAGIC - UCs fora do cadastro (`FTX*` / `UC9xxxxxx`) são mantidas e sinalizadas em `fl_uc_cadastrada`.

# COMMAND ----------

emission_date = mixed_date_sql(
    "f.data_emissao", lambda candidate: f"date_format({candidate}, 'yyyy-MM') = f.mes_referencia"
)
save_silver(
    f"""
    SELECT
        trim(f.id_fatura) AS id_fatura,
        trim(f.id_uc) AS id_uc,
        f.mes_referencia AS competencia,
        {emission_date} AS data_emissao,
        try_to_date(f.data_vencimento, 'yyyy-MM-dd') AS data_vencimento,
        try_to_date(f.data_pagamento, 'yyyy-MM-dd') AS data_pagamento,
        {br_decimal_sql("f.valor_energia")} AS valor_energia_rs,
        {br_decimal_sql("f.tributos")} AS tributos_rs,
        {br_decimal_sql("f.valor_total")} AS valor_total_rs,
        upper(regexp_replace(trim(f.bandeira_tarifaria), '\\\\s+', '_')) AS bandeira_tarifaria,
        upper(trim(f.status)) AS status_origem,
        CASE WHEN f.data_pagamento IS NOT NULL THEN 'PAGA'
             WHEN try_to_date(f.data_vencimento, 'yyyy-MM-dd') < current_date() THEN 'VENCIDA'
             ELSE 'ABERTA' END AS status_pagamento,
        uc.id_uc IS NOT NULL AS fl_uc_cadastrada,
        f._ingested_at AS _bronze_ingested_at
    FROM {BRONZE}.bronze_faturas f
    LEFT JOIN silver_uc_alimentador uc ON uc.id_uc = trim(f.id_uc)
    WHERE f.id_fatura <> 'id_fatura'
    """,
    "silver_faturas",
)

# COMMAND ----------

# MAGIC %md ## Ocorrências de Rede
# MAGIC Cada linha é uma UC interrompida. `duracao_min` às vezes vem como `74 min`;
# MAGIC causas vazias (`-`, `N/A`, `NULL`, nulo) viram `NAO INFORMADA`.

# COMMAND ----------

save_silver(
    f"""
    SELECT
        trim(id_ocorrencia) AS id_ocorrencia,
        trim(alimentador) AS id_alimentador,
        trim(id_uc) AS id_uc,
        upper(trim(tipo)) AS tipo_ocorrencia,
        CASE WHEN upper(trim(causa)) IN ('-', 'N/A', 'NULL', 'NONE', '') OR causa IS NULL
             THEN 'NAO INFORMADA' ELSE upper(trim(causa)) END AS causa,
        to_timestamp(data_abertura) AS inicio_interrupcao,
        to_timestamp(data_encerramento) AS fim_interrupcao,
        CAST(regexp_extract(duracao_min, '([0-9]+)', 1) AS INT) AS duracao_min,
        CAST(CAST(regexp_extract(duracao_min, '([0-9]+)', 1) AS INT) / 60.0 AS DECIMAL(18,4))
            AS duracao_horas,
        date_format(to_timestamp(data_abertura), 'yyyy-MM') AS competencia
    FROM {BRONZE}.bronze_ocorrencias_rede
    """,
    "silver_ocorrencias_rede",
)

# COMMAND ----------

# MAGIC %md ## Atendimentos (cabeçalho + tratativas explodidas)
# MAGIC Nota de satisfação mantida na escala 1–5 (ADR-001).

# COMMAND ----------

save_silver(
    f"""
    SELECT
        protocolo AS id_atendimento,
        protocolo AS numero_protocolo,
        trim(id_uc) AS id_uc,
        upper(trim(assunto)) AS motivo_chamado,
        upper(trim(subassunto)) AS submotivo_chamado,
        upper(trim(canal)) AS canal_atendimento,
        to_timestamp(data_abertura) AS data_abertura,
        to_timestamp(data_fechamento) AS data_fechamento,
        CASE WHEN data_fechamento IS NULL THEN 'ABERTO' ELSE 'ENCERRADO' END AS status_chamado,
        CAST(nota_satisfacao AS DECIMAL(3,1)) AS nota_csat,
        size(historico) AS qtd_tratativas
    FROM {BRONZE}.bronze_atendimentos
    """,
    "silver_atendimentos",
)
save_silver(
    f"""
    SELECT
        protocolo AS id_atendimento,
        CAST(tratativa.sequencia AS INT) AS sequencia,
        to_timestamp(tratativa.data) AS data_tratativa,
        upper(trim(tratativa.acao)) AS acao,
        upper(trim(tratativa.canal)) AS canal
    FROM {BRONZE}.bronze_atendimentos
    LATERAL VIEW explode(historico) historico_explodido AS tratativa
    """,
    "silver_atendimentos_tratativas",
)

# COMMAND ----------

# MAGIC %md ## Inspeções (3 abas unificadas)
# MAGIC Resultado em 8 grafias ➜ booleano estrito. Datas ambíguas: vale o candidato
# MAGIC dentro da campanha de fiscalização (ago–dez/2025).

# COMMAND ----------

inspection_date = mixed_date_sql(
    "data", lambda candidate: f"{candidate} BETWEEN DATE'2025-08-01' AND DATE'2025-12-31'"
)
save_silver(
    f"""
    SELECT
        trim(id_inspecao) AS id_inspecao,
        trim(id_uc) AS id_uc,
        {inspection_date} AS data_inspecao,
        trim(inspetor) AS id_inspetor,
        upper(trim(resultado)) AS resultado_origem,
        upper(trim(resultado)) LIKE '%CONFIRMADA%' AS irregularidade_constatada,
        CASE WHEN trim(tipo_irregularidade) IN ('-', '') THEN NULL
             ELSE upper(trim(tipo_irregularidade)) END AS tipo_irregularidade,
        {br_decimal_sql("kwh_recuperado")} AS kwh_recuperado,
        _source_sheet AS aba_origem
    FROM {BRONZE}.bronze_inspecoes
    """,
    "silver_inspecoes",
)

# COMMAND ----------

# MAGIC %md ## Limites ANEEL — Neoenergia PE (ADR-003)

# COMMAND ----------

save_silver(
    f"""
    SELECT
        CAST(IdeConjUndConsumidoras AS INT) AS id_conjunto,
        upper(trim(DscConjUndConsumidoras)) AS conjunto_aneel,
        upper(trim(SigIndicador)) AS indicador,
        CAST(AnoLimiteQualidade AS INT) AS ano,
        {br_decimal_sql("VlrLimite")} AS valor_limite
    FROM {BRONZE}.bronze_aneel_limites
    WHERE trim(SigAgente) = 'Neoenergia PE' AND upper(trim(SigIndicador)) IN ('DEC', 'FEC')
    """,
    "silver_aneel_limites",
)
