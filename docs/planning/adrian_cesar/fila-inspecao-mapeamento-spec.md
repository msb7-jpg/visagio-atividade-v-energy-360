# Fila de Inspeção — mapeamento da especificação contra o que existe (Prompt 0)

Autor: Adrian César (fatia 05), com apoio do Claude Code. Data: 2026-11-06.
Documento lido: [`V-Energy-Grid-360_Fila-de-Inspecao_Especificacao-e-Prompts.md`](V-Energy-Grid-360_Fila-de-Inspecao_Especificacao-e-Prompts.md).
Auditoria de dados usada como base: [`docs/viabilidade_motivos.md`](../../viabilidade_motivos.md).

A própria especificação manda executar o Prompt 0 (descoberta, mapeamento e auditoria de pertinência) e **parar para aprovação** antes de codar as telas.
Este arquivo é essa entrega. **Nenhum código foi alterado.**

## 1. Fase 0 — o que já existe

Stack: FastAPI + SQLAlchemy sobre `v_energy.db` (SQLite), React 19, TanStack Query, shadcn. Módulo em `backend/app/features/loss_management/` (4.243 linhas) e `frontend/src/features/loss_management/`.

Tabelas e fontes: `ordem_inspecao` (escrita pelo portal), `fato_inspecoes_perdas` (histórico de campo), `fato_medicao`, `fato_faturamento` (tarifa), cadastro de UC e GD.

Endpoints atuais: fila (`suspicious-units`), detalhe da UC, `queue-summary`, `queue-filters`, `inspectors`, ordens (lista, criar, atualizar), export CSV, upload.

## 2. Fase 1 — telas da especificação × código atual

| Tela / elemento da spec | Existe hoje? | Fonte no banco | Decisão |
|---|---|---|---|
| T1 Fila: tabela, ordenação, filtros município/bairro/classe, seleção, top N, dock de gerar ordens | Sim (`SuspiciousQueueTab`, `PrioritizedQueueTable`, `QueueFilters`, `QueueActionsBar`) | fila calculada em `queue_query.py` | IMPLEMENTAR (existe): só ajustes de layout, se aprovado |
| T1 KPIs: selecionadas, energia, valor, capacidade 200 editável | Parcial (`SelectionStrip`, `queue_summary.py`; capacidade fixa em 200, só aviso) | `queue_summary`, tarifa de `fato_faturamento` | IMPLEMENTAR (existe); tornar a capacidade editável é pequeno |
| T1 KPI "Precisão estimada" vinda do backtest | Não existe backtest persistido | `fato_inspecoes_perdas` + fila recalculada na data de corte | IMPLEMENTAR (derivado), ver seção 3 |
| T1 Parâmetros da detecção + "Recalcular fila" | Não: limiar, janelas e meses são constantes (`hit_rate.py`, `queries.py`) | — | ESTADO "somente leitura"; o botão só existe se houver recálculo real (regra da spec) |
| T1 Filtro **Família** e **Nº mínimo de sinais** | Não. O código tem 3 motivos (`queda_subita`, `queda_moderada`, `leitura_zerada`), todos da família Consumo | `SuspicionReason` | PENDENTE: com 1 família só, o filtro e a coluna "Sinais" por família não têm o que mostrar |
| T1 Coluna "Motivo principal · outros sinais", pontos por família | Parcial (badges de motivo) | idem | OCULTAR a parte multi-família até haver 2ª família |
| T1d Aba **Fora da fila** | Não existe. As exclusões são só uma `UNION` de `id_uc` | `excluded_units_query` | IMPLEMENTAR (derivado): motivos que o backend já produz (ordem ativa, inspecionada sem achado ≤ 15 meses, reincidência, cancelamento bloqueante 90 dias, GD) |
| T1d "Volta a ser avaliada" | Derivável para cancelamento (atualizado_em + 90 d) e inspeção (data + janela) | `ordem_inspecao`, `fato_inspecoes_perdas` | IMPLEMENTAR (derivado) |
| T2 Detalhe: score, gráfico de consumo, memória de cálculo | Sim (`UnitDetailSheet`, `UnitScoreCalculation`, `UnitConsumptionChart`) | `unit_detail_service` | IMPLEMENTAR (existe) |
| T2 Série "esperado" e "pares" | Esperado: sim (base). Pares: não existe no código | `fato_medicao` | PENDENTE: definição de "par" (classe, bairro, faixa) precisa de decisão |
| T2 Marcadores de eventos (troca de medidor, atendimento) | Não. Medidores têm `data_ultima_manutencao` 100% nula; atendimentos existem | `atendimentos.json`, medidores | OCULTAR troca de medidor; atendimento é viável como contexto |
| T2 Insight de IA | Existe um serviço de insights no chat | `features/chat` | OMITIR ou template determinístico (regra da spec) |
| T2 Linha do tempo de inspeções | Sim (`PriorInspectionsList`) | `fato_inspecoes_perdas`, `ordem_inspecao` | IMPLEMENTAR (existe) |
| T3 Ordens Kanban, cancelar com motivo, registrar resultado, lote | Sim (`OrderBoard`, `CancelOrderDialog`, `RegisterResultDialog`, `GenerateOrdersDialog`) | `ordem_inspecao` | IMPLEMENTAR (existe) |
| T3 Visão **Tabela** alternativa ao Kanban | Não | `ordem_inspecao` | IMPLEMENTAR (existe dado) |
| T3e **Histórico/auditoria** da ordem | Não existe tabela de eventos; só `criado_em`/`atualizado_em` | — | PENDENTE: exige criar tabela `ordem_inspecao_evento` (proposta P1). Sem ela não se exibe histórico (a spec proíbe histórico sintético) |
| T4 **Efetividade**: KPIs de campo (concluídas, com achado, taxa real, kWh recuperados) | Taxa real existe no `HitRateDTO` | `ordem_inspecao`, `fato_inspecoes_perdas` | IMPLEMENTAR (existe) |
| T4 Backtest por data de corte e N | Não. Existe só a conferência manual de "top 200 = 94,9%" (changelog) | fila na data de corte via `LOSS_REFERENCE_COMPETENCIA` | IMPLEMENTAR (derivado): o recálculo por competência já existe; falta um endpoint que rode a fila numa data e cruze com as inspeções dos 3 meses seguintes |
| T4 Barras por família | Só 1 família | — | OCULTAR até haver 2ª família; por **motivo** é viável (3 motivos) |
| T4 Linha mensal vs. linha de base | Viável, mas as inspeções cobrem só ago–dez/2025 (1.389, sem reincidência) | `fato_inspecoes_perdas` | IMPLEMENTAR com aviso: 5 pontos mensais, n por mês |
| T5 Upload (área de soltar, resultado) | Sim (`InspectionUploadModal`, `upload_*`) | `ordem_inspecao` | IMPLEMENTAR (existe) |
| T5b **Pré-visualização** antes de importar (dry run) | Não; P6 das decisões adiou ("só se houver tempo") | `upload_reconcile.py` | IMPLEMENTAR (existe a conciliação; falta modo `dry_run` e a tela) |

## 3. Fase 3 — auditoria de pertinência

**O que o banco não sustenta (a spec parte de premissas que a auditoria de dados desmentiu):**

1. **Sete famílias de motivo.** Só Consumo tem poder preditivo comprovado. Reclamação, inadimplência e interrupção de rede foram medidas e **não separam** irregularidade (`viabilidade_motivos.md` §1, item 6). Medidor (tipo eletromecânico) e Rede (concentração por alimentador) são os únicos candidatos além de Consumo. Criar tags e filtros para famílias sem sinal seria exatamente o dado decorativo que a regra 1 da spec proíbe.
2. **Linha de base "~50%".** Medida: **62,7%** (871 de 1.389). Deve ser calculada, nunca fixa.
3. **Backtest sem vazamento.** Só é honesto em T = jul/2025 (antes das inspeções). A fila de hoje tem poucas UCs inspecionáveis: quase todas as UCs com queda e sem GD já foram inspecionadas.
4. **Reincidência e "Fora da fila" com muitos motivos.** Não há reincidência nos dados (1.389 UCs distintas, uma única janela). Os motivos de exclusão reais são só os do `queue_query.py`.
5. **Capacidade 200 como "referência".** O código atual já a trata como aviso; concordo com a spec e só falta torná-la editável.

**Propostas para aprovação** (nada disto foi implementado):

| # | O quê | Onde | Fonte | Por que ajuda | Custo |
|---|---|---|---|---|---|
| P1 | Tabela de eventos da ordem (quem, quando, antes/depois) | backend + gaveta de histórico | nova `ordem_inspecao_evento`, gravada pelo `service.py` | Única forma honesta de entregar T3e; hoje não há trilha | Médio: migração leve (`schema_upgrade.py`), escrita em toda mudança de status |
| P2 | Fatiar a Fila em **Fila / Fora da fila / Ordens / Efetividade** por abas | `LossManagementPage` | existentes | É o desenho da spec e hoje a fila já tem faixas próprias | Médio |
| P3 | Backtest por data de corte como endpoint | `queue_summary.py` + `hit_rate.py` | `fato_inspecoes_perdas` | Dá o KPI "Precisão estimada" honesto | Médio-alto: roda a fila por competência (≈ 0,2 a 0,7 s com o cache) |
| P4 | Dry run do upload com erros por célula | `upload_reconcile.py` + modal | existentes | Fecha a decisão P6 que ficou aberta | Médio |
| P5 | Tipo de medidor eletromecânico como fator de ranking e concentração por alimentador | `scoring.py` | medidores, `ocorrencias_rede` | Os dois únicos sinais P1 além da queda (`viabilidade_motivos.md` §9) | Alto: muda o score e exige nova medição |

**Riscos:** viés de reinspecionar sempre as mesmas UCs (já mitigado pelas janelas de 12 e 15 meses); vazamento temporal no backtest (usar só dados até a data de corte); texto de insight fora da memória de cálculo.

## 4. O que precisa de decisão sua

1. Aprovar P1 a P5 (ou escolher quais). Sugestão de ordem: **P2 → fora da fila → P3 → P4 → P1**; P5 por último.
2. **Famílias:** manter só "Consumo" por enquanto (recomendado) ou esconder o conceito de família até existir a segunda?
3. **Pares** (T2): classe, bairro ou faixa de consumo?
4. **Mínimo de amostra** por barra na Efetividade (a spec sugere n < 10).

## 5. Como conferir este mapeamento

- Todas as colunas "Existe hoje?" apontam para um arquivo em `backend/app/features/loss_management/` ou `frontend/src/features/loss_management/`.
- Os números de dados (62,7%, 1.389, 94,9%) vêm do `changelog.md` desta pasta e de `docs/viabilidade_motivos.md`.
