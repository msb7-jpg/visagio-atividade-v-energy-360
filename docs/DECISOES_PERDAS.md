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
  `queda_subita` (0,93); a de 20% a 50% é `queda_moderada`. **Atualização de 2026-10-28:** a chance da queda moderada
  não depende mais da faixa de queda bruta (0,42 e 0,07), e sim da queda descontada a queda geral da carteira (D12):
  0,915 quando a queda normalizada é de 20% ou mais e 0,076 abaixo disso. Leitura zerada 0,627 (a taxa geral). A ordem da fila não mudou (kWh esperado = kWh a
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
  `JANELA_RECUPERACAO_MESES` altera os kWh e R$ exibidos, não a ordem. O cartão "Energia recuperável das selecionadas"
  mostra essa razão de 1,87× como nota, sem alterar o número exibido. Segue em 3 (valor da primeira versão); se
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
  (`PRIORITY_MIN_HIT_PROBABILITY`) fica entre as taxas medidas. Até 2026-10-28 eram 7% (queda de 20% a 30%) e 42% (30%
  a 50%); com a queda normalizada (D12) passam a ser 7,6% e 91,5%, e o corte de 30% continua entre elas. A ordem
  dentro de cada aba é a do backend (kWh esperado). "Selecionar top 10 prioritárias" escolhe só entre as
  prioritárias, em qualquer aba. A seleção vale entre abas.
- **O que os dados mostram (2026-06, `v_energy.db` real):** a fila tem **165 UCs**, todas `queda_moderada`: 31 com
  91,5% e 134 com 7,6% (até 2026-10-28, com a queda bruta, eram 19 com 42% e 146 com 7%). Não há queda abrupta (≥ 50%) nem leitura zerada. As 1.358 UCs já inspecionadas saem da fila:
  das 656 candidatas com queda de 20% ou mais, 491 foram inspecionadas em 2025-08 a 2025-12.
- **Taxas conferidas no ponto do tempo** (queda calculada até o mês anterior à inspeção, 1.385 inspeções): 7% (12 de
  161) para 20% a 30%, 42% (132 de 314) para 30% a 50% e 91% (713 de 780) a partir de 50%. Medir com a queda de hoje
  dá 93% na faixa de 20% a 30%, mas é viés de olhar para o futuro: não usar.
- **Sinais testados e não adotados:** consumo frente à mediana das UCs da mesma classe e alimentador, e leituras
  estimadas nos 3 meses anteriores. Entre as 130 inspeções com queda abaixo de 20% (11 irregularidades), nenhum
  separa as irregulares. Faltam exemplos de UCs que o campo nunca visitou, então só um **piloto de inspeção** em
  uma amostra de fora da fila valida um sinal novo.
- **Em aberto:** depois de quanto tempo uma UC com irregularidade constatada volta à fila (reincidência).

### D12. Remedição dos sinais na Gold real (2026-10-28)
- **Método:** para cada uma das 1.385 inspeções avaliáveis (agosto a dezembro de 2025), a queda de consumo é calculada
  no ponto do tempo: os 3 meses anteriores ao mês da inspeção contra os 12 meses antes deles, sem leituras
  negativas. É o mesmo cuidado de D11 contra o viés de olhar para o futuro.
- **GD (D3) confirmado:** 1 irregularidade em 31 inspeções em UCs com GD (3,2%), em qualquer faixa de queda. A
  exclusão de UCs com GD continua.
- **Queda de 50% ou mais (D2) confirmada:** 92,6% (713 de 770) nas UCs sem GD.
- **Leitura zerada não é mensurável:** a Gold real não tem nenhuma leitura com consumo zero nem negativo
  (0 linhas em 2.152.336). O motivo `leitura_zerada` nunca dispara hoje, e a taxa de 62,7% que ele usa é a geral, sem
  medição própria.
- **Reincidência não é mensurável:** as 1.389 inspeções são de 1.389 UCs diferentes. Nenhuma UC foi inspecionada duas
  vezes, então não há dado para definir o prazo em que uma UC volta à fila depois de uma irregularidade.
- **A queda geral da carteira muda a leitura das faixas.** A mediana de `consumo recente / base` de todas as UCs foi
  0,75 (ago), 0,62 (set), 0,61 (out), 0,74 (nov) e 1,02 (dez/2025): em meados de 2025 a carteira inteira caiu. Medida
  contra a mediana do mês (queda normalizada = 1 − razão da UC / mediana), a separação das inspeções, sem GD, é muito
  maior:

| Faixa de queda | Bruta | Normalizada pela mediana do mês |
|---|---|---|
| menos de 10% | 8,0% (8 de 100) | 8,0% (35 de 440) |
| 10% a 20% | 12,0% (3 de 25) | 6,7% (1 de 15) |
| 20% a 30% | 7,8% (12 de 154) | 88,9% (16 de 18) |
| 30% a 50% | 43,0% (131 de 305) | 92,8% (467 de 503) |
| 50% ou mais | 92,6% (713 de 770) | 92,1% (348 de 378) |

  A queda normalizada de 20% ou mais acerta de 89,8% a 94,3% em cada um dos 5 meses; abaixo de 20% acerta de 6,5% a
  9,3%. A bruta mistura meses de queda geral, e é por isso que a faixa de 30% a 50% parece valer só 42%.
- **Efeito na fila de 2026-06:** a mediana da carteira é 0,918 (sem queda geral). Das 165 UCs da fila, **31** têm queda
  normalizada de 20% ou mais (chance histórica de cerca de 92%) e **134** não têm (cerca de 8%). A classificação atual
  (19 UCs a 42% e 146 a 7%) subestima 12 das 31 UCs fortes e superestima parte das 19.
- **Limites:** os acertos são de UCs que o campo já escolhera inspecionar; nenhuma UC de fora da fila foi inspecionada,
  então a medição não diz o que a fila deixa de ver. Cada mês é uma amostra independente, mas não há um período de
  teste separado.
- **Decisão implementada (2026-10-28):** a chance de acerto da `queda_moderada` passa a usar a queda normalizada.
  Medido só na população da fila (sem GD, queda bruta de 20% a 50%): **91,5%** (118 de 129) com queda normalizada de
  20% ou mais e **7,6%** (25 de 330) abaixo. A regra de entrada na fila não mudou (queda bruta de 20% ou mais), então
  a lista, a energia recuperável e os números do Painel do Diretor continuam iguais; muda a chance de cada UC, a
  ordem e o retorno esperado. A mediana da carteira (recente/base de todas as UCs, inclusive as com GD e as já
  inspecionadas) é calculada na API e guardada em cache por dia (`portfolio_repository.py`).
- **Resultado na fila de 2026-06 (mediana 0,918):** as mesmas 165 UCs, agora 31 a 91,5% e 134 a 7,6%. O retorno
  esperado da fila inteira subiu de cerca de 908 para cerca de 2.046 kWh/mês. **Corrigido em 2026-10-29 pelo D14:** 25
  das 31 eram ligações recentes sem taxa medida; a fila forte real tem 7 UCs e o retorno esperado cai para cerca de 788.
- **Não confundir com o sinal já descartado em D11:** aquele comparava a UC com a mediana das UCs da mesma classe e
  alimentador. A normalização aqui compara com a carteira inteira no mesmo período.
- **Cautela:** a maior parte das UCs com queda normalizada alta na população da fila vem de agosto e dezembro de 2025
  (nos meses de queda geral quase toda queda bruta passa de 50%). A taxa de 91,5% segue sendo histórica de UCs que o
  campo já escolhera inspecionar.

### D13. Piloto de inspeção fora da fila (protocolo proposto, não executado)
- **Por que:** todas as taxas de acerto vêm de UCs que o campo já escolhera inspecionar. Ninguém de fora da fila foi
  visitado, então não se sabe o que a fila deixa de ver. Só inspecionar uma amostra de fora mede isso, e é o único
  jeito de aprovar um sinal novo (D11 e D12).
- **Estratos de 2026-06** (`v_energy.db` real, sem GD e sem inspeção desde 2025-04, 40.128 UCs; queda normalizada = D12):

| Estrato | Definição | UCs |
|---|---|---|
| A | na fila, queda bruta e normalizada de 20% ou mais | 31 |
| B | na fila, queda bruta de 20% ou mais e normalizada abaixo | 134 |
| D | fora da fila, queda normalizada de 10% a 20% | 459 |
| E | fora da fila, queda normalizada abaixo de 10% | 39.504 |

- **Amostra proposta (cerca de 150 inspeções, uma parte da capacidade de mais de 200 por mês):** as 31 UCs de A (a
  fila forte, que o campo visitaria de qualquer forma), 40 sorteadas de B, 40 de D e 40 de E, sorteio aleatório simples
  dentro de cada estrato e com semente registrada.
- **Ligações recentes (D14):** 35 UCs da fila têm menos de 11 meses de base e recebem a taxa fraca sem medição. O
  piloto deve incluir cerca de 20 delas, em estrato à parte (`PILOTO-L`), para medir o que valem de fato.
- **O que cada estrato responde:**
  - A confirma os 91,5%. B mede de novo o 7,6% com UCs que o campo não escolheu (hoje a taxa vem de UCs escolhidas).
  - D e E medem a taxa de quem a fila ignora. Com 40 inspeções e nenhuma irregularidade, o limite superior de 95% é de
    cerca de 7,5% (regra dos três); com 3 irregularidades, a taxa fica entre cerca de 2% e 20%.
- **Critério de decisão:** se D ou E ficarem acima de B (cerca de 7,6%) ou chegarem a 15% ou mais, o sinal de queda
  de consumo está cego a esse grupo e a regra de entrada precisa de um sinal novo (por exemplo, leituras estimadas ou
  comparação com vizinhos, já descartados na base atual). Se D e E ficarem abaixo de B, a exclusão está validada.
- **Como registrar:** ordens normais, com o motivo `PILOTO-A`, `PILOTO-B`, `PILOTO-D` ou `PILOTO-E` (o campo `motivo`
  aceita texto livre) e resultado pelo fluxo de sempre; a análise é uma consulta sobre `ordem_inspecao`. Sem código novo.
- **Dependência:** autorização do gerente de perdas e da equipe de campo (pendência 12.2 do checklist). Mandar a
  equipe a UCs sem sinal é um custo real, por isso o piloto é pequeno e fica fora da entrega de 04/11.

### D14. Histórico mínimo: ligação recente não recebe a chance medida (2026-10-29)
- **Como apareceu:** a UC106967 (Iputinga), a primeira da fila, mostrava "309 → 212 kWh/mês, −31%", e o gráfico do
  detalhe começava em 307 e terminava em 158. Os números estavam certos (a tabela usa médias, o gráfico usa meses
  isolados), mas a UC foi ligada em 24/12/2025 e só tem 6 leituras: a "base de 12 meses" eram 3 meses. A conferência
  das 165 UCs contra uma conta independente no banco não achou nenhuma divergência de cálculo.
- **O que os dados mostram:** 38.628 UCs têm 12 meses de base, 6.304 têm 11 (um mês faltando na limpeza) e cerca de
  90 têm menos. Na fila de 2026-06, 58 das 165 UCs têm menos de 12 meses e **25 das 31** UCs fortes eram assim. Das
  1.358 UCs sem GD que o campo inspecionou, só 7 tinham menos de 11 meses de base: a taxa de 91,5% (D12) foi medida
  em UCs com histórico completo e não vale para ligações recentes.
- **Decisão:** exigir `MESES_BASE_MINIMO` = 11 meses de leitura na janela de base para receber a chance medida. Abaixo
  disso a UC continua na fila, mas a chance não passa da taxa fraca (7,6%, `TAXA_ACERTO_HISTORICO_CURTO`), a linha da
  tabela diz "Ligação recente: base de N meses" e a frase do detalhe avisa que a chance medida não se aplica. A
  energia a recuperar não muda.
- **Efeito na fila de 2026-06:** as mesmas 165 UCs, agora **7 fortes** (6 com 12 meses de base e 1 com 11) e **158
  fracas** (35 delas ligações recentes). O retorno esperado da fila inteira cai de cerca de 2.046 para cerca de 788
  kWh/mês. É o número honesto: o resto era extrapolação.
- **Limite:** a taxa fraca para ligação recente é uma escolha prudente, não uma medição. Só um piloto de inspeção
  (D13, estrato de ligações recentes) diz quanto elas realmente valem. O `data_ligacao` existe no dado bruto
  (`unidades_consumidoras.csv`) e não chegou à `dim_unidade_consumidora`; contar os meses de leitura dispensa a coluna.

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