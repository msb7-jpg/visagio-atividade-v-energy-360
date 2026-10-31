# 📝 Diário de Bordo — Fatia 06 (Joao Henrique)
**Fatia:** Qualidade da Rede (DEC/FEC) & Plataforma com RBAC (Fullstack)  
**Dono:** Joao Henrique

---

## Registros de Execução

### [2026-10-16] - Inicialização do Planejamento da Fatia 06
- **Autor:** Antigravity / Time V-Energy
- **O que foi feito:**
  - Estruturação do checklist operacional em `qualidade_rede_rbac.md`.
  - Mapeamento das rotas de DEC/FEC por alimentador e regras de RBAC dinâmico por perfil.
- **Dificuldades / Desafios:**
  - Orquestrar a navegação protegida no frontend para direcionar imediatamente ao cargo correto no login.
- **Próximos Passos:**
  - Implementar backend em `backend/app/features/grid_quality/` e módulo de RBAC em `app/features/auth/`.
- **Validação de Testes:**
  - Aguardando implementação.

### [2026-10-19] - RBAC no backend: `require_role` tipado e grupos de papéis centralizados
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Criado `backend/app/shared/role_groups.py` com os grupos de papéis (`DIRETORIA_ONLY`, `OPERACAO_ACCESS`, `ATENDIMENTO_ACCESS`, `PERDAS_ACCESS`) a partir de `UserRole`, único ponto a alterar quando o grupo decidir o conjunto final de papéis.
  - `require_role` em `backend/app/shared/dependencies.py` agora recebe `Sequence[UserRole]`; os aliases `Require*` usam os grupos centrais.
  - Criado `backend/tests/test_rbac.py`: 401 (sem token e token inválido), 403 e 200 em matriz papel x rota, 403 com mensagem de perfil negado, e login real dos usuários seed. `GERENTE_ATENDIMENTO` (sem usuário seed) usa token gerado direto.
- **Dificuldades / Desafios:**
  - Os papéis do código (`diretor`, `gerente_*`, `atendente`) divergem dos do planejamento (`DIRETORIA`, `ATENDIMENTO`, `ADMIN`...); nenhum papel foi renomeado, aguardando decisão do grupo.
- **Próximos Passos:**
  - Criar `backend/app/features/grid_quality/` e `test_grid_quality_service.py`; item de testes do checklist segue em andamento.
- **Validação de Testes:**
  - Ruff, Pylint (10/10), import-linter (4 contratos mantidos) e `uv run pytest` (45 testes) aprovados. Executados direto via `uv run` (equivalentes ao `make lint-backend`).

### [2026-10-20] - Fix: `require_role` aceita papéis em string (compatibilidade com a Fatia 05)
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Commit `ed98c57` (`fix(auth)`): `require_role` em `backend/app/shared/dependencies.py` passou a aceitar `Sequence[UserRole | str]` e normaliza com `UserRole(role).value`; string fora do enum levanta `ValueError`. Aliases e mensagens de 401 e 403 mantidos.
  - 4 casos de teste novos em `backend/tests/test_rbac.py`: membros do enum, strings válidas, lista mista e string inválida.
- **Dificuldades / Desafios:**
  - Na simulação de junção com `origin/feat/fatia-05-perdas`, a lista de strings da Fatia 05 (`LOSS_ROLES`) gerava `AttributeError` na importação com a versão anterior (`role.value`).
- **Validação de Testes:**
  - `make lint-backend` aprovado e `uv run pytest` com 49 testes aprovados.

### [2026-10-21] - Backend de qualidade da rede (`grid_quality`): DEC/FEC por alimentador
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Criado `backend/app/features/grid_quality/` (8 arquivos): `schemas.py`, `rules.py` (regras puras de status, delta, ranking e resumo), `queries.py` (único módulo que conhece tabela e colunas de `fato_qualidade_alimentador`), `repository.py`, `service.py`, `dependencies.py` (`GridQualitySvc`) e `router.py`.
  - Endpoints (prefixo `/quality`, protegidos com `RequireOperacao`): `GET /indicators` (`competencia`), `GET /feeders` (`competencia`, `status`) e `GET /feeders/{id_alimentador}/history` (`meses`, 1 a 48, padrão 24). **Não registrados** em `api/v1/router.py` (arquivo compartilhado).
  - Testes novos em `backend/tests/`: `test_grid_quality_service.py` (regras e serviço com repositório fake), `test_grid_quality_repository.py` (SQLite em memória com as 7 colunas do contrato), `test_grid_quality_router.py` (app mínimo, 401/403/200/404/422) e `test_grid_quality_imports.py` (AST: `service`/`rules` sem `fastapi`/`starlette`/`sse_starlette`, `rules` sem `sqlalchemy`, pacote sem importar outras features nem usar imports relativos). Sem `conftest.py`; fixtures dentro de cada arquivo.
  - Nomes neutros nos DTOs (`dec_limite_horas`, `fec_limite_vezes`); `*_aneel` só aparece em `queries.py`. Em `QualityIndicatorsDTO` a média de FEC chama `fec_medio_vezes` (unidade coerente com `fec_apurado_vezes`); os pontos da série seguem os mesmos nomes do ranking.
- **Suposições adotadas (decisões de comportamento 1 a 9):**
  1. `VIOLACAO` só com valor estritamente maior que o limite; valor igual ao limite cai em `ALERTA` (alerta a partir de 85% do limite).
  2. Limite nulo ou menor ou igual a zero: aquela métrica não gera violação nem alerta; `delta_dec_horas` fica `None` e o alimentador vai por último no ranking.
  3. `violou_meta` não é lido; o status vem de `rules.py`, comparando apurado com limite.
  4. Linhas com DEC ou FEC apurado nulo são ignoradas nas consultas (inclusive na última competência).
  5. Histórico: ordem decrescente com `LIMIT N`, invertida na saída; assume uma linha por mês por alimentador.
  6. Indicadores: média simples entre alimentadores; só `VIOLACAO` conta em `alimentadores_em_violacao`; percentual de 0 a 100; base vazia devolve indicadores zerados e `competencia` nula.
  7. Validação nas rotas: `competencia` no padrão `YYYY-MM` e `meses` de 1 a 48 (422 fora disso).
  8. Proteção por rota com `_user: RequireOperacao`, em vez de `dependencies=[...]` no router.
  9. Testes de rota geram o JWT direto com `PyJWT` e as configurações do app, sem importar `app.features.auth`; helper de token fica dentro do arquivo de teste.
- **Dificuldades / Desafios:**
  - Limites da skill (30 linhas por função, complexidade 10): `summarize_indicators` passou de 30 linhas e teve o caso vazio extraído para helper.
  - O contrato do import-linter em `pyproject.toml` lista módulos explicitamente e é arquivo compartilhado; `grid_quality.service` e `grid_quality.rules` ficam fora dele, cobertos só pelo teste de AST (imports diretos).
- **Validação de Testes:**
  - `make lint-all`: aprovado (backend: Ruff, Pylint 10/10, import-linter com 4 contratos mantidos; frontend: ESLint e Fallow).
  - `make test-all`: pytest aprovado com 119 testes (49 antes, 70 novos). **Vitest não executou**: falha de ambiente ao iniciar o worker (`undici` 8.12.2 exige Node >= 22.19.0; máquina com Node 22.14.0). Nenhum arquivo do frontend foi alterado nesta entrega; a falha não foi corrigida.
- **Pendências:**
  - Registrar o router em `api/v1/router.py` e incluir `grid_quality.service` e `grid_quality.rules` no contrato do import-linter em `pyproject.toml` (arquivos compartilhados).
  - Perguntas B1 a B6 do grupo (origem do limite, denominador do DEC/FEC, região, causa e retorno da manutenção, histórico de 24 meses, subestação e chave de junção).
  - Frontend da fatia, `AppLayout`/`SidebarNav` e testes de frontend; validar contra o `v_energy.db` real quando o pipeline entregar `fato_qualidade_alimentador`.

### [2026-10-21] - Alinhamento do documento com o case
- **Autor:** Joao Henrique
- **O que foi feito:**
  - `qualidade_rede_rbac.md` §1: fala da Beatriz Farias substituída pelo texto literal da pág. 6 do `atividade.pdf` (o texto anterior não constava no PDF).
  - §1: requisitos da pág. 6 e da user story da pág. 8 (regiões com as piores interrupções; retorno da manutenção preventiva), sem definir métrica.
  - §1: nota de prioridade: DEC/FEC por alimentador é requisito (pág. 8); RBAC e testes de backend são Diferencial (pág. 9).
  - §1: nota "Observação sobre os dados (pág. 4)": valores simplificados, 1 registro = 1 UC; as menções a "meta/limite ANEEL" seguem pendentes de B1.
  - §2: perfis do token JWT passam a listar os papéis de `UserRole`. **Decisão de 2026-10-21: não haverá perfil ADMIN.** Status do cabeçalho: "Em andamento".
  - Não foram alteradas as menções a meta/limite ANEEL, subestação, município, causas, 24 meses, filtros e a separação atendente × gerente_atendimento.
- **Pendências (perguntas ao grupo que continuam abertas):**
  - B1 origem do limite; B2 denominador do DEC/FEC e `ucs_atingidas` × 1 registro = 1 UC; B3 granularidade de "região"; B4 métrica de "retorno" da manutenção preventiva e causas; B5 histórico de 24 meses (os dados cobrem 4 anos); B6 subestação nos dados e chave `alimentador` × `id_alimentador`; B7 papéis finais (ADMIN decidido; restam os nomes finais e atendente × gerente_atendimento); B8 filtros do portal, comparação entre períodos e dono da story "principais indicadores"; B9 suposições no README e `SmartInsightCard` na tela de qualidade; B10 números do 5W2H que não constam no PDF e intervalo de anos (2022-2025 contra 5 arquivos de leituras).
  - Avisar o grupo: `ROADMAP.md` §7.1 e os planos de Bernardo, Célio e Adrian citam `UserRole.ADMIN`, que não existe e não existirá.

### [2026-10-22] - Decisões do grupo: região, histórico de 48 meses, causas e DEC/FEC
- **Autor:** Joao Henrique
- **O que foi feito:**
  - `grid_quality/service.py`: `MESES_HISTORICO_PADRAO` passou de 24 para 48 (o máximo continua 48); a rota `/quality/feeders/{id_alimentador}/history` usa a mesma constante. `test_grid_quality_router.py`: stub e teste do padrão atualizados para 48.
  - `qualidade_rede_rbac.md`: subestação removida (controller, filtro, coluna "Subestação de Origem" e filtro da tela 4.1); filtros passam a ser município, bairro e alimentador. Histórico de 48 meses nas seções 2 e 4. Região = município e bairro (decisão do grupo, B3); o município vem do alimentador (relação 1:1, observado nos dados brutos). Aba renomeada para "Visão por Região (município e bairro)", com a visão por bairro dependendo de dado pendente.
  - DEC = soma das durações (horas) ÷ UCs do alimentador; FEC = nº de ocorrências ÷ UCs do alimentador; cada linha da base é uma UC. Denominador fixo ou mensal: pendente (B2).
  - Textos de tela: "ANEEL/meta ANEEL" trocado por "limite de referência (suposição pendente, B1)"; nomes de coluna do contrato (`dec_limite_aneel`, `fec_limite_aneel`) mantidos.
  - Causas: CLIMATICA, VEGETACAO, TERCEIROS, FALHA DE EQUIPAMENTO, SOBRECARGA, NAO IDENTIFICADA. SidebarNav: perfil `atendimento` trocado por `atendente` e `gerente_atendimento` (grupo `ATENDIMENTO_ACCESS`).
  - Observação registrada: números calculados sobre os dados BRUTOS, antes do pipeline; podem mudar após o Silver/Gold.
- **Pendências:**
  - Ryei: tabela de ocorrências com causa (o contrato atual de `fato_qualidade_alimentador` não tem causa).
  - Origem do bairro: provável `dim_unidade_consumidora` (Renan), a confirmar.
  - Quais tipos de ocorrência contam como interrupção (hoje a fórmula conta todas as linhas da base).
  - B1 (origem do limite) e B2 (denominador fixo ou mensal) seguem abertas. Nenhuma agregação por município foi criada.
- **Validação de Testes:**
  - `make lint-backend`: Ruff, Pylint 10.00/10 e import-linter com 4 contratos mantidos.
  - `uv run pytest` em `backend`: 119 testes aprovados.

### [2026-10-22] - Registro das rotas `/quality` e contrato do import-linter
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Commit `695c694` (`feat(fatia-06-qualidade)`): `backend/app/api/v1/router.py` passou a registrar o router de `grid_quality` (prefixo `/quality`) com `include_router`, no mesmo padrão dos routers de auth e chat.
  - `backend/pyproject.toml`: `app.features.grid_quality.service` e `app.features.grid_quality.rules` incluídos no contrato 1 do import-linter ("Serviços de negócio não importam frameworks HTTP"), ao lado de `app.features.auth.service`. Mudanças só de acréscimo (4 linhas), para facilitar o merge com as Fatias 03, 04 e 05.
  - `qualidade_rede_rbac.md`: item "Registrar rotas em `router.py`" marcado `[x]`; texto da seção 2 atualizado (rotas registradas).
- **Validação de Testes:**
  - `make lint-backend`: Ruff, Pylint 10.00/10 e import-linter com 4 contratos mantidos e 0 quebrados.
  - `uv run pytest` em `backend`: 119 testes aprovados.
  - `app.openapi()['paths']` lista `/api/v1/quality/indicators`, `/api/v1/quality/feeders` e `/api/v1/quality/feeders/{id_alimentador}/history`.
- **Pendências:**
  - Conflitos esperados em `router.py` e `pyproject.toml` com as Fatias 03, 04 e 05: resolver na reunião com o grupo, mantendo as linhas de todas as fatias.
  - As demais pendências das entradas anteriores continuam abertas (B1 a B10, frontend da fatia, `v_energy.db` real, tabela de ocorrências com causa).

### [2026-10-23] - Shell RBAC no frontend: `AppLayout`, `SidebarNav` e `navItems`
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Criado `frontend/src/components/layout/`: `navItems.ts` (lista única de telas com os papéis permitidos, espelho de `role_groups.py`, e `navItemsFor(role)`), `SidebarNav.tsx` (links filtrados por `user.role`) e `AppLayout.tsx` (menu lateral, cabeçalho com usuário, papel e logout, `<Outlet />` e ponto de encaixe do `ChatDrawer` da Fatia 07).
  - `components/layout/__tests__/RbacNavigation.test.tsx`: matriz papel x itens do menu e ocultação de Qualidade e Perdas para `atendente`.
  - Atendimento (`atendente`, `gerente_atendimento`) vê só "Visão 360 da UC". Atalho do Chat ainda não existe (depende da Fatia 07).
- **Validação de Testes:**
  - `make lint-all` e `make test-all` aprovados (398 pytest, 75 vitest).
- **Pendências:**
  - `AppLayout` ainda **não está ligado** em `AppRoutes.tsx` (etapa 2); as páginas atuais têm cabeçalho próprio e vão duplicar ao ligar.

### [2026-10-23] - Rotas sob o `AppLayout`, redirecionamento por cargo e acesso negado com retorno
- **Autor:** Joao Henrique
- **O que foi feito:**
  - `frontend/src/routes/AppRoutes.tsx`: rotas protegidas agora ficam dentro de `<AppLayout />`; `/dashboard` passou a exigir `diretor`, `gerente_operacao` ou `gerente_perdas`; o fallback `*` usa `HomeRedirect` (tela inicial do cargo, ou `/login` sem sessão).
  - `frontend/src/routes/homeRoute.ts`: `homeRouteFor(role)` devolve a primeira tela do menu permitida ao papel. `LoginPage` navega para ela após o login.
  - `ProtectedRoute`: a tela "Acesso Restrito" ganhou o botão "Voltar à tela inicial".
  - Arquivos de outras fatias, com autorização do grupo para esta integração: removido o cabeçalho próprio de `DashboardPage` e os botões "Voltar ao painel" de `LossManagementPage` e `Customer360Page`, que o shell passou a cobrir.
  - `RbacNavigation.test.tsx` estendido: `homeRouteFor` por papel e acesso negado com botão de retorno.
- **Validação de Testes:**
  - `make lint-all` e `make test-all` aprovados.
- **Pendências:**
  - O item "Qualidade da Rede" do menu ainda aponta para `/quality`, que só ganha rota na etapa 3. `gerente_operacao` abre hoje em `/dashboard` (primeiro item do menu).

### [2026-10-23] - Frontend da Fatia 06: tela `/quality` (DEC/FEC por alimentador)
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Criado `frontend/src/features/grid_quality/` no padrão de `loss_management`: `types`, `api/qualityApi.ts`, `queries/qualityQueries.ts` (cache de 5 min; histórico só consulta com alimentador selecionado), `hooks/useGridQualityController.ts` (filtro de status e alimentador aberto), `utils/qualityFormatters.ts` e `components/`.
  - Componentes (todos abaixo de 150 linhas): `GridQualityPage`, `QualityKpiCards` (DEC médio, FEC médio, alimentadores em violação, com tooltip das fórmulas), `FeederRankingTable`, `QualityStatusBadge`, `FeederHistorySheet` (gaveta lateral) e `FeederTimeSeriesChart` (DEC contra o limite, 48 meses).
  - Rota `/quality` em `AppRoutes.tsx` para `diretor` e `gerente_operacao`.
- **Fora do escopo (dependem de decisão ou dado de outro membro):** filtros de município e bairro, aba de região, lista de causas, card de UCs expostas e retorno da manutenção preventiva.
- **Validação de Testes:**
  - `make lint-all` e `make test-all` aprovados (398 pytest, 79 vitest). Sem testes da página ainda (etapa 4); tela não conferida no navegador nem contra o `v_energy.db` real.
- **Pendências:**
  - Testes Vitest de `GridQualityPage` e conferência manual com o backend.

### [2026-10-23] - Backend alinhado ao ADR-003 (limite anual, acumulado no ano) e RBAC da Visão 360
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Contrato de `fato_qualidade_alimentador` conferido em `origin/feat/fatia-02-faturamento` (Gold e ADR-002/ADR-003): as 15 colunas batem com o esperado; sem divergência.
  - Commit `ce2e5b5`: `CUSTOMER360_ACCESS` em `role_groups.py`, alias `RequireCustomer360` e matriz em `test_rbac.py` (200 para os 4 papéis, 403 para `gerente_operacao`); `navItems.ts` ganhou o ícone `UserSearch` no item da Visão 360 (os 4 papéis já estavam lá).
  - Commit `e656d69`: `grid_quality` classifica pelo **acumulado no ano** contra o limite anual. `queries.py` lê acumulados, conjunto, critério e UCs (apuração sem acumulado fica fora); `rules.py` recalcula status e `delta_dec` (acumulado menos o limite) sem ler `violou_meta`; indicadores usam a média do acumulado até a competência. Campos novos nos DTOs de ranking e série: `dec_acumulado_ano_horas`, `fec_acumulado_ano_vezes`, `conjunto_aneel`, `criterio_limite`, `ucs_atendidas`. Nenhum campo existente foi renomeado ou removido.
  - Novo `FeederScope` em `rules.py` agrupa conjunto, critério e UCs (limite de 10 atributos do Pylint).
  - Testes: acumulado cruzando o limite, janeiro (acumulado = mensal), virada de ano, limite nulo, `MEDIANA_RMR`, repasse dos campos novos na rota.
- **Respostas e decisões registradas:**
  - B1 e B2 informadas pelo ADR-003 e pela Gold do Ryei (branch sem merge): limite anual por conjunto, mediana RMR para Recife, Paulista, Abreu e Lima e Araçoiaba, denominador fixo, grade de 48 meses, `ucs_atingidas` substituída por `ucs_atendidas` e `ucs_interrompidas`.
  - **Decisão pendente do grupo:** seguir o ADR-003 (limites reais) ou a pág. 4 do case (valores simplificados, não comparáveis com limites reais). Textos de tela mantidos como "limite de referência (suposição pendente, B1)".
  - Bernardo (issue #27): `CUSTOMER360_ACCESS`, usuário `gerente.atendimento@venergy.com`, rota `/customers` e tabela de ocorrências ainda pendente (colunas e índices em `qualidade_rede_rbac.md`).
- **Validação de Testes:**
  - `make lint-all` aprovado (Ruff, Pylint 10/10, import-linter, ESLint, Fallow) e `make test-all`: 418 pytest e 79 vitest.
- **Pendências:**
  - O frontend (`grid_quality/types`, textos e gráfico) ainda lê só os campos mensais; precisa passar a mostrar o acumulado no ano.
  - Merge da Gold da Fatia 02 e validação contra o `v_energy.db` real.

### [2026-10-23] - Frontend ajustado ao acumulado no ano e testes da página (etapa 4)
- **Autor:** Joao Henrique
- **O que foi feito:**
  - `qualityTypes.ts` ganhou os campos do contrato novo (`dec_acumulado_ano_horas`, `fec_acumulado_ano_vezes`, `conjunto_aneel`, `criterio_limite`, `ucs_atendidas`).
  - `FeederRankingTable` mostra DEC e FEC acumulados no ano ao lado do limite anual (o mensal saiu da tabela) e um selo "Limite aproximado" com tooltip quando `criterio_limite` é `MEDIANA_RMR` (ADR-003).
  - `FeederTimeSeriesChart` plota o DEC acumulado no ano contra o limite anual tracejado; o valor do mês aparece no tooltip.
  - `QualityKpiCards`: "Média do acumulado no ano até a competência" e fórmulas atualizadas. Os textos "limite de referência (suposição pendente, B1)" foram mantidos.
  - Testes: `GridQualityPage.test.tsx` (7 casos: cards, acumulado ao lado do limite, limite aproximado só na mediana RMR, filtro de status, gaveta do histórico, vazio e erro), com mocks no contrato novo. `RbacNavigation.test.tsx` já cobria o menu e o acesso negado.
  - Commits do frontend das etapas 1 a 3 separados em shell, páginas de outras fatias e feature `grid_quality`.
- **Validação de Testes:**
  - `make lint-all` aprovado; `make test-all`: 418 pytest e 86 vitest.
- **Pendências:**
  - Conferir a tela no navegador e contra o `v_energy.db` real; filtros de município e bairro, aba de região, causas e card de UCs expostas seguem fora do escopo.


### [2026-10-27] - Textos da tela ajustados ao ADR-003 revisado (B1 resolvida)
- **Autor:** Joao Henrique
- **O que foi feito:**
  - B1 resolvida pelo ADR-003 revisado (26/10, Ryei, issue #23): o limite é "limite de referência", sem multa nem violação regulatória real. Removido "(suposição pendente, B1)" de `QualityKpiCards`, `FeederHistorySheet` e do teste.
  - Rótulos: "Violação Crítica" virou "Acima do limite de referência"; "Alimentadores em violação" virou "Alimentadores acima do limite de referência" (fórmula sem a palavra violação); filtro "Somente acima do limite de referência".
  - Só texto: `VIOLACAO`, `percentual_violacao`, `alimentadores_em_violacao`, `dec_limite_aneel` e `violou_*` não foram renomeados.
- **Registro de dados:**
  - `fato_ocorrencias_rede` existe; `OSCILACAO` e os 5 tipos contam; `NAO INFORMADA` é distinta de `NAO IDENTIFICADA`.
  - A Gold da Fatia 02 ainda não foi mesclada na `main`.


### [2026-10-27] - Aba Continuidade na tela de qualidade (frontend com dados de exemplo)
- **Autor:** Joao Henrique
- **O que foi feito:**
  - `/quality` continua a única rota; `GridQualityPage` virou abas "Visão atual" (padrão, movida para `CurrentQualityView` sem mudar comportamento) e "Continuidade".
  - Continuidade, a partir de `design/continuidade_referencia.png`: aviso "Dados de exemplo, aguardando a Gold da Fatia 02", filtros (mês do evento 07/2025 e município), 4 cards B contra A, destaque do evento, mapa esquemático e DEC por município, tabela por UC-horas, causas e tipos de ocorrência. Só componentes de `ui/` e tokens do `design.md`.
  - Dados: `mocks/continuityMock.ts` (único arquivo de mock, colunas reais de `fato_qualidade_alimentador` e `fato_ocorrencias_rede`, conferidas em `origin/feat/fatia-02-faturamento`) atrás de `api/continuityApi.ts`; agregações em `utils/continuityAggregations.ts`. Trocar a API não mexe nos componentes.
- **Fora desta entrega:** bloco "Gerado por IA" (depende do agente do Miguel), lista de bairros (exige `dim_unidade_consumidora`), filtro de causa, seletor de período, exportar CSV, premissa de retorno da manutenção, detalhe ao clicar no alimentador.
- **Pendências:** trocar o mock pela API real depois do merge da Gold da Fatia 02; definir com o grupo a lista de causas atacáveis (premissa da referência); coordenadas dos municípios são fixas no mock.
- **Validação de Testes:**
  - `make lint-all` aprovado; `make test-all`: 537 pytest e 174 vitest.


### [2026-10-28] - Visão 360 da UC liberada para o gerente_operacao (pedido do Bernardo, Fatia 03)
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Backend: `UserRole.GERENTE_OPERACAO` entrou em `CUSTOMER360_ACCESS` (`role_groups.py`), grupo usado por `RequireCustomer360` e pelo router de `customer360`; nenhuma lista duplicada. `gerente_operacao` segue 403 em `/perdas` e `/diretoria`.
  - Frontend: `AppRoutes.tsx` deixou de ter listas próprias de papéis e passou a ler `NAV_ITEMS` (`rolesOf(path)`), fonte única do RBAC das telas; o item `/customers` ganhou `gerente_operacao`. A árvore de rotas foi extraída para `AppRouteTree` (sem roteador) para ser testável com `MemoryRouter`.
  - Testes atualizados: `test_customer360_router.py` (`operacao@venergy.com` passa a receber 200, no teste dos perfis autorizados), `test_rbac.py` (`/customer360` inclui `GERENTE_OPERACAO`), `RbacNavigation.test.tsx` (menu do gerente_operacao inclui "Visão 360 da UC").
  - Teste novo `routes/__tests__/RbacMatrix.test.tsx`, sem navegador: Vitest + `MemoryRouter` percorre 5 papéis x 5 rotas (tela permitida ou "Acesso Restrito") e confere os itens do menu, com tabela esperada explícita.
- **Validação de Testes:**
  - `make lint-all` aprovado; `make test-all`: 537 pytest e 342 vitest.


### [2026-10-28] - Documentação de RBAC e atualização dos docs da fatia após o merge da Gold
- **Autor:** Joao Henrique
- **O que foi feito:**
  - `ROADMAP.md`: Fatia 06 com "série 48m"; matriz de dependência de RBAC passou a citar os grupos reais de `role_groups.py` e os aliases `Require*` de `dependencies.py` (sem `UserRole.ATENDIMENTO`, `DIRETORIA` e `ADMIN`, que não existem); registrado que `CUSTOMER360_ACCESS` inclui `gerente_operacao`, a pedido do Bernardo, além de diretor, gerente_atendimento, atendente e gerente_perdas.
  - `DECISOES.md`: ADR-024 (RBAC). Foi escrito como ADR-010 e renumerado em 28/10, porque o Painel do Diretor (Bernardo) usa ADR-010 a ADR-016 e a Visão 360 usa ADR-017 a ADR-023.
  - `qualidade_rede_rbac.md` e `plano_frontend_fatia_06.md`: Gold da Fatia 02 mesclada (PR #38), `fato_ocorrencias_rede` entregue e `v_energy.db` real recebido; o item "tipos de ocorrência" virou resolvido. Entradas antigas deste changelog ficam como histórico da época.
  - Validação com o banco real iniciada: 5.856 linhas em `fato_qualidade_alimentador` e 180.000 em `fato_ocorrencias_rede`.
- **Pendências:** a aba Continuidade ainda usa dados de exemplo; a troca do mock pelo banco real é a tarefa seguinte e atualizará a entrada de 27/10.
- **Validação de Testes:**
  - Só documentação, nenhum código alterado. `make lint-all` aprovado; `make test-all`: 537 pytest e 342 vitest.


### [2026-10-28] - Aba Continuidade com dados reais e clientes mais afetados por circuito
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Backend: `GET /quality/continuity?municipio=&incluir_evento=` (mesmo grupo `RequireOperacao`) devolve o `ContinuitySnapshot` agregado em SQL, sem carregar as 180 mil ocorrências. Arquivos novos em `grid_quality/`: `continuity_queries.py`, `continuity_rules.py`, `continuity_repository.py`, `continuity_service.py`, `continuity_schemas.py` (JSON em camelCase) e `municipalities.py`.
  - Regras (constantes nomeadas em `continuity_rules.py`): período A = primeiros 12 meses e B = últimos 12 (`MESES_POR_PERIODO`), derivados da série; evento extremo = mês de UC-horas acima de 3 vezes a mediana mensal da rede inteira (`LIMIAR_EVENTO_EXTREMO`), igual para qualquer município; `incluir_evento=false` tira o mês de A e de B; sem mês acima do limiar, `event` vem nulo. UC-horas = soma de `duracao_horas`. DEC = UC-horas / soma de `ucs_atendidas` contada uma vez por alimentador no escopo; FEC = ocorrências / a mesma soma. Causa `NAO INFORMADA` vira "Sem causa registrada". Circuitos: os 20 maiores por UC-horas (`LIMITE_CIRCUITOS_RANKING`); amostra pequena = menos de 50 UCs.
  - Causas atacáveis (suposição de negócio, a validar com a Fatia 02): `VEGETACAO`, `FALHA DE EQUIPAMENTO` e `SOBRECARGA`. As demais, inclusive "Sem causa registrada", não contam.
  - Coordenadas dos 14 municípios: aproximação estática em `municipalities.py`, não vêm do banco.
  - O filtro de escopo (município) está isolado em `scope_query` (`continuity_queries.py`): devolve os alimentadores do escopo e o resto só filtra por `id_alimentador`. Bairro não entra ali (ver ADR-025, item 6).
  - Backend: `GET /quality/feeders/{id}/customers?meses=12&limite=10` (1 a 48 meses, 1 a 50 clientes) com as UCs de um circuito por horas sem energia.
  - Frontend: `continuityApi` chama a API; removidos `continuityMock.ts`, `continuityAggregations.ts`, o banner de dados de exemplo e os tipos órfãos. Gaveta do circuito ganhou a tabela de clientes com "Ver ficha" para `/customers?uc=`. `QualityStatusBadge`: acima do limite = destructive, alerta = warning, conforme = success. Textos: "limite de referência" e "Situação em relação ao limite de referência".
  - A lista de 14 municípios do filtro é constante no frontend (`continuityMunicipalities.ts`), porque o snapshot filtrado traz só o município escolhido.
- **Fora desta entrega:** filtro de bairro (fora de escopo: um alimentador atende em média 3,3 bairros, então exigiria filtrar por UC; a causa atende melhor o gerente de operação), bloco "Gerado por IA" e "causa principal por circuito".
- **Pendências:** validar a lista de causas atacáveis com a Fatia 02. Nome de bairro sujo na Gold registrado em `docs/CORRECOES.md`.
- **Validação de Testes:**
  - `make lint-all` aprovado; `make test-all`: 644 pytest e 360 vitest. Testes novos: `test_grid_quality_continuity.py` e `test_grid_quality_customers.py` (seed pequeno, valores à mão) e rotas novas em `test_grid_quality_router.py`.


### [2026-10-30] - Acabamento da Qualidade da Rede: nova tentativa, cartões por situação e paginação
- **Autor:** Joao Henrique
- **O que foi feito:**
  - "Tentar novamente" (`onRetry` com `refetch`) na Continuidade, na Visão atual (indicadores e ranking) e nas duas consultas da gaveta do circuito. O erro dos indicadores passou de `EmptyState` para `ErrorState`.
  - Backend: `GET /quality/indicators` ganhou `alimentadores_em_alerta`, `percentual_alerta`, `alimentadores_conformes` e `percentual_conforme` (antes só vinha a violação). Teste de agregação com 4 alimentadores calculados à mão (1 violação, 1 alerta, 2 conformes: 25%, 25% e 50%).
  - Frontend: o cartão único virou três cartões de situação (Badge destructive, warning e success) com "n de N circuitos", mantendo DEC e FEC médios numa linha acima.
  - Paginação da tabela de circuitos com o componente `components/ui/pagination.tsx` (15 por página); volta à página 1 ao trocar o filtro de situação e a gaveta abre de qualquer página.
  - Gaveta: `whitespace-nowrap` em "Ver ficha" e no bairro de "Clientes mais afetados".
- **Fora desta entrega:** conferência visual no navegador (só testes automatizados).
- **Validação de Testes:**
  - `make lint-all` aprovado; `make test-all`: 708 pytest e 543 vitest.

### [2026-10-30] - Filtro de causa na Continuidade
- **Autor:** Joao Henrique
- **O que foi feito:**
  - Backend: `GET /quality/continuity` ganhou `causa` (valor do banco; "Sem causa registrada" vale `NAO INFORMADA`; inexistente = 400). Filtra a ocorrência e vale para KPIs de A e B, cartão do evento, municípios, circuitos e tipos. Denominador do DEC/FEC inalterado; bloco de causas continua com todas, filtrado só por município; evento detectado na rede inteira. `ContinuityEvent` ganhou `extremeInScope`; mês sem ocorrência no escopo conta como zero na mediana.
  - Frontend: seletor "Causa" ao lado do município ("Todas" e as causas do snapshot, sem rota nova). O cartão do evento fica neutro quando o mês não é extremo para a causa e não calcula "N vezes" com mediana zero.
  - ADR-025: item 7 (causa) e correção do item 6 (bairro não é filtro).
- **Fora desta entrega:** filtro de bairro (motivo no ADR-025, item 6), bloco "Gerado por IA" e "causa principal por circuito".
- **Validação de Testes:**
  - Banco real (`v_energy.db`, B = 12 últimos meses): DEC de B da rota igual ao SQL independente em todas as 7 causas (VEGETACAO 0,24127; CLIMATICA 2,14186); soma por causa 3,4493594 = DEC total 3,4493594.
  - `make lint-all` aprovado; `make test-all`: 731 pytest e 578 vitest.
