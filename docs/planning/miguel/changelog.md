# 📝 Diário de Bordo — Fatia 07 (Miguel)
**Fatia:** Agente Text-to-SQL, IA Embutida & Avaliação (Fullstack IA)  
**Dono:** Miguel

---

## Registros de Execução

### [2026-10-31] - Atendimento às Devolutivas de Design: IA Recolhível e Foco Executivo (Issues #65 e #69)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Issue #65: Resposta da IA em Linguagem Natural com Auditoria Recolhida e Rótulos de Negócio:**
    - Reordenada a hierarquia visual em `frontend/src/features/chat/components/feed/ChatMessage.tsx`: a resposta sintetizada em linguagem natural (`MarkdownRenderer`) com valores e tabelas destacados agora é renderizada no topo do balão de resposta.
    - Criado o componente especializado `AiAuditBlock.tsx` (`frontend/src/features/chat/components/feed/AiAuditBlock.tsx`), agrupando `NodeStepper`, `ThoughtInspector` e `SqlCodeBlock` dentro de um bloco sanfonado recolhido por padrão: *"Ver raciocínio da IA (Auditoria)"*, reduzindo a carga cognitiva para o Diretor Comercial Henrique Duarte e mantendo 100% de transparência técnica para a Diretoria de Tecnologia (Patrícia Lins).
    - Durante o streaming ativo inicial (`isStreaming && !message.content`), exibe um feedback executivo amigável (*"Consultando registros da distribuidora..."*), migrando dinamicamente para o texto assim que os tokens chegam.
    - Atualizados os rótulos dos nós da FSM (`backend/app/core/constants.py`) para linguagem de negócio clara: *"Compreendendo o pedido"*, *"Localizando indicadores no sistema"*, *"Garantindo segurança da consulta"*, *"Consultando base de dados da distribuidora"*, *"Refinando precisão da consulta"* e *"Preparando síntese executiva"*.
    - Criada suíte de testes unitários em `frontend/src/features/chat/components/feed/ChatMessage.test.tsx` cobrindo a priorização da resposta, a auditoria recolhida e a alternância de estado.
  - **Issue #69: SmartInsightCard Recolhível por Padrão com Persistência em `localStorage`:**
    - Refatorado `frontend/src/features/insights/SmartInsightCard.tsx` para iniciar recolhido em barra compacta horizontal (`py-2 px-3`), com o ícone `Sparkles`, badge de contexto e prévia de uma linha do resumo executivo, liberando espaço visual imediato para os gráficos e KPIs do Painel do Diretor (`ExecutiveDashboardPage.tsx`).
    - Adicionado botão de toggle (*"Expandir"* / *"Minimizar"*) e persistência da preferência do usuário via `localStorage` sob chave `venergy_insight_collapsed_${context}` com tratamento seguro em `try/catch`.
    - Ajustado para conformidade estrita com as regras do Design System (`design.md` e linter `shadcn/no-restyle`), utilizando apenas variantes de Card e tamanhos oficiais de Button.
    - Atualizados os testes unitários em `frontend/src/features/insights/SmartInsightCard.test.tsx` cobrindo o estado recolhido inicial, expansão/minimização e respeito à preferência salva.
  - **Validação de Qualidade e Governança:**
    - `make lint-backend`: 10.00/10 no Pylint, Ruff sem advertências e 4/4 contratos do import-linter respeitados.
    - `make lint-frontend`: ESLint 100% limpo e Fallow com 0 arquivos acima do teto de 150 LOC e 0% de duplicação.
    - `make test-all`: 709 testes do backend e 544 testes do frontend aprovados (total de 1.253 testes verdes).


### [2026-10-30] - Execução Local dos Notebooks do Lakehouse via Feature Flags (`IS_DATABRICKS`), Script Único e Alembic
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Feature Flag Dual-Runtime nos 10 Notebooks (`data-engineering/notebooks/*.ipynb`):**
    - Adicionada detecção automática `IS_DATABRICKS = "DATABRICKS_RUNTIME_VERSION" in os.environ` na célula de inicialização de todos os 10 notebooks das Fatias 01 e 02 (`fatia01_bronze`, `fatia01_silver`, `fatia01_gold`, `fatia01_export_sqlite`, `fatia01_testes_qualidade`, `fatia02_bronze`, `fatia02_silver`, `fatia02_gold`, `fatia02_testes_qualidade`, `fatia02_export_sqlite`).
    - No Databricks Serverless, o comportamento permanece 100% inalterado e sem dependências externas.
    - Fora do Databricks (Jupyter Kernel local no VS Code ou CLI), carrega `data-engineering/notebooks/local_runtime.py`.
  - **Runtime Local com PySpark + Delta Lake (`data-engineering/notebooks/local_runtime.py`):**
    - Configura `SparkSession` local com `delta-spark`, catálogo Delta e alias nativo Catalyst para `try_to_date` → `to_date`.
    - Registra automaticamente tabelas Delta existentes em `data/lakehouse/{bronze,silver,gold}.db/` a cada início de sessão, eliminando conflitos de lock de metastore Derby quando múltiplos notebooks estão abertos.
    - Fornece shim local para `dbutils.fs` (`ls`, `cp`, `rm`) e sincroniza `aneel_limites_continuidade.csv` para `data/landing/`.
  - **Integração Formal do Alembic (`backend/alembic.ini` & `backend/migrations/`):**
    - Configurado Alembic em `backend/migrations/env.py` com filtro `include_object` que gerencia exclusivamente as tabelas operacionais do ORM (`ordem_inspecao`) e ignora as tabelas analíticas do Lakehouse.
    - Criada a migração `0001_create_and_upgrade_ordem_inspecao.py` (idempotente) e adicionados testes automatizados em `backend/tests/test_loss_schema_upgrade.py`.
  - **Orquestrador Local em Comando Único (`scripts/run_pipeline_local.sh` & `make pipeline-local`):**
    - Criado script `.sh` que executa todos os 10 notebooks na ordem exata do DAG (`data-engineering/job.yaml`) via `nbclient` (Jupyter Kernel `python3`), publica o `backend/v_energy.db` atualizado (773 MB, 0 bairros corrompidos por mojibake, 33/33 testes críticos Fatia 01 e 26/26 testes Fatia 02 aprovados) e aplica `alembic upgrade head` ao final.

### [2026-10-29] - Fechamento de Robustez GenAI: Execution Accuracy, Suíte de Recusa, Fidelidade Numérica e Benchmark Local
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Métrica Real de Execution Accuracy (EX) com `result_comparator.py`:**
    - Criado comparador semântico agnóstico a aliases e ordenação de colunas em `app/agent/utils/result_comparator.py` (Pure Python), suportando tolerância para ponto flutuante (`math.isclose` com `rel_tol=1e-3, abs_tol=0.05`), escalares isolados (`SUM`, `COUNT`, `AVG`) e multiconjuntos de linhas.
    - O script de avaliação `evaluate_agent.py` agora executa a consulta canônica esperada no banco real `v_energy.db` e compara o conjunto de dados retornado pelo agente com o gabarito real, acabando com a limitação de apenas verificar se a query rodou sem erros.
  - **Suíte de Recusa Obrigatória ("Não Sei" / Escopo / Segurança) no Golden Dataset:**
    - Expandido o dataset `backend/tests/golden_dataset.json` de 25 para **36 casos**:
      - 28 casos analíticos (`tipo: "sql"`), incluindo as 3 perguntas canônicas das lideranças Patrícia (#26 - queda solar > 30% em Olinda: 153 UCs), Henrique (#27 - bairro perdendo mais volume: Iputinga) e Henrique (#28 - receita comercial em Jaboatão: -5,12%).
      - 8 casos de recusa mandatória (`tipo: "recusa"`, #29 a #36), cobrindo dados inexistentes (CPF de cliente, dados climáticos/chuva), fora da área de concessão (Caruaru), fora do período temporal (2020), tentativa de injeção de prompt e comandos de mutação DDL/DML (`DROP TABLE`, `DELETE`, `UPDATE`).
  - **Conferência Semântica de Fidelidade aos Dados (`faithfulness_checker.py` & `insights_service.py`):**
    - Criado o verificador de fidelidade em `app/agent/utils/faithfulness_checker.py` com regex que analisa citações numéricas em Markdown (lidando com pontuação brasileira e internacional, moedas `R$`, percentuais e inteiros) e valida se pertencem ao conjunto de dados real retornado pelo SQLite ou às métricas do painel.
    - Integrada a validação em `app/features/chat/insights_service.py` (`_filter_faithful_insights`), expurgando qualquer insight ou bullet point que contenha números inventados antes de entregar a resposta na interface do Painel do Diretor.
    - Sanada a pendência transversal da seção 3 do `docs/CORRECOES.md`.
  - **Integração e Benchmark com Modelo Local (`Qwen3.5-4B-Q4_K_M` via `lcpp`):**
    - Configurado o servidor `llama-server` com `LD_PRELOAD` resolvendo compatibilidade de ABI com CUDA na GPU RTX 5060, escutando em `http://127.0.0.1:8080/v1`.
    - Atualizados `backend/.env`, `config.py` e provedor `local.py` para utilizar o modelo local como padrão.
    - Criada suíte de testes de integração em `backend/tests/test_agent_integration.py` cobrindo o comparador, o checador de fidelidade, a filtragem do `insights_service`, a recusa de escopo e o bloqueio de segurança contra mutações.
    - **Execução Real do Benchmark (36 casos contra `Qwen3.5-4B-Q4_K_M.gguf`):**
      - Taxa de Recusa Correta ("Não Sei" / Segurança): **100,0%** (8/8 casos de recusa cumpridos com sucesso).
      - Execução sem erro no SQLite: **82,14%**.
      - Execution Accuracy (EX - Acerto Semântico Real): **53,57%**.
      - Fidelidade aos Dados (Groundedness Score): **83,33%**.
      - Latência p50: **35,6 s** (ciclo completo de 4 nós: roteamento, geração SQL, execução e síntese analítica).
      - Relatórios gerados em `docs/planning/miguel/benchmark_resultado.json` e `benchmark_resultado.md`.
- **Validação:**
  - `make lint-backend`: 100% verde (Ruff limpo, Pylint 10.00/10, import-linter 4/4 contratos preservados).
  - `make lint-frontend`: 100% verde (ESLint limpo, Fallow 0 violações, 0 duplicações).
  - `cd frontend && bun run build`: 100% verde (0 erros de tipagem TypeScript).
  - `cd frontend && bun run test`: 100% verde (65 suítes, 539 testes vitest aprovados).
  - `pytest tests/test_agent*.py`: 100% verde (16 testes unitários e de integração do agente aprovados).

### [2026-10-28] - Harmonização Visual e Padronização de Labels da Tabela Executiva (`IndicatorsTable.tsx`)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Rastreamento Ponta a Ponta das Colunas e Métricas:**
    - Elaborado plano e documentação de rastreamento completo de linhagem de dados para os 11 indicadores do Painel do Diretor desde a camada Gold SQLite (`fato_faturamento`, `fato_ocorrencias_rede`, `fato_atendimentos`, `fato_medicao`, `dim_unidade_consumidora`) até os DTOs e formatadores frontend.
  - **Padronização de Labels e Variação em Pontos Percentuais (`indicatorFormatters.ts`):**
    - Corrigido o bug que gerava `+0,05% ponto percentual` e `-3,1% pontos percentuais` com duplicidade de `%` e quebra de linha.
    - Implementada a notação regulatória e executiva concisa **`p.p.`** (ex: `+0,05 p.p.` e `-3,1 p.p.`), com `title` e `aria-label` para acessibilidade.
    - Padronizados sufixos e casas decimais das unidades em `UNIT_FORMATTERS`:
      - `UCS`: formatado com sufixo `UCs` (`45.000 UCs`, `3.510 UCs`).
      - `PCT`: precisão estável de 1 casa decimal (`19,0%` vs `15,9%`).
      - `NOTA`: formato explícito da escala de avaliação (`4,10 / 5` e `3,90 / 5`).
      - `VEZES`: 2 casas decimais consistentes (`0,90 vezes` vs `1,31 vezes`).
  - **Harmonização do Layout da Tabela (`IndicatorsTable.tsx`):**
    - Corrigido o bug conceitual onde `SEM_COMPARACAO` (ex.: painel solar de base zero) exibia o artefato confuso `≈ —`, agora exibindo unicamente `—`.
    - Ajustado o tratamento de indicadores neutros (`INFORMATIVO`, como tarifa média que subiu +13,8%): exibem seta indicativa de tendência com cor neutra em vez do símbolo de aproximação `≈`.
    - Harmonizadas larguras estáveis de colunas na escala do Design System sem quebra de linhas (`whitespace-nowrap` nas colunas numéricas de Base, Atual e Variação).
    - Código mantido com 141 linhas (respeitando o limite $\le 150$ LOC do Fallow).
  - **Ajustes de Testes Vitest:**
    - Atualizados `dashboardPeriods.test.ts` e `ExecutiveDashboardPage.test.tsx` para cobrirem a nova notação `p.p.`, sufixos e alinhamento decimal.
- **Validação:**
  - `make lint-all`: 100% aprovado (Ruff, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint, Fallow).
  - `make test-all`: 100% aprovado (655 testes backend pytest + 391 testes frontend vitest).

---

### [2026-10-28] - Resolução dos Comentários da 2ª Rodada de Revisão (Bernardo) & Sincronização com `main`
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Alinhamento Completo do Catálogo do Agente à Camada Gold Real (`catalog_prompt.py`):**
    - Atualizados schemas das 7 tabelas analíticas conforme `DATA_DICTIONARY.md`: `dim_unidade_consumidora`, `fato_medicao`, `fato_faturamento`, `fato_qualidade_alimentador`, `fato_ocorrencias_rede`, `fato_atendimentos` e `fato_inspecoes_perdas`.
    - Substituídas colunas inexistentes (`codigo_uc` -> `id_uc`, `mes_ano` -> `competencia`, `valor_faturado_reais` -> `valor_total_rs`, `dec_apurado` -> `dec_apurado_horas`, `fec_apurado` -> `fec_apurado_vezes`, `energia_recuperada_kwh` -> `kwh_recuperado`, `tipo_fraude` -> `tipo_irregularidade`).
    - Enriquecido com os valores categóricos reais em MAIÚSCULAS e sem acentos (`RESIDENCIAL`, `JABOATAO DOS GUARARAPES`, `FATURA`, `FALTA DE ENERGIA`, `ENCERRADO`, etc.) e mapeamento semântico de termos cotidianos.
  - **Reescrita e Validação do Golden Dataset (`tests/golden_dataset.json`):**
    - Todas as 25 perguntas e queries analíticas reescritas e validadas contra o SQLite real `backend/v_energy.db`, retornando 100% de dados válidos e coerentes.
  - **IA Embutida no Painel do Diretor (`ExecutiveDashboardPage.tsx`):**
    - Integrado o `<SmartInsightCard context="executive" />` diretamente no Painel do Diretor (`features/executive_dashboard/components/ExecutiveDashboardPage.tsx`), alimentado com os indicadores reais recebidos de `GET /api/v1/dashboard/indicators`.
    - Aceita a remoção do antigo `DashboardPage.tsx` consolidando o fluxo no Painel do Diretor.
  - **Sincronização de Decisões de Arquitetura (`docs/DECISOES.md` e `ROADMAP.md`):**
    - Preservadas as decisões ADR-001 a ADR-025 de toda a equipe e registradas as decisões da Fatia 07 no final como **ADR-026** (purgação de nós de gráficos na FSM) e **ADR-027** (assistente flutuante não-bloqueante).
    - Preservada a linha e escopo da equipe no `docs/planning/ROADMAP.md`.
  - **Estabilidade do Gerenciador de Pacotes e Lockfile (`frontend/bun.lock`):**
    - Lockfile restaurado a partir da `origin/main` e pacotes `react-markdown`, `remark-gfm`, `shiki` reinstalados, sanando inconsistências de exportação do ESLint.
  - **Prioridade e Respeito a `AI_MODEL_NAME` na LLM Factory (`backend/app/core/`):**
    - `config.py` e `factory.py` ajustados para garantir precedência do modelo especificado no `.env` (ex: `Qwen3.5-4B-Q4_K_M` em provedores locais).
- **Validação:**
  - `bun run build`: 100% aprovado (0 erros).
  - `make lint-all`: 100% aprovado (Ruff, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint, Fallow).
  - `make test-all`: 100% aprovado (655 testes backend pytest + 391 testes frontend vitest).

---

### [2026-10-27] - Resolução Integral do Code Review do PR #35 (Miguel)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Quality Gates e Conformidade Estrita com Linters:**
    - Revertido `"complexity-crap": "error"` no `frontend/.fallowrc.jsonc`.
    - Refatoradas e simplificadas as funções `drainReader` (lib de streaming) e `AssistantChatMessage` (feed do chat), mantendo o score CRAP e a complexidade ciclomática/cognitiva bem abaixo dos tetos permitidos (0 violações no Fallow).
    - Removidos 5 arquivos mortos legados com supressão: `AgentStepProgress.tsx`, `ChatInput.tsx`, `ChatMessageBubble.tsx`, `SqlAuditAccordion.tsx` e `DirectionalSlide.tsx`.
    - Removidas supressões obsoletas `fallow-ignore-file unused-file` em `sheet.tsx` e `tooltip-card.tsx`.
  - **Isolamento de Sessão por Usuário no LangGraph (`router.py`):**
    - Conversas no checkpointer `MemorySaver` agora isoladas por usuário via composição de chave `f"{current_user.id}:{thread_id}"`, impedindo vazamento de histórico entre diferentes papéis (Diretoria vs Atendimento).
  - **Unificação Canônica de Endpoints:**
    - Rotas de IA consolidadas exclusivamente nos contratos canônicos da especificação: `POST /api/v1/chat/stream` e `POST /api/v1/ai/insights`.
    - Removidos aliases redundantes e atualizados clientes no frontend (`useAgentStream.ts` e `insightsApi.ts`).
  - **Resiliência da Factory LLM e Configurações:**
    - Implementado fallback inteligente por provedor em `factory.py` (modelos com prefixo no OpenRouter e padrão `gemini-2.5-flash-lite` no Google).
    - Documentados exemplos de `OPENROUTER_API_KEY` e provedores no `.env.example`.
  - **Tratamento de Exceções e Schema no Insights Service:**
    - Validação de tipagem explícita para lista de strings em `insights` e texto em `resumo_executivo`, diferenciando logs de erro de decodificação JSON de falhas de conectividade.
  - **Race Condition Corrigida no Streaming do Frontend (`useAgentStream.ts`):**
    - Verificação de referência `abortControllerRef.current === abortController` no bloco `finally`, prevenindo interferência de cancelamentos em novas mensagens.
  - **Parametrização do Benchmark (`evaluate_agent.py`):**
    - Adicionado suporte a flags CLI `--provider` e `--model` (e variáveis de ambiente `EVAL_PROVIDER`), executado em loop único de eventos assíncronos.
  - **Acessibilidade e Design System:**
    - Removido `<div onClick>` redundante em volta do botão disparador do chat em `ChatWidgetTrigger.tsx`.
    - Removido `!important` do `index.css` e adotada a variante `variant="embedded"` no `Input.tsx`.
    - Documentada a sanitização do realce de sintaxe SQL via Shiki em `SqlCodeBlock.tsx`.
    - Ajustado texto de integridade e política de não-alucinação em `catalog_prompt.py` para citar exatamente `"Região Metropolitana do Recife"`.
    - Removida imagem órfã `issue-mini-chat.png` e script `populate_sqlite_from_landing.py` do versionamento Git (movido para pasta local com `.gitignore`).
    - Registradas Decisões 003 e 004 em `docs/DECISOES.md`.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint, Fallow).
  - `make test-all`: 100% verde (537 testes pytest + 185 testes vitest).

---

### [2026-10-25] - Remoção Completa da Geração de Gráficos na Fatia 07 (Miguel)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Simplificação Arquitetural da FSM do LangGraph (`backend/app/agent/`):**
    - Removido o nó `chart_generator_node` do fluxo executivo do agente.
    - Na transição pós-execução SQL (`check_sql_execution`), execuções bem-sucedidas agora direcionam diretamente para `synthesizer_node`.
    - Excluídos módulos e ferramentas de suporte a gráficos: `nodes/chart_generator.py`, `tools/chart_builder.py`, `schemas/chart_schema.py` e `prompts/chart_prompt.py`.
    - Movido `TABLE_PRESENT_PROMPT` para `prompts/synthesizer_prompt.py`, priorizando respostas analíticas tabulares limpas em Markdown.
    - Removido o slash command `/chart` de `KNOWN_COMMANDS` e do roteador `router_node`.
    - Removido o campo `chart_spec` de `AgentState`, `AgentStateUpdate` e do despacho SSE em `event_dispatcher.py`.
    - Removidos enums `AgentNode.CHART_GENERATOR`, `SSEEventType.CHART` e `ChartType` em `constants.py`.
  - **Limpeza no Frontend do Chat (`frontend/src/features/chat/`):**
    - Removido o componente `InteractiveChartCard.tsx`.
    - Removido suporte ao evento SSE `chart` e à especificação `ChartSpec` de `chatMessageReducer.ts` e `types/chat.types.ts`.
    - Removido o botão "Gerar Gráfico" (`onGenerateChart` / `hasChart`) em `ChatMessageActions.tsx`, `ChatMessage.tsx` e `ChatContainer.tsx`.
    - Atualizados `MarkdownRenderer.tsx` e testes unitários (`chatMessageReducer.test.ts`, `test_agent_graph.py`).
  - **Atualização da Documentação:**
    - Atualizados `docs/STATE_MACHINE.md`, `ROADMAP.md`, `README.md` e `agente_text_to_sql_ia.md`.
- **Validação de Testes e Linters:**
  - `make lint-all` e `make test-all`.

---

### [2026-10-25] - Encaixe do ChatDrawer Global no AppLayout, SmartInsightCard no Dashboard e Carga SQLite (Miguel)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Encaixe do `<ChatDrawer />` no Layout Global (`AppLayout.tsx`):**
    - Com a introdução do novo shell compartilhado `AppLayout.tsx` (Fatia 06), o botão do ChatDrawer agora reside no cabeçalho fixo global superior, ficando disponível de forma consistente em todas as telas da plataforma (`/dashboard`, `/revenue`, `/losses`, `/quality`, `/customers`).
  - **Inserção Proativa do `<SmartInsightCard />` no Dashboard:**
    - Reincorporado `<SmartInsightCard context="revenue" metrics={{...}} />` no topo do `DashboardPage.tsx` com métricas analíticas operacionais completas, gerando diagnósticos com suporte ao provedor ativo ou mock local.
  - **Script de População SQLite Automatizado (`scripts/populate_sqlite_from_landing.py`):**
    - Desenvolvido e executado script de ingestão a partir dos arquivos CSV descompactados de `data/landing/` para o banco SQLite local (`backend/v_energy.db`):
      - `dim_unidade_consumidora`: 46.461 UCs reais populadas.
      - `fato_faturamento`: 100.000 faturas detalhadas populadas.
      - `fato_qualidade_alimentador`: 5.856 registros mensais contendo o schema completo de 15 colunas com DEC/FEC apurados e acumulados ano (DEC/FEC YTD), sanando o erro 500 em `GET /api/v1/quality/indicators`.
      - `fato_atendimentos`: 50.000 chamados populados com tempos de atendimento.
  - **Sincronização com `origin/main` (Rebase):**
    - Integrados 74 commits da equipe principal com resolução limpa de conflitos em rotas, dependências e interfaces.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint, Fallow com maintainability 91.9).
  - `make test-all`: 100% verde (537 testes backend pytest + 182 testes frontend vitest).

---

### [2026-10-25] - Transformação Proativa do SmartInsightCard & Resiliência de IA (Miguel)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Experiência Proativa ("Thought you might wanna know this..."):**
    - Refatorado `SmartInsightCard.tsx` para carregar insights contextuais proativamente via TanStack Query v5 sem demandar clique do usuário.
    - Criados `frontend/src/features/insights/api/insightsApi.ts` e `frontend/src/features/insights/queries/useProactiveInsights.ts` com cache `staleTime: 5 min` e cancelamento seguro com `AbortSignal`.
    - Adicionado suporte a estado limpo e não intrusivo: se o provedor de IA estiver indisponível ou retornar erro (ex: 503), o componente não renderiza nada (`return null`), evitando poluição visual.
    - Exibe Skeleton suave durante o carregamento inicial e botão minimalista `RotateCw` para refresh sob demanda.
  - **Serviço de Insights no Backend Conectado ao LLM Real:**
    - Criado serviço Pure Python `backend/app/features/chat/insights_service.py` isolado e desacoplado de frameworks HTTP, respeitando os contratos do `import-linter`.
    - Conectado ao `get_chat_model()` com prompt de especialista do setor elétrico brasileiro (V-Energy), gerando síntese de impacto regulatório/financeiro em JSON puro (`resumo_executivo` e `insights`).
    - Lança `ServiceUnavailableError` caso não haja provedor de IA online configurado, instruindo a UI a ocultar o card de maneira elegante.
    - Adicionado suporte a mock de insights determinístico em `GroundedMockStrategy` para testes e cenários offline.
  - **Testes Unitários:**
    - Atualizado `SmartInsightCard.test.tsx` com cenários de ausência de renderização em erro/503, exibição de skeleton em loading e renderização correta de dados recebidos.
    - Atualizado `test_agent_stream.py` cobrindo o novo comportamento do endpoint.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint, Fallow).
  - `make test-all`: 100% verde (293 testes backend pytest + 50 testes frontend vitest).

---

### [2026-10-23] - Exposição Global do Chat, Correção de Auth JWT, Gráficos Interativos e Memória Follow-up (Miguel)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Exposição Global do `<ChatDrawer />` e `<SmartInsightCard />`:**
    - Integrado `<ChatDrawer />` nos cabeçalhos de `DashboardPage.tsx` e `LossManagementPage.tsx` (Fatia 05), permitindo acesso ao Assistente Text-to-SQL em todas as rotas autenticadas ativas.
    - Integrado `<SmartInsightCard context="revenue" />` na tela principal do `DashboardPage.tsx` e adicionado link de navegação direta do card "Fila de Perdas" para `/losses`.
    - Aprimorado `ChatDrawer.tsx` com `<EmptyState />` e 3 botões de sugestões rápidas clicáveis para demonstração imediata.
  - **Correção de Autenticação JWT no Streaming SSE e Insights:**
    - Atualizados `useAgentStream.ts` e `SmartInsightCard.tsx` para ler o token via `getStoredToken()` (`venergy_access_token`) de `@/features/auth/utils/token`, eliminando falhas `401 Unauthorized`.
  - **Suporte Real a Follow-up Conversacional (`thread_id` + `MemorySaver`):**
    - Em `backend/app/features/chat/router.py`, configurado `MemorySaver` no `create_agent_graph(checkpointer=memory_checkpointer)` e adicionados os aliases de rota canônicos `/api/v1/chat/stream` e `/api/v1/ai/insights` (com suporte também ao contexto `losses`).
    - Em `useAgentStream.ts`, capturado o `thread_id` emitido no evento SSE `session` e reenviado nas mensagens seguintes da mesma sessão (resetando ao limpar o histórico).
  - **Renderizador de Gráficos (`InteractiveChartCard.tsx`) & Auditoria SQL Completa:**
    - Criado `InteractiveChartCard.tsx` com barras proporcionais em classes semânticas Tailwind (sem inline styles), integrado em `ChatMessageBubble.tsx`.
    - Normalizado `handleChartEvent` e `handleDataEvent` em `chatMessageReducer.ts` para suportar o formato `ChartJsConfigDTO` e contabilizar `row_count`, exibido ao lado de `durationMs` em `SqlAuditAccordion.tsx`.
  - **Alinhamento do Catálogo Semântico & Avaliação Completa (`evaluate_agent.py`):**
    - Sincronizado `catalog_prompt.py` com os nomes reais de colunas das Fatias 01, 02, 04 e 05 (`id_uc`, `competencia`, `valor_total_rs`, `consumo_faturado_kwh`, `ordem_inspecao`).
    - Evoluído `backend/scripts/evaluate_agent.py` para executar o grafo FSM sobre os 25 casos do `golden_dataset.json`, reportando `syntactic_validity_pct` (100%), `execution_accuracy_pct` (100%) e `average_latency_ms`.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff ok, Pylint 10.00/10, import-linter 4/4 kept, ESLint 0 erros/0 warnings, Fallow maintainability 91.6 com 0 erros).
  - `make test-all`: 100% verde (pytest backend + vitest frontend).

---

### [2026-10-20] - Implementação Conclusiva da Fatia 07 (Miguel)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - **Catálogo Semântico & Prompting:** Enriquecido `catalog_prompt.py` com o schema consolidado das tabelas analíticas Gold (`dim_unidade_consumidora`, `fato_medicao`, `fato_faturamento`, `fato_qualidade_alimentador`, `fato_atendimentos`, `fato_inspecoes_perdas`) e mapeamento canônico de termos cotidianos ("conta de luz", "falta de luz", "gato", "painel solar", DEC/FEC).
  - **IA Embutida e Proativa:** Implementado endpoint `POST /api/v1/agent/insights` (e alias `POST /api/v1/agent/ai/insights`) no backend, fornecendo síntese executiva contextualizada para as telas de Visão 360 e Receita.
  - **Frontend Streaming Headless & Reducer:** Criados os utilitários de transporte e decodificação SSE (`sseStreamParser.ts`), reducer de mensagens imutável (`chatMessageReducer.ts`) e hook headless `useAgentStream.ts` com cancelamento seguro via `AbortController`.
  - **Componentes de UI Conformes ao Design System (`design.md`):**
    - `ChatDrawer.tsx`: Gaveta lateral global com Sheet, badge seguro read-only e alternância de estado limpo.
    - `ChatMessageBubble.tsx`: Balão com renderização Markdown rica e integração de progresso e auditoria.
    - `AgentStepProgress.tsx`: Timeline com status dos nós da FSM (`StepStatus`).
    - `SqlAuditAccordion.tsx`: Sanfona de auditoria para inspeção da consulta SQL e telemetria (ms).
    - `SmartInsightCard.tsx`: Card de IA embutida em `<Card variant="glass">` com botão de acionamento assíncrono.
  - **Golden Dataset & Framework de Avaliação Automatizada:** Criado `backend/tests/golden_dataset.json` com 25 casos de teste de negócio cobrindo faturamento, perdas, GD, qualidade de rede e atendimento, acompanhado de `backend/scripts/evaluate_agent.py` alcançando 100% de validade sintática e segurança AST.
  - **Testes Unitários:** Adicionados testes Vitest no frontend para o parser SSE (`sseStreamParser.test.ts`), reducer (`chatMessageReducer.test.ts`), renderização da gaveta (`ChatDrawer.test.tsx`) e card de insights (`SmartInsightCard.test.tsx`).
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff ok, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint 0 erros/warnings, Fallow 89.2 maintainability sem violações).
  - `make test-all`: 100% verde (12 pytest backend, 5 arquivos / 11 testes vitest frontend).

---

### [2026-10-16] - Inicialização do Planejamento da Fatia 07
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Estruturação do checklist operacional em `07_ai_agent_and_insights.md`.
  - Mapeamento das regras de anti-alucinação, catálogo semântico com jargões e máquina de estados LangGraph FSM em `docs/STATE_MACHINE.md`.
- **Dificuldades / Desafios:**
  - Garantir tempo de resposta streaming fluido via SSE e zero risco de alucinação quando a query SQLite não encontrar registros.
- **Próximos Passos:**
  - Refinar o prompt semântico com schemas reais da Gold e criar o Golden Dataset de benchmark com 25+ perguntas.
- **Validação de Testes:**
  - Testes base do agente passando com sucesso (`test_agent_graph.py`, `test_agent_security.py`, `test_agent_stream.py`).

### [2026-10-16] - Adaptação Global ao Design System "SaaS Enterprise Analytics" (`design.md`)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Migração de todas as variáveis globais e tokens de cor em `frontend/src/index.css` para a paleta corporativa Dark Navy (`#0F172A`), Royal Blue (`#1E40AF`), Blue (`#3B82F6`), Light Blue (`#60A5FA`), White (`#FFFFFF`) e Light Grey (`#F8FAFC`).
  - Atualização do raio base de cantos para 12px (`--radius: 0.75rem` / `rounded-xl`) conforme padrão `design.md`.
  - Configuração de tipografia com Google Fonts (`Inter` e `JetBrains Mono`) e metadados no `frontend/index.html`.
  - Atualização das instruções de governança em `frontend/design-system.lint.json`.
  - Refatoração dos componentes de UI (`button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `table.tsx`):
    - `Button`: adicionada prop/variante `fullWidth`, raio de 12px, font-semibold e efeito tátil `active:translate-y-px`.
    - `Card`: adicionadas variantes `glass` e `interactive` com `cva`, cantos de 12px e bordas semânticas.
    - `Input`: raio de 12px e anel de foco `ring-2 ring-offset-2`.
    - `Badge`: raio `rounded-lg` e indentação de 2 espaços.
    - `Table`: estilização corporativa com `border-border`.
  - Correção dos componentes de feedback (`LoadingSkeleton.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`) e telas (`LoginPage.tsx`, `DashboardPage.tsx`, `AuthProvider.tsx`).
  - Resolução de todas as 48 inconsistências de linter e JSDoc no frontend.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff, Pylint 10/10, import-linter 4/4 contracts kept, ESLint 0 erros/0 warnings, Fallow maintainability 91.0).
  - `make test-all`: 100% verde (12 pytest backend, 1 vitest frontend).

### [2026-10-16] - Calibração do design.md e Padrão de Commit Semântico no AGENTS.md
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Enriquecimento e calibração profunda do `design.md` tornando-o uma especificação canônica, autocontida e 100% compatível com a codebase (tokens semânticos Tailwind v4, classes semânticas, `min-h-dvh`, contratos de `Button fullWidth`, variantes de `Card` e receitas de UI completas).
  - Atualização do `AGENTS.md` com o **Padrão de Commit Semântico** (`<tipo>(<escopo>): <descrição>`), mapeando escopos para as 7 fatias e domínios transversais.
  - Vinculação formal do `design.md` na tabela de documentos mestres e na governança inegociável do frontend no `AGENTS.md`.
  - Refatoração de otimização em `src/components/ui/tooltip-card.tsx` para simplificação de complexidade ciclomática e cognitivo.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff, Pylint 10.00/10, import-linter 4/4, ESLint 0 erros/0 warnings, Fallow 0 threshold violations).
### [2026-10-16] - Expansão de Componentes UI do Design System & Mapeamento nas Fatias
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Adaptação dos componentes recém-adicionados (`dialog.tsx`, `alert-dialog.tsx`, `select.tsx`, `spinner.tsx`, `tooltip-card.tsx`) para total conformidade com o `design.md` (raio de 12px `rounded-xl`, `bg-card`, backdrop blur semântico, `size-*` canônico para o spinner, e redução de CRAP em `tooltip-card.tsx`).
  - Criação de novos componentes de UI de alto valor referenciados nas diretrizes de frontend:
    - `tabs.tsx` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` baseados em `@base-ui/react/tabs`).
    - `sheet.tsx` (`Sheet`, `SheetContent`, etc. com suporte a gavetas laterais direcionadas).
    - `separator.tsx` (divisor semântico horizontal e vertical).
    - `textarea.tsx` (campo multilinha com foco corporativo `ring-primary`).
    - `label.tsx` (etiqueta acessível com suporte a asterisco de obrigatoriedade).
  - Mapeamento e documentação explícita dos componentes recomendados em cada planejamento de fatia vertical (`visao_360_uc.md`, `inteligencia_comercial_receita.md`, `gestao_perdas_campo.md`, `qualidade_rede_rbac.md`, `agente_text_to_sql_ia.md`).
  - Criação da tabela consolidada de componentes de UI por fatia no Plano Diretor `docs/planning/ROADMAP.md`.
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (Ruff, Pylint 10.00/10, import-linter 4/4 kept, ESLint 0 erros/0 warnings, Fallow 0 threshold violations, maintainability 87.3).
  - `make test-all`: 100% verde (12 testes pytest backend, 1 vitest frontend).

### [2026-10-16] - Configuração de Dark Mode por Padrão (Dark by Default)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Configuração do Dark Mode como padrão em toda a aplicação:
    - Adicionada a classe `dark` diretamente na tag raiz em `frontend/index.html` (`<html lang="pt-BR" class="dark">`), garantindo renderização instantânea sem flash de tema claro (zero FOUC).
    - Agrupados os seletores `:root, .dark` em `frontend/src/index.css` para aplicar a paleta Dark Navy (`#0F172A`), texto Light Grey (`#F8FAFC`) e superfícies translúcidas por padrão.
    - Preservada a classe `.light` para casos de uso sob demanda do modo claro.
### [2026-10-16] - Alinhamento de Conceitos de Negócio, Métricas & Preparação para a Banca
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Análise integral e extração de regras de domínio a partir do `atividade.pdf` (Case Final V-Energy Grid 360).
  - Criação do Guia Mestre `docs/planning/DOMINIO_NEGOCIO_E_DEFESA_BANCA.md`:
    - Contexto da concessão (45k UCs, 14 municípios, 120 alimentadores, 2,1M faturas e leituras).
    - Desmontagem analítica do paradoxo de Henrique Duarte (reajuste de 10,5% com queda de 4% em volume e receita subindo apenas 8%).
    - Vocabulário canônico do SEB (classes B1/B2/B3/A4, competência, alimentador, bandeiras tarifárias, GD solar Lei 14.300, perdas técnicas vs não técnicas, DEC e FEC PRODIST Módulo 8).
    - Fórmulas matemáticas completas de decomposição de receita e indicadores de continuidade.
    - Roteiro estruturado de apresentação em 6 blocos (15 minutos de pitch) e simulação de sabatina de 15 minutos da banca avaliadora.
  - Atualização do Plano Diretor `docs/planning/ROADMAP.md` com a Seção 7 vinculando o guia mestre e os critérios de avaliação da Visagio.
  - Enriquecimento de todos os 7 checklists operacionais (`cadastro_medicao_gd.md`, `faturamento_rede_atendimento.md`, `visao_360_uc.md`, `inteligencia_comercial_receita.md`, `gestao_perdas_campo.md`, `qualidade_rede_rbac.md`, `agente_text_to_sql_ia.md`) com seções dedicadas de conceitos de negócio, métricas da fatia e perguntas prováveis da banca (Q&A).
- **Validação de Testes e Linters:**
  - `make lint-all`: 100% verde (sem regressão).

### [2026-10-16] - Refatoração para 5W2H Puro, Telas Ultra-Concretas & Matriz de Convergência
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Substituição do guia de defesa pelo documento mestre `docs/planning/DOMINIO_NEGOCIO_5W2H.md`:
    - Eliminação completa de foco em apresentação/slides/banca.
    - Estruturação profunda do modelo econômico e regulatório da distribuição de energia (Fio A, Fio B, TE, TUSD, Resolução ANEEL 1.000/2021).
    - Modelagem 5W2H Global do Case V-Energy e matrizes 5W2H específicas para os 5 desafios de negócio (Henrique Duarte, Camila Barreto, Rafael Coutinho, Beatriz Farias e Patrícia Lins).
  - Atualização do Plano Diretor `docs/planning/ROADMAP.md` (Seção 7) com a **Matriz Formal de Convergência & Integração entre Fatias ("Quem Cria vs Quem Consome/Pluga")**.
  - Reestruturação completa da Seção 4 nos 7 checklists individuais (`renan`, `ryei_estevan`, `bernardo`, `celio`, `adrian_cesar`, `joao_henrique`, `miguel`):
    - Inclusão do **Objetivo 5W2H da Fatia**.
    - **Especificação Concreta de Telas, Layout e Comportamentos (Zero Abstração):** descrição visual exata de grids, tabelas com colunas nomeadas, badges semânticos, filtros, gráficos e fluxos de interação.
    - **Contratos de Integração da Fatia:** especificação rigorosa do que cada desenvolvedor cria/entrega e o que recebe/importa dos outros colegas.
### [2026-10-16] - Centralização Canônica do 5W2H & Incorporação das Falas Oficiais das Lideranças
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Incorporação do painel completo das citações literais das 5 lideranças executivas (`atividade.pdf`) em `docs/planning/DOMINIO_NEGOCIO_5W2H.md`:
    - Henrique Duarte (Diretor Comercial, pág. 2 e 6).
    - Camila Barreto (Gerente de Atendimento, pág. 6-7).
    - Rafael Coutinho (Gerente de Perdas, pág. 6).
    - Beatriz Farias (Gerente de Operação, pág. 6).
    - Patrícia Lins (Diretora de TI, pág. 2 — fragmentação/R$ 4,2M e pág. 7 — honestidade/não-alucinação).
  - Eliminação de redundâncias de 5W2H em todos os 7 checklists operacionais individuais (`renan`, `ryei_estevan`, `bernardo`, `celio`, `adrian_cesar`, `joao_henrique`, `miguel`):
    - O 5W2H reside de forma única e canônica em `docs/planning/DOMINIO_NEGOCIO_5W2H.md`.
    - Os checklists individuais preservam o objetivo claro, as especificações ultra-concretas de tela/layout e os contratos de integração ("Quem Cria vs Quem Pluga"), apontando formalmente para o documento mestre.
    - As citações das lideranças correspondentes foram incorporadas na Seção 1 de cada fatia.
- **Validação de Testes e Linters:**
  - `make lint-all` e `make test-all` executados com 100% de aprovação.

### [2026-10-16] - Grifos Cromáticos de Alto Contraste, Índice Executivo & Anotações no PDF (`atividade.pdf`)
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Criação do script de automação reprodutível `scripts/annotate_pdf.py` utilizando `pymupdf`.
  - Backup automático de segurança do arquivo original em `atividade.orig.pdf`.
  - Redesenho completo da Capa (Página 1): substituição da lista simples de nomes por um **Painel de Legenda Executivo** estruturado com fundo sutil, barra lateral colorida, badges, nomes completos, títulos das 7 fatias verticais, escopos e referências de páginas.
  - Implementação da **paleta cromática de 7 cores distintas de alto contraste**:
    - Renan (Fatia 01): Turquesa / Ciano (`#008B8B`)
    - Ryei Estevan (Fatia 02): Laranja Vibrante (`#E65100`)
    - Bernardo H (Fatia 03): Verde Esmeralda (`#2E7D32`)
    - Célio (Fatia 04): Vermelho Carmim (`#C62828`)
    - Adrian Cesar (Fatia 05): Azul Cobalto (`#1565C0`)
    - João Henrique (Fatia 06): Roxo / Violeta (`#6A1B9A`)
    - Miguel (Fatia 07): Âmbar / Ouro (`#F57F17`)
  - Aplicação de **51 grifos semânticos e notas nativas do PDF (`/Highlight` e `/Text` Sticky Notes)** nas páginas 2 a 10, cobrindo 100% das User Stories, falas de executivos, camadas de dados e entregáveis, com orientações técnicas e contratos de integração.
- **Validação de Testes e Linters:**
  - Execução de `make lint-all` e `make test-all`.

### [2026-10-25] - Adaptação Completa do Chat IA, Botão Circular Flutuante & Modo Tela Cheia
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Migração e adaptação visual dos componentes de chat de `/home/miguelsb/workspace/visagio-monorepo/ai-assistant/frontend` para o padrão corporativo V-Energy (`design.md` Corporate Blue & Dark Navy).
  - Implementação do botão disparador circular flutuante no canto inferior direito (`fixed bottom-6 right-6 z-50`) com animação e beacon luminoso ao gerar respostas (`ChatWidget.tsx`).
  - Implementação de expansão dinâmica para card flutuante translúcido (`chat-widget-panel`) e alternância instantânea para **modo tela cheia (*Fullscreen*)** (`fixed inset-0 w-screen h-screen min-h-dvh`).
  - Adição de animações com física de mola via `motion/react`: `AmbientGlow` (aura azul corporativa), `CollapsibleMotion` (sanfonas suaves) e `StaggerList` (etapas em cascata).
  - Criação do pipeline de visualização em tempo real das etapas da FSM: `NodeStepper` com `StepItem` exibindo status animado (loader, check verde, erro), latência em ms e linha vertical conectora.
  - Implementação do inspetor de pensamento cognitivo (`ThoughtInspector`) com ícone `Brain`.
  - Implementação do bloco de código SQL com syntax highlighting via Shiki (`SqlCodeBlock`) e botão funcional de cópia.
  - Renderização rica de Markdown (`MarkdownRenderer` via `react-markdown` + `remark-gfm`) com suporte a tabelas analíticas (`TableRenderer`) com ordenação por coluna, paginação e exportação CSV/TSV.
  - Redesenho do campo de entrada (`ChatInput`) com suporte a slash commands (`/chart`, `/sql`, `/perdas`, `/dec`, `/clear`), menu popover navegável por teclado, command pills e botão `Pause` para aborto de streaming via `AbortController`.
  - Pílulas categorizadas de sugestões rápidas do setor elétrico (`SuggestionsExplorer`).
  - Conformidade estrita com todos os linters do monorepo: Fallow mantendo $\le 150$ linhas por arquivo, manutenibilidade em 92.4% e 0% de arquivos mortos; ESLint e `@shadcn/lint` sem erros; pytest e vitest 100% verdes.
- **Validação:**
  - `make lint-all`: Ruff OK, Pylint 10.00/10, import-linter 4/4 contratos mantidos, ESLint e Fallow 100% aprovados.
  - `make test-all`: 293 testes backend e 48 testes frontend aprovados.

### [2026-10-25] - Correção da Abertura do Chat Widget Flutuante durante Streaming
- **Autor:** Miguel / Antigravity
- **O que foi feito:**
  - Identificada e corrigida a causa raiz pela qual o botão flutuante minimizado não permitia reabrir a janela de chat durante a geração de resposta (streaming ativo):
    - O elemento indicador de pulso (`span className="animate-ping"`) ocupava a área absoluta do disparador sem a propriedade `pointer-events-none`, interceptando todos os eventos de clique do usuário e descartando-os sem chamar `onOpen`.
    - O container circular externo (`size-14`) não capturava cliques fora da área central do botão menor de 36px (`size="icon"`).
    - O componente `ChatWidgetTrigger` não continha a chave `key="chat-trigger"` no chaveamento condicional do `AnimatePresence`.
  - Adicionado `pointer-events-none` ao beacon `animate-ping` em `ChatWidgetTrigger.tsx`.
  - Configurado manipulador `onClick={onOpen}` no container circular com `event.stopPropagation()` no botão interno.
  - Adicionada chave `key="chat-trigger"` no `ChatWidget.tsx` para transição determinística no `AnimatePresence`.
  - Criada suíte de testes unitários dedicada `ChatWidgetTrigger.test.tsx` com 3 cenários cobrindo o acionamento em repouso e durante streaming ativo.
- **Validação:**
  - `make lint-all`: Ruff OK, Pylint 10.00/10, import-linter 4/4 mantidos, ESLint e Fallow 100% aprovados.
  - `make test-all`: 537 testes backend e 185 testes frontend aprovados (total 722 testes verdes).







