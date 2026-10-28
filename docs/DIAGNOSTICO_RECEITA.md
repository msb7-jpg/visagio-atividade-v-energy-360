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
| 6.2 | **Fraude e furto** | energia não faturada com indício de irregularidade; usar **o mesmo cálculo de energia recuperável da fila de perdas** (Adrian) | `fato_anomalia_leitura` · fila de perdas | Renan + Adrian | `[a preencher]` | `[a preencher]` |
| 6.3 | **Inadimplência** | faturas vencidas e não pagas e o valor delas | `fato_faturamento.status_pagamento = 'VENCIDA'` | Ryei | n/a | `[a preencher]` |
| 6.4 | **Leituras estimadas** | faturas fechadas pela média e quanto elas se afastam da leitura real seguinte | `fato_medicao.tipo_leitura = 'ESTIMADA'` | Renan | `[a preencher]` | `[a preencher]` |
| 6.5 | **Clientes que passaram a consumir menos** | queda de consumo das UCs sem GD e sem anomalia, por classe e bairro | `fato_faturamento` · `dim_unidade_consumidora` | Célio (ranking da tela) | `[a preencher]` | `[a preencher]` |

Cuidados de interpretação (a validar com os dados antes de afirmar qualquer coisa):

- **Inadimplência não reduz a receita faturada:** ela reduz o que entra no caixa. Se a conta da seção 4 usa receita faturada, a inadimplência explica um problema de **arrecadação**, não a queda de volume. Apresentar separadamente.
- **Leitura estimada** muda o mês em que o consumo é cobrado, e tende a se compensar em 12 meses. Medir o efeito real nas duas janelas antes de contá-lo como causa.
- **Faturas sem consumo válido** (6.329 faturas, segundo o dicionário de dados) entram na receita, mas não no volume: elevam levemente a tarifa média. Informar o tamanho disso na seção 9.

### 6.1 a 6.5: detalhamento

Repetir o bloco abaixo para cada causa depois que o número existir.

- **Medido:** `[a preencher]` (valor, janela, recorte)
- **Consulta:** código da consulta na seção 9
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

`[a preencher]` Consultas das causas 6.1 a 6.5, uma por causa, com o resultado ao lado.

**Limites e premissas em aberto**

- Receita e volume por `valor_total_rs` e `consumo_faturado_kwh`; confirmar com Ryei se o consumo faturado já é líquido da geração distribuída.
- Uma fatura por UC por competência (usada no ticket médio).
- Os valores de DEC/FEC e qualquer limite de referência são só comparativos; **não** são multas nem violações regulatórias reais (glossário do case).
- Satisfação do cliente está na escala de 1 a 5 (ADR-001), não de 0 a 10.

**Fontes dos números:** tela `/revenue` (Célio), pipeline Gold (Renan e Ryei), fila de perdas (Adrian).
