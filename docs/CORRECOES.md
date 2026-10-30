# Correções pendentes do projeto

> Lista única do que ainda precisa ser corrigido antes da entrega (04/11/2026).
> Atualizada em 2026-10-29 por Bernardo H (conferência com o banco regerado) e Adrian C. (pendências do design novo e da Fila de Inspeção).
>
> 🔴 bloqueia merge ou entrega · 🟡 importante · ⚪ melhoria

### Como usar (regra do `AGENTS.md`, "Pendências transversais")
- **Entra aqui:** problema em código ou dado de outra fatia, ou que depende de mais de um membro: bug, dado errado na Gold, conflito entre PRs, apontamento de revisão ainda aberto.
- **Não entra aqui:** tarefa só da sua fatia (vai no seu checklist em `docs/planning/<membro>/`) e entrega concluída (vai no seu `changelog.md`).
- **Como registrar:** na seção do responsável, com prioridade, evidência (arquivo, linha, número medido ou consulta) e correção sugerida.
- **Ao resolver:** marque `[x]`, anote a data e o PR e mova o item para "Já resolvido". Registre a entrega no seu `changelog.md`.

---

## 1. Dados e pipeline (Renan, com Ryei)

- [ ] 🔴 **O banco regerado não tem a correção de bairros do PR #45.** O código (`fix_mojibake` em `fatia01_silver.ipynb`) está na `main`, mas o `v_energy.db` distribuído em 29/10 foi exportado antes dele.
  - **Evidência (29/10, banco novo):** `SELECT count(DISTINCT bairro) FROM dim_unidade_consumidora WHERE bairro GLOB '*[^ -~]*'` = 59, e há 358 pares município + bairro (o certo são 298). Ex.: `JARDIM JORDA£O` (30 UCs), `BRASA\xadLIA TEIMOSA` (55 UCs).
  - **Impacto:** os nomes quebrados aparecem na Receita (cascata e ranking), na Visão 360 e na Fila de Perdas, e dividem bairros no diagnóstico. Inclui o caso do hífen invisível apontado pelo João.
  - **Correção:** rodar o Workflow de novo com a `main` atual e distribuir o `v_energy.db` novo. A consulta acima deve voltar 0.

- [ ] 🟡 **Volume da Gold diferente do texto do case.** A energia faturada cai **5,1%** entre jul/22–jun/23 e jul/25–jun/26, e o case fala em "quase 4%". A receita bate (+8,0%). Sem as 3.510 UCs com painel solar, o volume fica estável (−0,2%): a queda inteira vem da geração solar. Registrar como suposição no README.
- [ ] 🟡 **Avaliar `mmap_size` para as consultas analíticas.** Medido em 30/10 no `v_energy.db` da raiz (773,6 MB; SQLite 3.50.4; 2.152.336 linhas em faturamento e medição): habilitar `PRAGMA mmap_size=268435456` reduziu as medianas de `suspicious_profiles_query` de 3,72 s para 1,31 s (−64,8%), da agregação de razão da carteira em `PortfolioRepositoryMixin` de 4,07 s para 1,44 s (−64,7%; 44.996 UCs) e `readings_query` de 1,02 s para 0,88 s (−14,1%). No conjunto das seis consultas medidas, a soma das medianas caiu de 9,82 s para 7,48 s. Em contrapartida, `period_totals_query` subiu 4,7%, `billing_query` 1,5%, min/max 3,6% e atendimento 8,6%. `cache_size=-64000` e `temp_store=MEMORY`, testados isoladamente, não trouxeram ganho consistente.
  - **Validação do warmup completo (modo somente leitura):** serviços e repositórios reais levaram 17,4 s sem mmap e 12,0 s com 256 MiB; duas execuções concorrentes levaram 19,7 s e 13,6 s, respectivamente, com os mesmos 165 itens na fila e cinco grupos de indicadores. O RSS/working set subiu 16 MiB no padrão e 396 MiB com 256 MiB de mmap; limites de 64 e 128 MiB ficaram em 18,3 s / +121 MiB e 16,3 s / +214 MiB. RSS inclui páginas mapeadas e não equivale a memória privada.
  - **Limite da evidência:** a cópia somente leitura não tinha `ordem_inspecao`; a fila foi medida com uma tabela temporária vazia, e a API normalmente cria a tabela operacional no startup. Repetir a comparação após a migração no arquivo efetivamente usado pela API.
  - **Correção sugerida:** não habilitar mmap globalmente sem definir um orçamento de memória para conexões concorrentes. Priorizar primeiro as otimizações locais já medidas (JOIN condicional na Receita e intervalo de datas no atendimento) e repetir o warmup na configuração/pool de produção antes de reconsiderar mmap.

## 2. Diagnóstico da receita (Renan e Célio)

- [x] 🔴 **Conclusão sobre fraude nos quatro bairros corrigida.** O diagnóstico agora usa a evidência reproduzível de 828 das 871 irregularidades confirmadas (95,1%) nos quatro bairros e a queda simultânea observada, sem afirmar que cada UC ou kWh seja recuperável. Consultas e limites registrados em `docs/DIAGNOSTICO_RECEITA.md`, seções 6.2, 6.5 e C2c.
- [ ] 🟡 **Reconciliar as 887 UCs com queda ≥40%.** A contagem divulgada não tem consulta ou regra de janela versionada. Reconstrução independente dos CSVs brutos, com uma aproximação local das regras atuais da Silver para UCs sem GD atual nos quatro bairros e comparando maio/2024–abril/2025 com maio/2025–abril/2026, resultou em 888 pela soma de kWh, 890 pela média dos meses disponíveis e 880 exigindo 12 meses completos em ambas as janelas. Nenhuma confirma 887; obter a consulta e os critérios originais e validar o resultado na Gold antes de usar a população para priorizar inspeções.
- [x] 🔴 **Placeholders do diagnóstico preenchidos.** Não há ocorrências de `[a preencher]` ou `[a confirmar]` em `docs/DIAGNOSTICO_RECEITA.md`; validação por busca textual em 2026-10-30.
- [ ] 🟡 **Seção 6.2 do diagnóstico (fraude e furto) cita números da fila de perdas que mudaram** (Adrian, 2026-10-28). Para usar "o mesmo cálculo da fila", atualizar: tarifa de **R$ 0,7876/kWh** (média ponderada de 12 meses de `fato_faturamento`, e não os 0,714 da constante antiga); chance de acerto da queda moderada **91,5%** com queda além da carteira de 20% ou mais e **7,6%** abaixo (a queda súbita segue 93% e a taxa geral 62,7%); fila de 2026-06 com 165 UCs (**7 fortes e 158 fracas**, 35 delas ligações recentes sem taxa medida, D14), cerca de 7.265 kWh/mês recuperáveis e cerca de 788 kWh/mês de retorno esperado. Fonte: `docs/DECISOES_PERDAS.md` D8, D11, D12 e D14.
- [ ] 🟡 Refazer os números por bairro depois da correção dos nomes (item 1).
- **Andamento (2026-10-30, Renan):** conclusão sobre fraude atualizada com a concentração reproduzível de 828/871 irregularidades nos quatro bairros; placeholders resolvidos; diagnóstico também contém os números D8/D14 da fila, explicação do volume/tarifa e recomendações em R$. A contagem individual divulgada como 887 não foi reproduzida (testes independentes, com aproximação das regras Silver, deram 880–890 conforme a definição); falta obter a consulta original, validar na Gold e conferir os sete valores de bairro contra a tela. Não marcar o entregável como concluído até fechar essas verificações.

## 3. IA (Miguel)

- [ ] ⚪ O endpoint de insights aceita `metricas` livres do cliente; o Painel envia os indicadores reais, mas o servidor não confere (apontado pelo Adrian). Revisão de Renan em 2026-10-30 confirmou que `ProactiveInsightsRequest.metricas` aceita valores numéricos e texto, `generate_proactive_insights_service` serializa o payload do cliente diretamente para o prompt, e a rota não consulta o banco. `evaluate_agent.py` mede SQL seguro/executável, não compara o resultado com a saída esperada; os testes de agente não cobrem respostas fiéis do insight nem recusas a prompt injection. Correção sugerida: derivar/validar métricas no servidor e comparar respostas com resultados esperados, incluindo casos de recusa e manipulação.

## 4. Painel do Diretor (Bernardo)

- [ ] 🟡 **O retrato de perdas do Painel soma a fila inteira.** Depois do PR #49, `/dashboard/losses` usa o mesmo ranking e o mesmo limiar de 20% da Fila de Inspeção. Com `LOSS_REFERENCE_COMPETENCIA="2025-09"` (a competência da demonstração), o card mostra 39.243 UCs e R$ 31,6 mi/ano recuperáveis, mas só 587 UCs têm chance alta (R$ 1,6 mi/ano); 95% do valor vem de UCs com 7,6% de chance de acerto (medido em 29/10 com o banco regerado).
  - **Correção sugerida:** mostrar no card as UCs prioritárias e o retorno esperado (valor × chance de acerto), com o total da fila como informação secundária.
- [ ] ⚪ **O indicador de atendimento aplica `substr()` à data.** Em 30/10, `service_query` levou cerca de 227 ms na mediana e o plano fez scan de `fato_atendimentos`. O intervalo semiaberto (`data_abertura >= YYYY-MM-01 AND data_abertura < primeiro dia do mês seguinte`) preserva os valores e levou cerca de 184 ms.
  - **Índice avaliado numa cópia temporária do banco:** a condição OR entre as duas janelas fez o plano usar `idx_benchmark_service_date`, mas elevou a mediana para 229,5 ms e aumentou a cópia em 8,5 MB. **Não adicionar o índice nem restringir a consulta com OR**; aplicar apenas a condição de intervalo semiaberto dentro dos `CASE`, mantendo o scan sequencial mais rápido.
- [ ] ⚪ Avisar o Célio que `period_totals_query` (`backend/app/features/revenue/queries.py`) perdeu o filtro de competência no `WHERE` para ficar mais rápida (mesmos números, ADR-016).
  - **Evidência adicional (30/10):** na base local de 2.152.336 faturas, a consulta sem filtros territoriais teve mediana pareada de 3,64 s com o JOIN ao cadastro e 2,66 s sem JOIN (−27%); os oito totais comparados foram iguais e não há faturas órfãs no snapshot. Avaliar omitir o JOIN apenas quando município, bairro e classe estiverem ausentes; manter o JOIN quando houver filtro e cobrir ambos os caminhos com teste.
  - **Implementação local (30/10):** `period_totals_query` omite o JOIN quando não há filtros territoriais e o mantém quando município, bairro ou classe estão preenchidos; os dois caminhos têm testes de SQL. A pendência de comunicação/merge permanece até integrar a alteração na branch da Fatia 04.

## 5. Visão 360 (Bernardo)

- [ ] ⚪ Plugar o `SmartInsightCard context="customer360"` (opcional: o case pede IA embutida em pelo menos uma tela, e ela já está no Painel).
- [ ] ⚪ **Situação da fatura fora do `StatusBadge`** (apontado pelo Adrian, 2026-10-29, fase 10.5 do design). `PAYMENT_STATUS` em `frontend/src/features/customer360/utils/customer360Formatters.ts:28` e o `PaymentStatusBadge` de `InvoicesTab.tsx:19` refazem à mão o que `StatusBadge kind="fatura"` (`components/ui/status-badge.tsx`) já tem, com os tons do design (paga = verde, em aberto = âmbar, vencida = vermelho). Hoje a fatura paga sai em cinza (`secondary`) e a aberta sem cor.
  - **Correção sugerida:** trocar por `<StatusBadge kind="fatura" status={...} />` e apagar `PAYMENT_STATUS`. A API devolve `PAGA`, `ABERTA` e `VENCIDA` e o vocabulário usa `paga`, `em_aberto` e `vencida`: mapear `ABERTA` para `em_aberto`, e manter o texto bruto para qualquer valor desconhecido.
- [ ] ⚪ **Sem "Tentar novamente" nos erros da Visão 360.** `features/customer360/components/Customer360Details.tsx` tem 4 `AsyncState` (linhas 63, 77, 82 e 92) e nenhum passa `onRetry`; numa falha o usuário só vê o aviso e precisa recarregar a página.
  - **Correção sugerida:** `onRetry={() => void query.refetch()}` em cada um, com a consulta que alimenta o bloco (modelo em `features/loss_management/components/UnitDetailSheet.tsx:57`).

## 6. Gestão de Perdas (Adrian)

- [x] ⚪ Adotar o `components/ui/pagination.tsx` (criado no #34) no `QueuePagination`. (Adrian César, 2026-10-30; `QueuePagination` removido, PR a abrir)

## 7. Inteligência Comercial (Célio)

- [ ] 🟡 **A Receita leva cerca de 4,5 s por consulta.** Medido em 29/10 com o banco novo: `/revenue/decomposition` 4,5 s e cada página de `/revenue/breakdown` (classe, município e bairro) 4,5 a 4,6 s. A tela dispara várias dessas ao abrir. Sugestão: o mesmo tratamento da ADR-016 (leitura sequencial sem `WHERE` por competência e cache por janela).
- [ ] ⚪ Registrar no `docs/planning/celio/changelog.md` a correção do filtro de bairro (commit `07a69c0`: a lista lê todas as páginas, e Recife tem 106 bairros).
- [ ] ⚪ **Sem "Tentar novamente" nos erros da Inteligência Comercial** (apontado pelo Adrian, 2026-10-29, fase 10.5 do design). Nenhum `AsyncState` passa `onRetry`: `RevenueResults.tsx:24`, `RevenueRankingCard.tsx:51`, `RevenueWaterfallCard.tsx:39` e `NeighborhoodHistorySheet.tsx:49`, em `frontend/src/features/revenue/components/`.
  - **Correção sugerida:** `onRetry={() => void query.refetch()}` em cada um (modelo em `features/loss_management/components/UnitDetailSheet.tsx:57`).

## 8. Qualidade da Rede (João)

- [ ] ⚪ **Sem "Tentar novamente" nos erros da Qualidade da Rede** (apontado pelo Adrian, 2026-10-29, fase 10.5 do design). Nenhum `AsyncState` passa `onRetry`: `ContinuityView.tsx:35`, `CurrentQualityView.tsx:49` e `FeederHistorySheet.tsx` (linhas 43 e 53), todos em `frontend/src/features/grid_quality/components/`. O `ErrorState` já mostra o botão quando recebe `onRetry`.
  - **Correção sugerida:** `onRetry={() => void query.refetch()}` em cada um (modelo em `features/loss_management/components/UnitDetailSheet.tsx:57`).

## 9. Fechamento (todos)

- [ ] 🔴 **README:** suposições de cada fatia, passo a passo de execução (incluindo `LOSS_REFERENCE_COMPETENCIA`), print do Workflow no Databricks e links para o dicionário de dados e o diagnóstico (case, seção 6).
  - **Andamento (2026-10-29):** a seção da Fatia 05 está no README (suposições, passo a passo com `LOSS_REFERENCE_COMPETENCIA="2025-09"` e limites), em "Suposições e Demonstração por Fatia". O print do Workflow e o dicionário de dados já estavam. Faltam as seções das outras fatias nesse mesmo lugar e o link para o diagnóstico (seção 2).
- [ ] 🟡 Rodar `make lint-all`, `make test-all` e `bun run build` na `main` depois de cada merge (o `make` não roda o `tsc`).
- [ ] ⚪ **Componentes do design novo sem dono: `KpiCard`, `DeltaBadge`, `DataTable` e `FilterBar`** (apontado pelo Adrian, 2026-10-29, fase 10.5 do design). Os `componentes-*.png` os preveem, mas nenhum existe em `frontend/src/components/ui/`: cada fatia tem a sua versão.
  - **Evidência:** cartões de KPI em `revenue/RevenueKpiCard(s).tsx`, `grid_quality/ContinuityKpiCards.tsx` e `grid_quality/QualityKpiCards.tsx`; variação em `revenue/VariationBadge.tsx`; tabelas em `grid_quality/FeederRankingTable.tsx`, `FeederUcHoursTable.tsx`, `FeederCustomersTable.tsx` e `loss_management/PrioritizedQueueTable.tsx`; filtros em `revenue/RevenueFiltersBar.tsx`, `grid_quality/ContinuityFilters.tsx` e `loss_management/QueueFilters.tsx`.
  - **Decisão da equipe:** quem cria cada componente compartilhado (sugestão: o dono da fatia com a versão mais completa) e se cabe antes de 04/11/2026. Pelo prazo, é aceitável manter as versões por fatia e só documentar a diferença; o que não pode é cada tela divergir do `design.md` sem registro.

---

## Já resolvido

- [x] PR #34: lista de bairros limitada a 100 (Recife tem 106). Corrigido em `07a69c0` e mesclado na `main` em 2026-10-28.
- [x] Numeração das ADRs: as da Visão 360 passaram para ADR-017 a ADR-023 (a `main` usa 006–009 da Fatia 01, e o Painel, 010–016). Resolvido na branch `feat/fatia-03-visao360-gold` em 2026-10-28, junto com o merge da `main`.
- [x] Visão 360: o resumo de interrupções dizia "teve 50" em 33 UCs com mais de 50 (agora usa o total real), e o diagnóstico do mês sem leitura apontava o mês errado. Corrigido na branch `feat/fatia-03-visao360-gold` em 2026-10-28.
- [x] Painel do Diretor: conflito com a `main` depois do merge do #34 (`navItems.ts` e `RbacNavigation.test.tsx`). Menu do diretor: Painel, Inteligência Comercial, Gestão de Perdas, Qualidade da Rede, Visão 360. Resolvido na branch `feat/painel-diretor` em 2026-10-28.
- [x] Painel do Diretor: lentidão (de 11 s para 0,01 s) e inadimplência marcada como "piorou" por +0,05 ponto percentual (ADR-011 e ADR-016), em 2026-10-28.
- [x] Faturas não pagas marcadas como "PAGA" (`9999-12-31`): corrigido na Silver da Fatia 02 (PR #44). Conferido no banco regerado em 2026-10-29: 0 faturas com `9999-12-31`, 1.700 `ABERTA`, inadimplência de 5,52% → 5,42% e pontualidade da Visão 360 sem atrasos absurdos.
- [x] PR #35 (IA): build, conflitos com a `main`, quadro de IA com números fixos (agora no Painel do Diretor com os indicadores reais), `AI_MODEL_NAME` ignorado e checklist marcado sem código. Mesclado na `main` em 2026-10-28.
- [x] PRs do Painel do Diretor (#42) e da Visão 360 (#43) abertos, revisados e mesclados em 2026-10-28.
- [x] Painel do Diretor: DEC e FEC diferentes da Continuidade no primeiro ano (1,48 x 1,47). O Painel passou a usar as UCs atendidas da Gold (ADR-012 revisada). Branch `fix/painel-dec-ucs-atendidas`, 2026-10-29.
- [x] Código da correção de bairros (`fix_mojibake`) no PR #45; falta regerar o banco (item 1, aberto). Bairros com o nome corrompido na Gold: UDF `fix_mojibake` implementado na Silver (`fatia01_silver.ipynb`) para reverter dupla codificação UTF-8/Latin-1 antes da remoção de acentos em `bairro`, `municipio`, `logradouro` e `nome_titular`. 61 bairros (348 UCs) unificados; conferência GLOB `*[^ -~]*` validada com zero falhas; testes de qualidade adicionados em `fatia01_testes_qualidade.ipynb` e ADR-009 atualizada. Resolvido na branch `feat/fatia-01-cadastro` em 2026-10-28.
- [x] **Fila curta na competência mais recente** (Adrian, PR #49, 2026-10-29). Em jun/2026 as 559 quedas acima de 50% são de UCs com painel solar, que a Fila exclui; sobram 165 UCs (7 de chance alta e 158 de baixa, D14). A demonstração da onda de 2025 usa `LOSS_REFERENCE_COMPETENCIA="2025-09"` (das 200 primeiras UCs, 196 foram inspecionadas depois, com 93,9% de acerto contra 62,7% geral; tabela no D9). Nesse mês a fila tem 39.243 UCs, quase todas de baixa chance, e as páginas são lentas. O passo a passo e a causa da fila longa (a carteira inteira perdeu consumo em 2025) estão no README, na seção da Fatia 05, com a medição no D9; a tela não foi alterada.
