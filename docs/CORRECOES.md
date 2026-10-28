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

- [ ] 🔴 **Bairros com o nome corrompido na Gold.** 61 bairros de `dim_unidade_consumidora` chegam com erro de acentuação, e o mesmo bairro aparece com dois nomes. Exemplos:

  | Bairro | Nome correto | Nome corrompido |
  |---|---|---|
  | Brasília Teimosa (Recife) | 2.075 UCs | 55 UCs (`BRASA\xadLIA TEIMOSA`) |
  | Águas Compridas (Olinda) | 224 UCs | 12 UCs (`A\x81GUAS COMPRIDAS`) |
  | Várzea (Recife) | 98 UCs | 5 UCs (`VA¡RZEA`) |
  | Jordão (Recife) | 78 UCs | 2 UCs (`JORDA£O`) |
  | Graças (Recife) | 52 UCs | 1 UC (`GRAA§AS`) |

  - **Tamanho:** 348 UCs (0,8% da base) em bairros "fantasmas", em 12 municípios.
  - **Causa:** o arquivo bruto `unidades_consumidoras.csv` mistura textos certos (`Jordão`) com textos em UTF-8 lido como Latin-1 (`Jardim JordÃ£o`). A Silver tira os acentos e põe em maiúsculas (ADR-009), mas não conserta essa codificação antes.
  - **Impacto:** o ranking da Receita, o filtro de bairro, a Visão 360 e os números por bairro do diagnóstico dividem esses bairros em dois.
  - **Correção:** na Silver, antes de tirar os acentos, reverter a codificação quando o texto tiver esse padrão (ex.: `texto.encode("latin-1").decode("utf-8")` com tratamento de erro, ou a biblioteca `ftfy`). Depois, regerar o `v_energy.db`. Aplicar também a `municipio`, `logradouro` e `nome_titular`.
  - **Conferência:** `SELECT bairro FROM dim_unidade_consumidora WHERE bairro GLOB '*[^ -~]*'` deve voltar vazio.

- [ ] 🟡 **Volume da Gold diferente do texto do case.** A energia faturada cai **5,1%** entre jul/22–jun/23 e jul/25–jun/26, e o case fala em "quase 4%". A receita bate (+8,0%). Sem as 3.510 UCs com painel solar, o volume fica estável (−0,2%): a queda inteira vem da geração solar. Confirmar se a diferença vem da limpeza ou é só arredondamento da fala do diretor, e registrar como suposição no README.

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
- [ ] 🟡 **Numeração das ADRs.** A `main` tem ADR-006 a ADR-009 (Fatia 01); a branch da Visão 360 usa ADR-006 a ADR-012; o Painel usa ADR-010 a ADR-016. Quem entrar depois na `main` renumera as suas.
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
- [x] Painel do Diretor: conflito com a `main` depois do merge do #34 (`navItems.ts` e `RbacNavigation.test.tsx`). Menu do diretor: Painel, Inteligência Comercial, Gestão de Perdas, Qualidade da Rede, Visão 360. Resolvido na branch `feat/painel-diretor` em 2026-10-28.
- [x] Painel do Diretor: lentidão (de 11 s para 0,01 s) e inadimplência marcada como "piorou" por +0,05 ponto percentual (ADR-011 e ADR-016), em 2026-10-28.
