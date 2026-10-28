# Plano: fechar o checklist operacional da Fatia 06 (frontend)

> **Dono:** Joao Henrique · **Criado:** 2026-10-23 · **Prazo do projeto:** 2026-11-04
> Backend (itens 1 a 5 do checklist) já está `[x]`. Restam os 5 itens de frontend.

## Estado atual (verificado)

- Existem `features/auth`, `customer360` (Bernardo) e `loss_management` (Adrian). **Não existem** `features/grid_quality/` nem `components/layout/`.
- `ProtectedRoute` já valida `allowedRoles`, mas a tela "Acesso Restrito" não tem botão de retorno.
- `AppRoutes.tsx` tem `/login`, `/dashboard`, `/losses`, `/customers`. Falta `/quality`. Cada página atual se desenha sozinha (sem shell comum).
- UI base disponível: `card`, `table`, `tabs`, `select`, `badge`, `sheet`, `chart`, `tooltip-card`, `label`, `separator`. `recharts` está instalado.
- Endpoints prontos: `GET /quality/indicators`, `/quality/feeders`, `/quality/feeders/{id}/history`. Papéis: `OPERACAO_ACCESS` (ver `role_groups.py`).
- Vitest voltou a rodar (68 testes). O bloqueio de Node de 2026-10-21 não se repete nesta máquina.

## Ordem de execução

Cada etapa: marcar `[- Em andamento por Joao Henrique - data]` → implementar → `make lint-all` + `make test-all` → `[x]` + entrada no `changelog.md`.

### Etapa 1: Shell RBAC (`AppLayout` + `SidebarNav`) — item 2 do checklist
Fazer primeiro: as outras fatias dependem dele e é o item de maior valor (Diferencial, pág. 9).
1. `frontend/src/components/layout/navItems.ts`: lista única `{ label, path, roles }` (Dashboard, Visão 360, Perdas, Qualidade). Os `roles` espelham `role_groups.py`; um só lugar para Bernardo, Célio e Adrian plugarem suas rotas.
2. `SidebarNav.tsx`: usa `useAuth()`, filtra `navItems` por `user.role`, `NavLink` para cada um, `<Separator />` entre grupos. Atendimento (`atendente`, `gerente_atendimento`) vê só Visão 360 e atalho do Chat.
3. `AppLayout.tsx`: sidebar + header (nome, badge do papel, logout) + `<Outlet />`. Deixar um slot no header para o `<ChatDrawer />` do Miguel (não implementar).
4. Cada componente ≤ 150 linhas, sem `<button>` nativo, sem cores brutas (`design.md`).

### Etapa 2: Rotas e redirecionamento por cargo — item 3
1. `AppRoutes.tsx`: embrulhar as rotas protegidas em um layout route (`<Route element={<ProtectedRoute><AppLayout/></ProtectedRoute>}>`) mantendo `allowedRoles` por rota; adicionar `/quality` com `QUALITY_ROLES` (espelho de `OPERACAO_ACCESS`).
2. Redirecionamento pós-login: função `homeRouteFor(role)` (ex.: operação → `/quality`, atendimento → `/customers`, perdas → `/losses`, diretor → `/dashboard`); usada no `LoginPage` e no fallback `*`. Pergunta ao grupo: confirmar a tela inicial de cada cargo.
3. `ProtectedRoute`: tela "Acesso Restrito" ganha botão `<Button>` "Voltar à tela inicial" apontando para `homeRouteFor(user.role)`.
- **Atenção:** `AppRoutes.tsx` e `navItems.ts` são os pontos de conflito com as outras fatias. Mudar só por acréscimo e avisar o grupo antes do push.

### Etapa 3: Feature `grid_quality` — item 1
Pasta `frontend/src/features/grid_quality/` no mesmo padrão de `loss_management` (`api/`, `queries/`, `hooks/`, `components/`, `types/`).
1. `types` + `api/qualityApi.ts`: tipos espelhando os DTOs do backend (`QualityIndicatorsDTO`, `FeederRankingDTO`, série), chamadas com `AbortSignal`.
2. `queries/qualityQueries.ts`: `queryOptions` para indicadores, ranking e histórico (usar a skill `tanstack-query`).
3. `hooks/useGridQualityController.ts`: filtros (status, alimentador selecionado, competência) e alimentador aberto na gaveta. Município e bairro: só entram se o dado existir (B3 aberta); começar com **status + alimentador**.
4. Componentes (≤ 150 linhas cada):
   - `QualityKpiCards.tsx`: DEC médio, FEC médio, % em violação (ex.: "14 de 122"), vs "limite de referência". O Card 4 (UCs expostas) só se o backend expuser o dado; senão fica fora e vai para pendências.
   - `FeederRankingTable.tsx`: ordenado por ΔDEC, badges Violação/Alerta/Conforme; clique abre `<Sheet side="right">`.
   - `FeederTimeSeriesChart.tsx`: 48 meses, linha de DEC + linha tracejada do limite (usa `ui/chart`). **Sem lista de causas** (depende de tabela do Ryei).
   - `GridQualityPage.tsx`: monta KPIs + filtro de status + tabela; `LoadingSkeleton`, `EmptyState`, erro.
5. Tooltip de fórmula DEC/FEC com `tooltip-card`.
- Adiado de propósito: aba "Visão por Região" (depende de bairro, B3) e "retorno da manutenção" (B4). Registrar como pendência, não inventar métrica.

### Etapa 4: Testes Vitest — item 4
1. `features/grid_quality/__tests__/GridQualityPage.test.tsx`: renderiza KPIs e ranking com API mockada; estado de loading, vazio e erro; clique na linha abre a gaveta.
2. `components/layout/__tests__/RbacNavigation.test.tsx`: matriz papel × itens do menu (atendente não vê Qualidade nem Perdas; operação vê Qualidade); `ProtectedRoute` mostra "Acesso Restrito" com botão de retorno; `homeRouteFor` por papel.
3. Seguir o padrão dos testes de `customer360` e `loss_management` (mocks, providers).

### Etapa 5: Fechamento — item 5
1. `make lint-all` e `make test-all` 100% (Fallow: ≤ 150 linhas, complexidade ≤ 15, duplicação ≤ 5%; ESLint sem tags nativas, sem `&&` vazado, sem barrel).
2. Subir a stack (`make run-backend` + `make run-frontend`) e conferir manualmente com 3 logins: `gerente_operacao` (Qualidade), `atendente` (só Visão 360), `diretor` (tudo).
3. Atualizar o checklist (`[x]`), o `changelog.md` e o status do cabeçalho; commits `feat(fatia-06-qualidade): ...`.

## Dependências e riscos

| Risco | Efeito | Mitigação |
|---|---|---|
| `v_energy.db` real chegou com `fato_qualidade_alimentador` (5.856 linhas) e `fato_ocorrencias_rede` (180.000), Gold mesclada no PR #38 | A tela de ranking e histórico ainda foi testada só com mock | Validação contra o banco real iniciada em 28/10; conferir cards, ranking e histórico e avisar o grupo |
| B1 e B2 resolvidas (ADR-003 revisado) | Limite é de referência, sem multa nem violação real | Usar o rótulo "limite de referência" |
| Tabela de causas disponível (`fato_ocorrencias_rede`); bairro ainda depende de `dim_unidade_consumidora` | Sem lista de causas e sem visão por região na tela atual | Fora do escopo desta entrega; listado nas pendências |
| Conflitos em `AppRoutes.tsx` / nav com Fatias 03, 05, 07 | Merge manual | Só acréscimos; `navItems.ts` único; combinar com o grupo antes do push |
| `ChatDrawer` (Miguel) ainda não existe | Slot vazio no header | Deixar só o ponto de encaixe |

### Etapa 3b: aba Continuidade com dados reais (2026-10-28)
`continuityApi` chama `GET /quality/continuity` (`municipio`, `incluir_evento`); mock e agregações no cliente removidos. Períodos A e B de 12 meses vêm da série; evento extremo com K = 3 sobre a mediana mensal da rede inteira; causas atacáveis (`VEGETACAO`, `FALHA DE EQUIPAMENTO`, `SOBRECARGA`) são suposição a validar com a Fatia 02; coordenadas do mapa são estáticas e aproximadas. A lista de 14 municípios do filtro é constante (o snapshot filtrado traz só um). A gaveta do circuito lista os clientes mais afetados (`GET /quality/feeders/{id}/customers`) com "Ver ficha" para `/customers?uc=`.

## Fora do escopo (decisão sobre perguntas B1 a B10 é do grupo)
Bairro como filtro (próxima etapa), aba de região, retorno da manutenção preventiva, lista de causas, UCs expostas (Card 4).
