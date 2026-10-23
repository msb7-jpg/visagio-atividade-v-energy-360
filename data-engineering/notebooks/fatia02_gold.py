# Databricks notebook source
# MAGIC %md
# MAGIC # Fatia 02 — Silver ➜ Gold (Faturamento, Rede & Atendimento)
# MAGIC
# MAGIC **Dono:** Ryei Estevan
# MAGIC
# MAGIC | Tabela Gold | Grão | Consumidores |
# MAGIC |---|---|---|
# MAGIC | `fato_faturamento` | 1 fatura de UC cadastrada | Portal (Visão 360, Receita), IA |
# MAGIC | `fato_qualidade_alimentador` | alimentador × competência | Portal (Qualidade DEC/FEC), IA |
# MAGIC | `fato_atendimentos` | 1 protocolo | Portal (Visão 360), IA |
# MAGIC | `fato_inspecoes_perdas` | 1 inspeção | Portal (Perdas), IA |
# MAGIC
# MAGIC Regras: `docs/planning/ryei_estevan/faturamento_rede_atendimento.md` (seção 4) e
# MAGIC `docs/DECISOES.md` (ADR-001 a ADR-003).

# COMMAND ----------

CATALOG = "visagio_atividade_v_energy_360"
SILVER = f"{CATALOG}.silver"

spark.sql(f"USE {CATALOG}.gold")


def save_gold(select_sql: str, table_name: str, comment: str) -> None:
    spark.sql(f"CREATE OR REPLACE TABLE {table_name} COMMENT '{comment}' AS {select_sql}")
    print(f"✓ {table_name}: {spark.table(table_name).count():,} linhas")


# COMMAND ----------

# MAGIC %md ## fato_faturamento
# MAGIC - Apenas faturas de UCs cadastradas (as 32.285 `FTX*` ficam auditáveis na Silver).
# MAGIC - `consumo_faturado_kwh` vem de `silver_leituras` da Fatia 01 (mesma UC e mês).
# MAGIC - `tarifa_aplicada_rs_kwh = valor_total_rs / consumo_faturado_kwh` quando o consumo é positivo.

# COMMAND ----------

save_gold(
    f"""
    SELECT
        f.id_fatura,
        f.id_uc,
        f.competencia,
        f.valor_energia_rs,
        f.tributos_rs,
        f.valor_total_rs,
        CAST(l.consumo_apurado_kwh AS DECIMAL(18,4)) AS consumo_faturado_kwh,
        f.bandeira_tarifaria,
        CASE WHEN l.consumo_apurado_kwh > 0
             THEN CAST(f.valor_total_rs / l.consumo_apurado_kwh AS DECIMAL(18,4)) END
            AS tarifa_aplicada_rs_kwh,
        f.data_emissao,
        f.data_vencimento,
        f.data_pagamento,
        f.status_pagamento
    FROM {SILVER}.silver_faturas f
    LEFT JOIN {SILVER}.silver_leituras l
        ON l.id_uc = f.id_uc AND date_format(l.mes_referencia, 'yyyy-MM') = f.competencia
    WHERE f.fl_uc_cadastrada
    """,
    "fato_faturamento",
    "Faturas de UCs cadastradas com consumo da leitura do mesmo mês (Fatia 02)",
)

# COMMAND ----------

# MAGIC %md ## fato_qualidade_alimentador — DEC/FEC ANEEL (ADR-003)
# MAGIC
# MAGIC Para cada alimentador e competência (grade completa: meses sem interrupção têm DEC = FEC = 0):
# MAGIC
# MAGIC $$DEC = \frac{\sum duracao\_horas \times UCs\_interrompidas}{C_{total}} \qquad FEC = \frac{\sum UCs\_interrompidas}{C_{total}}$$
# MAGIC
# MAGIC Cada linha de `silver_ocorrencias_rede` é **uma** UC interrompida, então o numerador do DEC é a soma
# MAGIC das durações e o do FEC é a contagem de linhas. O limite ANEEL é anual: compara-se o **acumulado no ano**.

# COMMAND ----------

MUNICIPIO_PARA_CONJUNTO = {
    "CAB": "CABO",
    "CAM": "CAMARAGIBE",
    "IGA": "IGARASSU",
    "ILH": "ITAMARACA",
    "IPO": "IPOJUCA",
    "ITA": "ITAPISSUMA",
    "JAB": "JABOATAO",
    "MOR": "MORENO",
    "OLI": "OLINDA",
    "SAO": "SAO LOURENCO DA MATA",
}
mapping_rows = ", ".join(
    f"('{city_code}', '{conjunto}')" for city_code, conjunto in MUNICIPIO_PARA_CONJUNTO.items()
)

save_gold(
    f"""
    WITH base_alimentador AS (
        SELECT id_alimentador, substr(id_alimentador, 5, 3) AS cod_municipio, count(*) AS c_total
        FROM {SILVER}.silver_uc_alimentador GROUP BY 1, 2
    ),
    periodo AS (
        SELECT explode(sequence(to_date(min(competencia), 'yyyy-MM'),
                                to_date(max(competencia), 'yyyy-MM'), INTERVAL 1 MONTH)) AS mes
        FROM {SILVER}.silver_ocorrencias_rede
    ),
    interrupcoes AS (
        SELECT id_alimentador, competencia,
               sum(duracao_horas) AS horas_uc_interrompidas, count(*) AS ucs_interrompidas
        FROM {SILVER}.silver_ocorrencias_rede GROUP BY 1, 2
    ),
    mensal AS (
        SELECT b.id_alimentador, b.cod_municipio, b.c_total,
               date_format(p.mes, 'yyyy-MM') AS competencia, year(p.mes) AS ano,
               coalesce(i.ucs_interrompidas, 0) AS ucs_interrompidas,
               CAST(coalesce(i.horas_uc_interrompidas, 0) / b.c_total AS DECIMAL(18,4)) AS dec_mes,
               CAST(coalesce(i.ucs_interrompidas, 0) / b.c_total AS DECIMAL(18,4)) AS fec_mes
        FROM base_alimentador b
        CROSS JOIN periodo p
        LEFT JOIN interrupcoes i
            ON i.id_alimentador = b.id_alimentador AND i.competencia = date_format(p.mes, 'yyyy-MM')
    ),
    mapa AS (SELECT * FROM VALUES {mapping_rows} AS mapa(cod_municipio, conjunto_aneel)),
    limites_conjunto AS (
        SELECT conjunto_aneel, ano,
               max(CASE WHEN indicador = 'DEC' THEN valor_limite END) AS dec_limite,
               max(CASE WHEN indicador = 'FEC' THEN valor_limite END) AS fec_limite
        FROM {SILVER}.silver_aneel_limites
        WHERE conjunto_aneel IN (SELECT conjunto_aneel FROM mapa)
        GROUP BY 1, 2
    ),
    limites_mediana AS (
        SELECT ano,
               CAST(percentile(dec_limite, 0.5) AS DECIMAL(18,4)) AS dec_limite,
               CAST(percentile(fec_limite, 0.5) AS DECIMAL(18,4)) AS fec_limite
        FROM limites_conjunto GROUP BY ano
    ),
    com_limite AS (
        SELECT m.*,
               coalesce(mp.conjunto_aneel, 'MEDIANA RMR') AS conjunto_aneel,
               CASE WHEN mp.conjunto_aneel IS NULL THEN 'MEDIANA_RMR' ELSE 'CONJUNTO' END
                   AS criterio_limite,
               coalesce(lc.dec_limite, lm.dec_limite) AS dec_limite_aneel,
               coalesce(lc.fec_limite, lm.fec_limite) AS fec_limite_aneel,
               sum(m.dec_mes) OVER acumulado_ano AS dec_acumulado_ano_horas,
               sum(m.fec_mes) OVER acumulado_ano AS fec_acumulado_ano_vezes
        FROM mensal m
        LEFT JOIN mapa mp ON mp.cod_municipio = m.cod_municipio
        LEFT JOIN limites_conjunto lc ON lc.conjunto_aneel = mp.conjunto_aneel AND lc.ano = m.ano
        LEFT JOIN limites_mediana lm ON lm.ano = m.ano
        WINDOW acumulado_ano AS (PARTITION BY m.id_alimentador, m.ano ORDER BY m.competencia)
    )
    SELECT
        id_alimentador, competencia, conjunto_aneel, criterio_limite,
        c_total AS ucs_atendidas, ucs_interrompidas,
        dec_mes AS dec_apurado_horas,
        fec_mes AS fec_apurado_vezes,
        dec_acumulado_ano_horas, fec_acumulado_ano_vezes,
        dec_limite_aneel, fec_limite_aneel,
        dec_acumulado_ano_horas > dec_limite_aneel AS violou_dec,
        fec_acumulado_ano_vezes > fec_limite_aneel AS violou_fec,
        dec_acumulado_ano_horas > dec_limite_aneel OR fec_acumulado_ano_vezes > fec_limite_aneel
            AS violou_meta
    FROM com_limite
    """,
    "fato_qualidade_alimentador",
    "DEC/FEC mensal e acumulado no ano por alimentador vs. limite anual ANEEL (ADR-003)",
)

# COMMAND ----------

# MAGIC %md ## fato_atendimentos (CSAT na escala 1–5 — ADR-001)

# COMMAND ----------

save_gold(
    f"""
    SELECT
        id_atendimento, id_uc, numero_protocolo, motivo_chamado, submotivo_chamado,
        canal_atendimento, data_abertura, data_fechamento, status_chamado,
        CAST((unix_timestamp(data_fechamento) - unix_timestamp(data_abertura)) / 3600.0
             AS DECIMAL(18,2)) AS tempo_resolucao_horas,
        qtd_tratativas, nota_csat
    FROM {SILVER}.silver_atendimentos
    """,
    "fato_atendimentos",
    "Chamados do call center, 1 linha por protocolo, CSAT 1-5 (ADR-001)",
)

# COMMAND ----------

# MAGIC %md ## fato_inspecoes_perdas

# COMMAND ----------

save_gold(
    f"""
    SELECT
        id_inspecao, id_uc, data_inspecao, id_inspetor, irregularidade_constatada,
        tipo_irregularidade, kwh_recuperado
    FROM {SILVER}.silver_inspecoes
    """,
    "fato_inspecoes_perdas",
    "Fiscalizações de campo (3 abas unificadas) com energia recuperada",
)
