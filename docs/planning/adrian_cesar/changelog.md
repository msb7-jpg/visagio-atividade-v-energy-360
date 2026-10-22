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

### [2026-10-21] - Revisão: fila funciona sem `fato_inspecoes_perdas` e avisa
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - `GET /losses/suspicious-units` não dá mais erro 500 quando `fato_inspecoes_perdas` ainda não foi exportada: a fila é montada sem excluir o histórico de campo (as ordens do sistema, ativas e concluídas, continuam excluindo).
  - **Contrato mudou:** a resposta deixou de ser uma lista e virou o envelope `{ "itens": [...], "avisos": [{ "codigo", "mensagem" }] }`. `avisos` vem vazio quando a análise está completa; sem o histórico traz `historico_campo_nao_aplicado`.
  - O repositório checa a existência da tabela (`inspect(...).has_table`) e só a ausência dela é tolerada: colunas fora do contrato, ou cadastro/medição ausentes, continuam sendo erro 500 explícito.
  - Frontend: tipos `SuspiciousQueue`/`QueueWarning`, novo `components/ui/alert.tsx` (padrão shadcn, variantes `default`, `warning` e `destructive`) e `QueueWarnings`, que mostra o banner "Histórico de inspeções de campo não aplicado." entre os filtros e a tabela, inclusive acima do estado vazio.
- **Decisões:**
  - Criado o token semântico `warning` (âmbar; `--warning` e `--warning-foreground` nos temas dark e light, em `index.css`, documentado no `design.md`) e a variante `<Alert variant="warning">`, usada no banner: `destructive` seria alarmista para um aviso que não impede o uso da fila.
  - `components.json` não existe no frontend, então o `alert.tsx` foi escrito à mão no padrão shadcn em vez de usar `shadcn add alert`.
  - Correções da revisão de código: o `Alert` usa `role="status"` (só a variante `destructive` usa `role="alert"`); a query da fila usa `placeholderData: keepPreviousData`, então o banner não pisca nem é reanunciado ao trocar o filtro; título de fallback para códigos de aviso desconhecidos; documentação do 500 cobre a tabela de inspeções fora do contrato.
- **Próximos Passos:**
  - Item 3 da Fase 2.1 (dupla contagem da queda na prioridade).
  - Quando a Fatia 02 exportar a tabela, o aviso some sozinho; nenhuma mudança de código é necessária.
- **Validação de Testes:**
  - RED confirmado antes da implementação (9 testes de backend e 9 de frontend falhando). `pytest`: 83 passed (10 novos, com cobertura de 97% em `loss_management`). Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. `vitest`: 17 passed (4 novos). ESLint OK, Fallow 0 acima do limite, `tsc -b` sem erros.

### [2026-10-21] - Fase 2.1: fim da dupla contagem da queda na prioridade da fila
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - A fila era ordenada por `score × kWh`. Os dois crescem com a queda de consumo (score = queda × 80; kWh = base × queda × 3), então o produto valia ≈ queda² × base e punha à frente UCs de base pequena com queda total em vez de UCs de base grande com queda moderada.
  - `expected_recovery_kwh` foi substituída por `priority_key`: a fila ordena por kWh estimado a recuperar (que já embute a intensidade da queda) e o score de risco só desempata. O score continua exibido sem alteração.
  - Empate total (mesmo kWh e mesmo score) resolvido por `id_uc`, para o corte do `limit` e a ordem da fila serem estáveis entre requisições.
  - Docstrings, descrição OpenAPI de `GET /losses/suspicious-units` e `DOMINIO_NEGOCIO_5W2H.md` atualizados ("valor esperado" → "kWh a recuperar").
- **Decisões:**
  - Multiplicar por uma probabilidade só faria sentido se ela fosse independente do kWh; a taxa histórica de acerto por sinal (item seguinte da Fase 2.1) é o candidato, e fica para quando o histórico da Fatia 02 estiver na Gold.
- **Validação de Testes:**
  - 3 testes novos (RED confirmado: o da dupla contagem e o do desempate falharam antes da correção). `pytest`: 86 passed. Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. Frontend não alterado.

### [2026-10-21] - Fase 5: exportar as ordens para a equipe de campo (CSV)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - `GET /api/v1/losses/inspections/export`: baixa um CSV com as ordens `gerada` e `pendente` (as que vão a campo; concluídas e canceladas ficam de fora), ordenadas por `id_inspecao`. Mesmo RBAC das demais rotas (`diretor` e `gerente_perdas`).
  - Colunas pré-preenchidas: `id_inspecao`, `id_uc`, `status`, `motivo`, `kwh_estimado`, `fiscal_responsavel`, `criado_em`. Em branco para a equipe preencher: `data_inspecao`, `irregularidade_constatada`, `tipo_irregularidade`, `kwh_recuperado`, `numero_toi`. O `id_inspecao` é a chave de conciliação do upload (Fase 6).
  - Formato pensado para o Excel em pt-BR: separador `;`, UTF-8 com BOM (acentos) e vírgula decimal no kWh.
  - Textos livres (`motivo`, `fiscal_responsavel`, `id_uc`) que começam com `=`, `+`, `-` ou `@` recebem apóstrofo, para não executarem como fórmula na planilha (CSV injection).
  - Módulo puro novo `export.py`; `LossRepository.list_active_orders`; `LossService.export_field_orders_csv`.
  - Frontend: `ExportOrdersButton` na aba "Ordens em Campo" (travado com `Spinner`/`aria-busy` durante o download, mostra o `detail` da API em caso de erro), `lossApi.exportInspections` (`responseType: 'blob'`), `useExportInspectionsMutation` e `saveBlobAsFile`.
  - Correções da revisão de código: erro da exportação lido como `Blob` agora é convertido em JSON (`parseBlobErrorBody`) e mostra o `detail` real da API em vez da mensagem genérica; `URL.revokeObjectURL` adiado em 10 s para não cancelar o download em alguns navegadores; kWh formatado com `.1f` (sem notação científica); botão desabilitado quando não há ordem `gerada`/`pendente`; teste passa a exigir o BOM no início do arquivo.
- **Decisões:**
  - O botão ficou na aba de ordens, e não na fila de suspeitas como no croqui da §4.1: o arquivo contém as ordens já geradas, que são listadas nessa aba.
  - Só CSV por enquanto; `.xlsx` não foi implementado (o checklist da Fase 5 pede CSV).
  - O CSV não traz município e bairro, pois a ordem não os armazena; incluí-los exigiria juntar `dim_unidade_consumidora` na exportação.
- **Próximos Passos:**
  - Fase 6: upload da planilha preenchida, conciliando por `id_inspecao` e lendo o mesmo formato (`;`, vírgula decimal, BOM).
- **Validação de Testes:**
  - RED confirmado antes da implementação (módulo `export` e `ExportOrdersButton` inexistentes). Backend: 13 testes novos, `pytest` 99 passed; Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. Frontend: 9 testes novos, `vitest` 26 passed; ESLint OK, `tsc -b` sem erros, Fallow 0 acima do limite.

### [2026-10-21] - Fase 6: upload da planilha preenchida em campo
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - `POST /api/v1/losses/inspections/upload` (multipart, campo `file`, `.csv` ou `.xlsx`, todas as abas): concilia cada linha pelo `id_inspecao` do arquivo exportado na Fase 5 e conclui as ordens `gerada`/`pendente` com resultado preenchido. Mesmo RBAC das demais rotas. Limite de 5 MB (413) e 10.000 linhas (400).
  - Retorna `UploadResultDTO`: `conciliadas`, `ignoradas` (linhas sem resultado, ainda em campo), `rejeitadas` (aba, linha, `id_inspecao` e motivo) e `kwh_recuperado_total`. Uma linha inválida nunca aborta o lote; as válidas são gravadas num único commit.
  - Normalização da bagunça de campo: resultado ("CONFIRMADA", "irregularidade confirmada", "NADA CONSTA", "sim", "não", "não confirmada"...), datas (`2025-08-01`, `14.08.2025`, `09-01-2025`, `14/08/2025` e datas nativas do Excel), decimais (`1.234,56`, `1,234.56`, `0,5`, `850 kWh`), cabeçalhos sem acento/caixa ("ID Inspeção"), CSV com `;`, `,` ou tab e UTF-8/Windows-1252.
  - Regras de recusa: id inválido ou inexistente, ordem já concluída/cancelada, id repetido no arquivo, valor ilegível, kWh sem irregularidade (contraditório). A validação de campos × status foi extraída de `service.py` para `update_rules.py` e é a mesma do `PATCH`.
  - Módulos novos puros (sem FastAPI): `upload_values.py`, `upload_parser.py`, `upload_reconcile.py`, `update_rules.py`. Dependências novas: `openpyxl` e `python-multipart`.
  - Frontend: botão "Subir planilha de campo" na aba "Ordens em Campo" abre `InspectionUploadModal` (arrastar e soltar + seleção de arquivo, recusa de formato no cliente, travamento durante o envio) com `UploadResultSummary` (ordens conciliadas, kWh, linhas ignoradas e rejeitadas com motivo). O upload invalida fila e ordens.
- **Decisões e limitações:**
  - `09-01-2025` é lido como dia-mês-ano (pt-BR); a ordem de campo só chega a `concluida` pela planilha mesmo vinda de `gerada`, pois o retorno de campo não passa pelo passo manual de envio.
  - `data_inspecao` é validada, mas não gravada: `ordem_inspecao` não tem a coluna e o `create_all` não altera tabelas existentes. Se for necessária, exige migração.
  - O R$ do resumo (exemplo do `atividade.pdf`) fica fora até a tarifa real de `fato_faturamento` (Ryei).
  - Não foi possível testar contra `inspecoes.xlsx` real: o arquivo não está no repositório; os formatos vêm da descrição da fatia.
  - Se uma ordem sair de campo entre a validação e a gravação (ex.: cancelada por outro usuário), ela é preservada e volta em `rejeitadas`.
  - Correções da revisão: limite de 10.000 linhas aplicado durante a leitura; erros de aba corrompida viram 400; `reset_dimensions()` contra dimensão declarada errada; consultas por ids em lotes de 500; `NADA CONSTA` aceita 0 kWh e tipo/TOI preenchidos (descartados); ids `15.0`/`15,0` aceitos.
- **Validação de Testes:**
  - Backend: 83 testes novos, `pytest` 182 passed; Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. Frontend: 7 testes novos, `vitest` 33 passed; ESLint OK, `tsc -b` sem erros, Fallow 0 acima do limite. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.
