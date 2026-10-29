# Decisões e suposições: Gestão de Perdas e Fila de Fiscalização (Fatia 05)

Dono: Adrian César. Formato: decisão, impacto e como garantir conformidade (ver `DECISOES.md`).

Os números abaixo foram medidos nos dados brutos do case (`base_dados_1.zip` e `base_dados_2.zip`), com o código
da própria fatia. Os scripts de medição **não estão versionados**: o método de cada número está descrito junto
dele para que possa ser refeito. As taxas e os limiares ficam em `backend/app/features/loss_management/scoring.py`.

## 1. Números que sustentam as decisões

| Medida | Valor | Como foi obtido |
|---|---|---|
| Inspeções de campo | 1.389 (2025-08-01 a 2025-12-31, 3 abas) | `inspecoes.xlsx` |
| Taxa geral de acerto | **62,7%** (871 irregulares, 518 regulares) | "pouco mais da metade" do gerente é uma aproximação |
| Queda >= 50% do consumo, sem GD | **92,6%** (770 inspeções) | sinal reconstruído no mês anterior à inspeção |
| Queda < 50%, sem GD | 26,4% (584 inspeções) | idem |
| UC com geração distribuída (GD) | **3,2%** (31 inspeções) | idem |
| Leitura com consumo zero | **nenhuma** nos 2,1 milhões de leituras | contagem direta |

Acerto por faixa de queda, sem GD (1.354 inspeções): até 0% = 10,4%; 0 a 20% = 6,8%; 20 a 40% = 14,7%;
**40 a 50% = 64,9%**; 50 a 60% = 92,9%; 60 a 80% = 92,5%. Não há inspeção com queda acima de 80%.

Método do sinal: para cada inspeção, a janela recente são as 3 competências anteriores ao mês da inspeção e a base
são as 12 anteriores a elas, com as leituras já tratadas (D5). Inspeções sem 15 meses de histórico ficam de
fora (1.385 de 1.389 entram).

## 2. Decisões da fila

### D1. A fila ordena pelo kWh esperado, não só pelo kWh
- **Decisão:** prioridade = kWh estimado a recuperar x taxa histórica de acerto do sinal. O score de risco só
  desempata. O gerente pediu "da mais promissora para a menos promissora" e lembrou que "cada inspeção que não
  encontra nada é um dia de equipe perdido".
- **Impacto:** a tabela mostra a coluna "Chance de acerto". Ordenar pelo produto `score x kWh` contava a queda duas
  vezes, porque os dois crescem com ela; a taxa de acerto não cresce com a queda.
- **Conformidade:** testes em `test_loss_management_service.py` (ordem pelo produto e desempate pelo score).

### D2. Sinais e limiares
- **Decisão (atualizada em 2026-10-27, fila classificada):** UC entra na fila se o consumo médio das 3 últimas
  competências cair **20% ou mais** frente às 12 anteriores, ou se tiver leitura zerada. A queda de 50% ou mais é
  `queda_subita` (0,93); a de 20% a 50% é `queda_moderada`, com chance por faixa medida na Gold real: 0,42 de 30% a
  50% e 0,07 de 20% a 30%. Leitura zerada 0,627 (a taxa geral). A ordem da fila não mudou (kWh esperado = kWh a
  recuperar x chance), então a queda súbita segue no topo e o piso de 20% só amplia a lista. Em meses de queda
  generalizada da carteira (ex.: 2025-07 e 2025-09) o piso não seleciona e a lista fica com dezenas de milhares de
  UCs; o topo continua correto.
- **Decisão anterior (até 2026-10-27):** só a queda de 50% ou mais entrava; a fila em tempo real (2026-06) ficava
  vazia.
- **Impacto:** o limiar de 50% é **conservador**: a faixa de 40 a 50% já acerta 64,9%, quase a média geral, mas
  abaixo de 40% o acerto é de 15% ou menos. Baixar o limiar para 40% aumentaria a fila com UCs de acerto médio.
- **Suposição não verificada:** a taxa de **leitura zerada é uma suposição**. Esse sinal nunca ocorre nos dados do
  case, então não há como medi-lo. Ele vem da primeira versão da fila; o PDF não o menciona.
- **Conformidade:** as constantes têm comentário com a origem; remedir quando houver a Gold real (Fase 7).

### D3. UCs com geração distribuída ficam fora da fila
- **Decisão:** excluir UCs com GD. A queda de consumo delas é esperada (o painel abate o consumo faturado).
- **Impacto:** nas 31 inspeções em UCs com GD, o acerto foi de 3,2%, contra 92,6% nas UCs sem GD com queda de 50%
  ou mais. Sem a exclusão, a fila mandaria a equipe a UCs com pouquíssima chance de irregularidade.

### D4. UC já inspecionada não volta à fila
- **Decisão:** sai da fila a UC com ordem ativa, ordem concluída ou inspeção no histórico de campo dentro da janela
  de análise (15 meses). Ordem cancelada devolve a UC à fila.
- **Impacto:** evita repetir inspeção cujo sinal já foi verificado.

### D5. Leituras com consumo negativo são descartadas
- **Decisão:** a consulta ignora `consumo_kwh < 0`.
- **Impacto:** nos dados brutos, 8.016 leituras têm consumo negativo (1.334 com o sinal trocado, 6.215 em que a
  leitura retrocedeu, 378 sem padrão); o valor típico é cerca de **188 vezes** a mediana da UC, então `abs()` não
  conserta. Sem o descarte, **81 de 81** UCs da fila eram falsos positivos: o UC104779, que consome 10 a 11 mil kWh
  por mês, aparecia com `-11065` na última competência.
- **Conformidade:** `test_negative_readings_do_not_create_a_false_sudden_drop`. A limpeza completa é da Silver.

### D6. Capacidade da fila
- **Decisão:** o limite padrão é 200 UCs, a capacidade mensal citada pelo gerente ("mais de 200 inspeções por mês").

## 3. Energia a recuperar

### D7. kWh estimado = déficit mensal x 3 meses (suposição)
- **Decisão:** a energia a recuperar é `(consumo base - consumo recente) x 3`.
- **O que os dados mostram** (188 ordens irregulares da demonstração de `2025-08`): o recuperado foi em mediana
  **1,87 vez** o estimado (quartis 1,32 e 2,25) e a estimativa ficou abaixo do recuperado em 176 das 188 UCs. A
  correlação entre os dois é **0,87**.
- **Impacto:** a estimativa **serve para ordenar** a fila (correlação alta, e a ordem não muda com a escala), mas
  **subestima o valor absoluto**: os dados sugerem cerca de 5,6 meses em vez de 3. Mudar a constante
  `JANELA_RECUPERACAO_MESES` altera os kWh e R$ exibidos, não a ordem. Segue em 3 (valor da primeira versão); se
  a diretoria for citar valores absolutos, o time deve decidir se ajusta.
- **Limite da evidência:** uma única competência de referência e uma amostra de 188 UCs.

### D8. Tarifa média calculada da base de faturamento
- **Decisão:** o R$ a recuperar usa a tarifa média ponderada dos últimos 12 meses de `fato_faturamento`:
  `sum(valor_total_rs) / sum(consumo_faturado_kwh)`. Com a Gold real, 2025-07 a 2026-06 dá **R$ 0,7876/kWh**. A API
  expõe o valor e o período em `tarifa_rs_kwh`, o cálculo é guardado em cache por dia e não há tarifa de reserva: sem
  faturas no período, a fila responde com erro explícito em vez de usar um número inventado.
- **Alternativas descartadas:** a média simples de `tarifa_aplicada_rs_kwh` (0,774) não pondera pelo consumo, e
  `valor_energia_rs / consumo_faturado_kwh` (0,561) ignora os tributos que o cliente paga. As constantes antigas
  (0,85 e 0,714) saíram do código.
- **Impacto:** o R$ é uma estimativa (o PDF pede a energia em kWh) e muda quando a base de faturamento muda. O painel
  do diretor usa a mesma tarifa, então os dois valores coincidem.

## 4. Dados e demonstração

### D9. A fila da competência mais recente (2026-06) é curta: 165 UCs, só 19 de chance alta
- **Decisão:** manter a regra de tempo real e oferecer a configuração opcional `LOSS_REFERENCE_COMPETENCIA`. A tabela
  abaixo é de antes da fila classificada (D11), quando o piso era a queda de 50%; hoje a fila de 2026-06 tem 165 UCs.
- **Funil de 2026-06** (`v_energy.db` real, conferido em 2026-10-28):

| Etapa | UCs |
|---|---|
| Cadastro (todas com medição na janela) | 45.000 |
| Queda de consumo de 20% ou mais (3 últimos meses contra os 12 anteriores) | 1.823 |
| Sem as UCs com GD (1.167, incluindo as 559 quedas de 50% ou mais) | 656 |
| Sem as UCs inspecionadas desde 2025-04 (491) | **165** |

  Quedas de 10% a 20% são 14.295 UCs e ficam fora: o sinal acerta 7% ou menos. As UCs fora da fila não estão
  "limpas": só não têm um sinal que o histórico mostre que acerta.
- **Impacto:** com os dados limpos, a onda de quedas foi em meados de 2025 e já foi inspecionada (a equipe saiu a
  campo de agosto a dezembro). Com a referência fixada, a fila é calculada com os dados até aquele mês, e só as
  inspeções feitas até o fim dele excluem a UC. A tela mostra o aviso "Competência de referência fixada".
- **Evidência na Gold real** (`v_energy.db`, conferida em 2026-10-27: a fila de cada mês e o que as inspeções reais
  acharam nos 3 meses seguintes):

| Referência | UCs na fila | Inspecionadas depois | Acerto | Top 200 inspecionadas | Acerto do top 200 |
|---|---|---|---|---|---|
| 2025-06 | 3 | 0 | n/a | 0 | n/a |
| 2025-07 | 827 | 300 | 94,0% | 129 | 94,6% |
| 2025-08 | 773 | 369 | 94,9% | 155 | 96,8% |
| 2025-09 | 590 | 492 | 91,5% | 197 | 93,9% |
| 2025-10 | 352 | 336 | 90,8% | 197 | 92,9% |
| 2025-11 | 71 | 70 | 90,0% | 70 | 90,0% |
| 2026-06 | 0 (165 com a fila classificada) | 0 | n/a | 0 | n/a |

  A API limita a consulta a 500 UCs; "UCs na fila" é o `total`. Na fila de 2026-06 há 559 quedas ≥ 50%, todas em UCs
  com GD (conectadas entre 2025-06 e 2026-04), que a regra exclui. O acerto vale para UCs que o campo já inspecionava
  com esse padrão (497 das 500 primeiras de 2025-07 foram inspecionadas depois): é a taxa histórica de acerto, e não
  prova que a regra ache irregularidades em UCs que ninguém inspecionou.
- **Medição anterior (banco de simulação, substituída pela tabela acima):** 2025-06: 354 UCs, 93,5%; 2025-08: 594
  UCs, 93,1%; 2025-10: 323 UCs, 94,8%. Os acertos são parecidos, mas a onda de quedas da Gold real começa mais tarde.

- **Demonstração de ponta a ponta** (`2025-08`, banco de simulação local): fila de 200 UCs, 200 ordens geradas,
  exportação de 200 linhas e upload do `inspecoes.xlsx` real com **198 conciliadas, 188 irregulares (94,9%)**.
- **Limite da evidência:** o acerto do top 200 mostra que o sinal funciona, o que já se sabia (92,6%). Não prova
  que a ordem dentro do top 200 seja melhor que a de fora, porque quase toda a fila tem queda de 50% ou mais.

### D10. Datas e planilha do campo
- **Decisão:** em datas com hífen (`NN-NN-AAAA`) o formato é **mês-dia-ano**; com ponto ou barra, dia-mês-ano.
  Nos dados reais, 33 das 46 datas com hífen têm o segundo número maior que 12 e nenhuma tem o primeiro.
- **Decisão:** o upload aceita a planilha exportada pelo portal (conciliada pelo `id_inspecao`) e a planilha do
  campo (`id_inspecao` como `IN0000007`, colunas `data`, `resultado`, `inspetor`), conciliada pela **ordem ativa da
  UC**. Normalização do resultado, da data e dos decimais cobre as 1.389 linhas reais.
- **Risco aceito:** casar pela UC conclui a ordem ativa mesmo se a planilha trouxer o resultado de uma inspeção
  antiga. A planilha do portal não tem esse risco. Rejeitar datas anteriores à criação da ordem quebraria a
  demonstração, porque as inspeções são de 2025.

### D11. A fila aparece em duas faixas pela chance de acerto
- **Decisão:** a tela separa a fila em abas acima da tabela: **Prioritárias** (chance de acerto de 30% ou mais, aba
  inicial), **Baixa chance** (abaixo de 30%) e **Todas**, cada uma com a contagem. Aba sem UC fica desligada, e a
  tela abre na primeira que tem UC. Uma versão anterior recolhia a baixa chance atrás de um botão no fim da lista;
  foi trocada porque o usuário não descobria as outras UCs sem rolar a página. O corte
  (`PRIORITY_MIN_HIT_PROBABILITY`) fica entre as taxas medidas: 7% (queda de 20% a 30%) e 42% (30% a 50%). A ordem
  dentro de cada aba é a do backend (kWh esperado). "Selecionar top 10 prioritárias" escolhe só entre as
  prioritárias, em qualquer aba. A seleção vale entre abas.
- **O que os dados mostram (2026-06, `v_energy.db` real):** a fila tem **165 UCs**, todas `queda_moderada`: 19 com
  42% e 146 com 7%. Não há queda abrupta (≥ 50%) nem leitura zerada. As 1.358 UCs já inspecionadas saem da fila:
  das 656 candidatas com queda de 20% ou mais, 491 foram inspecionadas em 2025-08 a 2025-12.
- **Taxas conferidas no ponto do tempo** (queda calculada até o mês anterior à inspeção, 1.385 inspeções): 7% (12 de
  161) para 20% a 30%, 42% (132 de 314) para 30% a 50% e 91% (713 de 780) a partir de 50%. Medir com a queda de hoje
  dá 93% na faixa de 20% a 30%, mas é viés de olhar para o futuro: não usar.
- **Sinais testados e não adotados:** consumo frente à mediana das UCs da mesma classe e alimentador, e leituras
  estimadas nos 3 meses anteriores. Entre as 130 inspeções com queda abaixo de 20% (11 irregularidades), nenhum
  separa as irregulares. Faltam exemplos de UCs que o campo nunca visitou, então só um **piloto de inspeção** em
  uma amostra de fora da fila valida um sinal novo.
- **Em aberto:** depois de quanto tempo uma UC com irregularidade constatada volta à fila (reincidência).

## 5. Limitações e pendências

- A **Gold real** (Renan e Ryei) ainda não está no `v_energy.db`: todos os números de fila vêm de um banco de
  simulação feito a partir das bases brutas, com tratamento mínimo. Remedir na Fase 7.
- `data_inspecao` do upload é validada e **não é gravada**, e o id externo (`IN...`) também não: a ordem não tem as
  colunas.
- A taxa de leitura zerada, a tarifa fixa e o fator de 3 meses são suposições, listadas acima.
- Problemas de qualidade encontrados que **não são desta fatia**, para a Silver: 21.523 leituras duplicadas
  exatas, 8.609 pares (UC, mês) repetidos com id `LTX...` e outro medidor, cerca de 24 mil `leitura_anterior`
  ausentes, 900 UCs duplicadas no cadastro e uma linha de cabeçalho repetida dentro do arquivo.
- A tela de upload com mais de mil recusas não foi avaliada no navegador.