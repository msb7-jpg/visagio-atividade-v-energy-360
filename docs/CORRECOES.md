# Correções pendentes do projeto

> Lista única do que ainda precisa ser corrigido antes da entrega (04/11/2026).
> Atualizada em 2026-10-28 por Bernardo H.
>
> 🔴 bloqueia merge ou entrega · 🟡 importante · ⚪ melhoria

### Como usar (regra do `AGENTS.md`, "Pendências transversais")
- **Entra aqui:** problema em código ou dado de outra fatia, ou que depende de mais de um membro: bug, dado errado na Gold, conflito entre PRs, apontamento de revisão ainda aberto.
- **Não entra aqui:** tarefa só da sua fatia (vai no seu checklist em `docs/planning/<membro>/`) e entrega concluída (vai no seu `changelog.md`).
- **Como registrar:** na seção do responsável, com prioridade, evidência (arquivo, linha, número medido ou consulta) e correção sugerida.
- **Ao resolver:** marque `[x]`, anote a data e o PR e mova o item para "Já resolvido". Registre a entrega no seu `changelog.md`.

---

## 1. Dados e pipeline (Renan, com Ryei)

- [ ] 🔴 **Faturas não pagas marcadas como "PAGA" na Gold.** No `faturas.csv`, o sistema legado marca fatura não paga com `status = EM ABERTO` e `data_pagamento` vazia **ou** `9999-12-31`. A Gold trata a data vazia como `VENCIDA`, mas transforma a `9999-12-31` em `PAGA`.
  - **Tamanho:** 60.394 faturas (R$ 12,9 mi) em 33.142 UCs, cerca de 1.250 por mês até jun/2026. Nenhuma fatura tem status `ABERTA` (dentro do prazo) na Gold.
  - **Impacto:**
    - a inadimplência real é cerca de **5,6%, e não 3,6%** (Painel do Diretor e causa 6.3 do diagnóstico);
    - na Visão 360, essas faturas aparecem como pagas e entram na pontualidade com atraso de mais de 8 mil anos (UC100095: atraso médio de 323.605 dias);
    - as "faturas em aberto" da Visão 360 ficam incompletas.
  - **Onde:** `data-engineering/notebooks/fatia02_silver.ipynb` (Fatia 02, Ryei), na regra `CASE WHEN f.data_pagamento IS NOT NULL THEN 'PAGA'`. O texto `9999-12-31` não é nulo, então vira `PAGA`. A Silver da Fatia 01 já trata essa mesma data como vazia em `data_retirada`.
  - **Segundo problema na mesma regra:** `VENCIDA` é decidido com `current_date()`, a data do dia em que o pipeline roda. Rodado depois de jul/2026, nenhuma fatura fica `ABERTA`, e o resultado muda conforme o dia da execução. O certo é comparar com a data de corte da base (2026-06-30).
  - **Correção:** na Silver, tratar `9999-12-31` como data ausente. `EM ABERTO` vira `VENCIDA` quando o vencimento é anterior à data de corte da base, e `ABERTA` quando ainda está no prazo. Depois, regerar o `v_energy.db`.
  - **Conferência:** `SELECT count(*) FROM fato_faturamento WHERE data_pagamento = '9999-12-31'` deve voltar 0, e `status_pagamento` deve ter `ABERTA` nas faturas com vencimento depois de jun/2026.

- [ ] 🟡 **Volume da Gold diferente do texto do case.** A energia faturada cai **5,1%** entre jul/22–jun/23 e jul/25–jun/26, e o case fala em "quase 4%". A receita bate (+8,0%). Sem as 3.510 UCs com painel solar, o volume fica estável (−0,2%): a queda inteira vem da geração solar. Confirmar se a diferença vem da limpeza ou é só arredondamento da fala do diretor, e registrar como suposição no README.

- [ ] ⚪ **Bairros com hífen suave (U+00AD) na `dim_unidade_consumidora`.** Dois bairros (56 UCs) trazem o caractere invisível no lugar do acento: `BRASA<U+00AD>LIA TEIMOSA` e `SA<U+00AD>TIO DOS PINTOS` (grafias certas: `BRASILIA TEIMOSA` e `SITIO DOS PINTOS`).
  - **Impacto:** o mesmo bairro aparece com duas grafias; pesa no filtro de bairro da Continuidade e na tabela de clientes mais afetados.
  - **Evidência:** `SELECT DISTINCT bairro FROM dim_unidade_consumidora WHERE bairro LIKE '%' || char(173) || '%'` (descoberto no ranking de clientes do ALM-REC-008).
  - **Correção sugerida:** remover U+00AD na normalização de texto da Silver (ADR-009).

## 2. Diagnóstico da receita (Renan e Célio)

- [ ] 🔴 **`docs/DIAGNOSTICO_RECEITA.md` ainda é um esqueleto,** com os números `[a preencher]`. É entregável obrigatório do case (seção 5.4): explicar a variação, sustentar as causas com dados e terminar em recomendações com ordem de grandeza do impacto.
- [ ] 🟡 Usar o achado acima: a queda de volume inteira vem das UCs com painel solar.
- [ ] 🟡 Refazer os números por bairro depois da correção dos nomes (item 1).

## 3. PR #35, IA (Miguel)

- [ ] 🔴 **O build quebra.** `bun run build` falha em `frontend/src/features/chat/components/feed/ChatMessage.tsx:66`: o tipo `ChatMessageData` não existe (o import é `ChatMessage as ChatMessageType`). O erro entrou no commit `51d7620`.
- [ ] 🔴 **Conflito com a `main` em 6 arquivos:**
  - `frontend/src/index.css`: manter os tokens do design novo da `main` e acrescentar só as classes do chat;
  - `frontend/src/components/ui/input.tsx`: manter a propriedade `error` da `main` (usada na Gestão de Perdas) junto com o `variant` do PR;
  - `frontend/src/components/layout/AppLayout.tsx`: header da `main`, com o `<ChatDrawer />` no ponto de encaixe;
  - `frontend/package.json` e `bun.lock`: manter `remark-gfm`, `shiki` e `sonner` e regerar o lock;
  - `docs/DECISOES.md`: não reescrever o arquivo; acrescentar as decisões do PR no fim, no formato ADR e com o próximo número livre (hoje a versão do PR usa "Decisão 003/004", números que já existem).
- [ ] 🔴 **Quadro de IA com números fixos no código.** O `SmartInsightCard` está no `DashboardPage` antigo com valores escritos à mão (R$ 85,2 mi, DEC 4,8). O case pede insights fiéis aos dados. Além disso, o Painel do Diretor remove esse arquivo. Tirar o card de lá; ele volta no Painel novo ligado aos indicadores reais (item 4).
- [ ] 🟡 **`AI_MODEL_NAME` do `.env` é ignorado.** Em `backend/app/core/llm_factory/factory.py`, sem `model` na chamada, o padrão fixo de cada provedor substitui o `.env` (com `AI_PROVIDER=local` e `AI_MODEL_NAME="Qwen3.5-4B-Q4_K_M"`, o sistema usa `local-model`). Usar `model or settings.ai_model_name or padrão_do_provedor`, com `ai_model_name` vazio por padrão em `config.py`.
- [ ] 🟡 **Checklist marcado sem o código.** Em `docs/planning/miguel/agente_text_to_sql_ia.md`, linha 79, o item "plugar o `SmartInsightCard` na Visão 360 e no Dashboard de Receita" está `[x]`, mas o card não está nessas telas.
- [ ] ⚪ Endpoint de insights aceita `metrics` livres do cliente; quando houver dados, buscar as métricas no servidor (apontado pelo Adrian).

## 4. Painel do Diretor (Bernardo)

- [ ] 🟡 Abrir o PR de `feat/painel-diretor` e pedir revisão do Adrian (tela) e do João (menu e rotas).
- [ ] 🟡 Quadro de IA no Painel com os indicadores reais, depois do merge do #35 (etapa 7 do plano).
- [ ] ⚪ Avisar o Célio que `period_totals_query` (`backend/app/features/revenue/queries.py`) perdeu o filtro de competência no `WHERE` para ficar mais rápida (mesmos números, ADR-016).

## 5. Visão 360 (Bernardo)

- [ ] 🟡 Abrir o PR de `feat/fatia-03-visao360-gold` (interrupções da UC, inspeções, leitura estimada, busca por nome).
- [ ] ⚪ Plugar o `SmartInsightCard context="customer360"` depois do merge do #35.

## 6. Gestão de Perdas (Adrian)

- [ ] 🟡 **Fila vazia na competência mais recente.** Em jun/2026, todas as 559 UCs com queda de consumo acima de 50% têm painel solar, e a Fila as exclui de propósito. A demonstração precisa de `LOSS_REFERENCE_COMPETENCIA=2025-08` no `.env`. Deixar isso no passo a passo do README e combinar como explicar à banca.
- [ ] ⚪ Adotar o `components/ui/pagination.tsx` (criado no #34) no `QueuePagination`.

## 7. Inteligência Comercial (Célio)

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
- [x] Bairros com o nome corrompido na Gold: UDF `fix_mojibake` implementado na Silver (`fatia01_silver.ipynb`) para reverter dupla codificação UTF-8/Latin-1 antes da remoção de acentos em `bairro`, `municipio`, `logradouro` e `nome_titular`. 61 bairros (348 UCs) unificados; conferência GLOB `*[^ -~]*` validada com zero falhas; testes de qualidade adicionados em `fatia01_testes_qualidade.ipynb` e ADR-009 atualizada. Resolvido na branch `feat/fatia-01-cadastro` em 2026-10-28.
