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

- **Regiões com as piores interrupções:** Beatriz Farias, pág. 6: *"saber quais regiões concentram as piores interrupções"*. Região = município e bairro (decisão do grupo, B3). O município vem do alimentador (relação 1:1, observado nos dados brutos). A visão por bairro depende de dado ainda pendente (origem do bairro: provável origem `dim_unidade_consumidora` (Renan), a confirmar).
- **Retorno da manutenção preventiva:** Beatriz Farias, pág. 6: *"onde a manutenção preventiva dá mais retorno"*; user story, pág. 8: *"...para direcionar a manutenção preventiva."* Como medir o "retorno": pendente da decisão do grupo (B4).

### Prioridade dos requisitos

- **Requisito do case:** acompanhar DEC e FEC por alimentador ao longo do tempo e identificar os piores (`atividade.pdf`, pág. 8).
- **Diferencial:** perfil por cargo (RBAC) e testes automatizados no backend (`atividade.pdf`, pág. 9).

### Observação sobre os dados (`atividade.pdf`, pág. 4)

> *"Nos dados deste case, cada registro de ocorrência corresponde a uma unidade consumidora interrompida, e os valores absolutos são simplificados: servem para comparar alimentadores e períodos entre si, não para comparar com os limites regulatórios reais."*

- Os valores de DEC e FEC são simplificados: servem para comparar alimentadores e períodos entre si, não com os limites regulatórios reais.
- Cada registro de ocorrência corresponde a uma UC interrompida.
- **DEC** = soma das durações das interrupções (horas) ÷ UCs atendidas do alimentador; **FEC** = UCs interrompidas ÷ UCs atendidas. Denominador **fixo** (UCs por alimentador), conforme ADR-003 e a Gold da Fatia 02 (Ryei, branch ainda sem merge). B2 respondida.
- **Grade completa de 48 meses:** meses sem interrupção têm DEC = FEC = 0. A coluna `ucs_atingidas` foi substituída por `ucs_atendidas` e `ucs_interrompidas`.
- **Limite anual e acumulado no ano (ADR-003):** a ANEEL fixa limite anual por conjunto elétrico. A Gold traz DEC/FEC do mês **e** `dec_acumulado_ano_horas` / `fec_acumulado_ano_vezes`; a violação é apurada sobre o acumulado no ano. O backend classifica pelo acumulado (VIOLACAO acima do limite, ALERTA a partir de 85%) e recalcula em Python, sem ler `violou_meta`. B1 informada pelo ADR-003: limite por conjunto (`criterio_limite = CONJUNTO`) e mediana dos 10 conjuntos mapeados para Recife, Paulista, Abreu e Lima e Araçoiaba (`MEDIANA_RMR`).
- **Resolvido:** `OSCILACAO` e os 5 tipos de ocorrência contam como interrupção.
- **Observação:** números calculados sobre os dados BRUTOS, antes do pipeline; podem mudar após o Silver/Gold.
- **B1 resolvida pelo ADR-003 revisado (26/10, Ryei, issue #23):** o limite aparece como "limite de referência", sem falar em multa nem violação regulatória real. Os nomes de coluna e campos do contrato (`dec_limite_aneel`, `fec_limite_aneel`, `VIOLACAO`, `percentual_violacao`, `alimentadores_em_violacao`, `violou_*`) permanecem.
- **Ocorrências:** `fato_ocorrencias_rede` existe; `OSCILACAO` e os 5 tipos de ocorrência contam. `NAO INFORMADA` (causa vazia) é distinta de `NAO IDENTIFICADA`.
- **Gold da Fatia 02:** mesclada na `main` (PR #38). O `v_energy.db` real chegou; a validação da fatia contra ele foi iniciada em 28/10: 5.856 linhas em `fato_qualidade_alimentador` e 180.000 em `fato_ocorrencias_rede`.

### Contrato real de `fato_qualidade_alimentador` (Gold da Fatia 02, mesclada na `main` pelo PR #38; contrato conferido antes no commit `65ad127`)

`id_alimentador`, `competencia` (`YYYY-MM`), `conjunto_aneel`, `criterio_limite` (`CONJUNTO` ou `MEDIANA_RMR`), `ucs_atendidas`, `ucs_interrompidas`, `dec_apurado_horas`, `fec_apurado_vezes` (do mês), `dec_acumulado_ano_horas`, `fec_acumulado_ano_vezes`, `dec_limite_aneel`, `fec_limite_aneel` (anuais), `violou_dec`, `violou_fec`, `violou_meta`.

### Respostas do Bernardo (Fatia 03, issue #27)

- RBAC da Visão 360: grupo `CUSTOMER360_ACCESS` (`diretor`, `gerente_atendimento`, `atendente`, `gerente_perdas` e, desde 28/10, `gerente_operacao`, a pedido dele para abrir a ficha do cliente a partir do ranking de circuitos) e alias `RequireCustomer360`, criados em `role_groups.py` e `dependencies.py`.
- Usuário seed `gerente.atendimento@venergy.com` criado por ele no PR dele; esta fatia não cria usuários.
- Rota do frontend: `/customers`.
- Tabela de ocorrências `fato_ocorrencias_rede` **entregue** (Ryei, PR #38): `id_ocorrencia`, `id_uc`, `alimentador`, `tipo`, `causa`, `data_abertura`, `data_encerramento`, `duracao_min`, com índices em `id_uc` e `alimentador`; 100% das ocorrências são de UCs do mesmo alimentador.

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/features/grid_quality/` & `backend/app/features/auth/`):
- `grid_quality` (rotas registradas em `api/v1/router.py`):
  - `schemas.py`: Schemas Pydantic (`QualityStatus`, `FeederRankingDTO`, `QualityIndicatorsDTO`, `FeederTimeSeriesPointDTO`, `FeederTimeSeriesDTO`).
  - `rules.py`: Regras puras, sem FastAPI e sem SQLAlchemy: `classify_status` (sobre o acumulado no ano: VIOLACAO acima do limite anual, ALERTA a partir de 85%, CONFORME), `delta_dec` (acumulado menos o limite), `rank_feeders` e `summarize_indicators` (média simples do acumulado no ano entre alimentadores; o denominador já é fixo por alimentador, ADR-003). `FeederScope` guarda conjunto, critério do limite e UCs.
  - `queries.py`: Consultas SQLAlchemy Core sobre `fato_qualidade_alimentador`; único módulo que conhece o nome da tabela e das colunas do contrato.
  - `repository.py`: `GridQualityRepository` sobre `AsyncSession`; falha de tabela ou coluna vira `DatabaseReadError`.
  - `service.py`: `GridQualityService` com indicadores, ranking e histórico. O limite é lido da coluna do contrato (anual, por conjunto ou mediana RMR, ADR-003); B1 resolvida pelo ADR-003 revisado.
  - `dependencies.py`: Fábrica `get_grid_quality_service` e alias `GridQualitySvc`.
  - `router.py`: Rotas `GET /quality/indicators` (`competencia`), `/quality/feeders` (`competencia`, `status`) e `/quality/feeders/{id_alimentador}/history` (`meses`, de 1 a 48, padrão 48), sob `/api/v1`, protegidas com `RequireOperacao`.
  - Continuidade (`continuity_*.py`, `municipalities.py`): `GET /quality/continuity` (`municipio`, `incluir_evento`) e `GET /quality/feeders/{id_alimentador}/customers` (`meses` 1 a 48, padrão 12; `limite` 1 a 50, padrão 10), ambas `RequireOperacao`. Períodos A/B de 12 meses derivados da série; evento extremo com `LIMIAR_EVENTO_EXTREMO = 3` sobre a mediana mensal da rede inteira; causas atacáveis (suposição, a validar com a Fatia 02): `VEGETACAO`, `FALHA DE EQUIPAMENTO`, `SOBRECARGA`; coordenadas dos municípios estáticas (aproximação, não vêm do banco). Filtro de escopo isolado em `scope_query`, para o bairro entrar depois.
- `auth/rbac`:
  - Enriquecimento de token JWT com perfil de cargo. Papéis existentes no código (`UserRole` em `backend/app/core/constants.py`): `diretor`, `gerente_operacao`, `gerente_atendimento`, `gerente_perdas`, `atendente`. Não haverá perfil ADMIN (decisão de 2026-10-21).
  - Dependência central `require_role(allowed_roles: Sequence[UserRole | str])` em `backend/app/shared/dependencies.py`, com os grupos de papéis em `backend/app/shared/role_groups.py`.

### Frontend (`frontend/src/features/grid_quality/` & `frontend/src/components/layout/`):
- `GridQualityPage.tsx`: Painel de continuidade operacional ($\le 150$ linhas).
- `hooks/useGridQualityController.ts`: Hook headless controlando filtros de município, bairro e alimentador.
- `components/QualityKpiCards.tsx`: Cards de DEC e FEC médios consolidados vs limite de referência.
- `components/FeederRankingTable.tsx`: Tabela dos piores circuitos com badges de alerta.
- `components/FeederTimeSeriesChart.tsx`: Série histórica mensal de 48 meses do circuito selecionado.
- `components/layout/AppLayout.tsx` & `SidebarNav.tsx`: Layout com navegação adaptativa ao cargo logado.
- `routes/ProtectedRoute.tsx`: Redirecionamento dinâmico de login para a tela do cargo ativo (Diferencial).

#### 🧩 Componentes do Design System Recomendados (`@/components/ui/` & `@/components/feedback/`):
- **Layout & Navegação:** `<AppLayout>` com `<SidebarNav>`, utilizando `<Separator />` para agrupamento de módulos permitidos por cargo (RBAC).
- **KPIs Regulatórios:** `<Card variant="glass">` e `<Card variant="interactive">` para DEC/FEC consolidado e percentual de violação do limite de referência.
- **Alternância de Módulos:** `<Tabs>` e `<TabsList>` / `<TabsTrigger>` para alternar entre *Visão por Região (município e bairro; a visão por bairro depende de dado ainda pendente)*, *Ranking de Alimentadores* e *Série Temporal*.
- **Tabela de Circuitos:** `<Table>` com `<TableHeader>`, `<TableRow>` e `<TableCell>` para ordenar alimentadores críticos com paginação limpa.
- **Badges Regulatórios:** `<Badge variant="destructive">` para circuitos que ultrapassaram o limite de referência e `<Badge variant="secondary">` para circuitos conformes.
- **Filtros Operacionais:** `<Select>` com `<Label>` para seleção dinâmica de Município, Bairro e Alimentador.
- **Gaveta Lateral de Circuito:** `<Sheet side="right">` disparado ao clicar em um alimentador para inspecionar gráfico de interrupções e UCs afetadas.
- **Tooltips Técnicos:** `<Tooltip>` de `@/components/ui/tooltip-card` explicando as fórmulas regulatórias de DEC (Duração Equivalente) e FEC (Frequência Equivalente).
- **Feedback & Estados:** `<LoadingSkeleton count={4} />` e `<EmptyState title="Nenhum alimentador com violação">`.

---

## 3. Checklist Operacional de Execução

- [x] Criar pasta `backend/app/features/grid_quality/` com schemas, repositório, serviço e rotas.
- [x] Implementar dependência de RBAC `require_role(...)` em `backend/app/shared/dependencies.py`.
- [x] Registrar rotas em `backend/app/api/v1/router.py`. (também incluídos `grid_quality.service` e `grid_quality.rules` no contrato 1 do import-linter em `backend/pyproject.toml`)
- [x] Criar testes unitários em `backend/tests/test_grid_quality_service.py` e `test_rbac.py` (garantindo bloqueio 403 para rotas não autorizadas). Também: `test_grid_quality_repository.py`, `test_grid_quality_router.py` e `test_grid_quality_imports.py`.
- [x] Garantir conformidade com `make lint-backend`.
- [x] Criar pasta `frontend/src/features/grid_quality/` com componentes $\le 150$ linhas.
- [x] Implementar layout base `AppLayout.tsx` e `SidebarNav.tsx` adaptativo por perfil de cargo.
- [x] Configurar redirecionamento automático por cargo no login em `frontend/src/routes/AppRoutes.tsx`.
- [x] Criar testes no frontend com Vitest em `GridQualityPage.test.tsx` e `RbacNavigation.test.tsx`.
- [x] Garantir conformidade com `make lint-frontend`.
- [x] Aba Continuidade com dados reais (`GET /quality/continuity`) e tabela de clientes mais afetados no detalhe do circuito (`GET /quality/feeders/{id}/customers`). Concluído por Joao Henrique em 2026-10-28; registro no `changelog.md`.
- [ ] Filtro de bairro na Continuidade (próxima etapa, parâmetro opcional em `dim_unidade_consumidora`).

---

## 4. Telas Concretas, Comportamentos & Contratos de Integração (Fatia 06)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Tela, Layout e Comportamentos (Zero Abstração)
1. **Cards Superiores de Continuidade (`QualityKpiCards.tsx`):**
   - Utilizam `<Card variant="glass">` e `<Card variant="interactive">`:
     - Card 1: **DEC Médio da Concessão (horas)** vs limite de referência (badge verde se $\le$ limite, vermelho se acima).
     - Card 2: **FEC Médio da Concessão (vezes)** vs limite de referência.
     - Card 3: **Percentual de Alimentadores em Violação (%)** com contagem absoluta (ex: *"14 de 122 circuitos"*).
     - Card 4: **Total de UCs Expostas a Circuitos Críticos** (impacto regulatório e risco de compensação).
2. **Filtros Operacionais:**
   - `<Select>` Município (por alimentador, relação 1:1), `<Select>` Bairro (origem pendente) e `<Select>` Alimentador.
   - `<Select>` Status Regulatório ("Todos", "Somente com Violação do Limite", "Conformes").
3. **Tabela de Alimentadores Críticos (`FeederRankingTable.tsx`):**
   - Ordenação inicial por **maior excesso de DEC sobre o limite de referência ($\Delta \text{DEC}$)**.
   - Colunas:
     - Código do Alimentador.
     - Município Atendido, Bairro e Quantidade de UCs conectadas.
     - DEC Apurado (h) e Limite de Referência (h).
     - FEC Apurado (vezes) e Limite de Referência (vezes).
     - Status Regulatório (Badges: `<Badge variant="destructive">Violação Crítica</Badge>`, `<Badge variant="outline">Alerta ($\ge 85\%$ do limite)</Badge>`, `<Badge variant="secondary">Conforme</Badge>`).
   - Comportamento: Ao clicar na linha, abre gaveta lateral `<Sheet side="right">` exibindo o gráfico `FeederTimeSeriesChart.tsx`.
4. **Gaveta Lateral de Série Temporal (`FeederTimeSeriesChart.tsx`):**
   - Renderizada dentro de `<SheetContent side="right">` com 500px de largura.
   - Gráfico de linha dos últimos **48 meses** do alimentador selecionado:
     - Linha sólida azul: DEC apurado mensal.
     - Linha tracejada vermelha horizontal: Limite de referência.
     - Lista das principais causas históricas das ocorrências (CLIMATICA, VEGETACAO, TERCEIROS, FALHA DE EQUIPAMENTO, SOBRECARGA, NAO IDENTIFICADA). Usa `fato_ocorrencias_rede` (causa), já disponível no banco real (ver 4.2).
5. **Comportamento do Shell RBAC (`AppLayout.tsx` & `SidebarNav.tsx`):**
   - O componente `SidebarNav.tsx` consome o contexto de autenticação `useAuth()`.
   - Se perfil for `atendente` ou `gerente_atendimento` (grupo `ATENDIMENTO_ACCESS`): exibe no menu apenas "Visão 360 da UC" e o atalho do Chat. Oculta "Inteligência Comercial", "Gestão de Perdas" e "Qualidade da Rede".
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
    - **Dependência atendida (PR #38, `fato_ocorrencias_rede`):** tabela de ocorrências com causa (CLIMATICA, VEGETACAO, TERCEIROS, FALHA DE EQUIPAMENTO, SOBRECARGA, NAO IDENTIFICADA), com colunas `id_ocorrencia`, `id_uc`, `alimentador`, `tipo`, `causa`, `data_abertura`, `data_encerramento`, `duracao_min` e índices em `id_uc` e `alimentador`. O contrato de `fato_qualidade_alimentador` não tem causa.
  - **De Renan (Fatia 01):** Consome `dim_unidade_consumidora` para contabilizar o número de UCs ativas ligadas a cada circuito elétrico, usadas como denominador do DEC e do FEC (fixo por alimentador, ADR-003; a Gold da Fatia 02 já traz `ucs_atendidas`). Provável origem do bairro: `dim_unidade_consumidora` (Renan), a confirmar.
  - **De Miguel (Fatia 07):**
    - Importa o componente `<ChatDrawer />` e insere o botão de disparo no cabeçalho (*Header*) global do `AppLayout.tsx`.
  - **De Bernardo, Célio e Adrian:** Recebe as rotas e títulos de suas páginas para compor as entradas autorizadas no menu dinâmico do `SidebarNav.tsx`.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Joao Henrique - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


