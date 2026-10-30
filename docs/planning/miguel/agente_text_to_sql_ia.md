# 🧠 Fatia 07: Agente Text-to-SQL, IA Embutida & Avaliação (Fullstack IA)

> **Dono Único:** Miguel  
> **Status:** Parcialmente Implementado (Grafo FSM base já estruturado em `backend/app/agent/`)  
> **Documento de Referência:** [`docs/STATE_MACHINE.md`](docs/STATE_MACHINE.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citações das Lideranças (`atividade.pdf`, pág. 2, 7 e 10):
> **Patrícia Lins · Diretora de Tecnologia (`atividade.pdf`, pág. 2):**  
> *"Cada diretoria tem seu próprio sistema. A Medição exporta relatórios mensais em arquivos de texto com separador ponto-e-vírgula. O Faturamento roda num mainframe legado que só gera arquivos posicionais. O Atendimento registra chamados numa ferramenta SaaS recente que tem API REST, mas ninguém integrou com nada... Na última reunião de conselho, a Área Comercial apresentou um número de faturamento e a Área de Operações apresentou outro. A diferença era de R$ 4,2 milhões. Ninguém sabia qual estava certo."*

> **Patrícia Lins · Diretora de Tecnologia (`atividade.pdf`, pág. 7):**  
> *"Hoje, se o time de perdas quer saber quantas unidades com painel solar em Olinda tiveram queda de consumo acima de 30%, alguém abre um chamado, meu analista escreve a consulta e a resposta chega dois dias depois. Quero que a pessoa pergunte em português e tenha a resposta na hora. Com uma condição: se o agente não souber, ele tem que dizer que não sabe. Dados inventados são mais prejudiciais do que não ter... Se o sistema alucinar um número de faturamento numa reunião de diretoria, a credibilidade do projeto inteiro vai para o ralo no primeiro minuto."*

> **Henrique Duarte · Diretor Comercial (`atividade.pdf`, pág. 10):**  
> *"Eu usaria isso antes de todas as reuniões. 'Qual bairro mais perdeu volume residencial no último ano?', 'Quanto a receita comercial cresceu em Jaboatão?'. Não preciso de dashboard para isso, preciso de uma resposta rápida e atualizada em que eu possa confiar."*

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
  - Nós da FSM: `router_node`, `sql_generator_node`, `sql_validator_node` (AST read-only sqlparse), `sql_executor_node` (`mode=ro`), `corrector.py` (auto-correção self-healing até 3 tentativas), `synthesizer.py` (anti-alucinação estrita).
  - Suporte a **Follow-up** com preservação de contexto e resolução de anáforas.
- **Despacho SSE & IA Embutida (`app/features/chat/`):**
  - `POST /api/v1/chat/stream`: Server-Sent Events transmitindo passos de raciocínio, pensamento, SQL gerado e dados tabulares.
  - `POST /api/v1/ai/insights`: Endpoint contextual para geração dos Smart Insights em telas.

### Frontend (`frontend/src/features/chat/` & `frontend/src/features/insights/`):
- `ChatDrawer.tsx`: Drawer lateral expansível globalmente acessível ($\le 150$ linhas).
- `hooks/useChatStreamController.ts`: Hook headless de consumo SSE com cancelamento via `AbortController`.
- `components/ChatMessageBubble.tsx`: Balão de mensagem em Markdown.
- `components/AgentStepProgress.tsx`: Indicador de progresso ("Classificando intenção", "Escrevendo SQL", etc.).
- `components/SqlAuditAccordion.tsx`: Sanfona para auditoria de SQL e telemetria em ms.
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
- [x] Enriquecer o catálogo semântico (`catalog_prompt.py`) com sinônimos cotidianos e schemas finais da Gold.
- [x] Implementar suporte conversacional a follow-up no `AgentState`.
- [x] Implementar endpoint `POST /api/v1/ai/insights` no backend.
- [x] Criar testes unitários em `backend/tests/test_agent_graph.py`, `test_agent_security.py` e `test_agent_stream.py`.
- [x] Construir o framework de benchmark em `backend/scripts/evaluate_agent.py` e `backend/tests/golden_dataset.json`.
- [x] Adaptar componentes ricos do chat (fidelidade visual ao ai-assistant, botão circular flutuante no canto inferior direito, expansão fluida e modo tela cheia, conformidade com design.md e fallow <= 150 linhas).
- [x] Implementar e exportar `SmartInsightCard.tsx` (componente plugável e desacoplado, pronto para ser consumido nas telas da Fatia 03 - Bernardo e Fatia 04 - Célio conforme contrato de integração).
- [x] Criar testes no frontend com Vitest em `ChatDrawer.test.tsx`.
- [x] Expor `<ChatDrawer />` globalmente nas telas ativas, corrigir autenticação JWT do streaming/insights, follow-up multi-turno com `MemorySaver` e métricas completas em `evaluate_agent.py`.
- [x] Implementar avaliação real de Execution Accuracy (`result_comparator.py`), suíte de recusa ("não sei") e perguntas canônicas do case no `golden_dataset.json`, conferência de fidelidade numérica (`faithfulness_checker.py`) no Agente e no Quadro de IA (`insights_service.py`), testes de integração (`test_agent_integration.py`) e benchmark real com modelo local (`Qwen3.5-4B-Q4_K_M` via `lcpp`).
- [x] Garantir 100% verde em `make lint-all` e `make test-all`.

---

## 4. Interface Concreta, Comportamentos & Contratos de Integração (Fatia 07)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Interface, Layout e Comportamentos (Zero Abstração)
1. **Gaveta Global do Chat (`ChatDrawer.tsx`):**
   - Implementada com `<Sheet>` e `<SheetContent side="right">` ocupando 400px de largura fixa, com backdrop translúcido.
   - **Cabeçalho:** Título *"Assistente V-Energy IA"* com badge verde `<Badge variant="outline">🔒 Modo Seguro (Read-Only)</Badge>`.
   - **Área de Histórico de Conversa (`ChatMessageBubble.tsx`):**
     - Mensagens do usuário alinhadas à direita em balão azul corporativo.
     - Respostas da IA alinhadas à esquerda em balão Dark Navy com renderização Markdown rica (tabelas, listas e destaques).
   - **Indicador de Progresso da FSM em Streaming (`AgentStepProgress.tsx`):**
     - Durante o streaming SSE, exibe sequencialmente os passos ativos com animação sutil:
       - ⏳ *"Classificando intenção..."*
       - 🔍 *"Gerando consulta SQL para tabelas Gold..."*
       - 🛡️ *"Validando segurança sintática da query..."*
       - ⚡ *"Executando consulta no SQLite..."*
       - ✍️ *"Sintetizando resposta executiva..."*
   - **Sanfona Técnica de Auditoria (`SqlAuditAccordion.tsx`):**
     - Ao final de cada resposta da IA, uma sanfona recolhida permite ao analista auditar a consulta:
       - Código SQL formatado em bloco `sql` com realce de sintaxe.
       - Telemetria de execução: Tempo total (ex: `142ms`), linhas retornadas (ex: `12 registros`).
   - **Tratamento Estrito de Honestidade e Não-Alucinação:**
     - Se o usuário fizer uma pergunta que não tem dados na V-Energy (ex: *"Qual o faturamento em São Paulo?"* ou *"Quem é o melhor cliente?"*):
     - O agente responde textualmente: *"Não possuo essa informação nos dados cadastrais ou históricos da V-Energy. A base abrange a Região Metropolitana do Recife entre 2022 e 2025."*
2. **Componente de IA Embutida (`SmartInsightCard.tsx`):**
   - Componente visual `<Card variant="glass">` com gradiente sutil.
   - Recebe `context: "customer360" | "revenue"` e payload com os filtros ativos.
   - Faz chamada assíncrona para `POST /api/v1/ai/insights` e renderiza 2 a 3 bullets de insights práticos, com botão sutil de "Regenerar" e tooltip de transparência algorítmica.
3. **Framework de Avaliação Automatizada (`evaluate_agent.py`):**
   - Script Python que itera sobre `backend/tests/golden_dataset.json` (25+ perguntas de teste com queries gabarito).
   - Executa a FSM para cada pergunta, compara o resultado numérico gerado contra o gabarito e gera um relatório:
     - `Execution Accuracy (%)`
     - `Syntactic Validity (%)`
     - `Average Latency (ms)`

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que Miguel ENTREGA para os outros colegas:**
  - Componente global `<ChatDrawer />` e botão disparador exportados em `@/features/chat/ChatDrawer`.
  - Componente reutilizável `<SmartInsightCard />` exportado em `@/features/insights/SmartInsightCard`.
  - Endpoints REST `/api/v1/chat/stream` (SSE) e `POST /api/v1/ai/insights`.
- **O que Miguel RECEBE dos outros colegas:**
  - **De Renan e Ryei Estevan (Fatias 01 e 02):** Recebe o schema consolidado das tabelas Gold no SQLite `v_energy.db` (`dim_unidade_consumidora`, `fato_medicao`, `fato_faturamento`, `fato_qualidade_alimentador`, `fato_atendimentos`, `fato_inspecoes_perdas`) para configurar o catálogo semântico da FSM (`catalog_prompt.py`).
  - **De João Henrique (Fatia 06):** João Henrique importa o `<ChatDrawer />` e insere o botão disparador no cabeçalho (*Header*) global do `AppLayout.tsx`.
  - **De Bernardo (Fatia 03):** Bernardo importa `<SmartInsightCard context="customer360" />` e posiciona no topo da `Customer360Page.tsx`.
  - **De Célio (Fatia 04):** Célio importa `<SmartInsightCard context="revenue" />` e posiciona no topo da `RevenueDashboardPage.tsx`.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Miguel - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


