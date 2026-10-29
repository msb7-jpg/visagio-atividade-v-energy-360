# Correções pendentes do projeto

> Lista única do que ainda precisa ser corrigido antes da entrega (04/11/2026).
> Atualizada em 2026-10-29 por Bernardo H, depois da conferência com o banco regerado.
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

## 2. Diagnóstico da receita (Renan e Célio)

- [ ] 🔴 **A conclusão sobre os 4 bairros está errada.** O `docs/DIAGNOSTICO_RECEITA.md` (seção 6.5, linha "Causa: não sabemos") diz que a queda em Iputinga, Macaxeira, Jardim Jordão e Prazeres tem causa desconhecida, e a 6.2 diz que fraude não é causa mensurável. Mas 828 das 871 irregularidades confirmadas em `fato_inspecoes_perdas` (95%) estão nesses bairros, e 887 UCs deles caíram 40% ou mais a partir de mai/2025. Corrigir 1, 6.2, 6.5, 7 e 8.
- [ ] 🔴 **Ainda há 10 `[a preencher]` e 12 `[a confirmar]`** no documento (contagem de 29/10). É entregável obrigatório (case, 5.4).

## 3. IA (Miguel)

- [ ] ⚪ O endpoint de insights aceita `metricas` livres do cliente; o Painel envia os indicadores reais, mas o servidor não confere (apontado pelo Adrian).

## 4. Painel do Diretor (Bernardo)

- [ ] ⚪ Avisar o Célio que `period_totals_query` (`backend/app/features/revenue/queries.py`) perdeu o filtro de competência no `WHERE` para ficar mais rápida (mesmos números, ADR-016).

## 5. Visão 360 (Bernardo)

- [ ] ⚪ Plugar o `SmartInsightCard context="customer360"` (opcional: o case pede IA embutida em pelo menos uma tela, e ela já está no Painel).

## 6. Gestão de Perdas (Adrian)

- [ ] 🟡 **Fila vazia na competência mais recente.** Em jun/2026, todas as 559 UCs com queda de consumo acima de 50% têm painel solar, e a Fila as exclui de propósito. A demonstração precisa de `LOSS_REFERENCE_COMPETENCIA=2025-08` no `.env`. Deixar isso no passo a passo do README e combinar como explicar à banca.
- [ ] ⚪ Adotar o `components/ui/pagination.tsx` (criado no #34) no `QueuePagination`.

## 7. Inteligência Comercial (Célio)

- [ ] 🟡 **A Receita leva cerca de 4,5 s por consulta.** Medido em 29/10 com o banco novo: `/revenue/decomposition` 4,5 s e cada página de `/revenue/breakdown` (classe, município e bairro) 4,5 a 4,6 s. A tela dispara várias dessas ao abrir. Sugestão: o mesmo tratamento da ADR-016 (leitura sequencial sem `WHERE` por competência e cache por janela).
- [ ] ⚪ Registrar no `docs/planning/celio/changelog.md` a correção do filtro de bairro (commit `07a69c0`: a lista lê todas as páginas, e Recife tem 106 bairros).

## 8. Fechamento (todos)

- [ ] 🔴 **README:** suposições de cada fatia, passo a passo de execução (incluindo `LOSS_REFERENCE_COMPETENCIA`), print do Workflow no Databricks e links para o dicionário de dados e o diagnóstico (case, seção 6).
- [ ] 🟡 Rodar `make lint-all`, `make test-all` e `bun run build` na `main` depois de cada merge (o `make` não roda o `tsc`).

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
