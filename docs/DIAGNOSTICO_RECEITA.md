# Diagnóstico da Receita — por que a receita cresceu pouco

> **Fatia 04 · Inteligência Comercial** · Autor: Célio · Números das causas: Renan (com apoio de Ryei e Adrian)
> **Status:** esqueleto estruturado, **sem números finais**. Cada campo `[a preencher]` só é preenchido com o resultado de uma consulta direta no `v_energy.db` (seção 9). Nada neste documento vem de estimativa de cabeça.

---

## 1. A pergunta do diretor

> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê."* — Henrique Duarte, Diretor Comercial (`atividade.pdf`, pág. 2)

**Resposta em uma frase** (escrever por último, depois das seções 4 a 8):

> `[a preencher]` Exemplo do formato esperado, **com números inventados**: *"A energia vendida caiu X%: Y% por painéis solares, Z% por fraude e o restante por clientes que passaram a consumir menos. Inspecionar as N unidades do topo da fila recupera cerca de R$ W por ano."*

---

## 2. Períodos e definições (iguais aos da tela `/revenue`)

Os números deste documento e os da tela de Inteligência Comercial precisam ser **os mesmos**. Por isso usam as mesmas janelas e as mesmas definições.

| Item | Definição |
|---|---|
| **Janela base** (primeiro ano da base) | competências `2022-07` a `2023-06` |
| **Janela atual** (últimos 12 meses) | competências `2025-07` a `2026-06` |
| **Receita** | soma de `fato_faturamento.valor_total_rs` (energia + tributos), por fatura |
| **Volume** | soma de `fato_faturamento.consumo_faturado_kwh` |
| **Tarifa média** | receita ÷ volume (R$/kWh), ponderada pelo volume |
| **Ticket médio por UC** | receita ÷ número de faturas (assume uma fatura por UC por competência) |
| **Segmento** | classe de consumo × município × bairro |

> `[a confirmar]` Primeira e última competência existentes no banco real. Se forem diferentes de `2022-07` e `2026-06`, atualizar esta tabela **e** `DEFAULT_REVENUE_QUERY` em `frontend/src/features/revenue/utils/revenueFilters.ts`.
> `[a confirmar com Ryei]` Se o case considera receita com tributos (`valor_total_rs`) ou só a energia (`valor_energia_rs`). A tela e este texto usam `valor_total_rs`.

---

## 3. Como a variação de receita é decomposta

A variação total de receita entre as janelas é separada em quatro efeitos, calculados **em cada segmento** e somados:

| Efeito | Fórmula (por segmento, depois somada) | Leitura |
|---|---|---|
| **Preço** | (P₁ − P₀) × Q₀ | quanto a receita mudou só porque a tarifa mudou, com o volume da base |
| **Volume** | (Q₁ − Q₀) × P₀ | quanto mudou só porque a energia faturada mudou, na tarifa da base |
| **Mix** | soma dos efeitos de volume dos segmentos − (Q₁ − Q₀) × tarifa média da base | troca de composição entre classes e locais com tarifas diferentes |
| **Cruzado** | (P₁ − P₀) × (Q₁ − Q₀) | interação entre as duas mudanças ao mesmo tempo |

- **Identidade:** preço + volume + mix + cruzado = receita atual − receita base (testada no backend).
- **Segmento novo ou perdido** (sem volume em uma das janelas) não tem tarifa comparável: toda a variação dele vai para o efeito de volume.
- No ranking por bairro, município ou classe, cada linha mostra preço + volume + cruzado = variação; o volume da linha já contém o mix dela.
- Implementação: `backend/app/features/revenue/decomposition.py`. Endpoint: `GET /api/v1/revenue/decomposition`.

---

## 4. Resultado da decomposição

| | Receita (R$) | Volume (MWh) | Tarifa média (R$/kWh) |
|---|---|---|---|
| Janela base | `[a preencher]` | `[a preencher]` | `[a preencher]` |
| Janela atual | `[a preencher]` | `[a preencher]` | `[a preencher]` |
| Variação | `[a preencher]` (`[a preencher]`%) | `[a preencher]`% | `[a preencher]`% |

| Efeito | R$ | % da variação |
|---|---|---|
| Preço | `[a preencher]` | `[a preencher]` |
| Volume | `[a preencher]` | `[a preencher]` |
| Mix | `[a preencher]` | `[a preencher]` |
| Cruzado | `[a preencher]` | `[a preencher]` |
| **Soma (= variação)** | `[a preencher]` | 100% |

**Conferência com o diretor:** os 10,5% de tarifa, os "quase 4%" de volume e os 8% de receita citados no case precisam aparecer (ou ser explicados) nesta tabela. Se algum não bater, dizer qual e por quê (por exemplo: o reajuste de 10,5% vale para a tarifa residencial, e a tarifa média inclui outras classes e a bandeira).

---

## 5. Onde a receita caiu

Origem: aba **Ranking territorial** da tela `/revenue`, ordenada pelo efeito-volume (maior perda primeiro).

| Nível | Principais perdas de volume | Observação |
|---|---|---|
| Classe de consumo | `[a preencher]` | |
| Município | `[a preencher]` | |
| Bairro (10 maiores perdas) | `[a preencher]` | cruzar com a penetração de GD (causa 6.1) |

---

## 6. Por quê: causa por causa

Cada causa tem **uma consulta direta no banco** (seção 9), **uma ação** e **uma estimativa de ganho em R$**. A ordem abaixo é a da divisão de tarefas do time.

| # | Causa | O que medir | Fonte (tabela.coluna) | Responsável | Energia (MWh) | Receita (R$/ano) |
|---|---|---|---|---|---|---|
| 6.1 | **Painéis solares (GD)** | queda de consumo faturado das UCs com GD depois da `data_conexao_gd`, comparada com UCs sem GD da mesma classe | `dim_unidade_consumidora.possui_gd`, `potencia_gd_kw`, `data_conexao_gd` · `fato_faturamento` | Renan | `[a preencher]` | `[a preencher]` |
| 6.2 | **Fraude e furto** | energia não faturada com indício de irregularidade; usar **o mesmo cálculo de energia recuperável da fila de perdas** (Adrian), mais o que as inspeções de campo já recuperaram | `fato_anomalia_leitura` · `fato_inspecoes_perdas` · fila de perdas (`/api/v1/losses`) | Renan + Adrian | `[a preencher]` | `[a preencher]` |
| 6.3 | **Inadimplência** | faturas vencidas e não pagas e o valor delas | `fato_faturamento.status_pagamento = 'VENCIDA'` | Ryei | n/a | `[a preencher]` |
| 6.4 | **Leituras estimadas** | leituras fechadas pela média (participação em cada janela) e quanto elas se afastam da leitura real seguinte | `fato_medicao.tipo_leitura = 'ESTIMADA'` | Renan | `[a preencher]` | `[a preencher]` |
| 6.5 | **Clientes que passaram a consumir menos** | queda de consumo das UCs mantidas, sem GD e sem anomalia, por classe e bairro (o que sobra depois de 6.1 a 6.4) | `fato_faturamento` · `dim_unidade_consumidora` | Célio (ranking da tela) | `[a preencher]` | `[a preencher]` |

Cuidados de interpretação (a validar com os dados antes de afirmar qualquer coisa):

- **Inadimplência não reduz a receita faturada:** ela reduz o que entra no caixa. Se a conta da seção 4 usa receita faturada, a inadimplência explica um problema de **arrecadação**, não a queda de volume. Apresentar separadamente.
- **Leitura estimada** muda o mês em que o consumo é cobrado, e tende a se compensar em 12 meses. Medir o efeito real nas duas janelas antes de contá-lo como causa.
- **Faturas sem consumo válido** (6.329 faturas, segundo o dicionário de dados) entram na receita, mas não no volume: elevam levemente a tarifa média. Informar o tamanho disso na seção 9.

### 6.0 Ponto de partida: UCs novas, perdidas e mantidas

Antes de atribuir a queda a qualquer causa, separar de onde ela vem. A base de clientes cresceu, então o volume total junta três grupos: UCs **novas** (só na janela atual), UCs **perdidas** (só na base) e UCs **mantidas** (nas duas). As causas 6.1 a 6.5 explicam a queda das mantidas; as novas e as perdidas mostram o efeito do crescimento. Consulta **C0** (seção 9).

- **Cuidado:** UC que entrou ou saiu no meio de uma janela tem menos de 12 faturas e distorce a comparação. Conferir quantas UCs mantidas têm menos de 12 meses em cada janela e dizer o tamanho disso.

### 6.1 Painéis solares (GD)

- **Como medir:** variação de consumo faturado das UCs **mantidas** com `possui_gd = 1` contra as sem GD da mesma classe (consulta **C1**). A diferença entre as duas variações, aplicada ao consumo da base das UCs com GD, é a parte atribuível à geração própria.
- **Cuidados:** `data_conexao_gd` mostra quando a UC passou a gerar; UC que ligou a GD no meio da janela mistura antes e depois. Confirmar com o Renan se `consumo_faturado_kwh` já é líquido da energia injetada.
- **Medido:** `[a preencher]` (kWh e MWh na janela, nº de UCs, kWp instalados)
- **Ação proposta:** `[a preencher]`
- **Ganho estimado e premissa:** `[a preencher]`

### 6.2 Fraude e furto

- **Como medir:** usar o **mesmo cálculo da fila de perdas** (Adrian), para não existirem dois números. No código dele (`backend/app/features/loss_management/scoring.py`):
  - kWh/mês recuperável = consumo médio da base − consumo médio recente da UC (mínimo 0);
  - valor/ano = kWh/mês × 12 × tarifa de referência;
  - retorno esperado = kWh/mês × taxa histórica de acerto (62,7% no geral e 93% para queda súbita, medidas em 1.389 inspeções de campo).
- **Conferir com o Adrian:** a tarifa de referência da fila é uma constante provisória (R$ 0,714/kWh, "tarifa de referência do desenho da tela"), diferente da tarifa média da tela de receita. Combinar qual vale no diagnóstico e usar a mesma nos dois.
- **Também medir (campo):** o que as inspeções já recuperaram de fato (consulta **C2a**) e quantas UCs têm leitura anômala (consulta **C2b**), como contexto, sem somar com a estimativa da fila.
- **Medido:** `[a preencher]` (UCs na fila, kWh/mês recuperável, valor/ano)
- **Ação proposta:** `[a preencher]` (ex.: quantas UCs do topo da fila inspecionar)
- **Ganho estimado e premissa:** `[a preencher]`

### 6.3 Inadimplência

- **Como medir:** percentual do faturado que está vencido e não pago, em cada janela (consulta **C3**).
- **Cuidado:** muda o caixa, não a receita faturada nem o volume. Entra no documento como problema de arrecadação, em separado das causas de volume.
- **Medido:** `[a preencher]`
- **Ação proposta:** `[a preencher]`
- **Ganho estimado e premissa:** `[a preencher]`

### 6.4 Leituras estimadas

- **Como medir:** participação das leituras estimadas em cada janela e o kWh que elas carregam (consulta **C4**). Depois comparar o consumo estimado com a leitura real seguinte da mesma UC.
- **Cuidado:** tende a mudar o mês da cobrança, não o total do ano. Só entra como causa se houver efeito líquido nas duas janelas.
- **Medido:** `[a preencher]`
- **Ação proposta:** `[a preencher]`
- **Ganho estimado e premissa:** `[a preencher]`

### 6.5 Clientes que passaram a consumir menos

- **Como medir:** queda das UCs mantidas, sem GD e sem leitura anômala, por classe, município e bairro (consulta **C5**). Cruzar com o ranking territorial da tela.
- **Medido:** `[a preencher]`
- **Ação proposta:** `[a preencher]`
- **Ganho estimado e premissa:** `[a preencher]`

---

## 7. Resíduo: o que as causas não explicam

| | MWh | % da queda de volume |
|---|---|---|
| Queda total de volume (seção 4) | `[a preencher]` | 100% |
| Soma das causas 6.1 a 6.5 | `[a preencher]` | `[a preencher]` |
| **Não explicado** | `[a preencher]` | `[a preencher]` |

Se as causas não explicarem toda a queda, este documento **diz isso claramente** e não força a conta.

---

## 8. Recomendações e ganho estimado

| Ação | Causa | Escopo | Ganho estimado (R$/ano) | Premissa | Prioridade |
|---|---|---|---|---|---|
| `[a preencher]` | | | `[a preencher]` | | |

---

## 9. Premissas, limites e como reproduzir

**Reprodutibilidade.** Todo número vem de uma consulta direta no `v_energy.db` (SQLite). A banca vai perguntar *"como vocês chegaram nesse valor?"*: a resposta é a consulta ao lado de cada número.

Consulta-modelo dos totais das duas janelas (a tela e a API usam a mesma lógica, com a junção ao cadastro):

```sql
SELECT
  CASE
    WHEN f.competencia BETWEEN '2022-07' AND '2023-06' THEN 'base'
    WHEN f.competencia BETWEEN '2025-07' AND '2026-06' THEN 'atual'
  END AS janela,
  SUM(f.valor_total_rs)           AS receita_rs,
  SUM(f.consumo_faturado_kwh)     AS volume_kwh,
  COUNT(*)                        AS faturas,
  COUNT(DISTINCT f.id_uc)         AS ucs
FROM fato_faturamento f
JOIN dim_unidade_consumidora u ON u.id_uc = f.id_uc
WHERE f.competencia BETWEEN '2022-07' AND '2023-06'
   OR f.competencia BETWEEN '2025-07' AND '2026-06'
GROUP BY janela;
```

### Consultas das causas

Todas rodam no SQLite (`v_energy.db`) com as janelas fixas da seção 2. Os resultados ainda não foram preenchidos: as consultas foram escritas a partir do dicionário de dados (`docs/DATA_DICTIONARY.md`) e testadas apenas quanto à sintaxe, então **conferir nomes de colunas e resultados no banco real** antes de usar qualquer número.

**C0: UCs novas, perdidas e mantidas (seção 6.0)**

Mostra de onde vem a variação de volume e de receita.

```sql
WITH por_uc AS (
  SELECT f.id_uc,
         SUM(CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06' THEN f.consumo_faturado_kwh END) AS kwh_base,
         SUM(CASE WHEN f.competencia BETWEEN '2025-07' AND '2026-06' THEN f.consumo_faturado_kwh END) AS kwh_atual,
         SUM(CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06' THEN f.valor_total_rs END)      AS rs_base,
         SUM(CASE WHEN f.competencia BETWEEN '2025-07' AND '2026-06' THEN f.valor_total_rs END)      AS rs_atual
  FROM fato_faturamento f
  GROUP BY f.id_uc
)
SELECT CASE
         WHEN kwh_base IS NULL  THEN 'nova (só na janela atual)'
         WHEN kwh_atual IS NULL THEN 'perdida (só na janela base)'
         ELSE 'mantida (nas duas janelas)'
       END                                   AS grupo,
       COUNT(*)                              AS ucs,
       ROUND(SUM(COALESCE(kwh_base, 0)), 0)  AS kwh_base,
       ROUND(SUM(COALESCE(kwh_atual, 0)), 0) AS kwh_atual,
       ROUND(SUM(COALESCE(kwh_atual, 0)) - SUM(COALESCE(kwh_base, 0)), 0) AS variacao_kwh,
       ROUND(SUM(COALESCE(rs_atual, 0)) - SUM(COALESCE(rs_base, 0)), 2)   AS variacao_rs
FROM por_uc
GROUP BY grupo
ORDER BY variacao_kwh;
```

**Resultado:** `[a preencher]`

**C1: UCs mantidas com e sem geração distribuída (causa 6.1)**

Compara a variação de consumo das UCs com GD com as sem GD, por classe.

```sql
WITH por_uc AS (
  SELECT f.id_uc,
         SUM(CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06' THEN f.consumo_faturado_kwh END) AS kwh_base,
         SUM(CASE WHEN f.competencia BETWEEN '2025-07' AND '2026-06' THEN f.consumo_faturado_kwh END) AS kwh_atual
  FROM fato_faturamento f
  GROUP BY f.id_uc
)
SELECT u.possui_gd,
       u.classe_consumo,
       COUNT(*)                                  AS ucs,
       ROUND(SUM(p.kwh_base), 0)                 AS kwh_base,
       ROUND(SUM(p.kwh_atual), 0)                AS kwh_atual,
       ROUND(SUM(p.kwh_atual) - SUM(p.kwh_base), 0) AS variacao_kwh,
       ROUND(100.0 * (SUM(p.kwh_atual) - SUM(p.kwh_base)) / SUM(p.kwh_base), 1) AS variacao_pct,
       ROUND(SUM(CASE WHEN u.possui_gd = 1 THEN u.potencia_gd_kw END), 1)       AS potencia_gd_kw
FROM por_uc p
JOIN dim_unidade_consumidora u ON u.id_uc = p.id_uc
WHERE p.kwh_base IS NOT NULL AND p.kwh_atual IS NOT NULL
GROUP BY u.possui_gd, u.classe_consumo
ORDER BY variacao_kwh;
```

**Resultado:** `[a preencher]`

**C2a: o que as inspeções de campo já recuperaram (causa 6.2)**

Taxa de acerto e energia recuperada medidas nas inspeções.

```sql
SELECT COUNT(*)                                          AS inspecoes,
       SUM(irregularidade_constatada)                    AS com_irregularidade,
       ROUND(100.0 * SUM(irregularidade_constatada) / COUNT(*), 1) AS taxa_acerto_pct,
       ROUND(SUM(kwh_recuperado), 0)                     AS kwh_recuperado,
       ROUND(SUM(CASE WHEN irregularidade_constatada = 1 THEN kwh_recuperado END)
             / SUM(irregularidade_constatada), 0)        AS kwh_medio_por_irregularidade
FROM fato_inspecoes_perdas;
```

**Resultado:** `[a preencher]`

**C2b: leituras anômalas (causa 6.2)**

Indício de by-pass; não é a estimativa da fila, que vem da API de perdas.

```sql
SELECT COUNT(DISTINCT id_uc)              AS ucs_com_anomalia,
       COUNT(*)                           AS leituras_anomalas,
       ROUND(SUM(ABS(diferenca_leitura_kwh)), 0) AS kwh_inexplicados
FROM fato_anomalia_leitura;
```

**Resultado:** `[a preencher]`

**C3: inadimplência por janela (causa 6.3)**

Percentual do faturado que está vencido.

```sql
SELECT CASE WHEN competencia BETWEEN '2022-07' AND '2023-06' THEN 'base' ELSE 'atual' END AS janela,
       COUNT(*)                                                                AS faturas,
       ROUND(SUM(valor_total_rs), 2)                                           AS faturado_rs,
       ROUND(SUM(CASE WHEN status_pagamento = 'VENCIDA' THEN valor_total_rs ELSE 0 END), 2) AS vencido_rs,
       ROUND(100.0 * SUM(CASE WHEN status_pagamento = 'VENCIDA' THEN valor_total_rs ELSE 0 END)
             / SUM(valor_total_rs), 2)                                         AS vencido_pct
FROM fato_faturamento
WHERE competencia BETWEEN '2022-07' AND '2023-06'
   OR competencia BETWEEN '2025-07' AND '2026-06'
GROUP BY janela
ORDER BY janela;
```

**Resultado:** `[a preencher]`

**C4: leituras estimadas por janela (causa 6.4)**

Participação das leituras estimadas.

```sql
SELECT CASE WHEN competencia BETWEEN '2022-07' AND '2023-06' THEN 'base' ELSE 'atual' END AS janela,
       COUNT(*)                                                     AS leituras,
       SUM(tipo_leitura = 'ESTIMADA')                               AS estimadas,
       ROUND(100.0 * SUM(tipo_leitura = 'ESTIMADA') / COUNT(*), 2)  AS estimadas_pct,
       ROUND(SUM(CASE WHEN tipo_leitura = 'ESTIMADA' THEN consumo_kwh END), 0) AS kwh_estimado
FROM fato_medicao
WHERE competencia BETWEEN '2022-07' AND '2023-06'
   OR competencia BETWEEN '2025-07' AND '2026-06'
GROUP BY janela
ORDER BY janela;
```

**Resultado:** `[a preencher]`

**C5: queda das UCs sem GD e sem anomalia (causa 6.5)**

Maiores quedas por classe, município e bairro.

```sql
WITH por_uc AS (
  SELECT f.id_uc,
         SUM(CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06' THEN f.consumo_faturado_kwh END) AS kwh_base,
         SUM(CASE WHEN f.competencia BETWEEN '2025-07' AND '2026-06' THEN f.consumo_faturado_kwh END) AS kwh_atual
  FROM fato_faturamento f
  GROUP BY f.id_uc
)
SELECT u.classe_consumo, u.municipio, u.bairro,
       COUNT(*)                                     AS ucs,
       ROUND(SUM(p.kwh_atual) - SUM(p.kwh_base), 0) AS variacao_kwh,
       ROUND(100.0 * (SUM(p.kwh_atual) - SUM(p.kwh_base)) / SUM(p.kwh_base), 1) AS variacao_pct
FROM por_uc p
JOIN dim_unidade_consumidora u ON u.id_uc = p.id_uc
WHERE p.kwh_base IS NOT NULL AND p.kwh_atual IS NOT NULL
  AND COALESCE(u.possui_gd, 0) = 0
  AND p.id_uc NOT IN (SELECT id_uc FROM fato_anomalia_leitura)
GROUP BY u.classe_consumo, u.municipio, u.bairro
ORDER BY variacao_kwh
LIMIT 20;
```

**Resultado:** `[a preencher]`


**Limites e premissas em aberto**

- Receita e volume por `valor_total_rs` e `consumo_faturado_kwh`; confirmar com Ryei se o consumo faturado já é líquido da geração distribuída.
- Uma fatura por UC por competência (usada no ticket médio).
- Os valores de DEC/FEC e qualquer limite de referência são só comparativos; **não** são multas nem violações regulatórias reais (glossário do case).
- Satisfação do cliente está na escala de 1 a 5 (ADR-001), não de 0 a 10.

**Fontes dos números:** tela `/revenue` (Célio), pipeline Gold (Renan e Ryei), fila de perdas (Adrian).
