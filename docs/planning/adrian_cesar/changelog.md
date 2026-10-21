# 📝 Diário de Bordo — Fatia 05 (Adrian Cesar)
**Fatia:** Gestão de Perdas, Fila de Fiscalização & Campo (Fullstack)  
**Dono:** Adrian Cesar

---

## Registros de Execução

### [2026-10-16] - Inicialização do Planejamento da Fatia 05
- **Autor:** Antigravity / Time V-Energy
- **O que foi feito:**
  - Estruturação do checklist operacional em `05_dev_loss_management.md`.
  - Desenho do fluxo de exportação e upload multipart de planilha de campo preenchida.
- **Dificuldades / Desafios:**
  - Tratar inconsistências de formato na planilha devolvida pela equipe de campo sem quebrar a importação transacional.
- **Próximos Passos:**
  - Implementar backend em `backend/app/features/loss_management/` e testes com arquivos mock.
- **Validação de Testes:**
  - Aguardando implementação.

### [2026-10-19] - Backend CRUD da Fila de Suspeitas e Ordens de Inspeção
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Criado `backend/app/features/loss_management/` (schemas, models, scoring, repository, service, dependencies, router, exceptions).
  - Endpoints protegidos por RBAC (`diretor`, `gerente_perdas`): `GET /losses/suspicious-units`, `GET|POST /losses/inspections`, `PATCH /losses/inspections/{id_inspecao}`.
  - Regra de suspeita: queda >= 50% do consumo médio das 3 últimas competências vs. 12 anteriores, ou leitura zerada; UCs com GD solar e com ordem ativa são excluídas. Fila ordenada por valor esperado (score x kWh estimado; tarifa média R$ 0,85/kWh).
  - Máquina de estados: gerada -> pendente -> concluida, com cancelamento (justificativa obrigatória) a partir de gerada/pendente; conclusão exige `irregularidade_constatada`.
  - Tabela operacional `ordem_inspecao` criada no startup (lifespan em `main.py`); rotas registradas em `api/v1/router.py`; service/scoring adicionados ao contrato Pure Python do import-linter.
- **Dificuldades / Desafios:**
  - Tabelas Gold (`dim_unidade_consumidora`, `fato_medicao`) ainda não existem: a fila retorna erro 500 explícito até o pipeline do Renan exportar o SQLite. Desenvolvido contra o contrato de colunas da Fatia 01 e validado com SQLite em memória.
- **Próximos Passos:**
  - Exportação CSV/XLSX e upload de planilha (dependem de `openpyxl`/`python-multipart`).
  - Usar `fato_inspecoes_perdas` (Ryei) para calibrar o score com o hit rate histórico.
- **Validação de Testes:**
  - `pytest`: 28 passed (16 novos em `test_loss_management_service.py` e `test_loss_router.py`). Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos, Pyright 0 erros.

### [2026-10-19] - Consulta portável, documentação OpenAPI e conformidade de lint
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - SQL bruto da fila de suspeitas reescrito com SQLAlchemy Core (`queries.py`), sem funções específicas de SQLite; compila em SQLite, PostgreSQL e MySQL.
  - Criado `app/shared/docs.py` (`EndpointDoc`) para padronizar a documentação Swagger, aplicado aos 4 endpoints de perdas (`router_metadata.py`), com 401/403/409/500 documentados.
  - Falhas de consulta às tabelas Gold passam a ser registradas em log com a causa original.
  - Checklist: item "conformidade com `make lint-backend`" concluído. Testes seguem em andamento até cobrirem exportação e upload de planilha.
- **Validação de Testes:**
  - `pytest`: 41 passed. Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos, Pyright 0 erros.

### [2026-10-20] - Ordem de desenvolvimento em fases e fechamento dos testes de backend
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Adicionada a seção 3.1 "Ordem de Desenvolvimento" ao checklist (Fases 0–8): alinhamentos com Renan/Ryei, script PROVISÓRIO de dados de desenvolvimento, ajustes da fila pela fala do Gerente de Perdas, conformidade com `backend-coding-standards`, frontend obrigatório, diferenciais (exportação e upload) e documentação de suposições.
  - Item de testes unitários/integração do backend marcado como concluído.
- **Dificuldades / Desafios:**
  - Vitest não iniciava com Node 22.14 (`undici` 8.12.2 exige Node >= 22.19). Resolvido atualizando o Node para 22.23.2.
- **Próximos Passos:**
  - Fase 0 (confirmar contratos com Renan/Ryei) e Fase 1 (script provisório de seed).
- **Validação de Testes:**
  - `pytest`: 41 passed. `vitest`: 1 passed. Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos, ESLint e Fallow OK.

### [2026-10-20] - Fase 1: script PROVISÓRIO de dados de desenvolvimento
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Criado um script de seed **somente local** (⚠️ provisório, não é a Gold; não versionado nem enviado no PR; remover na Fase 7). Gera `dim_unidade_consumidora`, `fato_medicao` e `fato_inspecoes_perdas` com as colunas dos contratos de Renan e Ryei a partir de `data/landing/`.
  - Segurança: aborta se qualquer tabela-alvo existir; DDL + dados numa única transação (`autocommit=False`); `--drop` remove apenas tabelas marcadas em `_seed_provisorio_fatia05`.
  - Limpeza: 30.132 leituras duplicadas idênticas e 1.261 UCs repetidas descartadas; classe unificada (caixa e acento); `NULL`/`-`/`N/A` tratados como ausentes; resultado de campo normalizado em booleano; decimais com vírgula; datas por separador (`-` = MM-DD-AAAA, `.` e `/` = DD-MM-AAAA).
  - `openpyxl` usado só em tempo de execução (`uv run --with openpyxl`), sem alterar `pyproject.toml`/`uv.lock` compartilhados.
- **Dificuldades / Desafios:**
  - No modo padrão do `sqlite3`, `CREATE TABLE` não entra na transação: uma falha deixava tabelas vazias. Corrigido com `autocommit=False` e validado com execução que falha de propósito.
- **Próximos Passos:**
  - Fase 2: excluir da fila UCs com ordem concluída e já inspecionadas no histórico, `limit` padrão 200 e filtro por bairro.
- **Validação de Testes:**
  - Seed: 45.200 UCs, 2.152.336 medições (2022-07 a 2026-06), 1.389 inspeções (acerto 62,7%, 0 datas inválidas, 0 FKs órfãs). Fila real: 83 UCs.
  - `pytest`: 41 passed. `vitest`: 1 passed. Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos, ESLint e Fallow OK.

### [2026-10-20] - Fase 2: fila ajustada à fala do Gerente de Perdas
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Fila exclui UCs já inspecionadas dentro da janela de análise (15 meses): ordem **concluída** no sistema ou registro em `fato_inspecoes_perdas` (Fatia 02). Ordem cancelada devolve a UC à fila. Evita mandar a equipe a uma UC cujo sinal de queda já foi verificado ("cada inspeção que não encontra nada é um dia de equipe perdido").
  - `limit` padrão = 200 (`FILA_CAPACIDADE_MENSAL`, "mais de 200 inspeções por mês").
  - Filtro por **bairro** além de município e classe; query params agrupados em `SuspiciousUnitsFilterDTO`.
  - Antecipado da Fase 3: montagem de `SuspicionFilters` (limiar de 50%) movida do repositório para o serviço.
  - Documentação OpenAPI e mensagem de erro 500 atualizadas para incluir `fato_inspecoes_perdas`.
- **Dificuldades / Desafios:**
  - Definir "recentemente": adotada a própria janela de análise do score, para a regra ser explicável ao gerente.
- **Próximos Passos:**
  - Fase 3 (docstrings, `update_order` no repositório, decompor expressões aninhadas).
- **Validação de Testes:**
  - 7 testes novos (TDD: RED confirmado antes da implementação). `pytest`: 48 passed. Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos, Pyright 0 erros.
  - Dados de desenvolvimento locais: fila caiu de 83 para 79 UCs (4 já inspecionadas excluídas); filtro por bairro validado.

### [2026-10-20] - Fase 3: conformidade com `backend-coding-standards`
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Docstrings Google-style (`Args`/`Returns`/`Raises`) em todas as funções e métodos públicos de repositório, serviço, consultas, scoring, rotas e fábrica de DI.
  - Isolamento do ORM: `LossRepository` devolve apenas `InspectionOrderDTO` (`to_order_dto`); `apply_changes(order, changes)` substituído por `update_order(id_inspecao, changes)`. O serviço não recebe nem manipula mais objetos ORM.
  - Expressões aninhadas decompostas em variáveis intermediárias nomeadas (`shift_competencia`, `build_windows`, `consumption_subquery`, `excluded_units_query`, `suspicious_profiles_query`, `risk_score`, `estimated_recoverable_kwh`, `expected_recovery_kwh`); `detect_reasons` sem mutação de lista.
- **Dificuldades / Desafios:**
  - Garantir que as docstrings das rotas não substituíssem as descrições do OpenAPI (`EndpointDoc` tem precedência; verificado).
- **Próximos Passos:**
  - Fase 4: frontend obrigatório (fila + ordens em campo).
- **Validação de Testes:**
  - 2 testes novos com repositório falso só de DTOs (RED antes da refatoração). `pytest`: 50 passed. Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos, Pyright 0 erros. Frontend: ESLint, Fallow e vitest OK.
  - Fila nos dados locais inalterada (79 UCs, ~100 mil kWh), confirmando refatoração sem mudança de comportamento.

### [2026-10-20] - Fase 4: frontend obrigatório (fila de suspeitas e ordens em campo)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Fatia vertical `frontend/src/features/loss_management/`: tipos espelhando os DTOs do backend, `lossApi` (axios com `signal`), `queryOptions` com fábrica de chaves (`lossKeys`), hooks separados de query e de mutation (invalidam fila e ordens após cada ação).
  - `LossManagementPage` com abas "Fila de Suspeitas" e "Ordens em Campo" e rota protegida `/losses` (RBAC `diretor`/`gerente_perdas`, igual ao backend).
  - Fila: ranking, motivo em badges, score, kWh e R$ a recuperar, filtros por município/bairro/classe e diálogo "Gerar ordem".
  - Ordens: status em badge, "Enviar para campo" (fiscal responsável), "Registrar resultado" (irregularidade, tipo, kWh recuperado, TOI) e "Cancelar ordem" via `AlertDialog` com justificativa obrigatória.
  - Componentes compartilhados da feature (`AsyncListState`, `ActionDialogFooter`) para carregamento/erro/vazio e rodapé com travamento `isPending` + mensagem de erro da API.
- **Dificuldades / Desafios:**
  - `shadcn/no-restyle` proíbe tipografia/cor direto em `TableCell` e espaçamento em `Tabs`: resolvido envolvendo o conteúdo em `span` e usando margem no `TabsContent`.
- **Próximos Passos:**
  - Fase 5 (exportar a fila para a equipe de campo).
- **Validação de Testes:**
  - 7 testes Vitest novos (RED antes da implementação): fila com motivo/kWh, estado vazio, filtro por bairro, gerar ordem, enviar para campo, registrar resultado e cancelamento com justificativa obrigatória. `vitest`: 8 passed. ESLint 0 problemas, Fallow OK, `bun run build` OK; maior componente com 112 linhas.
  - Ponta a ponta local (backend + Vite proxy, login real): fila com 79 UCs, filtro por bairro, ordens HTTP 200 e perfil sem permissão HTTP 403. Backend: `pytest` 50 passed.

### [2026-10-20] - Correções da revisão de padrões de backend (loss_management)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Fila de suspeitas: o histórico de `fato_inspecoes_perdas` passa a ignorar `id_uc` NULL; antes, uma única linha nula fazia o `NOT IN` esvaziar a fila inteira.
  - `PATCH /losses/inspections/{id}`: cada status de destino aceita só os seus campos (pendente: fiscal; concluída: fiscal e resultado de campo; cancelada: justificativa). Sem irregularidade constatada, tipo, kWh recuperado e TOI são rejeitados (400).
  - Frontend (`RegisterResultDialog`): kWh recuperado e TOI ficam desabilitados e não são enviados quando não há irregularidade.
- **Próximos Passos:**
  - Índice único parcial em `ordem_inspecao` e update condicional de status para eliminar as condições de corrida; paginação de `GET /losses/inspections`.
- **Validação de Testes:**
  - Ruff, Pylint 10/10, import-linter (4 contratos), ESLint e Fallow OK; pytest 56 passed, vitest 8 passed.

### [2026-10-20] - Correções da revisão de backend (ordem ativa única e contrato do update)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Índice único parcial `uq_ordem_inspecao_uc_ativa` em `ordem_inspecao(id_uc) WHERE status IN ('gerada','pendente')`: impede duas ordens ativas para a mesma UC mesmo com requisições concorrentes (a checagem `has_active_order` do serviço continua como caminho rápido).
  - `LossRepository.create_order` converte o `IntegrityError` em `ActiveOrderConflictError` (409), com rollback da sessão.
  - `LossRepository.update_order` passa a receber `InspectionOrderUpdateDTO` em vez de `Mapping[str, object]`.
  - `ACTIVE_STATUSES` movido para `models.py` (fonte única para índice, fila e repositório).
- **Dificuldades / Desafios:**
  - `create_all` não adiciona índices a tabelas já existentes: bancos locais criados antes precisam do `CREATE UNIQUE INDEX` manual.
- **Validação de Testes:**
  - `pytest`: 61 passed (5 novos em `test_loss_repository.py`, escritos antes da correção). Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos.

### [2026-10-20] - Correções da revisão de frontend
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Testes de erro da API: mensagem do `detail` exibida no diálogo ao gerar ordem para UC com ordem ativa (409) e ao ter o cancelamento recusado.
  - Cancelamento mostra `Spinner` e `aria-busy` durante o envio, como os demais diálogos (`ActionDialogFooter` também ganhou `aria-busy`).
  - `compactFilters` movido para `lossQueries.ts`: a chave da query usa só filtros preenchidos, evitando requisição e cache duplicados ao filtrar com campos vazios.
  - `AsyncListState` recebe `errorDescription`; a aba de ordens não cita mais as tabelas Gold.
- **Validação de Testes:**
  - Vitest: 13 passed (5 novos, escritos antes da correção; 3 falharam no RED). ESLint OK, Fallow 0 acima do limite, `tsc -b` sem erros.

### [2026-10-21] - Revisão: ordem só para UC do cadastro e kWh calculado no servidor
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - `POST /losses/inspections` busca a UC em `dim_unidade_consumidora` e devolve 404 se ela não existir. Antes, a API criava ordem para `UC_QUE_NAO_EXISTE`.
  - `kwh_estimado` deixou de ser aceito no corpo (`extra="forbid"` → 422) e é calculado pelo serviço com a mesma regra e janela da fila (`order_estimated_kwh`). Antes, o cliente podia gravar qualquer valor (ex.: 999.999).
  - UC do cadastro que a fila não listaria (sem suspeita, com GD ou sem leitura nas 3 últimas competências) gera ordem manual com 0 kWh.
  - Frontend deixa de enviar `kwh_estimado` ao gerar a ordem.
- **Decisões:**
  - UC fora da fila apenas por inspeção recente mantém o kWh calculado pelo consumo: a reinspeção é uma escolha consciente do gerente e o déficit continua sendo um fato do consumo.
- **Validação de Testes:**
  - `pytest`: 73 passed (novos testes de rota e de serviço escritos antes da correção; 3 falharam no RED, mais 1 no RED do caso sem leitura recente apontado na revisão de código). Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. ESLint e Fallow OK, `tsc -b` sem erros, vitest 13 passed.
