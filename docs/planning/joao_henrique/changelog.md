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
