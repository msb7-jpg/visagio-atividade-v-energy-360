# 🌐 Fatia 06: Qualidade da Rede (DEC/FEC) & Plataforma com RBAC (Fullstack)

> **Dono Único:** Joao Henrique  
> **Status:** Em andamento  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Fala da Executiva (`atividade.pdf`, pág. 6):
> **Beatriz Farias · Gerente de Operação:**  
> *"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."*

### User Stories do Case (`atividade.pdf`, pág. 8-9):
> - *"• Como gerente de operação, quero acompanhar DEC e FEC por alimentador ao longo do tempo e identificar os piores, para direcionar a manutenção preventiva."*
> - *"• Como usuário, quero entrar com meu perfil e ver as telas específicas do meu cargo. (Diferencial)"*
> - *"• Como usuário do portal, quero filtrar e recortar as informações conforme a minha necessidade, para chegar rápido ao que procuro."*
> - *"• Como desenvolvedor, quero testes automatizados no backend, para que novas mudanças não quebrem o que já funciona. (Diferencial)"*

### Requisitos extraídos do case

- **Regiões com as piores interrupções:** Beatriz Farias, pág. 6: *"saber quais regiões concentram as piores interrupções"*. Granularidade de "região": pendente da decisão do grupo (B3).
- **Retorno da manutenção preventiva:** Beatriz Farias, pág. 6: *"onde a manutenção preventiva dá mais retorno"*; user story, pág. 8: *"...para direcionar a manutenção preventiva."* Como medir o "retorno": pendente da decisão do grupo (B4).

### Prioridade dos requisitos

- **Requisito do case:** acompanhar DEC e FEC por alimentador ao longo do tempo e identificar os piores (`atividade.pdf`, pág. 8).
- **Diferencial:** perfil por cargo (RBAC) e testes automatizados no backend (`atividade.pdf`, pág. 9).

### Observação sobre os dados (`atividade.pdf`, pág. 4)

> *"Nos dados deste case, cada registro de ocorrência corresponde a uma unidade consumidora interrompida, e os valores absolutos são simplificados: servem para comparar alimentadores e períodos entre si, não para comparar com os limites regulatórios reais."*

- Os valores de DEC e FEC são simplificados: servem para comparar alimentadores e períodos entre si, não com os limites regulatórios reais.
- Cada registro de ocorrência corresponde a uma UC interrompida.
- **Pendente (B1):** as menções a "meta/limite ANEEL" no restante deste documento (seções 2 e 4) ficam pendentes da decisão do grupo sobre a origem do limite.

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/features/grid_quality/` & `backend/app/features/auth/`):
- `grid_quality` (rotas ainda não registradas em `api/v1/router.py`; ver checklist):
  - `schemas.py`: Schemas Pydantic (`QualityStatus`, `FeederRankingDTO`, `QualityIndicatorsDTO`, `FeederTimeSeriesPointDTO`, `FeederTimeSeriesDTO`).
  - `rules.py`: Regras puras, sem FastAPI e sem SQLAlchemy: `classify_status` (VIOLACAO, ALERTA a partir de 85% do limite, CONFORME), `delta_dec`, `rank_feeders` e `summarize_indicators` (média simples entre alimentadores; a ponderada por UCs depende da pergunta B2 do grupo).
  - `queries.py`: Consultas SQLAlchemy Core sobre `fato_qualidade_alimentador`; único módulo que conhece o nome da tabela e das colunas do contrato.
  - `repository.py`: `GridQualityRepository` sobre `AsyncSession`; falha de tabela ou coluna vira `DatabaseReadError`.
  - `service.py`: `GridQualityService` com indicadores, ranking e histórico. O limite é lido da coluna do contrato; a origem dele segue em aberto (pergunta B1).
  - `dependencies.py`: Fábrica `get_grid_quality_service` e alias `GridQualitySvc`.
  - `router.py`: Rotas `GET /quality/indicators` (`competencia`), `/quality/feeders` (`competencia`, `status`) e `/quality/feeders/{id_alimentador}/history` (`meses`, de 1 a 48, padrão 24), sob `/api/v1` quando registradas, protegidas com `RequireOperacao`.
- `auth/rbac`:
  - Enriquecimento de token JWT com perfil de cargo. Papéis existentes no código (`UserRole` em `backend/app/core/constants.py`): `diretor`, `gerente_operacao`, `gerente_atendimento`, `gerente_perdas`, `atendente`. Não haverá perfil ADMIN (decisão de 2026-10-21).
  - Dependência central `require_role(allowed_roles: Sequence[UserRole | str])` em `backend/app/shared/dependencies.py`, com os grupos de papéis em `backend/app/shared/role_groups.py`.

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

- [x] Criar pasta `backend/app/features/grid_quality/` com schemas, repositório, serviço e rotas.
- [x] Implementar dependência de RBAC `require_role(...)` em `backend/app/shared/dependencies.py`.
- [ ] Registrar rotas em `backend/app/api/v1/router.py`. (pendente: arquivo compartilhado)
- [x] Criar testes unitários em `backend/tests/test_grid_quality_service.py` e `test_rbac.py` (garantindo bloqueio 403 para rotas não autorizadas). Também: `test_grid_quality_repository.py`, `test_grid_quality_router.py` e `test_grid_quality_imports.py`.
- [x] Garantir conformidade com `make lint-backend`.
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
    def require_role(allowed_roles: Sequence[UserRole | str]) -> Callable[..., UserDTO]:
        """Valida token JWT e exige que user.role esteja em allowed_roles (string fora do enum levanta ValueError)."""
    ```
  - Grupos de papéis centralizados em `backend/app/shared/role_groups.py` (`DIRETORIA_ONLY`, `OPERACAO_ACCESS`, `ATENDIMENTO_ACCESS`, `PERDAS_ACCESS`) e aliases `Require*` em `dependencies.py`.
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


