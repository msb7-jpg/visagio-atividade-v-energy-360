# Diagnóstico da Receita — por que a receita cresceu pouco

> **Fatia 04 · Inteligência Comercial** · Autor: Célio · Números das causas: Renan (com apoio de Ryei e Adrian)
> **Status:** versão consolidada com as janelas e métricas da tela `/revenue`, evidências da Gold e números atualizados da Fila de Perdas. As conclusões distinguem queda observada, irregularidade confirmada em campo e potencial estimado de recuperação; os limites de causalidade e de qualidade da origem estão explícitos.

---

## 1. A pergunta do diretor

> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê."* — Henrique Duarte, Diretor Comercial (`atividade.pdf`, pág. 2)

**Resposta resumida:**

> A receita faturada cresceu 8,0% porque a tarifa média realizada avançou 13,8%, enquanto o volume caiu 5,1%. A geração distribuída responde por 11.314 MWh — 97,4% da queda líquida — e, nos quatro bairros de maior queda (Iputinga, Macaxeira, Jardim Jordão e Prazeres), 828 das 871 irregularidades confirmadas em campo (95%) coincidem com uma redução de consumo concentrada desde maio de 2025, evidência de fraude como causa local. O saldo dos quatro bairros é de 2.714 MWh e até R$ 2,01 milhões em receita anual em jogo, não um ganho garantido. Inadimplência afeta caixa, não receita faturada; leituras estimadas não mostram efeito líquido comprovado; e a tabela vazia de anomalias de leitura não invalida as irregularidades registradas nas inspeções.

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
> A métrica adotada é `valor_total_rs` (energia + tributos), como na tela `/revenue` e no contrato do case de receita faturada. A receita sem tributos (`valor_energia_rs`) também varia +8,0%; usar uma ou outra não altera a conclusão percentual, mas os valores em reais deste documento seguem `valor_total_rs`.

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

**Efeitos da decomposição** (cascata da tela `/revenue`, janelas padrão, sem filtros; valores arredondados como a tela mostra):

| Efeito | R$ | % da variação (aprox.) |
|---|---|---|
| Preço | +22,6 mi | ≈ +180% |
| Volume | -8,0 mi | ≈ -64% |
| Mix | -0,46 mi | ≈ -4% |
| Cruzado | -1,5 mi | ≈ -12% |
| **Soma (= variação)** | **+12,6 mi** | 100% |

Em palavras: a tarifa traria +R$ 22,6 mi, mas a queda de volume tira R$ 8,0 mi, e o efeito cruzado e o mix tiram mais R$ 2,0 mi, o que deixa a receita em +R$ 12,6 mi. Como conferência, a mesma conta feita só no total (sem separar por segmento) dá preço ≈ +21,7 mi, volume ≈ -8,0 mi e cruzado ≈ -1,1 mi. A diferença para a tela vem de separar por segmento (classe, município e bairro), e a tela é a referência.

**Conferência com o diretor:**
- Receita +8,0%: bate.
- Volume: a consulta da janela padronizada dá -5,1%, 1,1 ponto percentual abaixo do enunciado aproximado ("quase -4%"). O número reproduzível da solução é -5,1%, calculado com `consumo_faturado_kwh` nas mesmas 12 competências da tela. O enunciado não especifica uma segunda métrica ou outro recorte que permita reproduzir -4%; portanto, não se substitui a métrica implementada por uma hipótese.
- Tarifa: a média realizada no conjunto de classes e municípios sobe 13,8% (residencial, +14,6%). Isso não é a mesma coisa que o reajuste tarifário homologado de 10,5%: o indicador da tela divide o faturamento total, inclusive tributos, pelo volume vendido e incorpora bandeiras e composição de clientes. Na comparação residencial sob bandeira verde, a alta é 9,1%, próxima do reajuste homologado; não se deve atribuir os 13,8% apenas ao reajuste.
- A receita bate em +8,0% nas duas medidas de faturamento. A diferença entre o enunciado aproximado e a métrica auditável fica registrada, sem afirmar uma causa que os dados disponíveis não demonstram.

---

## 5. Onde a receita caiu

Origem: aba **Ranking territorial** da tela `/revenue`, ordenada pelo efeito-volume (maior perda primeiro).

| Nível | Principais perdas de volume | Observação |
|---|---|---|
| Classe de consumo | 1ª Comercial -R$ 4,42 mi (volume -11,3%); 2ª Residencial -R$ 3,89 mi (-6,7%); 3ª Industrial -R$ 0,25 mi (-0,5%). Rural (+R$ 0,02 mi, +1,3%) e Poder Público (+R$ 0,05 mi, +1,6%) não perdem volume | comercial e residencial respondem por quase todo o efeito-volume por classe (-R$ 8,50 mi no total, que é o volume de -R$ 8,0 mi mais o mix de -R$ 0,46 mi). Nas cinco classes a variação da receita é positiva (comercial +R$ 2,63 mi, residencial +R$ 4,05 mi, industrial +R$ 4,75 mi, rural +R$ 0,47 mi e poder público +R$ 0,67 mi), porque o efeito-preço cobre a perda |
| Município | 1º Recife -R$ 3,62 mi (volume -5,5%); 2º Jaboatão dos Guararapes -R$ 2,17 mi (-7,7%); 3º Paulista -R$ 0,58 mi (-4,0%); 4º Olinda -R$ 0,45 mi (-2,8%); 5º Cabo de Santo Agostinho -R$ 0,45 mi (-4,6%). Os outros nove municípios perdem de -R$ 0,26 mi (Camaragibe) a -R$ 0,02 mi (Aracoiaba) | Recife e Jaboatão juntos respondem por 68% do efeito-volume por município (-R$ 5,79 mi de -R$ 8,50 mi). Jaboatão tem a maior queda relativa de volume. Os quatro bairros da causa 6.5 estão nesses dois municípios. Os 14 municípios têm variação de receita positiva, porque o efeito-preço cobre a perda |
| Bairro (maiores perdas de efeito-volume) | Entre os valores reproduzidos da tela: Iputinga (Recife) -R$ 1,01 mi; Jardim Jordão (Jaboatão) -R$ 0,79 mi; Prazeres (Jaboatão) -R$ 0,50 mi; Macaxeira (Recife) -R$ 0,41 mi; Brasília Teimosa (Recife) -R$ 0,33 mi; Barra de Jangada (Jaboatão) -R$ 0,14 mi; Engenho Velho (Jaboatão) -R$ 0,13 mi | os quatro bairros prioritários são também os quatro da evidência de fraude (6.2 e 6.5); juntos, sua receita cai R$ 1,40 mi apesar do efeito-preço positivo. Os sete valores disponíveis são mantidos; não se estimam posições adicionais sem a resposta correspondente da tela |

---

## 6. Por quê: causa por causa

Cada causa tem **uma consulta direta no banco** (seção 9), **uma ação** e **uma estimativa de ganho em R$**. A ordem abaixo é a da divisão de tarefas do time.

| # | Causa | O que medir | Fonte (tabela.coluna) | Responsável | Energia (MWh) | Receita (R$/ano) |
|---|---|---|---|---|---|---|
| 6.1 | **Painéis solares (GD)** | queda de consumo faturado das UCs com GD depois da `data_conexao_gd`, comparada com UCs sem GD da mesma classe | `dim_unidade_consumidora.possui_gd`, `potencia_gd_kw`, `data_conexao_gd` · `fato_faturamento` | Renan | -11.314 (medido) | ≈ -8,3 mi/ano (estimado a tarifa média da base) |
| 6.2 | **Fraude e furto** | irregularidades confirmadas em campo e queda concentrada nos quatro bairros; potencial de novas inspeções deve seguir o cálculo da fila | `fato_inspecoes_perdas` · `fato_anomalia_leitura` · fila (`/api/v1/losses`) | Renan + Adrian | 2.714 MWh de queda nos quatro bairros; 1.473 MWh recuperados em campo no período registrado | ≈ R$ 7,45 mil/ano de retorno esperado na fila real de 2026-06; ≈ R$ 2,01 mi/ano em jogo nos quatro bairros (teto, não garantido) |
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
- **Cuidado:** UC que entrou ou saiu no meio de uma janela tem menos de 12 faturas e distorce a comparação. Medido (C7): 103 das 44.741 UCs mantidas (0,2%) têm menos de 12 faturas na janela base e nenhuma na atual. Entraram no meio da janela base, então o volume base delas é menor que o de um ano completo. O efeito é pequeno e não muda a conclusão.

### 6.1 Painéis solares (GD)

- **Como medir:** variação de consumo faturado das UCs **mantidas** com `possui_gd = 1` contra as sem GD da mesma classe (consulta **C1**). A diferença entre as duas variações, aplicada ao consumo da base das UCs com GD, é a parte atribuível à geração própria.
- **Cuidados:** `data_conexao_gd` mostra quando a UC passou a gerar; UC que ligou a GD no meio da janela mistura antes e depois. A comparação usa o volume efetivamente faturado (`consumo_faturado_kwh`), portanto mede o que foi faturado e não a geração ou injeção física total.
- **Medido (C1):** entre as UCs mantidas, as 3.496 com GD (3.115 residenciais e 381 comerciais) consumiram 62% menos (residencial -62,0%, comercial -61,6%), o que dá -11.314 MWh (-6.565 residencial e -4.749 comercial). As UCs sem GD ficaram praticamente estáveis (residencial +0,9%, comercial -3,0%, industrial -0,6%). A GD responde por 97,4% da queda líquida de volume (11.314 de 11.618 MWh) e por 91% da queda das UCs mantidas.
- **Cuidados do dado:**
  1. **Potência:** a coluna de origem é `potencia_kwp`; a Silver apenas a converte para número e a Gold mantém o valor, sem conversão nem limite. A checagem do CSV bruto confirma 35 UCs acima de 100 (todas acima de 1.000), com máximo de 8.994,91. O campo Gold chamado `potencia_gd_kw` não é evidência de potência validada em kW: os registros são mantidos para rastreabilidade, mas não devem sustentar estimativas de capacidade até a origem ser corrigida ou esclarecida. A conclusão de volume não usa potência.
  2. **Quando a GD ligou:** `possui_gd` é o estado atual da UC. Pela `data_conexao_gd` (C6), todas as UCs com GD ligaram a partir de 2024: 1.845 em 2024, 1.304 em 2025 e 361 em 2026. Nenhuma tinha GD na janela base, então a base é limpa. Já as ligadas em 2025 e 2026 passaram parte da janela atual sem GD, e por isso a queda média de 62% provavelmente subestima o efeito de uma UC com a GD funcionando o ano inteiro.
  3. **Limite de interpretação:** `consumo_faturado_kwh` é o volume que o faturamento contabiliza. Não permite inferir, sozinho, a energia solar gerada, a energia injetada nem o autoconsumo.
- **Ação proposta:** acompanhar novas conexões e o consumo faturado por UC/classe; validar a unidade e os 35 valores extremos com a fonte de GD antes de usar potência em projeções; tratar remuneração da rede como decisão regulatória separada.
- **Perda estimada e premissa:** ≈ R$ 8,3 mi/ano (6.565 MWh × R$ 0,7145 residencial + 4.749 MWh × R$ 0,7540 comercial, tarifas médias da janela base). É receita faturada que deixou de existir na comparação, não um valor recuperável por inspeção.

### 6.2 Fraude e furto

- **Como medir:** separar (1) irregularidades confirmadas e energia já recuperada nas inspeções, (2) queda de consumo observada nas UCs dos quatro bairros e (3) retorno esperado da fila ainda não inspecionada. Não somar esses valores: são períodos e populações potencialmente sobrepostos.
- **Medido em campo (C2a):** 1.389 inspeções, 871 com irregularidade (62,7%) e 1.473.112 kWh recuperados. A tarifa média ponderada da janela atual (D8 de `DECISOES_PERDAS.md`), R$ 0,7876/kWh, equivale a aproximadamente R$ 1,16 mi sobre o total recuperado no período das inspeções; esse valor não é anualizado.
- **Concentração territorial:** 828 das 871 irregularidades confirmadas (95,1%) estão em Iputinga, Macaxeira, Jardim Jordão e Prazeres. A contagem divulgada de 887 UCs com queda de pelo menos 40% desde maio de 2025 ainda não foi reproduzida: uma reconstrução independente dos CSVs, com uma aproximação local das regras atuais da Silver e comparando maio/2024–abril/2025 com maio/2025–abril/2026, contou 888 UCs pela soma do consumo e 890 pela média mensal dos meses disponíveis; exigindo 12 meses completos em cada janela, contou 880. Esses resultados não confirmam os 887 nem substituem uma consulta validada na Gold. A evidência de campo e o início abrupto e simultâneo da queda sustentam fraude/irregularidade como causa local, mas não provam que cada UC ou cada kWh seja recuperável.
- **C2b — anomalias de leitura:** `fato_anomalia_leitura` tem 0 linhas (0 UCs). Isso não contradiz as inspeções: a tabela identifica apenas leitura atual menor que a anterior sem rollover ou troca de medidor, enquanto `fato_inspecoes_perdas` registra irregularidades constatadas em campo.
- **Fila, competência 2026-06:** 165 UCs, sendo 7 prioritárias e 158 de baixa chance; a energia recuperável estimada é 7.265 kWh/mês e o retorno esperado, após calibrar as taxas de acerto e excluir as ligações recentes sem taxa medida, é cerca de 788 kWh/mês. Com R$ 0,7876/kWh, isso representa aproximadamente R$ 7,45 mil/ano de retorno esperado. Os 7.265 kWh/mês equivaleriam a até R$ 68,7 mil/ano se tudo fosse recuperado, um teto teórico, não a estimativa provável. Para a demonstração, a referência configurada é 2025-09; esses números de 2026-06 descrevem a fila em tempo real e não a tela fixada para a demo.
- **Ação proposta:** priorizar as 7 UCs de maior retorno esperado na fila em tempo real; nos quatro bairros, definir e validar a regra de queda por UC e cruzar o grupo resultante com o histórico de ordens e inspeções antes de direcionar novas visitas.
- **Estimativa:** R$ 7,45 mil/ano de retorno esperado para a fila real de 2026-06 (788 kWh/mês × 12 × R$ 0,7876/kWh). O potencial dos bairros é apresentado separadamente na seção 6.5.

### 6.3 Inadimplência

- **Como medir:** percentual do faturado que está vencido e não pago, em cada janela (consulta **C3**).
- **Cuidado:** muda o caixa, não a receita faturada nem o volume. Entra no documento como problema de arrecadação, em separado das causas de volume.
- **Medido (C3):** 5,52% do faturado estava vencido na janela base (R$ 8,66 mi de R$ 157,1 mi) e 5,42% na atual (R$ 9,20 mi de R$ 169,7 mi). O percentual ficou estável, então a inadimplência não explica a queda de volume nem o crescimento menor da receita.
- **Ação proposta:** tratar os R$ 9,20 mi vencidos como carteira de cobrança, com priorização por valor e idade do débito, e acompanhar a recuperação efetiva sem alterar a conclusão sobre receita faturada.
- **Valor em aberto:** R$ 9,20 mi na janela atual; é saldo vencido, não ganho anual nem valor garantido de recuperação.

### 6.4 Leituras estimadas

- **Como medir:** participação das leituras estimadas em cada janela e o kWh que elas carregam (consulta **C4**). Depois comparar o consumo estimado com a leitura real seguinte da mesma UC.
- **Cuidado:** tende a mudar o mês da cobrança, não o total do ano. Só entra como causa se houver efeito líquido nas duas janelas.
- **Medido (C4):** 18,95% das leituras eram estimadas na janela base (101.630 de 536.267) e 15,85% na atual (85.536 de 539.768). A participação caiu, e o kWh estimado caiu de 42.555 MWh para 33.705 MWh. Estimativa não explica a queda de volume.
- **Ainda não medido:** a comparação do consumo estimado com a leitura real seguinte da mesma UC.
- **Ação proposta:** manter o monitoramento da participação de leituras estimadas e comparar a estimativa com a leitura real seguinte por UC, para detectar viés persistente.
- **Ganho estimado:** não quantificado em R$; não há medição do efeito líquido entre as janelas, portanto nenhum ganho é atribuído.

### 6.5 Clientes que passaram a consumir menos

- **Como medir:** queda das UCs mantidas, sem GD e sem leitura anômala, por classe, município e bairro (consulta **C5**). Cruzar com o ranking territorial da tela.
- **Medido (C1 e C5):** no total, as UCs mantidas sem GD variaram -1.101 MWh (queda pequena, de 0,5%). Mas a queda se concentra em poucos bairros: Iputinga e Macaxeira (Recife), Jardim Jordão e Prazeres (Jaboatão dos Guararapes). No comércio desses bairros o consumo caiu perto de 50% e na residencial perto de 17%, num total de 2.714 MWh (1.766 comercial e 948 residencial). Outros locais compensam parte disso.
- **Medido (C8):** a queda começa de uma vez em maio de 2025, nos quatro bairros ao mesmo tempo (entre -10% e -11% em maio, e de -13% a -21% em junho e julho, contra o mesmo mês de 2024). Até abril de 2025 o consumo repete o de 2024. O número de UCs não muda, então não são clientes que saíram.
- **Causa:** a evidência de campo aponta fraude/irregularidade como causa da queda local: 828 de 871 irregularidades confirmadas estão nesses quatro bairros. A queda aparece em seis alimentadores (três em Jaboatão e três em Recife), enquanto o ALM-REC-024 também atende IPSEP, que cai apenas 2,8%; isso afasta uma falha isolada de alimentador como explicação suficiente. A `subestacao` vazia impede testar agrupamento por subestação. A contagem de UCs com queda individual ≥40% permanece sem definição reproduzível: as reconstruções com dados brutos variam de 880 a 890 conforme o tratamento de completude e denominador. A evidência sustenta uma causa local de fraude, mas não determina individualmente a irregularidade de cada UC nem a energia recuperável sem inspeção.
- **Ação proposta:** reconciliar a definição da queda individual com a consulta original, cruzar o grupo validado com as irregularidades e inspeções já registradas, e priorizar apenas os casos ainda sem evidência de campo; acompanhar kWh efetivamente recuperado por bairro.
- **Valor em jogo:** até ≈ R$ 2,01 mi no ano comparável se os 2.714 MWh voltassem ao nível de referência (1.766 MWh comerciais × R$ 0,754 + 948 MWh residenciais × R$ 0,7145). É teto de receita faturada, não ganho garantido nem valor a somar às recuperações de campo.

---

## 7. Resíduo: o que as causas não explicam

| Movimento | MWh | % da queda líquida de volume |
|---|---|---|
| Queda líquida de volume (seção 4) | 11.618 | 100% |
| Geração distribuída (6.1) | 11.314 | 97,4% |
| UCs mantidas sem GD (saldo líquido; inclui os quatro bairros) | 1.101 | 9,5% |
| UCs novas (compensam) | -797 | -6,9% |
| **Saldo não explicado pela GD, após UCs novas** | 304 | 2,6% |

A GD explica 97,4% da queda líquida. Nas UCs sem GD, o saldo total é -1.101 MWh, mas os quatro bairros têm queda bruta de 2.714 MWh — parcialmente compensada por outras localidades — e concentram 95,1% das irregularidades confirmadas em campo. As UCs novas acrescentam 797 MWh. Os 304 MWh são o saldo algébrico remanescente depois da GD e das UCs novas, não uma causa independente. Inadimplência não reduz receita faturada, e leituras estimadas não têm efeito líquido demonstrado.

---

## 8. Recomendações e ganho estimado

| Ação | Causa | Escopo | Ganho estimado (R$/ano) | Premissa | Prioridade |
|---|---|---|---|---|---|
| Acompanhar novas conexões de GD e projetar a perda de volume | 6.1 | 3.496 UCs com GD | Perda estimada de ≈ R$ 8,3 mi/ano a medir (não é ganho a recuperar) | tarifa média da base por classe | Alta |
| Reconciliar a regra de queda individual e validar o grupo resultante contra inspeções e recuperações | 6.2/6.5 | 4 bairros; 828 de 871 irregularidades confirmadas (95,1%) | até ≈ R$ 2,01 mi/ano em jogo (teto, não garantido) | 887 não reproduzido; recuperação depende de inspeção; não somar às recuperações já realizadas | Alta |
| Inspecionar primeiro as UCs de maior retorno esperado na fila real | 6.2 | 7 UCs prioritárias entre 165 na referência 2026-06 | ≈ R$ 7,45 mil/ano de retorno esperado; ≈ R$ 68,7 mil/ano é o teto da energia potencial recuperável | 788 kWh/mês esperados; 7.265 kWh/mês recuperáveis; R$ 0,7876/kWh | Média |
| Acompanhar cobrança de faturas vencidas | 6.3 | R$ 9,20 mi vencidos na janela atual | até R$ 9,20 mi de saldo em aberto; não é ganho anual nem volume | depende da recuperação efetiva | Baixa |
| Reduzir viés de leitura estimada e medir acerto contra leitura real seguinte | 6.4 | 85.536 estimadas na janela atual | não quantificado; nenhum ganho atribuído | efeito líquido entre janelas ainda não medido | Baixa |

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

Todas rodam no SQLite (`v_energy.db`) com as janelas fixas da seção 2. Os resultados de D1 e C0 a C5 foram obtidos no banco real em 28/10/2026 (um script de leitura roda todas: `rodar_consultas_receita.py`). C6 a C9 foram obtidos no mesmo dia.

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

Esta tabela detecta apenas queda de índice sem rollover ou troca de medidor; não substitui as irregularidades confirmadas nas inspeções de campo.

```sql
SELECT COUNT(DISTINCT id_uc)              AS ucs_com_anomalia,
       COUNT(*)                           AS leituras_anomalas,
       ROUND(SUM(ABS(diferenca_leitura_kwh)), 0) AS kwh_inexplicados
FROM fato_anomalia_leitura;
```

**Resultado** (banco real, 28/10/2026): 0 UCs com anomalia e 0 leituras anômalas. A tabela `fato_anomalia_leitura` está vazia.

**C2c: irregularidades confirmadas nos quatro bairros (seções 1, 6.2 e 6.5)**

```sql
SELECT
  COUNT(*) AS irregularidades_confirmadas,
  SUM(CASE WHEN u.bairro IN ('IPUTINGA', 'MACAXEIRA', 'JARDIM JORDAO', 'PRAZERES')
           THEN 1 ELSE 0 END) AS irregularidades_nos_quatro_bairros,
  ROUND(100.0 * SUM(CASE WHEN u.bairro IN ('IPUTINGA', 'MACAXEIRA', 'JARDIM JORDAO', 'PRAZERES')
                         THEN 1 ELSE 0 END) / COUNT(*), 1) AS percentual_nos_quatro_bairros
FROM fato_inspecoes_perdas i
JOIN dim_unidade_consumidora u ON u.id_uc = i.id_uc
WHERE i.irregularidade_constatada = 1;
```

**Resultado** (banco real, 29/10/2026): 871 irregularidades confirmadas; 828 nos quatro bairros (95,1%).

**Reconciliação da queda individual ≥40%:** a contagem divulgada de 887 não tem consulta ou definição de janela versionada. Na reconstrução dos CSVs brutos com uma aproximação local das regras atuais da Silver, considerando UCs sem GD atual nos quatro bairros e as janelas maio/2024–abril/2025 e maio/2025–abril/2026, o resultado foi 888 ao comparar os totais de kWh e 890 ao comparar médias mensais dos meses disponíveis. Exigindo 12 meses observados em ambas as janelas, o resultado foi 880. Como a origem do 887 não foi localizada e os critérios produzem populações diferentes, não tratar nenhuma dessas contagens como reproduzida no banco Gold até validar a consulta e a regra de completude.

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

**Resultado** (banco real, 28/10/2026):

| Ano da conexão | Classe | UCs | Potência média (kW) | Potência máxima (kW) |
|---|---|---|---|---|
| 2024 | COMERCIAL | 207 | 79,1 | 5.911,6 |
| 2024 | RESIDENCIAL | 1.638 | 76,3 | 8.908,7 |
| 2025 | COMERCIAL | 130 | 33,6 | 75,0 |
| 2025 | RESIDENCIAL | 1.174 | 73,8 | 8.994,9 |
| 2026 | COMERCIAL | 46 | 33,9 | 75,0 |
| 2026 | RESIDENCIAL | 315 | 48,8 | 6.529,1 |

Nenhuma UC ligou a GD antes de 2024, então a janela base (2022-07 a 2023-06) é anterior a toda a GD.

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

**Resultado** (banco real, 28/10/2026): das 44.741 UCs mantidas, 103 têm menos de 12 faturas na janela base e nenhuma tem menos de 12 na janela atual.

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

**Resultado** (banco real, 28/10/2026): consumo mensal (kWh) das UCs sem GD nos quatro bairros, comparando cada mês com o mesmo mês de 2024. O número de UCs quase não muda no período (por exemplo, Iputinga vai de 1.109 a 1.123).

| Bairro | abr/2025 | mai/2025 | jun/2025 | jul/2025 |
|---|---|---|---|---|
| IPUTINGA | -1,2% | -6,9% | -13,2% | -13,5% |
| JARDIM JORDAO | -0,2% | -10,4% | -20,5% | -18,6% |
| MACAXEIRA | +1,8% | -10,4% | -13,0% | -17,3% |
| PRAZERES | 0,0% | -11,4% | -17,5% | -21,2% |

Até abril de 2025 o consumo repete o de 2024, com a mesma sazonalidade. A partir de maio de 2025 cai de uma vez, nos quatro bairros ao mesmo tempo, e fica abaixo da curva anterior até junho de 2026 (a série completa tem 48 meses por bairro).


**C9: alimentador e subestação dos quatro bairros (causa 6.5)**

Ver se os quatro bairros compartilham a rede, e quanto cada alimentador caiu.

```sql
WITH por_uc AS (
  SELECT f.id_uc,
         SUM(CASE WHEN f.competencia BETWEEN '2024-05' AND '2024-12' THEN f.consumo_faturado_kwh END) AS kwh_2024,
         SUM(CASE WHEN f.competencia BETWEEN '2025-05' AND '2025-12' THEN f.consumo_faturado_kwh END) AS kwh_2025
  FROM fato_faturamento f
  GROUP BY f.id_uc
)
SELECT u.subestacao, u.alimentador, u.bairro, u.municipio,
       COUNT(*)                                      AS ucs,
       ROUND(SUM(p.kwh_2025) - SUM(p.kwh_2024), 0)   AS variacao_kwh,
       ROUND(100.0 * (SUM(p.kwh_2025) - SUM(p.kwh_2024)) / SUM(p.kwh_2024), 1) AS variacao_pct
FROM por_uc p
JOIN dim_unidade_consumidora u ON u.id_uc = p.id_uc
WHERE p.kwh_2024 IS NOT NULL AND p.kwh_2025 IS NOT NULL
  AND COALESCE(u.possui_gd, 0) = 0
GROUP BY u.subestacao, u.alimentador, u.bairro, u.municipio
HAVING COUNT(*) >= 30
ORDER BY variacao_pct
LIMIT 25;
```

**Resultado** (banco real, 28/10/2026): variação do consumo de mai a dez/2025 contra mai a dez/2024, UCs sem GD, grupos com 30 UCs ou mais. A coluna `subestacao` está vazia em todas as linhas.

| Alimentador | Bairro | Município | UCs | Variação kWh | Variação % |
|---|---|---|---|---|---|
| ALM-JAB-014 | PRAZERES | JABOATAO DOS GUARARAPES | 320 | -173.472 | -18,6 |
| ALM-JAB-007 | JARDIM JORDAO | JABOATAO DOS GUARARAPES | 996 | -443.274 | -17,0 |
| ALM-JAB-013 | PRAZERES | JABOATAO DOS GUARARAPES | 304 | -129.564 | -16,9 |
| ALM-REC-027 | MACAXEIRA | RECIFE | 278 | -133.471 | -14,8 |
| ALM-REC-028 | MACAXEIRA | RECIFE | 246 | -134.684 | -14,3 |
| ALM-REC-024 | IPUTINGA | RECIFE | 1.119 | -526.886 | -13,5 |
| ALM-REC-013 | CACOTE | RECIFE | 76 | -14.952 | -5,2 |
| ALM-REC-024 | IPSEP | RECIFE | 92 | -8.595 | -2,8 |

As demais 18 linhas do top 25 ficam entre -4,2% e -1,6%. Os seis alimentadores dos quatro bairros caem de 13,5% a 18,6%, e o resto da lista cai bem menos (até 5,2%). O alimentador ALM-REC-024 atende Iputinga (-13,5%) e também IPSEP (-2,8%), então uma falha no alimentador não explicaria sozinha a queda.


**Limites e premissas**

- Receita por `valor_total_rs` e volume por `consumo_faturado_kwh`, conforme o contrato e as métricas da tela. O volume representa o que foi faturado; não mede a geração ou a injeção solar física.
- Banco real conferido em 28/10/2026: 2.152.336 faturas, nenhuma sem UC no cadastro, 6.329 sem consumo, nenhum par UC e competência com mais de uma fatura, 5 classes (COMERCIAL, INDUSTRIAL, PODER PUBLICO, RESIDENCIAL, RURAL) e 14 municípios.
- `possui_gd` é o estado atual da UC, não o da época de cada janela.
- A contagem de 887 UCs com queda ≥40% não foi reproduzida. A reconstrução independente nos CSVs brutos variou entre 880 e 890 conforme a regra de completude e o denominador; consultar a nota C2c. Só os 828 de 871 registros de inspeção nos quatro bairros estão reproduzidos por consulta direta à Gold.
- A conta de até R$ 2,01 mi para os quatro bairros é um limite de receita em jogo calculado com as tarifas-base por classe; não é economia, recuperação observada nem previsão garantida.
- Os R$ 7,45 mil/ano da fila são retorno esperado para a fila real de 2026-06; a configuração de demonstração `LOSS_REFERENCE_COMPETENCIA=2025-09` produz outra fila.
- A coluna `subestacao` de `dim_unidade_consumidora` está vazia no banco real; só o `alimentador` está preenchido.
- A tela pode limitar a lista de bairros retornados pela API; este documento não usa a lista truncada como fonte de totais.
- Uma fatura por UC por competência (usada no ticket médio).
- Os valores de DEC/FEC e qualquer limite de referência são só comparativos; **não** são multas nem violações regulatórias reais (glossário do case).
- Satisfação do cliente está na escala de 1 a 5 (ADR-001), não de 0 a 10.

**Fontes dos números:** tela `/revenue` (Célio), pipeline Gold e arquivos brutos (Renan e Ryei), fila e decisões de perdas (Adrian). Evidências sem consulta versionada estão identificadas como tal acima.
