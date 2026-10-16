# 👤 Fatia 03: Visão 360 da Unidade Consumidora (Fullstack)

> **Dono Único:** Bernardo H  
> **Status:** Não Iniciado  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citação da Liderança (`atividade.pdf`, pág. 6-7):
> *Camila Barreto · Gerente de Atendimento:*  
> *"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se foi aumento de consumo, se a bandeira tarifária mudou ou se teve reajuste na tarifa."*

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

- [ ] Criar pasta `backend/app/features/customer360/` com `schemas.py`, `repository.py`, `service.py` e `router.py`.
- [ ] Registrar rotas em `backend/app/api/v1/router.py`.
- [ ] Criar testes do backend em `backend/tests/test_customer360_service.py` e `test_customer360_router.py`.
- [ ] Garantir conformidade com `make lint-backend` (Ruff, Pylint $\le 300$ linhas, import-linter).
- [ ] Criar pasta `frontend/src/features/customer360/` com página, controller headless e subcomponentes atômicos ($\le 150$ linhas).
- [ ] Adicionar rota `/customers` em `frontend/src/routes/AppRoutes.tsx`.
- [ ] Criar testes unitários no frontend com Vitest em `Customer360Page.test.tsx`.
- [ ] Garantir conformidade com `make lint-frontend` (Fallow e ESLint).

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Bernardo H - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
