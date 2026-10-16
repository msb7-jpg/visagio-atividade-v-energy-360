# 🧠 Fatia 07: Agente Text-to-SQL, IA Embutida & Avaliação (Fullstack IA)

> **Dono Único:** Miguel  
> **Status:** Parcialmente Implementado (Grafo FSM base já estruturado em `backend/app/agent/`)  
> **Documento de Referência:** [`docs/STATE_MACHINE.md`](docs/STATE_MACHINE.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citações das Lideranças (`atividade.pdf`, pág. 7 e 10):
> *Patrícia Lins · Diretora de Tecnologia:*  
> *"Hoje, se o time de perdas quer saber quantas unidades com painel solar em Olinda tiveram queda de consumo acima de 30%, alguém abre um chamado, meu analista escreve a consulta e a resposta chega dois dias depois. Quero que a pessoa pergunte em português e tenha a resposta na hora. Com uma condição: se o agente não souber, ele tem que dizer que não sabe. Dados inventados são mais prejudiciais do que não ter."*

> *Henrique Duarte · Diretor Comercial:*  
> *"Eu usaria isso antes de todas as reuniões. 'Qual bairro mais perdeu volume residencial no último ano?', 'Quanto a receita comercial cresceu em Jaboatão?'. Não preciso de dashboard para isso, preciso de uma resposta rápida e atualizada em que eu possa confiar."*

> *Diretrizes Gerais:*  
> *"O agente precisa ser honesto. Um agente que inventa respostas ou apresenta dados incorretos é um problema crítico. Priorizem precisão e tratamento de erros acima de qualquer funcionalidade adicional."*

### User Stories do Case (`atividade.pdf`, pág. 9):
> - *"• Como usuário não técnico, quero perguntar em português sobre consumo, faturamento, interrupções e atendimento e receber respostas claras, sem precisar escrever SQL."*
> - *"• Como usuário, quero que o agente entenda termos do dia a dia, como 'conta de luz' e 'falta de luz', e os relacione aos dados certos."*
> - *"• Como analista, quero conseguir auditar como a IA chegou a cada resposta, para confiar no que ela apresenta."*
> - *"• Como usuário do portal, quero receber, nas telas que uso no dia a dia, insights gerados por IA que me ajudem a interpretar os dados sem precisar perguntar."*
> - *"• Como usuário do portal, quero acessar o agente diretamente dentro da plataforma, sem trocar de ferramenta."*
> - *"• Como responsável por Segurança da Informação, quero que as funcionalidades de IA não possam alterar dados nem ser manipuladas para agir fora do seu papel."*
> - *"• Como analista, quero fazer perguntas de follow-up sem repetir o contexto da pergunta anterior. (Diferencial)"*
> - *"• Como responsável pela plataforma, quero medir de forma automatizada a qualidade das respostas do agente, para acompanhar sua evolução. (Diferencial)"*

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/agent/` & `backend/app/features/chat/`):
- **Motor LangGraph FSM (`app/agent/`):**
  - Catálogo semântico com mapeamento de jargões ("conta de luz" $\to$ faturas, "falta de luz" $\to$ interrupções, "gato" $\to$ perdas/inspeções).
  - Nós da FSM: `router_node`, `sql_generator_node`, `sql_validator_node` (AST read-only sqlparse), `sql_executor_node` (`mode=ro`), `corrector.py` (auto-correção self-healing até 3 tentativas), `chart_generator.py` (`ChartJsConfigDTO`), `synthesizer.py` (anti-alucinação estrita).
  - Suporte a **Follow-up** com preservação de contexto e resolução de anáforas.
- **Despacho SSE & IA Embutida (`app/features/chat/`):**
  - `POST /api/v1/chat/stream`: Server-Sent Events transmitindo passos de raciocínio, pensamento, SQL gerado e gráficos.
  - `POST /api/v1/ai/insights`: Endpoint contextual para geração dos Smart Insights em telas.

### Frontend (`frontend/src/features/chat/` & `frontend/src/features/insights/`):
- `ChatDrawer.tsx`: Drawer lateral expansível globalmente acessível ($\le 150$ linhas).
- `hooks/useChatStreamController.ts`: Hook headless de consumo SSE com cancelamento via `AbortController`.
- `components/ChatMessageBubble.tsx`: Balão de mensagem em Markdown.
- `components/AgentStepProgress.tsx`: Indicador de progresso ("Classificando intenção", "Escrevendo SQL", etc.).
- `components/SqlAuditAccordion.tsx`: Sanfona para auditoria de SQL e telemetria em ms.
- `components/InteractiveChartCard.tsx`: Renderizador de gráficos Chart.js interativos.
- `components/SmartInsightCard.tsx`: Card de IA embutida integrado na Visão 360 e no Dashboard de Receita.

#### 🧩 Componentes do Design System Recomendados (`@/components/ui/` & `@/components/feedback/`):
- **Gaveta Global de Chat:** `<Sheet>` e `<SheetContent side="right">` para o container do `ChatDrawer`, permitindo interagir com o agente sem perder o contexto da tela atual.
- **Entrada de Perguntas:** `<Textarea>` estilizado com anéis de foco corporativos (`ring-2 ring-primary`) para digitação de perguntas em linguagem natural.
- **Insights Contextuais:** `<Card variant="glass">` para o `SmartInsightCard` com borda sutil e gradiente translúcido nas telas de Visão 360 e Receita.
- **Indicadores de Streaming:** `<Spinner size="sm">` e `<Spinner size="md">` durante a transmissão de passos da FSM ("Validando SQL", "Executando no SQLite").
- **Auditoria Técnica:** `<Tabs>` e `<TabsList>` / `<TabsTrigger>` para alternar entre a *Resposta Sintetizada*, a *Query SQL Auditável* e os *Metadados de Execução (ms)*.
- **Etiquetas de Segurança:** `<Badge variant="outline">` com ícone de cadeado indicando transação estritamente *Read-Only* no banco SQLite.
- **Detalhamento Flutuante:** `<Tooltip>` de `@/components/ui/tooltip-card` sobre termos de telemetria (latência do LLM, tokens consumidos, tentativas de auto-correção).
- **Feedback:** `<EmptyState title="Como posso ajudar hoje?">` com sugestões clicáveis para o primeiro uso do chat.

### Framework de Avaliação Automatizada de Qualidade (Diferencial):
- `backend/tests/golden_dataset.json`: 25+ perguntas de teste de negócio com queries esperadas.
- `backend/scripts/evaluate_agent.py`: Script de cálculo de acurácia sintática, semântica e latência média.

---

## 3. Checklist Operacional de Execução

- [x] Grafo base do LangGraph FSM e nós essenciais em `backend/app/agent/`.
- [x] Validador sintático AST e execução somente-leitura (`mode=ro`).
- [ ] Enriquecer o catálogo semântico (`catalog_prompt.py`) com sinônimos cotidianos e schemas finais da Gold.
- [ ] Implementar suporte conversacional a follow-up no `AgentState`.
- [ ] Implementar endpoint `POST /api/v1/ai/insights` no backend.
- [ ] Criar testes unitários em `backend/tests/test_agent_graph.py`, `test_agent_security.py` e `test_agent_stream.py`.
- [ ] Construir o framework de benchmark em `backend/scripts/evaluate_agent.py` e `backend/tests/golden_dataset.json`.
- [ ] Criar componentes do chat em `frontend/src/features/chat/` ($\le 150$ linhas por componente).
- [ ] Implementar `SmartInsightCard.tsx` e plugar na Visão 360 e no Dashboard de Receita.
- [ ] Criar testes no frontend com Vitest em `ChatDrawer.test.tsx`.
- [ ] Garantir 100% verde em `make lint-all` e `make test-all`.

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Miguel - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
