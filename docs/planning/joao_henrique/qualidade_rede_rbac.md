# 🌐 Fatia 06: Qualidade da Rede (DEC/FEC) & Plataforma com RBAC (Fullstack)

> **Dono Único:** Joao Henrique  
> **Status:** Não Iniciado  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### User Stories do Case (`atividade.pdf`, pág. 8-9):
> - *"• Como gerente de operação, quero acompanhar DEC e FEC por alimentador ao longo do tempo e identificar os piores, para direcionar a manutenção preventiva."*
> - *"• Como usuário, quero entrar com meu perfil e ver as telas específicas do meu cargo. (Diferencial)"*
> - *"• Como usuário do portal, quero filtrar e recortar as informações conforme a minha necessidade, para chegar rápido ao que procuro."*
> - *"• Como desenvolvedor, quero testes automatizados no backend, para que novas mudanças não quebrem o que já funciona. (Diferencial)"*

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/features/grid_quality/` & `backend/app/features/auth/`):
- `grid_quality`:
  - `schemas.py`: Schemas Pydantic (`QualityIndicatorsDTO`, `FeederRankingDTO`, `FeederTimeSeriesDTO`).
  - `repository.py`: Consultas SQL nos alimentadores comparando DEC/FEC contra metas da ANEEL.
  - `service.py`: Lógica Pure Python de ranking e identificação de circuitos com estouro de limites regulatórios.
  - `router.py`: Rotas `GET /api/v1/quality/indicators`, `/feeders`, `/feeders/{id}/history`.
- `auth/rbac`:
  - Enriquecimento de token JWT com perfil de cargo (`diretoria`, `atendimento`, `perdas`, `operacao`, `admin`).
  - Dependência central `require_role(roles: list[UserRole])` em `backend/app/shared/dependencies.py`.

### Frontend (`frontend/src/features/grid_quality/` & `frontend/src/components/layout/`):
- `GridQualityPage.tsx`: Painel de continuidade operacional ($\le 150$ linhas).
- `hooks/useGridQualityController.ts`: Hook headless controlando filtros de subestação e alimentador.
- `components/QualityKpiCards.tsx`: Cards de DEC e FEC médios consolidados vs metas regulatórias.
- `components/FeederRankingTable.tsx`: Tabela dos piores circuitos com badges de alerta.
- `components/FeederTimeSeriesChart.tsx`: Série histórica mensal de 24 meses do circuito selecionado.
- `components/layout/AppLayout.tsx` & `SidebarNav.tsx`: Layout com navegação adaptativa ao cargo logado.
- `routes/ProtectedRoute.tsx`: Redirecionamento dinâmico de login para a tela do cargo ativo (Diferencial).

#### 🧩 Componentes do Design System Recomendados (`@/components/ui/` & `@/components/feedback/`):
- **Layout & Navegação:** `<AppLayout>` com `<SidebarNav>`, utilizando `<Separator />` para agrupamento de módulos permitidos por cargo (RBAC).
- **KPIs Regulatórios:** `<Card variant="glass">` e `<Card variant="interactive">` para DEC/FEC consolidado e percentual de violação dos limites ANEEL.
- **Alternância de Módulos:** `<Tabs>` e `<TabsList>` / `<TabsTrigger>` para alternar entre *Visão Macrorregional*, *Ranking de Alimentadores* e *Série Temporal*.
- **Tabela de Circuitos:** `<Table>` com `<TableHeader>`, `<TableRow>` e `<TableCell>` para ordenar alimentadores críticos com paginação limpa.
- **Badges Regulatórios:** `<Badge variant="destructive">` para circuitos que ultrapassaram a meta da ANEEL e `<Badge variant="secondary">` para circuitos conformes.
- **Filtros Operacionais:** `<Select>` com `<Label>` para seleção dinâmica de Subestação e Alimentador.
- **Gaveta Lateral de Circuito:** `<Sheet side="right">` disparado ao clicar em um alimentador para inspecionar gráfico de interrupções e UCs afetadas.
- **Tooltips Técnicos:** `<Tooltip>` de `@/components/ui/tooltip-card` explicando as fórmulas regulatórias de DEC (Duração Equivalente) e FEC (Frequência Equivalente).
- **Feedback & Estados:** `<LoadingSkeleton count={4} />` e `<EmptyState title="Nenhum alimentador com violação">`.

---

## 3. Checklist Operacional de Execução

- [ ] Criar pasta `backend/app/features/grid_quality/` com schemas, repositório, serviço e rotas.
- [ ] Implementar dependência de RBAC `require_role(...)` em `backend/app/shared/dependencies.py`.
- [ ] Registrar rotas em `backend/app/api/v1/router.py`.
- [ ] Criar testes unitários em `backend/tests/test_grid_quality_service.py` e `test_rbac.py` (garantindo bloqueio 403 para rotas não autorizadas).
- [ ] Garantir conformidade com `make lint-backend`.
- [ ] Criar pasta `frontend/src/features/grid_quality/` com componentes $\le 150$ linhas.
- [ ] Implementar layout base `AppLayout.tsx` e `SidebarNav.tsx` adaptativo por perfil de cargo.
- [ ] Configurar redirecionamento automático por cargo no login em `frontend/src/routes/AppRoutes.tsx`.
- [ ] Criar testes no frontend com Vitest em `GridQualityPage.test.tsx` e `RbacNavigation.test.tsx`.
- [ ] Garantir conformidade com `make lint-frontend`.

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Joao Henrique - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
