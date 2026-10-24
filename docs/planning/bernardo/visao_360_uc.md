# 👤 Fatia 03: Visão 360 da Unidade Consumidora (Fullstack)

> **Dono Único:** Bernardo H  
> **Status:** Backend e frontend concluídos · Integração pendente  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citação da Liderança (`atividade.pdf`, pág. 6-7):
> *Camila Barreto · Gerente de Atendimento:*  
> *"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."*

### User Story do Case (`atividade.pdf`, pág. 8):
> - *"• Como atendente, quero encontrar uma unidade consumidora e ver numa única tela seu histórico de consumo, faturas, medidor, geração própria, interrupções e chamados, para responder ao cliente na hora, inclusive quando ele reclama de conta alta."*

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/features/customer360/`):
- `schemas.py`: Schemas Pydantic (`CustomerSummaryDTO`, `CustomerHistoryDTO`, `CustomerEventTimelineDTO`).
- `repository.py`: Consultas SQL otimizadas isoladas no SQLite local.
- `service.py`: Lógica Pure Python (zero import de FastAPI) para cálculo de variações YoY de consumo.
- `router.py`: Rotas REST finas:
  - `GET /api/v1/customers/{id_uc}/summary`
  - `GET /api/v1/customers/{id_uc}/history`
  - `GET /api/v1/customers/{id_uc}/events`

### Frontend (`frontend/src/features/customer360/`):
- `Customer360Page.tsx`: Container da visão 360 ($\le 150$ linhas).
- `hooks/useCustomer360Controller.ts`: Hook headless com TanStack Query v5 e suporte a cancelamento via `signal`.
- `components/CustomerSearchBar.tsx`: Input com busca por ID da UC.
- `components/CustomerOverviewCard.tsx`: Card com dados cadastrais, medidor ativo e badge de GD solar.
- `components/ConsumptionYoYChart.tsx`: Gráfico comparativo de consumo em barras/linhas dos últimos 12 meses vs ano anterior.
- `components/InvoicesHistoryTable.tsx`: Tabela com histórico de faturas e badges de status de pagamento.
- `components/OutagesTimeline.tsx`: Timeline com interrupções na rua/alimentador e chamados abertos.

#### 🧩 Componentes do Design System Recomendados (`@/components/ui/` & `@/components/feedback/`):
- **Navegação & Estrutura:** `<Tabs>` e `<TabsList>` / `<TabsTrigger>` / `<TabsContent>` para alternar entre as visões de *Consumo*, *Faturas* e *Chamados/Eventos*.
- **Cards Analíticos:** `<Card variant="glass">` para resumo cadastral da UC e `<Card variant="interactive">` para métricas consolidadas.
- **Campos de Busca:** `<Input>` com `<Label htmlFor="uc-search">` para busca rápida por ID da UC.
- **Tabela de Faturas:** `<Table>` com `<TableHeader>`, `<TableRow>`, `<TableCell>` e badges de adimplência (`<Badge variant="secondary">` para paga e `<Badge variant="destructive">` para vencida).
- **Detalhamento Flutuante:** `<Tooltip>` de `@/components/ui/tooltip-card` sobre dados técnicos do medidor e capacidade solar instalada.
- **Gaveta de Fatura:** `<Sheet>` e `<SheetContent side="right">` para abrir o espelho da fatura sem sair da tela única de atendimento.
- **Feedback:** `<LoadingSkeleton count={4} />` e `<EmptyState title="UC não encontrada">`.

---

## 3. Checklist Operacional de Execução

- [x] Criar pasta `backend/app/features/customer360/` com `schemas.py`, `repository.py`, `service.py` e `router.py`.
- [x] Registrar rotas em `backend/app/api/v1/router.py`.
- [x] Criar testes do backend em `backend/tests/test_customer360_service.py` e `test_customer360_router.py`.
- [x] Garantir conformidade com `make lint-backend` (Ruff, Pylint $\le 300$ linhas, import-linter).
- [x] Criar pasta `frontend/src/features/customer360/` com página, controller headless e subcomponentes atômicos ($\le 150$ linhas).
- [x] Adicionar rota `/customers` em `frontend/src/routes/AppRoutes.tsx`.
- [x] Criar testes unitários no frontend com Vitest em `Customer360Page.test.tsx`.
- [x] Garantir conformidade com `make lint-frontend` (Fallow e ESLint).

---

## 4. Telas Concretas, Layouts & Contratos de Integração (Fatia 03)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Tela, Layout e Comportamentos (Zero Abstração)
1. **Barra de Busca Superior (`CustomerSearchBar.tsx`):**
   - Campo `<Input>` com placeholder *"Digite o ID da Unidade Consumidora (ex: UC100000)..."*.
   - Comportamento: Disparo automático por tecla `Enter` ou debounce de 400ms. Se a UC não existir no SQLite, renderiza `<EmptyState title="Unidade Consumidora não encontrada" description="Verifique o número informado na fatura" />`.
2. **Card de Resumo Cadastral (`CustomerOverviewCard.tsx`):**
   - Utiliza `<Card variant="glass">` com layout em grid de 4 colunas:
     - Coluna 1: Nome do Cliente e Código do Titular.
     - Coluna 2: Endereço (Logradouro, Bairro, Município) e Subgrupo Tarifário (ex: B1 Residencial).
     - Coluna 3: Circuito Elétrico (Subestação e Alimentador) e Número do Medidor Ativo.
     - Coluna 4: Badge de Status (`<Badge variant="secondary">Ativo</Badge>`) e Badge de Geração Solar (se `possui_gd = true`, exibe `<Badge variant="outline">☀️ GD Solar (X kWp)</Badge>` com tooltip explicativo).
3. **Card de IA Embutida (`SmartInsightCard.tsx`):**
   - Posicionado imediatamente abaixo do resumo cadastral.
   - Exibe análise contextual automatizada (ex: *"Esta UC registrou queda de 45% no consumo faturado a partir de março/2024, coincidindo com a conexão de sistema solar fotovoltaico de 4.5 kWp"*).
4. **Área Central em Abas (`<Tabs defaultValue="consumption">`):**
   - **Aba 1: Histórico de Consumo (`ConsumptionYoYChart.tsx`):**
     - Gráfico de barras verticais comparando mês a mês os **últimos 12 meses** contra o **mesmo mês do ano anterior** (YoY).
     - Tooltip interativo exibindo consumo em kWh, valor faturado em R$ e variação percentual ($\Delta\%$).
     - **Diagnóstico Visual de Conta Alta:** Banner destacado no topo da aba caso o mês recente apresente variação $>25\%$:
       - Se $\Delta\text{kWh} > 25\%$: *"Aumento decorrente de maior consumo físico de energia (+X kWh vs ano anterior)"*.
       - Se $\Delta\text{kWh} \le 5\%$ e $\Delta\text{R\$} > 20\%$: *"Consumo físico estável, aumento gerado por acionamento de Bandeira Vermelha P2 e reajuste homologado ANEEL"*.
   - **Aba 2: Faturas e Histórico Financeiro (`InvoicesHistoryTable.tsx`):**
     - Tabela com colunas: Competência, Vencimento, Consumo (kWh), Valor (R$), Bandeira Tarifária (Badges: Verde, Amarela, Vermelha 1, Vermelha 2) e Status (Badge verde "Paga", amarelo "Aberta", vermelho "Vencida").
     - Ação na linha: Botão "Espelho" abre gaveta lateral `<Sheet side="right">` com o detalhamento tributário da fatura (TUSD Fio B, TE, impostos) sem desviar o atendente da tela principal.
   - **Aba 3: Eventos da Rede e Protocolos (`OutagesTimeline.tsx`):**
     - Timeline cronológica vertical unindo:
       - Interrupções do fornecimento ocorridas no alimentador daquela UC (data, duração em horas, causa).
       - Histórico de protocolos de chamados abertos no call center com nota CSAT.

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que Bernardo ENTREGA para os outros colegas:**
  - Rota de frontend `/customers` no `AppRoutes.tsx`.
  - Componente de página `Customer360Page.tsx` integrada ao layout corporativo.
  - Endpoints REST `/api/v1/customers/{id_uc}/summary`, `/history`, `/events`.
- **O que Bernardo RECEBE dos outros colegas:**
  - **De Renan (Fatia 01):** Consulta tabelas `dim_unidade_consumidora` e `fato_medicao` no SQLite `v_energy.db`.
  - **De Ryei Estevan (Fatia 02):** Consulta tabelas `fato_faturamento` e `fato_atendimentos` no SQLite `v_energy.db`.
  - **De João Henrique (Fatia 06):**
    - Importa e aplica a dependência de segurança no seu roteador FastAPI:  
      `dependencies=[Depends(require_role([UserRole.ATENDIMENTO, UserRole.DIRETORIA, UserRole.ADMIN]))]`
    - Renderiza sua página dentro do `<AppLayout>` fornecido por João Henrique.
  - **De Miguel (Fatia 07):**
    - Importa o componente de IA embutida:  
      `import { SmartInsightCard } from '@/features/insights/SmartInsightCard';`  
      e o renderiza com `<SmartInsightCard context="customer360" ucId={id_uc} />`.

---

## 5. Pendências, Esclarecimentos e Decisões em Aberto

> Atualizado em 2026-10-19 após a entrega do backend. Marque `[x]` ao resolver.

### 5.1 Esclarecer com outras fatias
- [ ] **Renan (Fatia 01):** incluir `nome_titular` na `dim_unidade_consumidora` (o case pede *"quem é o cliente"*). O backend já exibe a coluna automaticamente se ela existir.
- [ ] **Renan (Fatia 01):** incluir `tipo_leitura` (REAL/ESTIMADA) na `fato_medicao`: 18% das leituras de 2025 são estimadas, causa comum de conta alta.
- [ ] **Renan (Fatia 01):** incluir a data de conexão da GD (`data_conexao`) e tipo/data de instalação do medidor na `dim_unidade_consumidora`.
- [ ] **Renan (Fatia 01):** criar índice em `dim_unidade_consumidora(numero_medidor_ativo)` para a busca por medidor (hoje varre ~46 mil linhas, ainda rápido).
- [ ] Quando o `nome_titular` existir, incluir a busca por nome nas sugestões.
- [ ] **Renan (Fatia 01):** como o `dias_faturamento` será calculado? No bruto, as datas de leitura geram intervalos de 19 a 47 dias, o que torna a média por dia instável.
- [ ] **João Henrique (Fatia 06):** compartilhar o achado de jul/2025 (~5x mais interrupções que a média, em todos os alimentadores).
- [ ] **Ryei (Fatia 02):** exportar uma tabela com as ocorrências individuais de rede (`id_uc`, `alimentador`, data, duração, causa). Hoje a aba de interrupções usa só o DEC/FEC mensal da `fato_qualidade_alimentador`.
- [ ] **Ryei (Fatia 02), baixa prioridade:** criar `CREATE INDEX idx_fato_atend_uc ON fato_atendimentos(id_uc)`. Medido com o volume real (319 mil chamados): ~11 ms por busca sem índice, então não bloqueia.
- [ ] **Ryei + João Henrique:** `dec_limite_aneel` / `violou_meta` contradizem o glossário do case (*"não para comparar com os limites regulatórios reais"*). Definir se a Visão 360 mostra badge de meta ANEEL.
- [ ] **João Henrique + Adrian:** confirmar a inclusão do `gerente_perdas` no acesso à Visão 360 (case, seção 3: *"o atendente, o analista de perdas e o diretor comercial"*). Atualizar a matriz RBAC do `ROADMAP.md` (linha 125).
- [x] **João Henrique:** criar um grupo `CUSTOMER360_ACCESS` em `app/shared/role_groups.py` (incluindo `GERENTE_PERDAS`) e trocar a lista local `CUSTOMER360_ROLES` do meu router por ele, quando a branch do RBAC for mergeada. (feito em 2026-10-24)

### 5.2 Corrigir / decidir na minha fatia
- [ ] Decidir com o time o limiar de ±10% de variação de consumo (`LIMIAR_VARIACAO_CONSUMO_PCT`).
- [x] Diagnóstico de conta alta com 4 causas: consumo, dias faturados, bandeira e preço do kWh (2026-10-22).
- [ ] Ciente: `status_pagamento = VENCIDA` é calculado na exportação da Fatia 02; pode ficar defasado até a próxima carga.
- [ ] Registrar as decisões da Fatia 03 em `docs/DECISOES.md` (formato ADR) e as suposições no `README.md` (obrigatório no case).
- [ ] Após o merge da Fatia 05, adotar o `EndpointDoc` (`app/shared/docs.py`) com um `router_metadata.py`, no mesmo padrão do Adrian.
- [ ] No merge com `main`, resolver os conflitos esperados em `api/v1/router.py` e `pyproject.toml` mantendo as linhas de todas as fatias (simulado em 2026-10-21: 165 testes verdes).
- [ ] Trocar a seed pelo `v_energy.db` real e conferir os tipos/valores; ajustar `tests/customer360_seed.py` se o schema divergir.

- [ ] Sugestão: mostrar o histórico de inspeções de perdas da UC (`fato_inspecoes_perdas`), completando a visão do analista de perdas.
- [x] Sugestão: mostrar a pontualidade de pagamento (pagas após o vencimento) a partir de `data_pagamento` e `data_vencimento`. (feito em 2026-10-24)

### 5.3 Frontend e integração
- [x] Instalar `bun` no ambiente local. `make` segue ausente (comandos do Makefile rodados manualmente).
- [ ] Instalar `make` no Windows para rodar `make lint-all` / `make test-all` direto.
- [x] Biblioteca de gráfico: chart no padrão shadcn (`components/ui/chart.tsx`) sobre Recharts 2.15. Avisar o time para reutilizarem.
- [x] Implementar o frontend (checklist da seção 3).
- [x] Propor ao time carregar as páginas sob demanda (`React.lazy`) no `AppRoutes.tsx`: o bundle passou de 500 kB. (feito em 2026-10-24: 1.103 kB → 274 kB)
- [ ] No merge com a Fatia 05, resolver o conflito esperado em `AppRoutes.tsx` mantendo as rotas `/losses` e `/customers` (simulado em 2026-10-21: ESLint, Fallow, tsc, build e 25 testes verdes).
- [ ] Propor ao João um `PageHeader` compartilhado junto do `AppLayout`: o cabeçalho com "Voltar ao painel" é igual ao da Fatia 05 (Fallow: 20 linhas duplicadas, dentro do limite de 5%).
- [ ] Adicionar acesso à `/customers` no menu (`SidebarNav` do João) ou no `DashboardPage`; hoje a rota só é acessada digitando a URL.
- [ ] Integrar `<AppLayout>` (João Henrique) e `<SmartInsightCard context="customer360" ucId={id_uc} />` (Miguel) quando entregues.
- [ ] Rodar `make lint-all` e `make test-all`, abrir PR da branch `feat/fatia-03-visao360`.

---

## 6. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Bernardo H - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


