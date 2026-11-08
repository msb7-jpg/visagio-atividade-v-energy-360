# Regras de negócio: Gestão de Perdas e Fila de Inspeção (Fatia 05)

Dono: Adrian César. Este arquivo é o **índice único das regras** da fatia, no estado do código em 2026-11-08.
Cada regra aponta para onde ela vive no código. O **porquê** e as medições estão em
[`docs/DECISOES_PERDAS.md`](../../DECISOES_PERDAS.md) (D1 a D15), citado entre parênteses. Se uma regra mudar,
atualize aqui, na decisão e no `changelog.md`.

Caminhos abaixo são relativos a `backend/app/features/loss_management/` (backend) e
`frontend/src/features/loss_management/` (frontend).

## 1. Quem pode fazer o quê

| Papel | Consulta fila, ordens e detalhe | Gera, atualiza, exporta CSV e envia planilha |
|---|---|---|
| Gerente de perdas | Sim | Sim |
| Diretor | Sim | Não (só leitura) |
| Demais papéis | Não | Não |

Fonte: `PERDAS_ACCESS` e `PERDAS_WRITE` em `app/shared/role_groups.py`; `router.py` aplica `require_role`. No
frontend, quem só consulta não vê os botões de gerar ordem (`useCanWriteLosses`).

## 2. Janelas e competência de análise

- **Janela recente:** 3 competências (`MESES_JANELA_RECENTE`). **Janela base:** as 12 anteriores a ela
  (`MESES_JANELA_BASE`). Consumo é a média mensal em cada janela. (`queries.py`)
- **Competência de análise:** a mais recente com medição. Pode ser fixada no passado por `LOSS_REFERENCE_COMPETENCIA`
  (demonstração: 2025-09); fixada, só contam as inspeções feitas até o fim daquele mês e a tela avisa. Valor igual ou
  posterior ao último dado não tem efeito. (`reference.py`, D9)
- **Leitura com consumo negativo é descartada** antes de qualquer cálculo. (D5)
- **Histórico mínimo:** a chance de acerto medida vale para UC com 11 ou mais meses de base
  (`MESES_BASE_MINIMO`); ligação recente fica limitada à taxa fraca. (`hit_rate.py`, D14)

## 3. Quem entra na fila

Uma UC é candidata se **todas** as condições valem (`queue_query.py`, `_candidate_conditions`):

1. Não tem geração distribuída (`possui_gd`). (D3)
2. Tem consumo base maior que zero e consumo recente informado.
3. Tem **queda relativa aos pares** de 20% ou mais (`LIMIAR_QUEDA_MODERADA`) **ou** pelo menos uma leitura zerada na
   janela. A queda relativa é `1 − (recente ÷ base da UC) ÷ mediana de (recente ÷ base) da classe de consumo`: ela separa a
   sazonalidade de uma queda anormal. Classe com menos de 100 UCs usa a mediana da carteira. (`peers.py`, D16) Com
   `LOSS_USE_PEERS=false` a queda volta a ser a bruta.
4. Não está na lista de exclusão (seção 4).
5. Passa o prazo de reincidência (seção 4).
6. Passa os filtros opcionais de município, bairro e classe.

**Motivos** (`scoring.py`, `detect_reasons`): `queda_subita` (queda de 50% ou mais), `queda_moderada` (de 20% até
menos de 50%; excludente com a súbita) e `leitura_zerada`, com a queda medida contra os pares. Uma UC pode ter a
queda e a leitura zerada juntas. (D2, D16)

## 4. Quem sai da fila e quando volta

| Situação da UC | Fica fora por | Volta quando |
|---|---|---|
| Ordem **concluída** sem irregularidade, ou inspeção de campo sem irregularidade | 15 competências (janela de análise) | Passa o prazo |
| Ordem concluída **com irregularidade** ou inspeção de campo com irregularidade | **12 competências**, contando a de referência | Passa o prazo, ou antes, se houver nova queda súbita (abaixo) |
| Ordem **cancelada** por `cliente_regularizou` ou `endereco_nao_localizado` | **90 dias** do cancelamento (`CANCELLATION_BLOCK_DAYS`) | Passam os 90 dias |
| Ordem cancelada por `ordem_duplicada`, `repriorizacao_equipe` ou `outro` | Não sai | Volta na hora |
| Ordem **ativa** (gerada ou em campo) | Não sai; fica na lista com a situação marcada | Segue na fila |

Fonte: `excluded_units_query`, `_reincidence_condition`, `_blocking_cancellations_query` em `queue_query.py`. (D4, D11)

**Retorno antecipado da reincidência:** dentro dos 12 meses, a UC volta se (1) a janela recente inteira é posterior
à inspeção, para não confundir com a queda que motivou a visita, e (2) o consumo recente é no máximo
`base × mediana(recente/base da carteira) × 0,5`. A mediana é limitada a 1,0, então carteira que cresceu não
afrouxa a regra. Os 12 meses são suposição adotada pelo dono da fatia, sem validação do gerente de perdas. (D11)

## 5. Quanto vale cada UC

- **Déficit mensal:** consumo esperado menos consumo recente, mínimo 0 (`monthly_deficit_kwh`). O esperado é
  `consumo base × mediana dos pares`: a queda que a estação explica não conta como energia a recuperar. (D16)
- **kWh a recuperar:** déficit mensal × **3 meses** (`JANELA_RECUPERACAO_MESES`). Suposição, sem fonte regulatória. (D7)
- **Tarifa média:** receita faturada ÷ energia faturada dos **últimos 12 meses** de `fato_faturamento`, ponderada
  pelo consumo, com 4 casas. Sem energia faturada o cálculo falha com erro explícito. (`tariff.py`, D8)
- **Valor a recuperar (R$):** kWh a recuperar × tarifa. **Valor por ano:** déficit mensal × 12 × tarifa.
- **Score de risco (0 a 100):** `queda × 80` mais 20 pontos se houver leitura zerada, com teto 100. Só desempata.
  (`PESO_QUEDA_CONSUMO`, `BONUS_LEITURA_ZERADA`)

## 6. Chance de acerto

Com os pares (padrão, `hit_curve.py`, D16), medido em `fato_inspecoes_perdas` (1.354 inspeções sem GD) pela queda
relativa aos pares:

| Queda relativa | Chance |
|---|---|
| Até 20% | 7,9% |
| De 20% a 30% | rampa linear de 7,9% a 92,5% (suposição: há 2 inspeções nessa faixa) |
| 30% ou mais | 92,5% (plano até 70%) |
| Leitura zerada isolada | 62,7% (taxa geral, nunca medida) |
| Ligação recente (base com menos de 11 meses) | no máximo 7,6% |

Queda súbita e moderada seguem a mesma curva, e a classe não entra na chance: os dados não as distinguem. Com mais de um
sinal, vale a maior taxa.

**Modelo anterior** (`LOSS_USE_PEERS=false`), taxas medidas em `fato_inspecoes_perdas` (`hit_rate.py`, D12):

| Sinal | Chance |
|---|---|
| Queda súbita | 93% |
| Queda moderada **além da carteira** (queda normalizada de 20% ou mais, `LIMIAR_QUEDA_NORMALIZADA`) | 91,5% |
| Queda moderada na linha da carteira | 7,6% |
| Leitura zerada isolada | 62,7% (taxa geral) |
| Ligação recente (base com menos de 11 meses) | no máximo 7,6% |

- **Queda normalizada:** `1 − (recente/base da UC) ÷ mediana(recente/base de todas as UCs)`. A mediana considera a
  carteira inteira, inclusive UCs com GD e fora dos filtros, e fica em cache até o fim do dia. (`portfolio_repository.py`)
- Com mais de um sinal, vale a **maior** taxa.

## 7. Ordem e score de prioridade

- **Prioridade = kWh a recuperar × chance de acerto** (kWh esperado). O score de risco só desempata. (D1)
- **Score exibido (0 a 100):** kWh esperado da UC ÷ maior kWh esperado entre **todas** as candidatas × 100. É
  calculado antes dos filtros, então **não muda** quando um filtro de município, bairro ou classe esconde o topo. (D15)
- **Faixas (frontend, `queueBands.ts`):** chance de 30% ou mais = **prioritária**; abaixo disso = **baixa chance**.
- **Sem teto de capacidade:** a equipe decide quantas UCs inspecionar. Os 200 (`FILA_CAPACIDADE_MENSAL`) são só o
  tamanho padrão da página da fila, paginada no servidor por `offset`, com `limit` de 1 a 500. (D6, D16)
- **Quantas inspecionar:** o campo N (padrão `TOP_SELECTION_COUNT`, 10) marca as N primeiras UCs **na fila**, em
  qualquer chance, e traz mais páginas até haver N livres. Se a fila está filtrada por outra situação, troca o filtro
  para "na fila". O N fica só no navegador.

## 8. Situação da UC na fila

`na_fila` (sem ordem ativa), `ordem_gerada` (ordem em `gerada`) e `em_campo` (ordem em `pendente`). Só UC `na_fila`
pode ser selecionada ou receber ordem. Filtro de situação e contagem por opção valem sobre a fila inteira; opções
com contagem 0 continuam aparecendo. (`queue_summary.py`, `queue_filter_options.py`)

## 9. Resumo da seleção

Calculado no servidor para as UCs selecionadas **que ainda estão na fila** (`queue_summary.py`):

- **Selecionadas:** quantidade. **kWh/mês** e **R$/ano:** soma do recuperável de cada UC.
- **Retorno esperado:** soma de (recuperável × chance de acerto) por UC, em kWh/mês e em R$/ano.
- **Ordens abertas:** ordens ativas (geradas ou em campo), sem comparar com um teto.
- **Taxa histórica exibida:** inspeções com irregularidade ÷ inspeções feitas no histórico de campo; sem histórico
  usa 62,7%.

### Curva de retorno e corte sugerido

`GET /losses/queue-curve?custo=&pontos=` (`queue_curve.py`) soma, UC a UC e só entre as UCs **livres** (sem ordem
ativa), o retorno esperado (energia recuperável × chance de acerto) em kWh/mês e R$/ano. O retorno marginal nunca sobe
(a fila é ordenada por kWh esperado e a tarifa é única). Com `custo` (R$ por inspeção), `corte_sugerido` é quantas UCs
seguidas ainda têm R$/ano esperado maior ou igual ao custo; sem custo, não há corte. `pontos` (2 a 500) limita a
resposta e mantém sempre a última UC. A tela usa o corte para preencher o N. (D16)

## 10. Ordens de inspeção

**Criar** (`service.create_inspection`):
- A UC precisa existir no cadastro (senão 404) e **não pode ter outra ordem ativa** (senão 409).
- Nasce em `gerada`, com `kwh_estimado` recalculado no servidor pela mesma regra da fila. **Ordem manual** (UC com GD,
  sem leitura recente ou sem suspeita) fica com 0 kWh.
- `fiscal_responsavel` assume quem gerou a ordem (`criado_por`) quando nenhum fiscal é informado.

**Transições permitidas** (`ALLOWED_TRANSITIONS`):

```
gerada ──► pendente ──► concluida   (final)
   │          │
   └──────────┴──────► cancelada    (final)
```

Concluída e cancelada não mudam mais; qualquer outra transição dá 409.

**Dados por status de destino** (`update_rules.py`; campo fora da lista dá 400):

| Destino | Campos aceitos |
|---|---|
| `pendente` | fiscal, inspetor |
| `concluida` | fiscal, inspetor, data da inspeção, irregularidade constatada (**obrigatória**), tipo, kWh recuperado, nº do TOI |
| `cancelada` | motivo do cancelamento (**obrigatório**, lista fechada), justificativa |

- Tipo, kWh recuperado e TOI **só valem com irregularidade constatada**; com "não", informar qualquer um dá 400.
- **Inspetor:** código de `INSP-001` a `INSP-040`, normalizado. **Data da inspeção:** não pode ser futura.
  **kWh recuperado:** zero ou mais. Textos têm limite de tamanho (fiscal 120, tipo 80, TOI 40, justificativa 500).
- **Motivos de cancelamento:** `cliente_regularizou`, `ordem_duplicada`, `endereco_nao_localizado`,
  `repriorizacao_equipe`, `outro`. Dois deles bloqueiam a UC por 90 dias (seção 4).

## 11. Planilha de campo (CSV) e retorno

**Exportar** (`export.py`): ordens `gerada` e `pendente`, separador `;`, UTF-8 com BOM (acentos no Excel pt-BR) e
números com vírgula decimal. Colunas pré-preenchidas: `id_inspecao`, `id_uc`, `status`, `motivo`, `kwh_estimado`,
`criado_em`. Colunas de retorno: `data_inspecao`, `inspetor_selecionado`, `irregularidade_constatada`,
`tipo_irregularidade`, `kwh_recuperado`, `numero_toi`; saem com o que já está salvo na ordem. `inspetor_selecionado`
só é preenchida com a ordem em campo; vazio é válido. Texto que começa com `=`, `+`, `-`, `@`, tabulação ou retorno
de carro ganha apóstrofo, para não virar fórmula.

**Importar o retorno** (`upload_parser.py`, `upload_reconcile.py`):
- Aceita `.xlsx` e `.csv` (separador `;`, `,` ou tabulação), até **10.000 linhas**.
- Identifica a ordem pelo `id_inspecao` do portal ou, quando o id não é do portal (planilha do campo), pela **ordem
  ativa da `id_uc`**; UC sem ordem ativa é recusada.
- A conciliação é **por linha**: uma linha inválida entra na lista de recusas com o motivo e não derruba o lote.
  Linha sem resultado é ignorada e contada.
- Valores aceitos: datas `AAAA-MM-DD`, `DD.MM.AAAA`, `MM-DD-AAAA`, `DD-MM-AAAA` e `DD/MM/AAAA`; resultado
  afirmativo (`sim`, `s`, `confirmada`, `irregular`...) ou negativo (`nao`, `n`, `nada`, `sem`, `improcedente`,
  `regular`...); decimais com vírgula ou ponto.
- Cada linha aplicada segue as mesmas regras de transição e de campos da seção 10.

## 12. Detalhe da UC

- A conta do score mostra: déficit mensal, janela de 3 meses, chance de acerto, kWh esperado e o score. É a mesma
  conta da fila. (`unit_detail.py`)
- **Gráfico de consumo:** por padrão os últimos 12 meses; "Tudo" pede o histórico completo (`historico_completo`). As
  faixas das janelas recente e base são marcadas no gráfico (`scoreWindows.ts`, espelho de `queries.py`). O painel
  volta aos 12 meses ao fechar e ao trocar de UC.
- **Inspeções anteriores:** histórico de campo e ordens concluídas da UC.
- "Gerar ordem desta UC" só fica ativo para UC `na_fila` e para quem pode gravar.

## 13. Limites conhecidos

- Os 12 meses de reincidência, a janela de 3 meses de recuperação e o corte de 30% das faixas são suposições
  declaradas, sem validação do gerente de perdas. (D7, D11)
- As janelas de 3 e 12 meses e os 90 dias de bloqueio existem no backend e no frontend; ao mudar um lado, mude o outro.
- A faixa de 20% a 30% de queda relativa não tem medição (2 inspeções); a rampa é suposição, e só o piloto fora da
  fila (D13) a mede. Em 2026-06, 29 das 31 UCs da fila estão nela.
- O backtest cobre só jul–dez/2025 (meses com inspeções de campo): o verão não foi validado com inspeções reais.
- A entrada por queda relativa perde 2,9% das irregularidades que a queda bruta pegava (25 de 867); pegá-las custaria
  330 inspeções a mais, com 7,6% de acerto. (D16)
- Os testes de rota do backend rodam com `LOSS_USE_PEERS=false` (`conftest.py`); o modelo com pares tem testes próprios.
- A regra de retorno antecipado da reincidência (seção 4) ainda mede a "nova queda súbita" contra a mediana da
  **carteira**, e não contra os pares; a entrada e os sinais usam os pares. Uma UC pode voltar antes do prazo por um
  critério e ser avaliada por outro. Decisão pendente da revisão de código de 2026-11-08.
- Os patamares de 7,9% e 92,5% foram medidos nas mesmas inspeções que o backtest usa: a precisão da aba Efetividade
  tende a ser otimista. A aba avisa.
- A curva de retorno considera a fila inteira, sem os filtros da tela; o "Marcar as N primeiras" respeita os filtros.
- "Marcar as N primeiras" vale no máximo 400 UCs por vez (o resumo da seleção não aceita mais).
- Ordens antigas só com fiscal exportam `inspetor_selecionado` vazio.
- A data da ordem usa `atualizado_em` do servidor, e o corte de reincidência parte da competência de referência; com
  referência fixada no passado os dois podem divergir.
