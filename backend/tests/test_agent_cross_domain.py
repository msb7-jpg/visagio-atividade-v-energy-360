"""Testes das capacidades de cruzamento multidimensional e cobertura do ROTEIRO_APRESENTACAO.md."""

import pytest

from app.agent.nodes.sql_executor import sql_executor_node
from app.agent.nodes.sql_validator import split_and_extract_sql_queries, validate_sql_query
from app.agent.nodes.synthesizer import _serialize_query_results
from app.agent.tools.query_runner import execute_sql_query
from app.core.constants import SqlErrorCategory

CENTRAL_DIAGNOSTIC_MULTI_SQL = """
-- [CONSULTA 1: Decomposicao Receita Preco e Volume]
WITH base AS (
  SELECT
    COUNT(DISTINCT CASE WHEN competencia BETWEEN '2022-07' AND '2023-06' THEN id_uc END) AS ucs_ano1,
    COUNT(DISTINCT CASE WHEN competencia BETWEEN '2025-07' AND '2026-06' THEN id_uc END) AS ucs_ult12m,
    SUM(CASE WHEN competencia BETWEEN '2022-07' AND '2023-06'
        THEN consumo_faturado_kwh ELSE 0 END) AS vol_ano1_kwh,
    SUM(CASE WHEN competencia BETWEEN '2025-07' AND '2026-06'
        THEN consumo_faturado_kwh ELSE 0 END) AS vol_ult12m_kwh,
    SUM(CASE WHEN competencia BETWEEN '2022-07' AND '2023-06'
        THEN valor_total_rs ELSE 0 END) AS rec_ano1_rs,
    SUM(CASE WHEN competencia BETWEEN '2025-07' AND '2026-06'
        THEN valor_total_rs ELSE 0 END) AS rec_ult12m_rs
  FROM fato_faturamento
),
calc AS (
  SELECT *, (rec_ano1_rs / vol_ano1_kwh) AS p0, (rec_ult12m_rs / vol_ult12m_kwh) AS p1 FROM base
)
SELECT ucs_ano1, ucs_ult12m,
       ROUND(rec_ano1_rs, 2) AS receita_ano1_rs, ROUND(rec_ult12m_rs, 2) AS receita_ult12m_rs,
       ROUND((rec_ult12m_rs - rec_ano1_rs) * 100.0 / rec_ano1_rs, 2) AS var_receita_pct,
       ROUND(vol_ano1_kwh, 2) AS volume_ano1_kwh, ROUND(vol_ult12m_kwh, 2) AS volume_ult12m_kwh,
       ROUND((vol_ult12m_kwh - vol_ano1_kwh) * 100.0 / vol_ano1_kwh, 2) AS var_volume_pct,
       ROUND((p1 - p0) * vol_ano1_kwh, 2) AS efeito_preco_rs,
       ROUND((vol_ult12m_kwh - vol_ano1_kwh) * p0, 2) AS efeito_volume_rs
FROM calc;

-- [CONSULTA 2: Impacto da Geracao Distribuida Solar]
SELECT u.possui_gd, COUNT(DISTINCT u.id_uc) AS qtd_ucs,
       ROUND(SUM(CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06'
           THEN f.consumo_faturado_kwh ELSE 0 END), 2) AS vol_ano1_kwh,
       ROUND(SUM(CASE WHEN f.competencia BETWEEN '2025-07' AND '2026-06'
           THEN f.consumo_faturado_kwh ELSE 0 END), 2) AS vol_ult12m_kwh,
       ROUND(SUM(CASE WHEN f.competencia BETWEEN '2025-07' AND '2026-06'
           THEN f.consumo_faturado_kwh ELSE 0 END) -
             SUM(CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06'
           THEN f.consumo_faturado_kwh ELSE 0 END), 2) AS variacao_kwh
FROM dim_unidade_consumidora u JOIN fato_faturamento f ON u.id_uc = f.id_uc
GROUP BY u.possui_gd ORDER BY u.possui_gd;

-- [CONSULTA 3: Evidencia de Fraudes nos Bairros Criticos]
SELECT u.bairro, u.municipio, COUNT(*) AS total_inspecoes,
       SUM(i.irregularidade_constatada) AS fraudes_confirmadas,
       ROUND(SUM(i.irregularidade_constatada) * 100.0 / COUNT(*), 2) AS taxa_assertividade_pct,
       ROUND(SUM(i.kwh_recuperado), 2) AS kwh_recuperado_total
FROM fato_inspecoes_perdas i JOIN dim_unidade_consumidora u ON i.id_uc = u.id_uc
GROUP BY u.bairro, u.municipio ORDER BY fraudes_confirmadas DESC LIMIT 4;
"""


def test_validator_allows_safe_multi_query_and_extracts_labels():
    """Valida que até 4 consultas SELECT/WITH separadas por ';' são aceitas e rotuladas."""
    is_valid, err_msg, err_cat = validate_sql_query(CENTRAL_DIAGNOSTIC_MULTI_SQL)
    assert is_valid is True
    assert err_msg is None
    assert err_cat is None

    extracted = split_and_extract_sql_queries(CENTRAL_DIAGNOSTIC_MULTI_SQL)
    assert len(extracted) == 3
    assert extracted[0][0].startswith("consulta_1_decomposicao")
    assert extracted[1][0].startswith("consulta_2_impacto")
    assert extracted[2][0].startswith("consulta_3_evidencia")


def test_validator_blocks_destructive_query_hidden_in_batch():
    """Garante que qualquer DDL/DML ou excesso de statements em batch seja bloqueado na AST."""
    poisoned_batch = """
    -- [CONSULTA 1: Leitura Valida]
    SELECT COUNT(*) FROM fato_faturamento;
    -- [CONSULTA 2: Injeção Maliciosa]
    DELETE FROM fato_faturamento WHERE status_pagamento = 'VENCIDA';
    """
    is_valid, _err, err_cat = validate_sql_query(poisoned_batch)
    assert is_valid is False
    assert err_cat == SqlErrorCategory.SECURITY_VIOLATION

    five_queries = "SELECT 1; SELECT 2; SELECT 3; SELECT 4; SELECT 5;"
    is_valid_limit, _err_limit, cat_limit = validate_sql_query(five_queries)
    assert is_valid_limit is False
    assert cat_limit == SqlErrorCategory.SECURITY_VIOLATION


def test_central_business_question_multi_query_execution():
    """
    Testa P1, P2, P3 e P4 do ROTEIRO_APRESENTACAO.md diretamente no v_energy.db:
    - Crescimento de receita +8,0% (R$ 157,1M -> R$ 169,7M) com Efeito-Preço positivo e Efeito-Volume negativo;
    - Queda de volume concentrada nas 3.510 UCs com GD Solar (-11,2M kWh), enquanto as 41.490 sem GD cresceram;
    - 835 fraudes confirmadas nos 4 bairros críticos (Iputinga, Jardim Jordão, Prazeres e Macaxeira).
    """
    state_update = sql_executor_node(
        {"generated_sql": CENTRAL_DIAGNOSTIC_MULTI_SQL, "error_count": 0}  # type: ignore[arg-type]
    )
    assert state_update["last_error"] is None
    rows = state_update["query_result"]
    assert rows is not None
    assert len(rows) == 7

    macro_row = next(
        row_record for row_record in rows if str(row_record.get("_bloco_consulta", "")).startswith("consulta_1")
    )
    assert macro_row["receita_ano1_rs"] == pytest.approx(157107191.43)
    assert macro_row["receita_ult12m_rs"] == pytest.approx(169683458.59)
    assert macro_row["var_receita_pct"] == pytest.approx(8.0)
    assert float(macro_row["efeito_preco_rs"]) > 19000000.0
    assert float(macro_row["efeito_volume_rs"]) < -6000000.0

    gd_rows = [
        row_record for row_record in rows if str(row_record.get("_bloco_consulta", "")).startswith("consulta_2")
    ]
    sem_gd = next(row_record for row_record in gd_rows if row_record["possui_gd"] == 0)
    com_gd = next(row_record for row_record in gd_rows if row_record["possui_gd"] == 1)
    assert sem_gd["qtd_ucs"] == 41490
    assert float(sem_gd["variacao_kwh"]) > 2000000.0
    assert com_gd["qtd_ucs"] == 3510
    assert com_gd["variacao_kwh"] == pytest.approx(-11198405.0)

    fraud_rows = [
        row_record for row_record in rows if str(row_record.get("_bloco_consulta", "")).startswith("consulta_3")
    ]
    bairros = {str(row_record["bairro"]) for row_record in fraud_rows}
    assert bairros == {"IPUTINGA", "JARDIM JORDAO", "PRAZERES", "MACAXEIRA"}
    total_fraudes_4_bairros = sum(int(row_record["fraudes_confirmadas"]) for row_record in fraud_rows)
    assert total_fraudes_4_bairros == 835

    toon_context = _serialize_query_results(rows)
    assert "consulta_1_decomposicao" in toon_context
    assert "efeito_preco_rs" in toon_context
    assert "consulta_2_impacto" in toon_context
    assert "possui_gd" in toon_context
    assert "consulta_3_evidencia" in toon_context
    assert "IPUTINGA" in toon_context


def test_grid_quality_and_uc360_cross_domain_queries():
    """Testa P5 (Qualidade da Rede DEC/FEC PRODIST Módulo 8 + Causas) e P6 (Visão 360 da UC) no v_energy.db."""
    grid_and_uc_sql = """
    -- [CONSULTA 1: Top Alimentador Violacao DEC FEC]
    SELECT id_alimentador, ROUND(SUM(dec_apurado_horas), 2) AS dec_12m_horas,
           ROUND(SUM(fec_apurado_vezes), 2) AS fec_12m_vezes, MAX(violou_meta) AS violou_meta
    FROM fato_qualidade_alimentador
    WHERE competencia BETWEEN '2025-07' AND '2026-06'
    GROUP BY id_alimentador ORDER BY dec_12m_horas DESC LIMIT 1;

    -- [CONSULTA 2: Causas de Interrupcao no Alimentador Critico]
    SELECT causa, COUNT(*) AS ocorrencias, ROUND(SUM(duracao_horas), 2) AS total_horas
    FROM fato_ocorrencias_rede
    WHERE id_alimentador = 'ALM-JAB-016' AND competencia BETWEEN '2025-07' AND '2026-06'
    GROUP BY causa ORDER BY total_horas DESC LIMIT 3;

    -- [CONSULTA 3: Visao 360 Cadastro e Faturamento UC100001]
    SELECT u.id_uc, u.municipio, u.bairro, u.classe_consumo, u.possui_gd,
           COUNT(f.id_fatura) AS total_faturas,
           SUM(CASE WHEN f.status_pagamento = 'VENCIDA' THEN 1 ELSE 0 END) AS faturas_vencidas
    FROM dim_unidade_consumidora u JOIN fato_faturamento f ON u.id_uc = f.id_uc
    WHERE u.id_uc = REPLACE(UPPER('UC-100001'), '-', '')
    GROUP BY u.id_uc, u.municipio, u.bairro, u.classe_consumo, u.possui_gd;
    """
    results = execute_sql_query.invoke({"query": grid_and_uc_sql})
    assert len(results) >= 3

    feeder_row = next(
        row_record for row_record in results if str(row_record.get("_bloco_consulta", "")).startswith("consulta_1")
    )
    assert feeder_row["id_alimentador"] == "ALM-JAB-016"
    assert feeder_row["dec_12m_horas"] == pytest.approx(43.9)
    assert feeder_row["violou_meta"] == 1

    uc_row = next(
        row_record for row_record in results if str(row_record.get("_bloco_consulta", "")).startswith("consulta_3")
    )
    assert uc_row["id_uc"] == "UC100001"
    assert int(uc_row["total_faturas"]) > 0


def test_four_neighborhoods_may_2025_consumption_drop_without_gd():
    """
    Testa a evidência temporal de queda brusca a partir de maio de 2025 nos 4 bairros críticos
    em clientes sem painel solar (possui_gd = 0).
    """
    may_2025_sql = """
    -- [CONSULTA 1: Queda Media por Fatura Antes e Depois de Maio 2025 sem GD]
    SELECT u.bairro, u.municipio,
           ROUND(AVG(CASE WHEN f.competencia BETWEEN '2024-07' AND '2025-04'
               THEN f.consumo_faturado_kwh END), 2) AS media_antes_maio25,
           ROUND(AVG(CASE WHEN f.competencia BETWEEN '2025-05' AND '2026-06'
               THEN f.consumo_faturado_kwh END), 2) AS media_depois_maio25
    FROM fato_faturamento f
    JOIN dim_unidade_consumidora u ON f.id_uc = u.id_uc
    WHERE u.possui_gd = 0 AND u.bairro IN ('IPUTINGA', 'MACAXEIRA', 'JARDIM JORDAO', 'PRAZERES')
    GROUP BY u.bairro, u.municipio
    ORDER BY u.bairro;
    """
    rows = execute_sql_query.invoke({"query": may_2025_sql})
    assert len(rows) == 4
    for row_record in rows:
        assert float(row_record["media_depois_maio25"]) < float(row_record["media_antes_maio25"])
