# Diagnóstico da Receita — por que a receita cresceu pouco

> **Fatia 04 · Inteligência Comercial** · Autor: Célio · Números das causas: Renan (com apoio de Ryei e Adrian)
> **Status:** rascunho com os números do `v_energy.db` real (consultas D1 e C0 a C5, seção 9). Falta: conferir com Renan, Ryei e Adrian os pontos marcados `[a confirmar]`, ler da tela `/revenue` os efeitos exatos por segmento (seção 4) e fechar ação e ganho em R$ de cada causa. Cada número vem de uma consulta direta no banco; o que é cálculo em cima delas está dito no texto.

---

## 1. A pergunta do diretor

> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê."* — Henrique Duarte, Diretor Comercial (`atividade.pdf`, pág. 2)

**Resposta em uma frase** (escrever por último, depois das seções 4 a 8):

> *(rascunho, a fechar depois de conferir com o time)* A energia faturada caiu 5,1% e a tarifa média subiu 13,8%, por isso a receita subiu só 8,0%. A queda de volume vem quase toda da geração distribuída (painéis solares): 3.496 UCs com GD consumiram cerca de 62% menos, o que representa 97% da queda líquida. Inadimplência, leituras estimadas e anomalias de leitura não explicam a queda. Fraude e consumo menor em alguns bairros ficam como pontos a investigar.

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

> **Conferido no banco real:** a primeira competência é `2022-07` e a última é `2026-06` (48 meses), então as janelas acima estão certas.
> A receita sem tributos (`valor_energia_rs`) também varia +8,0%, então usar `valor_total_rs` ou só a energia não muda a conclusão. `[a confirmar com Ryei]` qual das duas o case considera como receita.

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
| Janela base | 157.107.191 | 227.051 | 0,6919 |
| Janela atual | 169.683.459 | 215.433 | 0,7876 |
| Variação | +12.576.267 (+8,0%) | -11.618 (-5,1%) | +13,8% |

Fonte: totais das duas janelas (consulta-modelo da seção 9; as mesmas contas da tela `/revenue`). Por classe (D1): a tarifa média residencial foi de 0,7145 para 0,8187 R$/kWh (+14,6%) e o volume residencial caiu de 81.685 para 76.234 MWh (-6,7%).

**Efeitos da decomposição.** Os valores exatos, por segmento, são os da cascata da tela `/revenue` com as janelas padrão. `[a preencher]` copiar da tela: preço, volume, mix e cruzado, em R$ e em % da variação. Como ordem de grandeza, calculando só no total (sem separar segmentos, então sem mix): preço ≈ +R$ 21,7 mi, volume ≈ -R$ 8,0 mi, cruzado ≈ -R$ 1,1 mi, soma ≈ R$ 12,6 mi. Esse cálculo é só uma conferência e **não** substitui o da tela.

**Conferência com o diretor:**
- Receita +8,0%: bate.
- Volume: o banco dá -5,1%, e o case fala em "quase -4%". Não bate. `[a confirmar]` se o case usa outro recorte (por exemplo outra fonte de consumo ou só uma classe).
- Tarifa: a média sobe 13,8% (residencial +14,6%), e o case fala em reajuste homologado de 10,5%. Não bate. O reajuste homologado é uma regra regulatória; a tarifa média cobrada também reflete bandeira, mix de classes e consumo. `[a confirmar]` com o time de onde vem o 10,5%.
- A receita bate mesmo com essas duas diferenças, então a conta em si está consistente. As diferenças precisam de explicação antes de a banca perguntar.

---

## 5. Onde a receita caiu

Origem: aba **Ranking territorial** da tela `/revenue`, ordenada pelo efeito-volume (maior perda primeiro).

| Nível | Principais perdas de volume | Observação |
|---|---|---|
| Classe de consumo | `[a preencher]` copiar da tela. Pelos totais da consulta D1: residencial -5.451 MWh e comercial -5.868 MWh | o industrial fica quase estável (-396 MWh) |
| Município | `[a preencher]` copiar da tela | |
| Bairro (10 maiores perdas) | `[a preencher]` copiar da tela | cruzar com a penetração de GD (causa 6.1) e com os bairros da consulta C5 (6.5) |

---

## 6. Por quê: causa por causa

Cada causa tem **uma consulta direta no banco** (seção 9), **uma ação** e **uma estimativa de ganho em R$**. A ordem abaixo é a da divisão de tarefas do time.

| # | Causa | O que medir | Fonte (tabela.coluna) | Responsável | Energia (MWh) | Receita (R$/ano) |
|---|---|---|---|---|---|---|
| 6.1 | **Painéis solares (GD)** | queda de consumo faturado das UCs com GD depois da `data_conexao_gd`, comparada com UCs sem GD da mesma classe | `dim_unidade_consumidora.possui_gd`, `potencia_gd_kw`, `data_conexao_gd` · `fato_faturamento` | Renan | -11.314 (medido) | ≈ -8,3 mi/ano (estimado a tarifa média da base) |
| 6.2 | **Fraude e furto** | energia não faturada com indício de irregularidade; usar **o mesmo cálculo de energia recuperável da fila de perdas** (Adrian), mais o que as inspeções de campo já recuperaram | `fato_anomalia_leitura` · `fato_inspecoes_perdas` · fila de perdas (`/api/v1/losses`) | Renan + Adrian | não é causa mensurável da queda | `[a preencher]` depende da fila do Adrian |
| 6.3 | **Inadimplência** | faturas vencidas e não pagas e o valor delas | `fato_faturamento.status_pagamento = 'VENCIDA'` | Ryei | n/a | não explica a queda; R$ 9,2 mi vencidos na janela atual (caixa) |
| 6.4 | **Leituras estimadas** | leituras fechadas pela média (participação em cada janela) e quanto elas se afastam da leitura real seguinte | `fato_medicao.tipo_leitura = 'ESTIMADA'` | Renan | não explica a queda (a participação caiu) | efeito líquido não medido |
| 6.5 | **Clientes que passaram a consumir menos** | queda de consumo das UCs mantidas, sem GD e sem anomalia, por classe e bairro (o que sobra depois de 6.1 a 6.4) | `fato_faturamento` · `dim_unidade_consumidora` | Célio (ranking da tela) | -1.101 no total das UCs mantidas sem GD; 4 bairros concentram -2.714 | até ≈ R$ 2,0 mi/ano em jogo nos 4 bairros (teto) |

Cuidados de interpretação (a validar com os dados antes de afirmar qualquer coisa):

- **Inadimplência não reduz a receita faturada:** ela reduz o que entra no caixa. Se a conta da seção 4 usa receita faturada, a inadimplência explica um problema de **arrecadação**, não a queda de volume. Apresentar separadamente.
- **Leitura estimada** muda o mês em que o consumo é cobrado, e tende a se compensar em 12 meses. Medir o efeito real nas duas janelas antes de contá-lo como causa.
- **Faturas sem consumo válido** (6.329 faturas, segundo o dicionário de dados) entram na receita, mas não no volume: elevam levemente a tarifa média. Informar o tamanho disso na seção 9.

### 6.0 Ponto de partida: UCs novas, perdidas e mantidas

Antes de atribuir a queda a qualquer causa, separar de onde ela vem. A base de clientes cresceu, então o volume total junta três grupos: UCs **novas** (só na janela atual), UCs **perdidas** (só na base) e UCs **mantidas** (nas duas). As causas 6.1 a 6.5 explicam a queda das mantidas; as novas e as perdidas mostram o efeito do crescimento. Consulta **C0** (seção 9).

- **Medido (C0):** 44.741 UCs mantidas e 259 novas. Nenhuma UC foi perdida. As mantidas tiveram -12.414 MWh e +R$ 11,92 mi; as novas deram +797 MWh e +R$ 0,66 mi. O crescimento da base (+0,6% de UCs) quase não compensa a queda de consumo das mantidas.
- **Cuidado:** UC que entrou ou saiu no meio de uma janela tem menos de 12 faturas e distorce a comparação. `[a preencher]` quantas UCs mantidas têm menos de 12 faturas em cada janela (consulta C7).

### 6.1 Painéis solares (GD)

- **Como medir:** variação de consumo faturado das UCs **mantidas** com `possui_gd = 1` contra as sem GD da mesma classe (consulta **C1**). A diferença entre as duas variações, aplicada ao consumo da base das UCs com GD, é a parte atribuível à geração própria.
- **Cuidados:** `data_conexao_gd` mostra quando a UC passou a gerar; UC que ligou a GD no meio da janela mistura antes e depois. Confirmar com o Renan se `consumo_faturado_kwh` já é líquido da energia injetada.
- **Medido (C1):** entre as UCs mantidas, as 3.496 com GD (3.115 residenciais e 381 comerciais) consumiram 62% menos (residencial -62,0%, comercial -61,6%), o que dá -11.314 MWh (-6.565 residencial e -4.749 comercial). As UCs sem GD ficaram praticamente estáveis (residencial +0,9%, comercial -3,0%, industrial -0,6%). A GD responde por 97,4% da queda líquida de volume (11.314 de 11.618 MWh) e por 91% da queda das UCs mantidas.
- **Cuidados do dado:** (1) a soma de `potencia_gd_kw` das residenciais dá 227 mil kW para 3.115 UCs (cerca de 73 kW por UC), valor alto para residência; `[a confirmar com Renan]` a unidade e se há UCs fora do padrão. (2) `possui_gd` é o estado atual da UC; `[a preencher]` conferir pela `data_conexao_gd` (consulta C6) quantas ligaram a GD antes da janela base. (3) `[a confirmar com Renan]` se o consumo faturado já é líquido da energia injetada.
- **Ação proposta:** `[a confirmar com Renan]` (hipóteses: acompanhar a cada mês as novas conexões de GD e a potência instalada para projetar a perda de volume; rever com o regulatório como a rede é remunerada nessas UCs).
- **Ganho estimado e premissa:** não é um ganho a recuperar, é uma perda a medir: ≈ R$ 8,3 mi por ano de receita (6.565 MWh × R$ 0,7145 residencial + 4.749 MWh × R$ 0,7540 comercial, tarifas médias da janela base na consulta D1). Aproximação: a conta exata por UC fica para depois da conferência.

### 6.2 Fraude e furto

- **Como medir:** usar o **mesmo cálculo da fila de perdas** (Adrian), para não existirem dois números. No código dele (`backend/app/features/loss_management/scoring.py`):
  - kWh/mês recuperável = consumo médio da base − consumo médio recente da UC (mínimo 0);
  - valor/ano = kWh/mês × 12 × tarifa de referência;
  - retorno esperado = kWh/mês × taxa histórica de acerto (62,7% no geral e 93% para queda súbita, medidas em 1.389 inspeções de campo).
- **Conferir com o Adrian:** a tarifa de referência da fila é uma constante provisória (R$ 0,714/kWh, "tarifa de referência do desenho da tela"), diferente da tarifa média da tela de receita. Combinar qual vale no diagnóstico e usar a mesma nos dois.
- **Também medir (campo):** o que as inspeções já recuperaram de fato (consulta **C2a**) e quantas UCs têm leitura anômala (consulta **C2b**), como contexto, sem somar com a estimativa da fila.
- **Medido (C2a):** 1.389 inspeções, 871 com irregularidade (62,7%, igual à taxa usada pelo Adrian), 1.473 MWh recuperados, em média 1.691 kWh por irregularidade. Com a tarifa provisória de 0,714 R$/kWh seriam cerca de R$ 1,05 mi recuperados no total das inspeções (o período dessas inspeções não foi conferido).
- **Medido (C2b):** `fato_anomalia_leitura` está **vazia** (0 UCs, 0 leituras). Não há indício de desvio nas leituras anômalas, então fraude **não** aparece como causa mensurável da queda de volume neste banco.
- **Para a fila:** `[a preencher]` UCs na fila, kWh/mês recuperável e valor/ano, vindos do cálculo do Adrian (API de perdas), com a tarifa que vocês combinarem.
- **Ação proposta:** `[a confirmar com Adrian]` (ex.: quantas UCs do topo da fila inspecionar).
- **Ganho estimado e premissa:** `[a preencher]` depende da tarifa e da fila do Adrian. Isto é potencial de recuperação, não explicação da queda observada.

### 6.3 Inadimplência

- **Como medir:** percentual do faturado que está vencido e não pago, em cada janela (consulta **C3**).
- **Cuidado:** muda o caixa, não a receita faturada nem o volume. Entra no documento como problema de arrecadação, em separado das causas de volume.
- **Medido (C3):** 5,52% do faturado estava vencido na janela base (R$ 8,66 mi de R$ 157,1 mi) e 5,42% na atual (R$ 9,20 mi de R$ 169,7 mi). O percentual ficou estável, então a inadimplência não explica a queda de volume nem o crescimento menor da receita.
- **Ação proposta:** `[a confirmar com Ryei]` (a inadimplência segue sendo um tema de caixa, mas não de volume).
- **Ganho estimado e premissa:** `[a preencher]` só se o grupo decidir tratar arrecadação; não entra na conta da queda.

### 6.4 Leituras estimadas

- **Como medir:** participação das leituras estimadas em cada janela e o kWh que elas carregam (consulta **C4**). Depois comparar o consumo estimado com a leitura real seguinte da mesma UC.
- **Cuidado:** tende a mudar o mês da cobrança, não o total do ano. Só entra como causa se houver efeito líquido nas duas janelas.
- **Medido (C4):** 18,95% das leituras eram estimadas na janela base (101.630 de 536.267) e 15,85% na atual (85.536 de 539.768). A participação caiu, e o kWh estimado caiu de 42.555 MWh para 33.705 MWh. Estimativa não explica a queda de volume.
- **Ainda não medido:** a comparação do consumo estimado com a leitura real seguinte da mesma UC.
- **Ação proposta:** `[a confirmar com Renan]` (manter a redução de leituras estimadas).
- **Ganho estimado e premissa:** `[a preencher]` não medido; sem efeito líquido comprovado.

### 6.5 Clientes que passaram a consumir menos

- **Como medir:** queda das UCs mantidas, sem GD e sem leitura anômala, por classe, município e bairro (consulta **C5**). Cruzar com o ranking territorial da tela.
- **Medido (C1 e C5):** no total, as UCs mantidas sem GD variaram -1.101 MWh (queda pequena, de 0,5%). Mas a queda se concentra em poucos bairros: Iputinga e Macaxeira (Recife), Jardim Jordão e Prazeres (Jaboatão dos Guararapes). No comércio desses bairros o consumo caiu perto de 50% e na residencial perto de 17%, num total de 2.714 MWh (1.766 comercial e 948 residencial). Outros locais compensam parte disso.
- **Causa:** não sabemos. `[a preencher]` investigar antes de afirmar qualquer coisa (consulta C8: status das UCs, GD, tipo de queda mês a mês, relação com a qualidade da rede).
- **Ação proposta:** `[a preencher]` depende da causa encontrada.
- **Valor em jogo:** até ≈ R$ 2,0 mi por ano se o consumo voltasse ao da base (1.766 MWh × R$ 0,754 comercial + 948 MWh × R$ 0,7145 residencial). É um teto, não um ganho garantido.

---

## 7. Resíduo: o que as causas não explicam

| | MWh | % da queda de volume |
|---|---|---|
| Queda líquida de volume (seção 4) | 11.618 | 100% |
| Geração distribuída (6.1) | 11.314 | 97,4% |
| Outras UCs mantidas, sem GD (inclui os bairros de 6.5) | 1.101 | 9,5% |
| UCs novas (compensam) | -797 | -6,9% |
| **Resto, depois da GD** (sem GD e novas, somados) | 304 | 2,6% |

A GD explica quase toda a queda líquida. O resto é a soma de dois movimentos que se compensam: UCs sem GD que consomem menos (1.101 MWh, concentradas em quatro bairros, causa ainda desconhecida) e UCs novas que acrescentam 797 MWh. Fraude, inadimplência e leituras estimadas não aparecem como causa da queda nos dados (6.2 a 6.4). Os 304 MWh finais ficam como resíduo, e a causa dos bairros de 6.5 continua em aberto.

---

## 8. Recomendações e ganho estimado

| Ação | Causa | Escopo | Ganho estimado (R$/ano) | Premissa | Prioridade |
|---|---|---|---|---|---|
| Acompanhar novas conexões de GD e projetar a perda de volume | 6.1 | 3.496 UCs com GD | Perda estimada de ≈ R$ 8,3 mi/ano a medir (não é ganho a recuperar) | tarifa média da base por classe | Alta |
| Investigar a queda de consumo em Iputinga, Macaxeira, Jardim Jordão e Prazeres | 6.5 | 4 bairros, 2.714 MWh | até ≈ R$ 2,0 mi/ano em jogo (teto) | depende da causa encontrada | Alta |
| Inspecionar o topo da fila de perdas | 6.2 | `[a preencher]` UCs | `[a preencher]` | tarifa e cálculo do Adrian | Média |
| Acompanhar arrecadação (caixa) | 6.3 | faturas vencidas | não entra na conta de volume | 5,4% do faturado vencido | Baixa |

`[a confirmar]` ações e ganhos com Renan, Adrian e Ryei antes de entregar.

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

Todas rodam no SQLite (`v_energy.db`) com as janelas fixas da seção 2. Os resultados de D1 e C0 a C5 foram obtidos no banco real em 28/10/2026 (um script de leitura roda todas: `rodar_consultas_receita.py`). C6 a C8 ainda estão sem resultado.

**D1: totais por classe e janela (seção 4)**

Receita, volume e tarifa média por classe, para conferir o que o diretor falou.

```sql
SELECT u.classe_consumo AS classe,
       CASE WHEN f.competencia BETWEEN '2022-07' AND '2023-06' THEN 'base' ELSE 'atual' END AS janela,
       COUNT(DISTINCT f.id_uc)                                   AS ucs,
       ROUND(SUM(f.valor_total_rs), 0)                           AS receita_rs,
       ROUND(SUM(f.consumo_faturado_kwh) / 1000.0, 0)            AS volume_mwh,
       ROUND(SUM(f.valor_total_rs) / SUM(f.consumo_faturado_kwh), 4) AS tarifa_media_rs_kwh
FROM fato_faturamento f
JOIN dim_unidade_consumidora u ON u.id_uc = f.id_uc
WHERE f.competencia BETWEEN '2022-07' AND '2023-06'
   OR f.competencia BETWEEN '2025-07' AND '2026-06'
GROUP BY u.classe_consumo, janela
ORDER BY u.classe_consumo, janela;
```

**Resultado** (banco real, 28/10/2026): residencial 81.685 → 76.234 MWh, tarifa 0,7145 → 0,8187 (+14,6%); comercial 51.834 → 45.966 MWh, tarifa 0,7540 → 0,9074; industrial 87.178 → 86.782 MWh, tarifa 0,6305 → 0,6881; poder público 4.111 → 4.178 MWh; rural 2.243 → 2.273 MWh.

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

**Resultado** (banco real, 28/10/2026):

| Grupo | UCs | kWh base | kWh atual | Variação kWh | Variação R$ |
|---|---|---|---|---|---|
| mantida (nas duas janelas) | 44.741 | 227.050.628 | 214.636.328 | -12.414.300 | +11.921.191,43 |
| nova (só na janela atual) | 259 | 0 | 796.596 | +796.596 | +655.075,73 |

Nenhuma UC perdida.

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

**Resultado** (banco real, 28/10/2026):

| GD | Classe | UCs | kWh base | kWh atual | Variação kWh | Variação % | Potência GD (kW) |
|---|---|---|---|---|---|---|---|
| 1 | RESIDENCIAL | 3.115 | 10.583.690 | 4.019.009 | -6.564.681 | -62,0 | 227.003,1 |
| 1 | COMERCIAL | 381 | 7.714.128 | 2.965.209 | -4.748.919 | -61,6 | 22.263,6 |
| 0 | COMERCIAL | 4.501 | 44.119.879 | 42.797.183 | -1.322.696 | -3,0 | |
| 0 | INDUSTRIAL | 875 | 87.177.798 | 86.664.088 | -513.710 | -0,6 | |
| 0 | RURAL | 649 | 2.242.780 | 2.248.871 | +6.091 | +0,3 | |
| 0 | PODER PUBLICO | 221 | 4.111.426 | 4.167.243 | +55.817 | +1,4 | |
| 0 | RESIDENCIAL | 34.999 | 71.100.927 | 71.774.725 | +673.798 | +0,9 | |

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

**Resultado** (banco real, 28/10/2026): 1.389 inspeções, 871 com irregularidade, taxa de acerto 62,7%, 1.473.112 kWh recuperados, 1.691 kWh por irregularidade.

**C2b: leituras anômalas (causa 6.2)**

Indício de by-pass; não é a estimativa da fila, que vem da API de perdas.

```sql
SELECT COUNT(DISTINCT id_uc)              AS ucs_com_anomalia,
       COUNT(*)                           AS leituras_anomalas,
       ROUND(SUM(ABS(diferenca_leitura_kwh)), 0) AS kwh_inexplicados
FROM fato_anomalia_leitura;
```

**Resultado** (banco real, 28/10/2026): 0 UCs com anomalia e 0 leituras anômalas. A tabela `fato_anomalia_leitura` está vazia.

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

**Resultado** (banco real, 28/10/2026):

| Janela | Faturas | Faturado (R$) | Vencido (R$) | Vencido (%) |
|---|---|---|---|---|
| base | 536.267 | 157.107.191,43 | 8.664.981,08 | 5,52 |
| atual | 539.768 | 169.683.458,59 | 9.199.032,90 | 5,42 |

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

**Resultado** (banco real, 28/10/2026):

| Janela | Leituras | Estimadas | Estimadas (%) | kWh estimado |
|---|---|---|---|---|
| base | 536.267 | 101.630 | 18,95 | 42.554.891 |
| atual | 539.768 | 85.536 | 15,85 | 33.705.044 |

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

**Resultado** (banco real, 28/10/2026, 10 maiores quedas):

| Classe | Município | Bairro | UCs | Variação kWh | Variação % |
|---|---|---|---|---|---|
| COMERCIAL | RECIFE | IPUTINGA | 107 | -583.635 | -50,7 |
| COMERCIAL | JABOATAO DOS GUARARAPES | JARDIM JORDAO | 110 | -488.225 | -47,8 |
| COMERCIAL | JABOATAO DOS GUARARAPES | PRAZERES | 87 | -423.933 | -48,1 |
| RESIDENCIAL | RECIFE | IPUTINGA | 946 | -332.412 | -17,4 |
| RESIDENCIAL | JABOATAO DOS GUARARAPES | JARDIM JORDAO | 841 | -300.770 | -17,5 |
| COMERCIAL | RECIFE | MACAXEIRA | 55 | -270.558 | -49,1 |
| RESIDENCIAL | RECIFE | MACAXEIRA | 441 | -174.412 | -18,4 |
| RESIDENCIAL | JABOATAO DOS GUARARAPES | PRAZERES | 506 | -140.424 | -13,7 |
| INDUSTRIAL | RECIFE | BRASILIA TEIMOSA | 39 | -75.948 | -2,0 |
| INDUSTRIAL | MORENO | CERCADO GRANDE | 1 | -61.747 | -14,2 |

As demais linhas do top 20 são industriais, com quedas menores.


**C6: quando as UCs com GD ligaram a geração (causa 6.1)**

Conferir se a queda de 62% vem de GD ligada durante as janelas, e a potência por UC.

```sql
SELECT strftime('%Y', data_conexao_gd) AS ano_conexao,
       classe_consumo,
       COUNT(*)                         AS ucs,
       ROUND(AVG(potencia_gd_kw), 1)    AS potencia_media_kw,
       ROUND(MAX(potencia_gd_kw), 1)    AS potencia_maxima_kw
FROM dim_unidade_consumidora
WHERE possui_gd = 1
GROUP BY ano_conexao, classe_consumo
ORDER BY ano_conexao, classe_consumo;
```

**Resultado:** `[a preencher]`

**C7: UCs mantidas com menos de 12 faturas em alguma janela (seção 6.0)**

```sql
SELECT SUM(faturas_base < 12)  AS ucs_base_incompleta,
       SUM(faturas_atual < 12) AS ucs_atual_incompleta,
       COUNT(*)                AS ucs_mantidas
FROM (
  SELECT id_uc,
         SUM(competencia BETWEEN '2022-07' AND '2023-06') AS faturas_base,
         SUM(competencia BETWEEN '2025-07' AND '2026-06') AS faturas_atual
  FROM fato_faturamento
  GROUP BY id_uc
  HAVING faturas_base > 0 AND faturas_atual > 0
);
```

**Resultado:** `[a preencher]`

**C8: os quatro bairros com maior queda (causa 6.5)**

Como o consumo caiu mês a mês e se as UCs desses bairros têm GD ou estão inativas.

```sql
SELECT f.competencia, u.bairro,
       COUNT(DISTINCT f.id_uc)               AS ucs,
       ROUND(SUM(f.consumo_faturado_kwh), 0) AS kwh
FROM fato_faturamento f
JOIN dim_unidade_consumidora u ON u.id_uc = f.id_uc
WHERE u.bairro IN ('IPUTINGA', 'MACAXEIRA', 'JARDIM JORDAO', 'PRAZERES')
  AND u.possui_gd = 0
  AND f.competencia >= '2022-07'
GROUP BY f.competencia, u.bairro
ORDER BY u.bairro, f.competencia;
```

**Resultado:** `[a preencher]`


**Limites e premissas em aberto**

- Receita e volume por `valor_total_rs` e `consumo_faturado_kwh`; `[a confirmar com Ryei]` se o consumo faturado já é líquido da geração distribuída.
- Banco real conferido em 28/10/2026: 2.152.336 faturas, nenhuma sem UC no cadastro, 6.329 sem consumo, nenhum par UC e competência com mais de uma fatura, 5 classes (COMERCIAL, INDUSTRIAL, PODER PUBLICO, RESIDENCIAL, RURAL) e 14 municípios.
- `possui_gd` é o estado atual da UC, não o da época de cada janela.
- O seletor de bairro da tela mostra no máximo 100 bairros por município (limite da API); Recife tem 106. Correção pendente.
- Uma fatura por UC por competência (usada no ticket médio).
- Os valores de DEC/FEC e qualquer limite de referência são só comparativos; **não** são multas nem violações regulatórias reais (glossário do case).
- Satisfação do cliente está na escala de 1 a 5 (ADR-001), não de 0 a 10.

**Fontes dos números:** tela `/revenue` (Célio), pipeline Gold (Renan e Ryei), fila de perdas (Adrian).
