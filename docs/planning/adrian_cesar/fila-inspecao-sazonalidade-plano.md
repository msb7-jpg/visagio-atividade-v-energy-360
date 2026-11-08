# Fila de Inspeção: sazonalidade, pares e "quantas inspecionar" (plano)

Dono: Adrian César (Fatia 05). Plano de 2026-11-08, resultado de uma rodada de perguntas e respostas sobre a lógica
da fila. A decisão resumida é a D16 de [`docs/DECISOES_PERDAS.md`](../../DECISOES_PERDAS.md). Os termos estão no
[`GLOSSARY.md`](../../../GLOSSARY.md). Branch: `feat/fatia-05-fila-sazonalidade`.

## Problema

O consumo médio da base é 59% maior em janeiro (494 kWh) do que em julho (310 kWh). A fila compara os 3 meses
recentes com a média dos 12 anteriores, então no inverno quase toda UC "cai". O código corrige isso só na chance de
acerto, com a mediana global da carteira (`portfolio_ratio`). A entrada na fila (queda bruta de 20%) e o déficit em kWh
ainda usam a queda bruta. A mediana global é praticamente a do residencial (85% das UCs), e a sazonalidade depende da
classe (o industrial varia muito menos que o residencial), então ela corrige demais as outras classes.

## Decisões

| # | Decisão |
|---|---|
| 1 | Sem teto de 200. A fila mostra as UCs que valem a pena e o usuário escolhe quantas inspecionar. |
| 2 | A lógica nova só substitui a atual se ganhar no backtest, validado deixando um mês de fora de cada vez. |
| 3 | Vocabulário: Prioridade, Chance de acerto, kWh esperado, Sinal, Pares, Queda relativa aos pares. O "score de risco" sai da tela. |
| 4 | Tela: campo "quantas inspecionar" (N), curva de retorno acumulado e custo por inspeção opcional que marca o corte sugerido. O card de capacidade de 200 sai. |
| 5 | Sazonalidade por comparação com os pares (mesma classe), aplicada na entrada, no déficit e na chance. |
| 6 | Pares só por classe, com mínimo de 100 UCs. Município e faixa de consumo só entram se o backtest provar ganho. |
| 7 | A chance de acerto vira uma curva suave. Industrial, rural e poder público usam a curva geral, marcada "sem medição própria". |
| 8 | O déficit × 3 meses continua, ajustado pela sazonalidade. Depois se compara o multiplicador com o `kwh_recuperado` real. |
| 9 | Piso de entrada: queda relativa aos pares de 20%, com leitura zerada sempre entrando. O backtest testa 10, 15, 20 e 30. |

## Fases

Cada fase começa pelo teste que falha e termina com `make lint-all` e `make test-all`.

| Fase | Entrega | Arquivos principais | Prova |
|---|---|---|---|
| 0 | Linha de base: backtest atual (5 cortes, N = 50/100/200) e sazonalidade medida na base inteira | Só leitura | Números reproduzíveis |
| 1 | Mediana por classe no lugar da global; `peer_ratio` no perfil; parâmetro temporário `modelo=atual\|novo` no backtest | novo `peers.py`, `portfolio_repository.py`, `backtest_schemas.py` | Indústria e residência em julho; classe com menos de 100 UCs |
| 2 | Entrada e déficit pela queda relativa aos pares | `queue_query.py`, `scoring.py` | UC em queda sazonal normal não entra; queda real no inverno entra |
| 3 | Curva de chance (script de calibração fora de `app`, leave-one-month-out) e portão de decisão | novo `hit_curve.py`, `hit_rate.py` | Curva monótona; a nova ganha da atual nos meses de teste |
| 4 | Piso de entrada escolhido no backtest | parâmetro temporário | Tabela comparativa |
| 5 | Endpoint da curva de retorno e do corte sugerido; sai o 200 fixo do resumo | novo `queue_curve.py`, `router.py`, `schemas.py`, `queue_summary.py` | Corte sugerido; sem custo, sem corte |
| 6 | Tela: N, curva, custo, card "ordens abertas", textos "prioridade", limite jul–dez na Efetividade | `QueueActionsBar.tsx`, `useQueueSelection.ts`, novo `QueueReturnCurve.tsx`, `CapacityCard.tsx`, `lossTypes.ts` | N marca as N primeiras livres; curva com e sem custo |
| 7 | Documentação: D16, `regras-de-negocio.md`, `changelog.md`, glossário | Docs da fatia | — |
| 8 | Revisão de código, lint, testes e commit local (sem push) | — | Lint e testes 100% |

**Portão da Fase 3:** se a lógica nova não ganhar no teste, paro e conversamos antes de seguir. As Fases 5 e 6 valem
mesmo assim, porque não dependem do modelo.

## Linha de base (Fase 0, 2026-11-08)

Backtest da lógica **atual**, 5 cortes, banco aberto só para leitura. "Precisão" = irregulares ÷ inspecionadas entre as
N selecionadas; "base" = taxa de acerto de todas as inspeções da janela.

| Corte | Base | N=50 (insp. / precisão) | N=100 | N=200 | kWh recuperado (N=50 / 100 / 200) |
|---|---|---|---|---|---|
| 2025-07 | 64,9% | 34 / 97,1% | 58 / 98,3% | 120 / 94,2% | 243 mil / 334 mil / 484 mil |
| 2025-08 | 64,2% | 39 / 97,4% | 74 / 95,9% | 155 / 96,8% | 271 mil / 392 mil / 571 mil |
| 2025-09 | 62,7% | 50 / 92,0% | 99 / 92,9% | 196 / 93,9% | 288 mil / 433 mil / 601 mil |
| 2025-10 | 59,4% | 49 / 93,9% | 98 / 93,9% | 195 / 93,8% | 235 mil / 337 mil / 443 mil |
| 2025-11 | 60,5% | 32 / 90,6% | 67 / 91,0% | 139 / 90,6% | 129 mil / 178 mil / 242 mil |

Leituras que mudam o plano:
- A precisão atual já é de 90% a 98%. Como as taxas foram ajustadas nas mesmas inspeções, esse número é otimista, e a
  margem para a lógica nova ganhar em **precisão** é pequena. O ganho esperado está em **generalizar para o verão** e em
  **kWh recuperado**, e a validação leave-one-month-out é o que mede isso sem enganar.
- Em vários cortes só uma parte das N foi inspecionada pelo campo (32 de 50 em 2025-11; 120 de 200 em 2025-07). O
  backtest mede só o que o campo visitou.
- Sazonalidade na base inteira, consumo médio de janeiro ÷ julho: residencial 2,37; comercial 1,69; poder público 1,56;
  rural 1,43; industrial 1,13. Confirma a medida da amostra e que a classe define a amplitude.

## Ajuste do critério de sucesso (2026-11-08, depois da Fase 0)

A precisão atual está inflada, porque as taxas foram ajustadas nas mesmas inspeções que o backtest usa. Por isso:
1. **O portão da Fase 3 é uma comparação justa:** a lógica atual também é refeita com as taxas ajustadas em 4 cortes e
   testadas no quinto. A nova não pode ficar pior que ela e deve melhorar em kWh recuperado ou em consistência entre
   classes.
2. **Testes sintéticos de sazonalidade**, que o backtest não faz: indústria com queda real em julho entra na fila;
   residência com queda sazonal normal não entra.
3. **O limite do verão** (sem inspeções em jan–jun) fica declarado na documentação e na tela.

## Fases 1 e 2: efeito medido (2026-11-08)

**Backtest (`modelo=novo` contra `atual`), 5 cortes, N = 50/100/200:** praticamente igual no topo (±1 UC inspecionada,
kWh recuperado até 3% menor). O backtest não enxerga o efeito, porque nos cortes jul–nov o topo é dominado por quedas
fortes, que os dois modelos veem.

**O efeito está no tamanho e na composição da fila** (competência de referência; "prioritárias" = chance ≥ 30%):

| Competência | Carteira (recente÷base) | Fila atual | Fila com pares |
|---|---|---|---|
| 2025-07 | 0,749 | 34.193 UCs (33.102 residenciais), 930 prioritárias | 956 UCs, 931 prioritárias |
| 2025-09 | 0,611 | 39.243 UCs, 587 prioritárias | 577 UCs, 575 prioritárias |
| 2025-11 | 1,015 | 501 UCs | 581 UCs |
| 2026-01 | 1,324 | 7 UCs | 31 UCs |
| 2026-03 | 1,346 | 2 UCs | 32 UCs (22 prioritárias) |
| 2026-06 | 0,918 | 165 UCs, 7 prioritárias | 31 UCs, as mesmas 7 prioritárias |

Leituras:
- **Inverno:** a lógica atual põe a carteira inteira na fila (todo mundo "cai"). Com pares, só ficam as UCs que caíram
  além da classe, e as prioritárias continuam as mesmas.
- **Verão:** o consumo sobe cerca de 32% e quase ninguém tem queda bruta de 20%, então a fila atual quase some. Com
  pares, aparecem UCs que ficaram para trás num mês em que a classe subiu. Esta é a direção que o backtest (só
  jul–dez) não consegue validar com inspeções reais.
- **kWh/mês recuperável** cai muito (2025-07: de 1,80 milhão para 157 mil): o déficit atual contava a queda sazonal
  como energia a recuperar.
- **Ainda curta no verão e em 2026-06** (31 a 32 UCs): a Fase 4 testa o piso de 10 e 15%.
- **Pendência de coerência:** o detalhe da UC (`fetch_registered_unit`) e a aba "Fora da fila" ainda usam a queda
  bruta. Só importam quando o modelo novo virar o padrão.

## Fase 3: o que os dados dizem sobre a chance de acerto (2026-11-08)

Conjunto de calibração: 1.354 inspeções sem GD (ago–dez/2025), cada uma com o perfil da UC no corte (mês anterior) e a
queda relativa aos pares daquele mês. Nenhuma tem leitura zerada.

| Queda relativa aos pares | Inspeções | Acerto |
|---|---|---|
| menos de 5% | 397 | 7,3% |
| 5% a 20% | 58 | 12,1% |
| 20% a 30% | **2** | (50%, sem significado) |
| 30% a 40% | 91 | 93,4% |
| 40% a 50% | 367 | 92,6% |
| 50% a 70% | 439 | 92,3% |

- **A relação é um degrau, não uma curva.** Abaixo de 20% o acerto é de cerca de 8%; a partir de 30% é de cerca de
  92,5% e fica plano até 70%. A queda bruta, que o código usava, vai de 8% a 93% de forma gradual porque a
  sazonalidade borra a fronteira; contra os pares ela some.
- **Uma curva suave ajustada não é identificável:** não há inspeção entre 20% e 30%, e a taxa é plana acima disso.
- **Súbita e moderada não se distinguem** em queda relativa (93,4%, 92,6% e 92,3%), e a classe quase não pesa dentro
  de cada faixa (comercial 94% a 97%, residencial 92%; diferença de 1,7 desvios).
- **AUC:** queda bruta 0,907; contra a carteira 0,909; contra os pares 0,914. Os pares são os melhores, por pouco.
- **Estabilidade mês a mês (leave-one-month-out):** acerto "alto" (queda ≥ 30%) entre 90,3% e 94,3% e "baixo" (< 20%)
  entre 6,5% e 9,3%. Com 2 parâmetros e 1.354 inspeções não há sobreajuste a corrigir.
- **A faixa sem medição pesa na fila real.** UCs da fila com pares com queda relativa de 20% a 30%: 2025-07, 44 de
  956; 2025-11, 319 de 581; 2026-01, 15 de 31; 2026-03, 22 de 32; 2026-06, 29 de 31. Hoje o código dá a elas 91,5%.

## Fase 3: decisão e efeito da rampa (2026-11-08)

Decisão do dono da fatia: **rampa linear de 7,9% (em 20% de queda relativa) a 92,5% (em 30%)**, implementada em
`hit_curve.py` e usada só no modelo com pares. Súbita e moderada e a classe saem da chance, porque os dados não as
distinguem. A faixa de 20% a 30% continua sem medição: o piloto fora da fila (D13) é o que a mede.

Backtest do modelo novo com a curva contra o atual: igual no topo (±1 a 3 UCs inspecionadas, kWh ±1%; em 2025-11 com
N=200, 129 contra 126 irregulares). Prioritárias (chance ≥ 30%) na fila:

| Competência | Atual | Pares + degraus | Pares + rampa |
|---|---|---|---|
| 2025-07 | 930 | 931 | 926 |
| 2025-11 | 500 | 580 | 437 |
| 2026-03 | 2 | 22 | 18 |
| 2026-06 | 7 | 7 | 5 |

A rampa tira de "prioritária" as UCs cuja chance era suposição otimista (2025-11: 580 para 437). O portão da Fase 3
(não ficar pior, ganhar em consistência) passa. Falta a Fase 4: escolher o piso de entrada.

## Riscos

- O backtest só cobre jul–dez/2025: o verão não é validado.
- As taxas atuais (91,5% e 7,6%) foram medidas nas mesmas inspeções que o backtest usa, então o backtest atual é
  otimista. A validação sem vazamento corrige isso para a lógica nova.
- O backtest só mede UCs que o campo visitou: seleciona-se o que o campo já escolheria.
- `scoring.py` tem cerca de 290 linhas (teto de 300): a lógica nova vai em módulos separados.
- O filtro de entrada passa a depender da mediana de cada classe, calculada antes da consulta de candidatas e
  guardada em cache por dia.
- Mudar o código invalida o cache em disco do backtest.
- Industrial, rural e poder público somam 16 inspeções: a curva geral é suposição declarada.
- Os tipos do frontend são copiados à mão: a remoção da capacidade fixa exige ajuste em `lossTypes.ts`.

## Em aberto

- Faixas "Prioritárias" e "Baixa chance" (corte de 30%): mantidas até a curva existir.
- Valor padrão do custo por inspeção: vazio.
