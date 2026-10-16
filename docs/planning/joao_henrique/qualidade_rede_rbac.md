# 🌐 Fatia 06: Qualidade da Rede (DEC/FEC) & Plataforma com RBAC (Fullstack)

> **Dono Único:** Joao Henrique  
> **Status:** Não Iniciado  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Fala da Executiva (`atividade.pdf`, pág. 6):
> **Beatriz Farias · Gerente de Operação:**  
> *"Quando o DEC estoura o limite da ANEEL, a compensação financeira vem direto da nossa margem. Eu preciso de duas coisas: primeiro, saber em tempo real quais alimentadores estão mais próximos do limite regulatório para priorizar manutenção preventiva; segundo, quando um cliente liga reclamando de falta de luz, o atendente precisa saber se é um problema geral daquele alimentador ou pontual daquela unidade."*

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

## 4. Telas Concretas, Comportamentos & Contratos de Integração (Fatia 06)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Tela, Layout e Comportamentos (Zero Abstração)
1. **Cards Superiores de Continuidade (`QualityKpiCards.tsx`):**
   - Utilizam `<Card variant="glass">` e `<Card variant="interactive">`:
     - Card 1: **DEC Médio da Concessão (horas)** vs Meta ANEEL (badge verde se $\le$ meta, vermelho se acima).
     - Card 2: **FEC Médio da Concessão (vezes)** vs Meta ANEEL.
     - Card 3: **Percentual de Alimentadores em Violação (%)** com contagem absoluta (ex: *"14 de 122 circuitos"*).
     - Card 4: **Total de UCs Expostas a Circuitos Críticos** (impacto regulatório e risco de compensação).
2. **Filtros Operacionais:**
   - `<Select>` Subestação (ex: "SE Boa Viagem", "SE Santo Amaro", "Todas").
   - `<Select>` Status Regulatório ("Todos", "Somente com Violação de Meta", "Conformes").
3. **Tabela de Alimentadores Críticos (`FeederRankingTable.tsx`):**
   - Ordenação inicial por **maior excesso de DEC sobre o limite ANEEL ($\Delta \text{DEC}$)**.
   - Colunas:
     - Código do Alimentador e Subestação de Origem.
     - Município Atendido e Quantidade de UCs conectadas.
     - DEC Apurado (h) e Limite ANEEL (h).
     - FEC Apurado (vezes) e Limite ANEEL (vezes).
     - Status Regulatório (Badges: `<Badge variant="destructive">Violação Crítica</Badge>`, `<Badge variant="outline">Alerta ($\ge 85\%$ da meta)</Badge>`, `<Badge variant="secondary">Conforme</Badge>`).
   - Comportamento: Ao clicar na linha, abre gaveta lateral `<Sheet side="right">` exibindo o gráfico `FeederTimeSeriesChart.tsx`.
4. **Gaveta Lateral de Série Temporal (`FeederTimeSeriesChart.tsx`):**
   - Renderizada dentro de `<SheetContent side="right">` com 500px de largura.
   - Gráfico de linha dos últimos **24 meses** do alimentador selecionado:
     - Linha sólida azul: DEC apurado mensal.
     - Linha tracejada vermelha horizontal: Limite regulatório ANEEL.
     - Lista das principais causas históricas das ocorrências (descargas atmosféricas, colisão de veículos em postes, queda de árvores na fiação).
5. **Comportamento do Shell RBAC (`AppLayout.tsx` & `SidebarNav.tsx`):**
   - O componente `SidebarNav.tsx` consome o contexto de autenticação `useAuth()`.
   - Se perfil for `atendimento`: exibe no menu apenas "Visão 360 da UC" e o atalho do Chat. Oculta "Inteligência Comercial", "Gestão de Perdas" e "Qualidade da Rede".
   - Se o usuário tentar acessar uma URL não autorizada diretamente: interceptado pelo `ProtectedRoute.tsx` exibindo página amigável de Acesso Não Autorizado com botão para retornar à tela inicial permitida.

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que João Henrique ENTREGA para os outros colegas:**
  - Dependência central de segurança em `backend/app/shared/dependencies.py`:
    ```python
    def require_role(allowed_roles: list[UserRole]):
        """Valida token JWT e exige que user.role esteja em allowed_roles."""
    ```
  - Layout mestre do portal `AppLayout.tsx` e barra lateral adaptativa `SidebarNav.tsx` em `frontend/src/components/layout/`.
  - Mecanismo de rota protegida `ProtectedRoute.tsx` em `frontend/src/routes/`.
- **O que João Henrique RECEBE dos outros colegas:**
  - **De Ryei Estevan (Fatia 02):** Consome a tabela `fato_qualidade_alimentador` no SQLite `v_energy.db` para alimentar os cards e o ranking.
  - **De Renan (Fatia 01):** Consome `dim_unidade_consumidora` para contabilizar o número de UCs ativas ligadas a cada circuito elétrico.
  - **De Miguel (Fatia 07):**
    - Importa o componente `<ChatDrawer />` e insere o botão de disparo no cabeçalho (*Header*) global do `AppLayout.tsx`.
  - **De Bernardo, Célio e Adrian:** Recebe as rotas e títulos de suas páginas para compor as entradas autorizadas no menu dinâmico do `SidebarNav.tsx`.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Joao Henrique - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


