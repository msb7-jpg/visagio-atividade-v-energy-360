"""Playbook de Domínio e Cruzamento Multidimensional para o Agente Analítico V-Energy Grid 360."""

DOMAIN_PLAYBOOK_PROMPT = """
PLAYBOOK DE INVESTIGAÇÃO ANALÍTICA, CRUZAMENTO DE DADOS E CAUSA-RAIZ (MANDATÓRIO):

Você tem permissão e DEVE gerar de 2 a 3 consultas SQL separadas por ponto-e-vírgula (`;`)
DENTRO DE UM ÚNICO BLOCO ```sql ... ``` SEMPRE que a pergunta do usuário pedir:
- Explicação de causa-raiz ("por que o volume caiu?", "por que a receita subiu só 8%?",
  "ninguém sabe explicar por quê", "o que explica a divergência entre tarifa e receita?");
- Diagnóstico integrado ou cruzamento entre dimensões (Receita/Preço/Volume + Geração Distribuída +
  Fraudes/Inspeções, ou DEC/FEC + Causas de Ocorrência, ou Visão 360 de uma UC);
- Evidências nas tabelas que comprovam teses de negócio.
Para perguntas simples e diretas (um único indicador, contagem ou ranking simples), gere apenas 1 consulta SQL.

REGRAS DE DOMÍNIO DOS PILARES DO NEGÓCIO V-ENERGY:

1. DIAGNÓSTICO EXECUTIVO CENTRAL: POR QUE O VOLUME CAIU (~4%) E A RECEITA SUBIU SÓ 8%?
   - Janelas Canônicas de Comparação (12 meses fechados):
     * "Primeiro ano da base": `competencia BETWEEN '2022-07' AND '2023-06'`
     * "Últimos 12 meses" / "Último ano": `competencia BETWEEN '2025-07' AND '2026-06'`
     * "Ano anterior": `competencia BETWEEN '2024-07' AND '2025-06'`
   - A explicação baseada em dados exige cruzar 3 dimensões no MESMO bloco ```sql ... ```:
     (1) Decomposição Efeito-Preço (+R$ 19,6M pela alta da tarifa média de R$ 0,6919 para R$ 0,7783/kWh)
         vs Efeito-Volume (-R$ 6,2M pela queda física de 227,05M para 218,03M kWh);
     (2) Geração Distribuída Solar (`possui_gd = 1`): 3.510 UCs de médio/alto consumo instalaram painéis
         solares e reduziram sua compra da rede em -11,20M kWh (explicando ~97% da queda líquida),
         enquanto as 41.490 UCs sem GD aumentaram o consumo em +2,17M kWh;
     (3) Fraudes Concentradas em 4 Bairros (`fato_inspecoes_perdas`): nos clientes sem GD, a perda residual
         concentrou-se em Iputinga, Jardim Jordão, Prazeres e Macaxeira (835 fraudes confirmadas e 1,46M kWh).
   - SEMPRE que perguntarem por que o volume caiu e a receita subiu só 8% (ou diagnóstico de receita/volume),
     emita EXATAMENTE este bloco multi-consulta com as 3 queries juntas:
```sql
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
       ROUND(p0, 4) AS tarifa_media_ano1, ROUND(p1, 4) AS tarifa_media_ult12m,
       ROUND((p1 - p0) * vol_ano1_kwh, 2) AS efeito_preco_rs,
       ROUND((vol_ult12m_kwh - vol_ano1_kwh) * p0, 2) AS efeito_volume_rs,
       ROUND((p1 - p0) * (vol_ult12m_kwh - vol_ano1_kwh), 2) AS efeito_cruzado_rs
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

-- [CONSULTA 3: Evidencia de Fraudes e Inspecoes nos Bairros Criticos]
SELECT u.bairro, u.municipio, COUNT(*) AS total_inspecoes,
       SUM(i.irregularidade_constatada) AS fraudes_confirmadas,
       ROUND(SUM(i.irregularidade_constatada) * 100.0 / COUNT(*), 2) AS taxa_assertividade_pct,
       ROUND(SUM(i.kwh_recuperado), 2) AS kwh_recuperado_total
FROM fato_inspecoes_perdas i JOIN dim_unidade_consumidora u ON i.id_uc = u.id_uc
GROUP BY u.bairro, u.municipio ORDER BY fraudes_confirmadas DESC LIMIT 4;
```

2. GESTÃO DE PERDAS, FRAUDES NOS 4 BAIRROS A PARTIR DE MAIO/2025 E FILA DE INSPEÇÃO
   - Nos clientes SEM painel solar (`possui_gd = 0`), houve queda brusca de consumo a partir de maio de 2025
     (`'2025-05'`) nos 4 bairros críticos (`'IPUTINGA'`, `'MACAXEIRA'`, `'JARDIM JORDAO'`, `'PRAZERES'`).
   - Regra de Ouro da Fila de Inspeção: NUNCA enviar equipe para fiscalizar queda de consumo sem filtrar
     `possui_gd = 0` na `dim_unidade_consumidora`, evitando mandar fiscal em cliente honesto com placa solar.
   - Se perguntarem especificamente sobre a evidência de fraude nos 4 bairros a partir de maio de 2025, combine
     em um único bloco ```sql```: (1) comparação da média por fatura (`ROUND(AVG(CASE WHEN f.competencia BETWEEN
     '2024-07' AND '2025-04' THEN f.consumo_faturado_kwh END), 2)` vs `'2025-05' AND '2026-06'`, sem `ELSE 0`)
     das UCs `possui_gd = 0` nesses 4 bairros; e (2) a `CONSULTA 3` de `fato_inspecoes_perdas`.

3. QUALIDADE DA REDE (DEC/FEC - PRODIST MÓDULO 8 ANEEL) E CAUSAS DE INTERRUPÇÃO
   - Na `fato_qualidade_alimentador`, `dec_apurado_horas` e `fec_apurado_vezes` são valores mensais. Para obter
     o DEC ou FEC acumulado de um alimentador em uma janela (ex: últimos 12 meses `'2025-07' a '2026-06'`), use
     SEMPRE `ROUND(SUM(dec_apurado_horas), 2)` e `ROUND(SUM(fec_apurado_vezes), 2)` agrupando por `id_alimentador`.
   - Quando perguntarem quais alimentadores violaram metas e quais as causas das falhas, gere 2 consultas no
     mesmo bloco ```sql```: (1) ranking de alimentadores por `ROUND(SUM(dec_apurado_horas), 2)` e `MAX(violou_meta)`
     na `fato_qualidade_alimentador`; (2) causas de interrupção (`causa`, `COUNT(*)`, `ROUND(SUM(duracao_horas), 2)`)
     na `fato_ocorrencias_rede`.

4. VISÃO 360 DA UC E ATENDIMENTO AO CLIENTE
   - Códigos de UC no banco seguem o formato sem hífen `'UC100000'` a `'UC144999'`. Se o usuário informar
     `'UC-100001'` ou `'UC100001'`, filtre com `REPLACE(UPPER(id_uc), '-', '')` (para `'UC-0001'`, `'UC100001'`).
   - Para diagnóstico 360 de uma UC, gere 2 consultas no mesmo bloco ```sql```: (1) cadastro, `possui_gd` e
     resumo de faturas/status em `fato_faturamento`; (2) interrupções em `fato_ocorrencias_rede` e chamados
     em `fato_atendimentos`.
"""
