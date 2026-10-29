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

### [2026-10-23] - Fase 2.1: fila priorizada pela chance de a inspeção achar irregularidade
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - A fala do Gerente de Perdas (`atividade.pdf`, pág. 6) pede a fila "da mais promissora para a menos promissora" e lembra que "cada inspeção que não encontra nada é um dia de equipe perdido". Ordenar só por kWh ignorava a chance de a inspeção achar algo.
  - `priority_key` passou a ordenar por **kWh esperado** = kWh a recuperar × `probabilidade_acerto`; o score de risco continua só desempatando. A taxa não cresce com a queda, então a queda não volta a ser contada duas vezes.
  - Nova função `hit_probability(reasons)` em `scoring.py`: devolve a maior taxa histórica de acerto entre os sinais da UC. Taxas: queda súbita **0,93**; leitura zerada isolada usa a taxa geral **0,627**.
  - `SuspiciousUnitDTO` ganhou `probabilidade_acerto` (0 a 1). Frontend: coluna "Chance de acerto" na fila (`formatPercent`), para o gerente ver por que a UC está na posição.
  - Texto do OpenAPI, docstrings e `DOMINIO_NEGOCIO_5W2H.md` atualizados.
- **Decisões e limitações:**
  - As taxas 0,93 e 0,627 são as medidas nos dados de desenvolvimento locais (seed provisório, 1.389 inspeções) e registradas neste diário. O seed não está mais disponível nesta máquina, então **não foram remedidas** nesta entrega; devem ser conferidas contra a Gold real na Fase 7.
  - A taxa de **leitura zerada isolada não foi medida**: usa a taxa geral como suposição. As taxas são constantes no código, não calculadas da Gold.
  - Efeito prático modesto: toda UC da fila tem queda >= 50% ou leitura zerada, então a reordenação só rebaixa quem entra apenas por leitura zerada (0,627 contra 0,93). Uma taxa por faixa de queda ou por classe exigiria cruzar o sinal da época da inspeção com `fato_inspecoes_perdas`.
  - A tarifa real de `fato_faturamento` segue pendente (aguarda Ryei).
- **Próximos Passos:**
  - Fase 7: remedir as taxas na Gold real; se houver sinais com taxas distintas, trocar as constantes por cálculo a partir do histórico.
  - Fase 8: documentar as suposições (taxas, limiar de 50%, fórmula do kWh).
- **Validação de Testes:**
  - RED confirmado antes da implementação (`ImportError` de `hit_probability` no backend e 1 teste falhando no frontend). Backend: 5 testes novos, `pytest` 187 passed; Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. Frontend: 1 teste novo, `vitest` 34 passed; ESLint OK, `tsc -b` sem erros, Fallow 0 acima do limite. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.

### [2026-10-23] - Teste com as bases brutas do case: consumo negativo na fila e datas do upload
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Carreguei as bases brutas (`base_dados_1.zip` e `base_dados_2.zip`, só local e ignoradas pelo git) em dois SQLite de simulação fora do repositório: um bruto, só com as colunas renomeadas ao contrato, e um com tratamento mínimo. Rodei o código real da fila e do upload contra eles.
  - **Fila:** `consumption_subquery` passou a ignorar leituras com `consumo_kwh < 0`. No banco bruto a fila tinha 83 linhas (77 UCs distintas) e **todas as 81 UCs candidatas tinham consumo negativo na janela recente**: o UC104779, consumo estável de 10 a 11 mil kWh/mês, aparece com `-11065` em 2026-06, o que derruba a média recente e simula a queda. Depois da correção a fila sobre o mesmo banco bruto tem 0 linhas.
  - **Upload:** `09-01-2025` agora é lido como 1º de setembro. Com hífen a data do campo é mês-dia-ano (33 das 46 datas `NN-NN-AAAA` do `inspecoes.xlsx` real têm o 2º número > 12 e nenhuma tem o 1º). Antes, 33 dessas linhas eram rejeitadas e 12 aceitas com a data errada. `%d-%m-%Y` ficou como último formato, só para datas sem ambiguidade (`14-08-2025`). Isto **corrige** o registro da Fase 6 deste diário, que dizia o contrário.
- **Achados das bases brutas (sem alteração de código):**
  - Os 8.016 consumos negativos únicos não se recuperam com `abs()`: 1.334 têm o sinal trocado, 6.215 são leituras que retrocederam (provável troca de medidor) e 378 não seguem padrão; o valor negativo típico é cerca de 188 vezes a mediana da UC. O tratamento correto é descartar a linha.
  - Há 21.523 leituras duplicadas exatas, mais 8.609 pares (UC, mês) repetidos com id `LTX...` e outro medidor, 24.667 `leitura_anterior` ausentes e 900 UCs duplicadas no cadastro (mais uma linha de cabeçalho repetida dentro do arquivo). Isso é trabalho da Silver (Renan); a fila só se defende dos negativos.
  - Taxas de acerto reconstruídas nas 1.385 inspeções com histórico: geral 62,7%; queda >= 50% sem GD 92,6% (770 casos); queda < 50% 26,4%; UCs com GD 3,2% (31 casos). Isso confirma as constantes 0,93 e 0,627 do item anterior. Nenhuma leitura tem consumo zero, então a taxa de "leitura zerada" segue sem medição.
  - Com dados tratados a fila da competência mais recente (2026-06) fica **vazia**: a onda de quedas foi em meados de 2025 e já foi inspecionada. Como mostrar a fila na demonstração é uma decisão em aberto.
  - O `inspecoes.xlsx` real não é aceito pelo upload: `id_inspecao` é `IN0000000` (não inteiro) e as colunas são `data`, `resultado` e `inspetor`. O resultado e o kWh são normalizados corretamente (871 irregulares, 518 regulares, 0 kWh ilegível), mas 0 das 1.389 linhas são conciliadas. Decisão em aberto.
- **Validação de Testes:**
  - RED confirmado (3 testes falhando antes: 2 de data e 1 de leitura negativa). `pytest` 190 passed (3 novos, 1 existente corrigido: o esperado de `09-01-2025`). Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos. Frontend não alterado. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.

### [2026-10-23] - Upload aceita a planilha no formato real do campo (conciliação pela UC)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - O `inspecoes.xlsx` real não era aceito (0 das 1.389 linhas): o `id_inspecao` real é `IN0000007` (não é um id de ordem do portal) e as colunas se chamam `data`, `resultado` e `inspetor`.
  - **Apelidos de coluna** (`upload_parser.py`): `data` vira `data_inspecao`, `resultado` vira `irregularidade_constatada` e `inspetor` vira `fiscal_responsavel`. O apelido nunca sobrescreve uma coluna que já exista no arquivo. O arquivo passa a ser aceito se tiver `id_inspecao` **ou** `id_uc`.
  - **Conciliação pela UC** (`upload_reconcile.py`): quando o `id_inspecao` não é um id do portal, a linha casa com a **ordem ativa** (`gerada` ou `pendente`) da `id_uc`. Um id numérico do portal continua tendo prioridade, então a planilha exportada pelo portal funciona como antes. Sem ordem ativa, a linha é recusada com "UC X sem ordem ativa (gerada ou em campo) no portal."; duas linhas da mesma UC mantêm a primeira. Linha sem resultado continua sendo ignorada, não recusada.
  - `LossService.upload_field_results` busca as ordens ativas só das UCs de linhas sem id do portal (`get_active_order_ids_by_uc`, em lotes de 500, consulta parametrizada).
  - Para respeitar o teto de 300 linhas, `get_order_statuses` e `apply_field_results` saíram de `repository.py` (286 → 243 linhas) para o novo `upload_repository.py` (`FieldUploadRepositoryMixin`, herdado pelo `LossRepository`), sem mudar comportamento nem assinatura.
- **Verificação com o arquivo real** (fora do repositório; o zip é local e ignorado pelo git, então não há teste versionado com ele):
  - Com ordens ativas para todas as UCs: 1.389 conciliadas (871 irregulares, 518 regulares), 0 recusadas, 0 ignoradas, 1.473.112 kWh.
  - Cenário de demonstração, com 100 UCs com ordem ativa: 100 conciliadas e 1.289 recusadas, todas pelo mesmo motivo ("sem ordem ativa").
- **Limitações e decisões:**
  - **Correção da revisão:** uma aba só com `id_uc` passou a ser lida como dados, e uma aba de resumo com essa coluna geraria recusas espúrias. Agora `id_inspecao` continua bastando sozinho, mas `id_uc` só vale junto com a coluna de resultado (já com o apelido `resultado` aplicado); um CSV ou uma pasta de trabalho sem nenhuma aba de dados é recusado com a mensagem de coluna ausente. O `inspecoes.xlsx` real segue sendo lido por inteiro.
  - `data_inspecao` e o id externo (`IN0000007`) continuam sem ser gravados: a ordem não tem essas colunas.
  - O resumo do upload pode listar mais de mil recusas quando o arquivo traz muito mais UCs do que ordens abertas. Não avaliei como a tela do modal exibe uma lista tão longa.
  - Conciliar pela UC assume que a planilha é do ciclo atual: se a equipe devolver o resultado de uma inspeção antiga de uma UC que hoje tem outra ordem ativa, a ordem nova será concluída. Fica registrado como risco aceito; o gerente vê as ordens conciliadas no resumo.
- **Validação de Testes:**
  - RED confirmado (10 testes novos falhando antes). `pytest` 201 passed (11 novos). Ruff OK, Pylint 10.00/10, Pyright 0 erros, import-linter 4 contratos mantidos. Frontend não alterado. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.

### [2026-10-23] - Competência de referência configurável para a demonstração da fila
- **Autor:** Adrian Cesar
- **Por quê:** com os dados do case tratados, a fila da competência mais recente (2026-06) fica vazia: a onda de quedas foi em meados de 2025 e já foi inspecionada. Calculada em `2025-08`, antes de a equipe sair a campo, a fila tem centenas de UCs e permite mostrar o fluxo completo.
- **O que foi feito:**
  - Nova configuração opcional `LOSS_REFERENCE_COMPETENCIA` (`YYYY-MM`, validada por regex; comentada em `.env.example`). Ausente = comportamento de produção (competência mais recente). Se for igual ou posterior à última dos dados, não tem efeito.
  - Novo `reference.py` (`resolve_analysis_reference`): escolhe a competência e o limite do histórico. `LossRepository` recebe a competência fixada (injetada por `get_loss_service` via `Depends(get_settings)`, sobrescrevível nos testes) e a usa na fila e no kWh das novas ordens, que seguem a mesma regra.
  - **Sem vazamento do futuro:** só as inspeções de `fato_inspecoes_perdas` feitas até o fim da competência de referência excluem a UC (`history_until`); sem isso a onda inteira seria excluída pelas inspeções de ago a dez de 2025 e a fila ficaria vazia.
  - **Defeito encontrado pelos testes:** a janela "recente" de `consumption_subquery` não tinha limite superior, então a referência passada ainda somava as leituras de meses posteriores. `ConsumptionWindows` ganhou `fim_recente` e a consulta limita a janela a ele. Em tempo real não muda nada (a referência é a última competência).
  - Aviso `competencia_referencia_fixada` na resposta da fila e banner "Competência de referência fixada." no frontend, para a demonstração não ser confundida com produção.
- **Verificação com os dados reais** (API em memória sobre uma cópia do banco tratado, fora do repositório, referência `2025-08`): fila de 200 UCs (o limite); 200 ordens geradas, todas com kWh > 0 (418.380 kWh); exportação de 200 linhas; upload do `inspecoes.xlsx` real com 198 conciliadas (188 irregulares, **94,9%** de acerto contra 62,7% da média geral) e 1.191 recusadas só por "UC sem ordem ativa". O kWh recuperado apurado nas 198 foi 718.226, contra 418.380 estimados nas 200 ordens: a fórmula do déficit (mensal × 3 meses) subestima o recuperado nesses dados; vale registrar na Fase 8.
- **Limitações e decisões:**
  - As ordens do próprio sistema (`ordem_inspecao`) continuam excluindo a UC em tempo real, sem respeitar a competência fixada: elas nascem na demonstração, não vêm do histórico.
  - A demonstração precisa das tabelas Gold no `v_energy.db` (hoje só existe `ordem_inspecao`). Os números acima vêm de um banco de simulação local feito a partir das bases brutas do case; a demonstração real depende da Gold de Renan e Ryei (Fase 7).
  - `queries.py` chegou a 290 linhas (teto de 300); a consulta da fila foi extraída para `queue_query.py` na revisão de padrões de 2026-10-23 (abaixo).
  - **Correção da revisão:** `LOSS_REFERENCE_COMPETENCIA=""` (estilo do `GEMINI_API_KEY=""` do `.env.example`) derrubava a validação de `Settings`, que é compartilhada por autenticação, chat e banco. Agora valor vazio vale "sem referência"; um valor preenchido e inválido (ex.: `2025-13`) continua falhando de propósito. A descrição de `score_risco` na API deixou de se chamar "probabilidade" (existe `probabilidade_acerto`) e diz que ele só desempata.
  - A tela de upload com mais de mil recusas não foi avaliada no navegador.
- **Validação de Testes:**
  - RED confirmado (os novos testes nem coletavam; depois, 2 falharam pelo defeito da janela sem limite superior). Backend: 18 testes novos, `pytest` 219 passed; Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos; Pyright 0 erros nos arquivos da fatia (4 erros preexistentes em `app/core/llm_factory/providers`, fora desta fatia). Frontend: 1 teste novo, `vitest` 35 passed; ESLint OK, `tsc -b` sem erros, Fallow 0 acima do limite. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.

### [2026-10-23] - Fase 8: decisões e suposições da fatia documentadas
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Criado `docs/DECISOES_PERDAS.md` no formato do esqueleto de `docs/DECISOES.md` (decisão, impacto, como garantir conformidade): 10 decisões (D1 a D10), os números que as sustentam e as limitações. As cinco suposições da Fase 8 estão marcadas no checklist.
  - Medições novas que o documento registra: acerto por faixa de queda (até 0% = 10,4%; 20 a 40% = 14,7%; **40 a 50% = 64,9%**; 50 a 60% = 92,9%; 60 a 80% = 92,5%), taxa de acerto do sinal de queda >= 50% (92,6%, 770 casos) e com GD (3,2%, 31 casos), e a comparação entre o kWh estimado e o recuperado nas 188 ordens irregulares da demonstração.
- **Achados que ficam para decisão do time (não alterei o código):**
  - **O limiar de 50% é conservador:** a faixa de 40 a 50% acerta 64,9%, quase a média geral. Baixar para 40% aumentaria a fila com UCs de acerto médio.
  - **A fórmula do kWh subestima o valor absoluto** (recuperado = 1,87× o estimado em mediana, 176 de 188 UCs), mas **ordena bem** (correlação 0,87). Os dados sugerem cerca de 5,6 meses em vez de 3. Mudar `JANELA_RECUPERACAO_MESES` altera os kWh e R$ exibidos, não a ordem da fila.
  - A taxa de leitura zerada segue suposição: o sinal nunca ocorre nos dados.
- **Não feito, de propósito:** o `README.md` principal e o `docs/DECISOES.md` são arquivos compartilhados (o segundo ainda é um esqueleto da equipe), então não os editei para não gerar conflito de merge. O PDF exige as suposições no README: basta acrescentar lá um link para `docs/DECISOES_PERDAS.md`.
- **Validação:** só documentação; nenhum código foi alterado nesta fase. As evidências vêm das medições feitas nas bases brutas do case, e os scripts delas não estão versionados (o método de cada número está descrito no documento).

### [2026-10-23] - Revisão de padrões: funções curtas, atribuição única e docstrings
- **Autor:** Adrian Cesar
- **Por quê:** `ruff`, `pylint` e `import-linter` passavam, mas a skill `backend-coding-standards` é mais rígida que o `pylint` (funções de no máximo 30 linhas, sem reatribuição de variável, docstring em toda função pública). Uma auditoria por AST apontou os desvios; nenhum comportamento mudou.
- **O que foi feito:**
  - Funções acima de 30 linhas decompostas: `consumption_subquery` (`_consumption_aggregates`), `excluded_units_query` (`_system_orders_query`, `_field_history_query`), `suspicious_profiles_query` (`_candidate_select`, `_candidate_conditions`), `fetch_consumption_profiles` (`_read_queue_rows`), `upload_field_results` (`skipped_rejections`), `reconcile_rows` (`reconcile_row`, `RowOutcome`, `ensure_not_duplicated`) e `build_update`.
  - Reatribuições eliminadas: `parse_kwh` (`number_from_cell`), `rows_from_xlsx` (`sheet_rows`, lista `sheets_with_key_column`) e `parse_order_id` (`integer_from_cell`).
  - `get_settings` ganhou docstring Google-style.
  - Consulta da fila movida para o novo `queue_query.py` (129 linhas): `queries.py` passaria de 300 linhas com os helpers (`pylint` C0302). `queries.py` ficou com 195. Efeito colateral: `repository.py` e `test_loss_queries.py` passaram a importar `suspicious_profiles_query` de `queue_query`.
  - Frontend revisado contra `frontend-coding-standards`: sem desvios nos arquivos alterados.
- **Atenção:** a leitura de cada aba do XLSX agora é materializada por inteiro (`sheet_rows` devolve lista), em vez de linha a linha; só pesa se uma única aba for muito grande.
- **Validação de Testes:**
  - Backend: `pytest` 227 passed (nenhum teste alterado além de um import); Ruff OK, Pylint 10.00/10, import-linter 4 contratos mantidos; auditoria de regras da skill sem apontamentos. Frontend: `vitest` 35 passed, ESLint OK, Fallow 0 acima do limite. Pyright não foi rodado nesta revisão. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.

### [2026-10-24] - Fase 9.1: contrato de backend da nova tela Fila de Inspeção
- **Autor:** Adrian César (Fatia 05)
- **Referência:** `docs/planning/adrian_cesar/assets/fila-inspecao-escuro.png` e `fila-inspecao-claro.png`; branch `feat/fatia-05-fila-inspecao-nova-tela`.
- **O que foi feito (TDD: RED confirmado, depois GREEN):**
  - `SuspiciousUnitDTO` ganhou `score` (inteiro de 0 a 100: kWh esperado da UC relativo ao topo da fila, calculado antes dos filtros para não mudar quando um filtro esconde o topo), `situacao` (`na_fila`, `ordem_gerada`, `em_campo`), `kwh_mes_recuperavel` (déficit mensal) e `valor_ano_rs`.
  - UCs com ordem ativa **permanecem na fila** com a situação da ordem (antes eram excluídas). Ordens concluídas na janela e o histórico de campo continuam excluindo.
  - Filtros novos em `GET /losses/suspicious-units`: `motivo` e `score_minimo`; o `limit` passa a valer depois dos filtros.
  - `GET /losses/queue-summary?ucs=...`: capacidade programada contra 200, energia e valor anual das selecionadas (ignora as que já têm ordem), retorno esperado (energia x taxa histórica) e taxa histórica (`fato_inspecoes_perdas`: total, confirmadas, período).
  - `GET /losses/queue-filters`: municípios e classes do cadastro.
  - `ucs` do resumo limitado a 400 itens de até 20 caracteres (422 acima disso); `rank_suspicious_units` aceita `limit=None`.
  - Módulos novos `queue_summary.py` (regras puras, no contrato do import-linter) e `queue_repository.py` (mixin), para manter `repository.py` e `scoring.py` abaixo de 300 linhas.
- **Mudanças de comportamento a conferir com o time:**
  - **Tarifa de referência 0,85 para 0,714 R$/kWh**, valor do desenho; todo R$ exibido na fila cai cerca de 16%. A tarifa real de `fato_faturamento` (Fatia 02) segue pendente.
  - O desenho usa o `kWh/mês` como déficit mensal; o campo antigo `kwh_estimado_recuperar` (déficit x 3 meses) foi mantido para não quebrar a tela atual.
  - "Programadas" no cartão de capacidade = ordens ativas (geradas ou em campo), sem recorte por mês.
- **Fora desta fase (decisão em aberto):** os 3 motivos novos do desenho (abaixo dos vizinhos, leituras estimadas, irregularidade confirmada antes), `Ver acerto por inspetor` (Fatia 07) e distribuição por inspetor. O filtro de motivo cobre os 2 motivos existentes.
- **Validação de Testes:**
  - `pytest`: 535 passed (24 novos em `test_loss_queue_design.py`; 3 testes antigos ajustados para a tarifa e para a UC com ordem ativa permanecer na fila). Ruff OK, Pylint 10,00/10, Pyright 0 erros em `loss_management`, import-linter 4 contratos mantidos. `make` não existe neste shell; os mesmos comandos foram rodados diretamente. Frontend não foi tocado nesta fase.

### [2026-10-24] - Fase 9.2: camada de dados do frontend da nova tela Fila de Inspeção
- **Autor:** Adrian César (Fatia 05)
- **O que foi feito (TDD: RED confirmado com 11 testes falhando, depois GREEN):**
  - `lossTypes.ts`: `QueueSituation`, campos novos de `SuspiciousUnit` (`score`, `situacao`, `kwh_mes_recuperavel`, `valor_ano_rs`), filtros `motivo` e `score_minimo`, e os tipos `QueueSummary`, `HitRate`, `QueueFilterOptions` e `BatchResult`.
  - `lossApi`: `getQueueSummary` (envia `ucs=UC1&ucs=UC2` com `paramsSerializer: { indexes: null }`, porque o axios usaria `ucs[]=` e o FastAPI não leria a lista) e `getQueueFilters`.
  - `lossQueries`: `queueSummaryQueryOptions` (ids ordenados na chave de cache, então a ordem da seleção não gera consultas repetidas; `keepPreviousData` para o cartão não piscar a cada clique) e `queueFiltersQueryOptions` (cache de 10 min). `compactFilters` passou a aceitar números e descarta `score_minimo` igual a zero.
  - `useQueueSummaryQuery` e `useQueueFiltersQuery`.
  - `useQueueSelection` (hook headless): só UCs `na_fila` são selecionáveis, `selectTop(n)` pula UCs com ordem, `toggleAll` e `clear`; a seleção acompanha a lista, e UCs que saem dela por filtro deixam de contar.
  - `useCreateInspectionsBatchMutation`: gera as ordens em blocos sequenciais de 5 UCs (`Promise.allSettled` por bloco, para não abrir dezenas de POSTs de uma vez contra o SQLite), devolve `{ created, failed }` sem abortar o lote por uma UC e invalida as listas em qualquer desfecho.
- **Decisão:** não há endpoint de lote no backend; o lote é feito no cliente, uma requisição por UC. A unicidade de ordem ativa por UC continua garantida pelo banco, então uma UC já ordenada por outra aba cai em `failed` com a mensagem da API.
- **Validação de Testes:**
  - Frontend: `vitest` 108 passed (22 novos); `tsc -b` 0 erros; ESLint OK; Fallow 0 acima do limite. Backend não foi alterado nesta fase. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.
- **Revisão de código (typescript-reviewer, sem CRITICAL):** corrigidos o lote sem limite de concorrência e o `isSelected` quadrático (agora usa `Set`). A seleção que volta marcada quando o filtro é removido foi mantida de propósito, documentada e travada por teste.
- **Anotado para a Fase 9.3 (UI):** usar `isPlaceholderData` do resumo para indicar números em atualização; limitar a seleção ao teto de 400 UCs do endpoint; a mensagem de falha por UC é genérica quando o erro não traz `detail` em texto (ex.: rede ou 422).

### [2026-10-24] - Fase 9.3: UI da nova tela Fila de Inspeção
- **Autor:** Adrian César (Fatia 05)
- **Referência:** `assets/fila-inspecao-escuro.png` e `fila-inspecao-claro.png`.
- **O que foi feito (testes escritos antes da UI):**
  - **Backend:** `GET /losses/suspicious-units` passou a devolver `total` (UCs que passam nos filtros antes do corte do `limit`), necessário para "Fila priorizada (1.248)" e "Mostrando 20 de 1.248". 2 testes novos.
  - **Página e abas:** título "Fila de Inspeção" e abas "Fila priorizada (N)" e "Ordens de inspeção (M)" com contador. O estado dos filtros e da seleção fica na página (`useSuspiciousQueueController`) e sobrevive à troca de aba.
  - **Cartões do topo:** capacidade do mês (programadas + selecionadas, barra e "ainda cabem N" ou "passa da capacidade em N" em vermelho), energia recuperável das selecionadas, retorno esperado e taxa de acerto histórica (com "como calculamos"). Os cartões ficam esmaecidos e `aria-busy` enquanto o resumo da nova seleção carrega.
  - **Filtros** em select (motivo, município, classe, score mínimo), aplicados ao mudar. Município e classe vêm de `GET /losses/queue-filters`.
  - **Ações:** "Exportar fila (CSV)", "Selecionar top 10" e "Gerar N ordens" (desligado sem seleção).
  - **Tabela priorizada:** checkbox por linha e no cabeçalho, UC como link para a Visão 360 (`/customers?uc=`), barra de score por faixa, motivos, kWh/mês, R$/ano e situação (Na fila, Ordem gerada, Em campo). UCs com ordem não podem ser marcadas.
  - **Geração em lote:** diálogo de confirmação com o resumo; se alguma UC falhar, o diálogo continua aberto listando quais e quantas foram geradas.
  - **Design system:** novo `components/ui/checkbox.tsx` (Radix), porque `<input>` nativo é proibido fora de `ui/`. Barras dimensionadas por variável CSS (`w-(--bar-width)`), como o lint do projeto exige.
  - Removidos `SuspiciousUnitsTable`, `QueueFiltersForm`, `CreateInspectionDialog` e `useCreateInspectionMutation` (substituídos pelo fluxo em lote).
- **Mudanças de rótulo a conferir:** os motivos passaram a usar os textos do desenho ("Queda abrupta de consumo" e "Consumo zero com medidor ativo"); eles também vão no campo `motivo` das ordens novas. O filtro por bairro saiu da tela (o desenho não tem), mas a API ainda o aceita.
- **Diferenças em relação ao desenho:** a coluna Classe mostra só a classe (a tensão B1/B3/A4 não existe nos dados); "Exportar fila (CSV)" exporta as ordens geradas e em campo, que é o que o backend entrega; "Ver acerto por inspetor, por mês e kWh por tipo" não foi incluído (Fatia 07).
- **Validação de Testes:**
  - Backend: `pytest` 537 passed; Ruff, Pylint 10,00/10, Pyright e import-linter OK.
  - Frontend: `vitest` 114 passed (15 novos em `SuspiciousQueueTab.test.tsx` e `CapacityCard.test.tsx`; 12 cenários da fila antiga saíram do `LossManagementPage.test.tsx`, que mantém os das ordens em campo); `tsc -b`, ESLint e Fallow OK.
  - **Não conferido no navegador:** a comparação visual contra as imagens fica para a Fase 9.5. `make` não existe neste shell; os mesmos comandos foram rodados diretamente.
- **Revisão de código (react-reviewer, sem CRITICAL):** corrigidos, com teste antes (RED confirmado em 5 cenários), os 3 achados HIGH do diálogo de lote: a seleção é congelada ao abrir (depois do lote a fila recarrega e a contagem encolhia para "2 de 1 ordens"), o diálogo não fecha com o lote em andamento (Esc, clique fora e "Voltar" ficam desligados) e uma falha geral do lote agora mostra mensagem. Também: cartão de capacidade sem `NaN%` quando o total é zero e com plural ("1 programada"), cabeçalho da tabela em estado parcial (`mixed`) e desligado sem UC livre, esqueleto do resumo com 4 cartões e filtros sem string vazia no estado.
- **Anotado para a Fase 9.5:** o resumo não tem estado de erro (com falha da API o esqueleto permanece); as dicas "como calculamos" não são alcançáveis por teclado; a seleção de UCs fora do filtro atual continua guardada de propósito (vide Fase 9.2), sem indicador na tela.

### [2026-10-24] - Fase 9.4: testes Vitest da nova tela Fila de Inspeção
- **Autor:** Adrian César (Fatia 05)
- **O que foi feito:** a cobertura foi medida antes de escrever (a base já estava perto de 90%) e os testes novos miraram os ramos que faltavam. Estes testes cobrem comportamento já implementado nas fases 9.1 a 9.3, então passaram de primeira; os que falharam (2) foram por expectativa errada do teste, não por defeito do código, e foram corrigidos no teste.
  - `QueueSummaryCards.test.tsx`: energia e valor anual com a tarifa, retorno esperado com a taxa histórica, esqueleto sem resumo, `aria-busy` na atualização, período no mesmo ano e atravessando a virada, e o aviso de taxa geral sem histórico de campo.
  - `PrioritizedQueueTable.test.tsx`: linha de total ("Mostrando 2 de 1.248"), cabeçalho que marca e limpa as UCs livres, estado parcial (`mixed`), cabeçalho desligado sem UC livre, traço para campos vazios, chips de motivo, link com id codificado, formatação de kWh/mês e R$/ano, e as 3 faixas de cor do `ScoreBar`.
  - `lossFormatters.test.ts`: valores compactos (R$ 535, R$ 15,8 mil, R$ 1,2 mi), períodos, inteiros, taxa, plural e textos dos motivos.
  - `lossApiRequests.test.ts`: filtros como query params e `signal`, listagem com e sem status, criação, atualização e upload multipart.
  - `SuspiciousQueueTab.test.tsx` (+8): voltar a "Todos os motivos" restaura a fila, cancelar a geração mantém a seleção sem criar ordens, o lote concluído fecha o diálogo e limpa a seleção, o resumo dentro do diálogo, a seleção sobrevive à troca de aba, taxa geral sem histórico e a exportação ligada ou desligada conforme as ordens programadas.
- **Validação de Testes:**
  - Frontend: `vitest` 158 passed em 21 arquivos; `tsc -b`, ESLint e Fallow OK. Cobertura de `features/loss_management` + `ui/checkbox.tsx`: 94,5% das instruções, 87,4% dos ramos e 94,4% das funções (meta: 80%). A cobertura foi medida com `@vitest/coverage-v8` instalado só localmente (`--no-save`); ele não está no `package.json`, então `make test-all` não mede cobertura.
  - Backend não foi alterado nesta fase (537 passed na última execução).

### [2026-10-24] - Fase 9.5: validação da nova tela Fila de Inspeção
- **Autor:** Adrian César (Fatia 05)
- **Conferência no app real (backend e frontend rodando):** banco **sintético**, gerado fora do repositório com a forma das tabelas Gold (400 UCs, 1.389 inspeções de histórico com 871 irregulares, 58 ordens ativas). Não é a Gold real: os números da tela refletem esses dados de teste.
  - A API respondeu como esperado: 284 UCs na fila (200 exibidas), 58 programadas, taxa de 62,7%, filtros de município e classe.
  - Na tela, no tema escuro: cartões, filtros, tabela com barra de score, link da UC, "Selecionar top 10" (cartões foram a 68 de 200 e 51.911 kWh/mês), diálogo de confirmação, geração das 10 ordens (linhas passaram a "Ordem gerada" com checkbox desligado, seleção limpa, contador da aba foi a 68). Sem erros no console.
  - Tema claro (classe `.light` do `index.css`, o app não tem botão de troca): layout e contraste coerentes com a imagem clara; faixas do score em vermelho (85 ou mais), âmbar (65 a 84) e cinza (abaixo de 65).
  - O desenho foi comparado por inspeção visual das capturas, não por diff de pixels.
- **Achado e correção:** a dica "como calculamos" cortava a última linha do texto (`Tooltip` animava até uma altura medida antes de o texto quebrar na largura final). Passou a animar para `height: 'auto'`.
- **Pendências da revisão resolvidas (testes antes, RED confirmado):** o resumo ganhou estado de erro ("Não foi possível carregar o resumo…", a fila continua visível) e as dicas ficam acessíveis por teclado (gatilhos viraram `Button variant="link"` e o `Tooltip` abre com foco).
- **Validação (equivalente a `make lint-all` e `make test-all`, rodados direto porque `make` não existe neste shell):**
  - Backend: Ruff OK, Pylint 10,00/10, import-linter 4 contratos mantidos, Pyright 0 erros na fatia, `pytest` 537 passed.
  - Frontend: ESLint OK, Fallow 0 acima do limite, `tsc -b` OK, `vitest` 160 passed em 21 arquivos.
- **Diferenças conhecidas em relação ao desenho:** sem tensão (B1, B3, A4) na coluna Classe; sem "Ver acerto por inspetor" (Fatia 07); motivos novos do desenho ainda não existem no backend (só queda abrupta e consumo zero); título e abas usam os componentes do design system, com tamanho um pouco menor que o desenho.

### [2026-10-25] - Sidebar do portal fixa durante a rolagem
- **Autor:** Adrian César (Fatia 05)
- **O que foi feito:** o menu lateral do `AppLayout` deixou de rolar junto com a página. O `<aside>` ganhou `sticky top-0 h-dvh self-start overflow-y-auto`: fica preso ao topo da tela, só o conteúdo ao lado rola e, se o menu passar da altura da tela, ele rola dentro da própria sidebar. Só classes com tokens do Tailwind (sem valores arbitrários), conforme `design.md`. Abaixo do breakpoint `md` a sidebar continua oculta. Mudança transversal (`design-system`), restrita a `frontend/src/components/layout/AppLayout.tsx`.
- **Validação (equivalente a `make lint-all` e `make test-all`, rodados direto porque `make` não existe neste shell):**
  - Backend: Ruff OK, Pylint 10,00/10, import-linter 4 contratos mantidos, `pytest` 537 passed.
  - Frontend: ESLint OK, Fallow 0 acima do limite, `vitest` 163 passed em 21 arquivos.
  - **Não conferido no navegador:** o comportamento fixo foi validado pelo CSS, não numa tela real.
- **Correções da revisão de código (testes antes, RED confirmado em 10 cenários):**
  - O checkbox do cabeçalho passou a agir só nas UCs livres da página visível (`toggleMany` no `useQueueSelection`, rótulo "Selecionar as UCs livres da página"); antes marcava as até 200 UCs carregadas, inclusive as não exibidas.
  - "Selecionar top N" voltou a só selecionar (não desmarca mais ao repetir).
  - A tabela remonta com `key` dos filtros, então a paginação volta à página 1 ao mudar filtros.
  - Validação: `vitest` e `tsc -b`, ESLint e Fallow OK (rodados no frontend; backend não foi alterado).


### [2026-10-27] - RBAC da fila de perdas passa a usar o grupo central `PERDAS_ACCESS`
- **Autor:** Adrian César (Fatia 05)
- **Origem:** issue #25 (João Henrique, Fatia 06): trocar `require_role(LOSS_ROLES)` pelo RBAC centralizado.
- **O que foi feito:** `loss_management/router.py` deixou de definir `LOSS_ROLES` localmente e passou a usar `require_role(PERDAS_ACCESS)` (`app.shared.role_groups`), o mesmo grupo por trás de `RequirePerdas`. O alias `RequirePerdas` é um `Annotated[UserDTO, Depends(...)]` para parâmetros de rota e não entra em `dependencies=[...]` do router, por isso o grupo foi usado direto, como em `customer360/router.py`. Perfis autorizados inalterados: `diretor` e `gerente_perdas`.
- **Validação (comandos equivalentes a `make lint-all` e `make test-all`, rodados direto porque `make` não existe neste shell):**
  - Backend: Ruff OK, Pylint 10,00/10, import-linter 4 contratos mantidos, `pytest` 537 passed.
  - **Frontend não validado nesta entrega:** `bun` não está instalado nesta máquina. Nenhum arquivo do frontend foi alterado.

### [2026-10-26] - Fase 9.6: quadro de ordens de inspeção (4 colunas)
- **Autor:** Adrian César (Fatia 05)
- **O que foi feito:** a aba "Ordens de inspeção" deixou de ser tabela e virou um quadro de 4 colunas (Pendente, Em campo, Concluída, Cancelada) sobre a **API real** (`/losses/inspections`), sem mock. Um adaptador (`utils/orderBoard.ts`) mapeia `gerada`→Pendente e `pendente`→Em campo, e monta o código `OI-AAAA-NNNN` (ano de `criado_em` + `id_inspecao` com 4 dígitos). Cartão (`OrderCard`) com código, data, UC, inspetor ("sem inspetor"), selo de resultado, motivo do cancelamento e ações por etapa. Barra de fluxo (`OrderFlowBar`) com "Exportar planilha de campo" e "Importar resultados de campo" (reaproveita `InspectionUploadModal`). Estados carregando, erro com "Tentar novamente" e coluna vazia.
- **Resultado de campo:** o diálogo valida (irregularidade sim exige tipo e kWh maior que zero), mostra o erro abaixo do campo com `aria-describedby` e ganhou o campo Inspetor. A regra vive em `utils/resultFormValidation.ts`.
- **Transições:** continuam validadas no servidor (`ALLOWED_TRANSITIONS`, 409); o front só oferece as ações coerentes (`ACTIONS_BY_STATUS`, testado).
- **Testes (Vitest):** `orderBoard.test.ts`, `resultFormValidation.test.ts`, `OrderBoard.test.tsx`; testes da página adaptados de `table` para `region`. Frontend: ESLint, Fallow e build OK, `vitest` 186 passed em 24 arquivos.
- **Pendente (aguarda decisão):** teste Playwright (não está no projeto); capturas escuro/claro contra o print; botões com 32–36 px de altura (o `Button` do design system chega a h-10 e `no-restyle` proíbe sobrescrever; o pedido era 44 px); `font-mono` nos códigos OI/UC (o print de referência usa sans); validação de tipo/kWh também no backend; prévia linha a linha da importação (exige dry-run no backend).
- **Sonner (2026-10-26):** instalado (`sonner@2.0.8`), com `components/ui/sonner.tsx` montado no `App.tsx`. Avisos (toasts) em enviar a campo ("OI-... enviada a campo com <inspetor>."), registrar resultado ("Resultado de OI-... registrado.") e cancelar ("OI-... cancelada."), todos testados.
- **Concluída em verde:** novo token semântico `success` (`--success`/`--success-foreground` e `--color-success*` no `index.css`) com #5BCB93 no escuro (`oklch(0.76 0.13 159)`, contraste 8,8:1) e #176B41 no claro (`oklch(0.47 0.10 156)`, contraste 6,5:1). `Badge` ganhou a variante `success`; `design.md` (cores e §5.4) atualizado com as seis variantes.
- **Auditoria contra `frontend-coding-standards` (correções):**
  - `Input` ganhou a prop `error` (borda `border-destructive`); o diálogo de resultado marca `Select` e `Input` com erro, `aria-invalid` e `aria-describedby`.
  - Esqueleto de carregamento em 4 colunas, na mesma grade do quadro (`BOARD_GRID_CLASSES`), com `aria-busy` e rótulo "Carregando ordens de inspeção".
  - Mensagem de erro do `ExportOrdersButton` com `max-w-64 text-right`, para não alargar a barra do fluxo.
  - Controlador headless `hooks/useResultFormController.ts` (estado, validação, payload, mutação e toast); `RegisterResultDialog` caiu de 135 para 87 linhas.
  - Observação: `@tanstack/react-form` e Zod (padrão da skill de formulários) não estão no projeto; a validação segue em função pura (`validateResultForm`).
- **Diferenças do protótipo:** grid por breakpoints (1, 2 e 4 colunas) em vez de `auto-fit`, pois o lint proíbe estilo inline e colchetes; raio de 12 px do design system (e não 8 px); cartão sem bairro (a ordem não tem esse campo) e sem score; id derivado do id numérico.

### [2026-10-27] - Fase 10: novo design (tokens e componentes compartilhados)
- **Autor:** Adrian César (Fatia 05)
- **Origem:** `tokens-claro.png`, `tokens-escuro.png`, `componentes-claro.png` e `componentes-escuro.png` (novo desenho do sistema).
- **Auditoria:** componentes já usavam só tokens semânticos (sem cores brutas nem `text-[..px]`). Os desvios estavam no `index.css`: oklch aproximado no lugar dos hex, tema claro em `.light` (o spec quer `:root` claro e `.dark` escuro), tokens `--brand-*` fora do spec, raios 12/24/36 px e escala de tipo padrão do Tailwind.
- **Tokens (`design-system`):** `index.css` reescrito com os hex do spec, escala de tipo 12/13/14/16/20/24/30 px, raio base 8 px (`sm` 4, `md` 8, `lg` 12) e `shadow-sm`. Removidos `--brand-*` e `.glass-card`; `glass-gradient` passou a derivar de `--background` e `--accent`. `sonner.tsx` detecta o escuro pela classe `dark`. `design.md` com a tabela escuro/claro, tipografia, raio e a Receita 1 sem `text-emerald-*`.
- **Raio e tipo nos componentes (27 arquivos):** botões, campos, badges e abas em `rounded-md`; cards e diálogos em `rounded-lg`; títulos `text-base` viraram `text-lg` (16 px); botões e campos em `text-base` (14 px).
- **Componentes existentes:** `EmptyState` (card sólido), `LoadingSkeleton` (shimmer, sem animação com movimento reduzido), `Badge` (`success`/`warning`/`destructive` em tint de 15% e variantes `accent`/`muted`), `SidebarNav` (item ativo `accent`) e `AppLayout` (barra superior opaca).
- **Novos (TDD, teste escrito antes):** `components/ui/status-badge.tsx` com vocabulário fechado por tipo (`fatura`, `ordem`, `leitura`), usado em `QueueSituationBadge`, `OrderBoardColumn` e `OrderFlowBar` (`BoardColumn.tone` virou `badge`); `components/feedback/ErrorState.tsx` (detalhe técnico, "Tentar novamente", "Copiar detalhes para o suporte", escopo `block`/`page`), usado em `AsyncState` (novas props opcionais `errorDetail` e `onRetry`) e no fallback do `ErrorBoundary`.
- **Código morto removido:** `InspectionStatusBadge.tsx` (ficou sem importador quando o quadro substituiu a tabela) e `STATUS_LABELS` de `lossFormatters.ts`.
- **Validação:** `make lint-all` exit 0 (Ruff, Pylint, import-linter, ESLint, Fallow 0 acima do limite); `make test-all` exit 0: backend 537 passed, frontend 200 passed em 26 arquivos (14 novos em `status-badge.test.tsx` e `ErrorState.test.tsx`); build do frontend OK. **Não conferido no navegador.**
- **Diferenças conhecidas em relação ao desenho:** selos e abas em 8 px (o spec pede 6 px, degrau que o Tailwind v4 não tem sem criar token); hover do botão primário em `/90` (spec: `/85`); ícone do selo "Estimada" é aproximado (`CircleDashed`); `EmptyState` sem `reason`/`activeFilters`; `AppShell` sem busca de UC, menu recolhível, selos "Dados até" e "Modo demonstração" nem seletor de tema.
- **Efeito na entrega do dia 26:** o raio do quadro de ordens, antes 12 px "do design system", agora segue a escala nova (cartões `rounded-md`, colunas `rounded-lg`).
- **Pendente / outras fatias:** `onRetry` do `ErrorState` ainda não ligado ao `refetch` em `Customer360Details`, `GridQualityPage` e `SuspiciousQueueTab`; UC 360 (`PAYMENT_STATUS`, Bernardo) e `QualityStatusBadge` (João Henrique) não migraram para o `StatusBadge`; `KpiCard`, `DeltaBadge`, `DataTable` e `FilterBar` seguem sem dono (compartilhados); `ChartCard`/`DrillDownTable` (Célio) e `ChatDrawer`/`SqlAuditPanel` (Miguel) ficam com os donos das fatias.

### [2026-10-27] - Fase 7: fila conferida contra a Gold real (`v_energy.db`)
- **Autor:** Adrian César (Fatia 05)
- **Contexto:** a equipe de dados enviou o `backend/v_energy.db` real. Até aqui a fila foi desenvolvida e validada em bancos de simulação (o seed de 45.200 UCs com fila de 83 UCs e o banco sintético de 400 UCs). Nesta data o `v_energy.db` passou a ser a fonte de verdade; as entradas anteriores com números do seed ficam como histórico.
- **O que foi conferido (somente leitura, nenhum código alterado):**
  - **Banco usado:** análises e backend abrem `backend/v_energy.db` (sem `.env` de banco nem `DATABASE_URL`). O `v_energy_dev.db` (65 KB, seed da Visão 360) e os `-wal`/`-shm` órfãos de `v_energy_perdas_dev` não foram usados. O `v_energy.db` não tem tabela de seed.
  - **Esquema:** colunas e formatos batem com o contrato usado em `queries.py` (`competencia` 'YYYY-MM', `data_inspecao` texto ISO, `possui_gd` 0/1). Contagens: 45.000 UCs, 2.152.336 medições (2022-07 a 2026-06, sem consumo negativo), 1.389 inspeções (871 irregulares, 62,7%), 3.510 UCs com GD (iguais às de `geracao_distribuida.csv`). `ordem_inspecao` e `fato_anomalia_leitura` vazias.
  - **Fila em tempo real (2026-06): 0 UCs.** As 559 UCs com queda ≥ 50% são todas com GD e todas conectaram entre 2025-06 e 2026-04, ou seja, a queda é explicada pela geração solar e a regra as exclui. Entre as UCs sem GD, a maior queda é de 38%. As 1.358 UCs sem GD inspecionadas desde 2025-04 saem da fila. O resultado é o esperado (ver `DECISOES_PERDAS.md` D9) e a regra não foi alterada.
  - **Poder do sinal nas 1.385 inspeções analisáveis** (consumo dos 3 meses antes da inspeção contra os 12 anteriores): queda ≥ 50% acerta 91% (713 de 780); faixa de 0,5 a 0,7 do consumo, 42%; de 0,7 a 0,85, 7%; sem queda, cerca de 6 a 10%. Nas 391 UCs com GD medidas, o consumo cai a uma mediana de 27% depois da conexão.
- **Backtest com o `LossService` real** (competência fixada, só as inspeções até o mês contam; acerto nas inspeções dos 3 meses seguintes):

| Referência | UCs na fila | Inspecionadas depois | Acerto | Top 200 inspecionadas | Acerto do top 200 |
|---|---|---|---|---|---|
| 2025-06 | 3 | 0 | n/a | 0 | n/a |
| 2025-07 | 827 | 300 | 94,0% | 129 | 94,6% |
| 2025-08 | 773 | 369 | 94,9% | 155 | 96,8% |
| 2025-09 | 590 | 492 | 91,5% | 197 | 93,9% |
| 2025-10 | 352 | 336 | 90,8% | 197 | 92,9% |
| 2025-11 | 71 | 70 | 90,0% | 70 | 90,0% |
| 2026-06 | 0 | 0 | n/a | 0 | n/a |

  - A API limita a 500 UCs por consulta, então "UCs na fila" é o `total` e o acerto da fila é medido nas 500 primeiras.
  - Fila de 2025-07 contra todas as inspeções posteriores (sem limite de 3 meses): 500 UCs, 497 inspecionadas depois, 467 irregulares (94,0%); top 200 com 189 de 199 (95,0%), contra 62,7% de toda a base.
- **Configuração para demonstração:** criado `backend/.env` local (ignorado pelo git) com `LOSS_REFERENCE_COMPETENCIA="2025-07"`. A API devolve 827 UCs (200 exibidas) e o aviso `competencia_referencia_fixada`, que a tela mostra. Para voltar ao tempo real, remover a linha e reiniciar o backend. Não conferido no navegador.
- **Decisões e limitações:**
  - Quase todas as UCs da fila fixada (497 de 500) foram depois inspecionadas: o campo já seguia esse padrão de queda. O backtest mostra que a regra reproduz bem a escolha do campo, mas **não prova** que ache irregularidades em UCs que ninguém inspecionou; apresentar como "taxa histórica de acerto".
  - `possui_gd` é o estado atual: UCs que conectaram GD depois da referência ficam fora do backtest (conservador).
  - A tabela do D9 de `DECISOES_PERDAS.md` foi medida no banco de simulação (por exemplo 354 UCs em 2025-06); na Gold real a onda de quedas começa mais tarde (3 UCs em 2025-06). A tabela acima a substitui.
- **Pendências:**
  - Tarifa: `TARIFA_MEDIA_RS_KWH` = 0,714 no código e 0,85 no D8; no `fato_faturamento` real a média de `tarifa_aplicada_rs_kwh` é 0,774 e `valor_energia_rs / consumo_faturado_kwh` é 0,561. Definir com Ryei qual medida usar.
  - Remedir na Gold real: limiar de 50% (92,6% no D2), exclusão de GD (3,2% no D3) e a taxa da leitura zerada isolada (usa a geral 0,627).
  - Taxa da queda súbita (0,93): mantida; o backtest na Gold real dá 91 a 95%.
  - Fila em tempo real vazia: `SuspiciousQueueTab.tsx` já explica ("Nenhuma UC atende aos critérios. UCs com geração distribuída ou já inspecionadas na janela de análise ficam fora da fila"). Opcional: citar também o limiar de queda de 50%.
- **Validação:** consultas somente leitura (`mode=ro`) e a `LossService` do backend; sem alteração de código, então `make lint-all` e `make test-all` não foram reexecutados.

### [2026-10-27] - Fase 11: fila classificada (piso de 20% e chance de acerto por faixa)
- **Autor:** Adrian César (Fatia 05)
- **Motivação:** com o limiar duro de 50%, a fila em tempo real (2026-06) ficava vazia e os dados de 2026 não apareciam. Pedido: uma fila classificada, sem corte duro, com a chance de acerto calibrada por faixa de queda.
- **O que foi feito (TDD, testes escritos antes):**
  - `schemas.py`: novo motivo `SuspicionReason.QUEDA_MODERADA` (`"queda_moderada"`).
  - `scoring.py`: piso `LIMIAR_QUEDA_MODERADA` = 0,2 e `LIMIAR_QUEDA_MODERADA_FORTE` = 0,3. Queda de 50% ou mais segue `queda_subita` (0,93); de 20% a 50% vira `queda_moderada`, com `probabilidade_acerto` por faixa: **0,42** (30% a 50%) e **0,07** (20% a 30%). Novas `reason_hit_rate` e `hit_probability(reasons, drop_ratio)`. A ordenação não mudou: kWh esperado = kWh a recuperar × chance de acerto, então a queda súbita continua no topo.
  - `service.py`: `suspicion_filters` passa o piso de 20% como critério de candidata (vale para a lista, o resumo e o kWh das ordens novas).
  - Front: tipo `SuspicionReason`, rótulo "Queda moderada de consumo" e opção no filtro Motivo. Texto OpenAPI de `GET /losses/suspicious-units` atualizado.
  - Tabela da fila: a coluna "Motivos" saiu, porque o motivo não está no banco (é calculado na API) e vinha igual em todas as linhas. Entraram "Queda" (`formatConsumptionDrop`, com consumo base → recente) e "Chance de acerto" (`probabilidade_acerto`), que variam por UC. O filtro por motivo continua. Validação: `make lint-all` e `make test-all` verdes (backend 543, frontend 209).
  - `backend/tests/conftest.py`: isola a suíte do `backend/.env` local. Sem isso, a competência fixada para demonstração fazia 12 testes falharem.
  - Fixture `UC_ZERADA` (base 150 para 120) e o teste unitário de leitura zerada isolada (recente 100 para 130) ajustados: com o piso novo, a queda de 33% deixou de ser "sem queda grande".
- **Taxas das faixas** (medidas no `v_energy.db`, inspeções de 2025-08 a 2025-12): 30% a 50% de queda = 42% (132 de 314); 15% a 30% = 7% (13 de 176); a faixa de 20% a 30% usa a segunda. Amostras pequenas e escolhidas pelo campo.
- **Resultado nos dados reais:**
  - Tempo real (2026-06): **165 UCs** sem GD e não inspecionadas, 19 com chance de 42% e 146 com 7%. Os dados de 2026 passam a aparecer.
  - Backtest 2025-07: top 200 com **94,9%** de acerto (188 de 198 inspecionadas depois) e fila de 500 com 94,1%; a ordenação do topo não piorou.
- **Limitações:**
  - **Meses de queda generalizada:** em 2025-07 e 2025-09 quase toda a carteira cai 20% ou mais (34.240 e 39.247 UCs acima do piso). O topo continua certo (queda súbita primeiro), mas o `total` perde o sentido e a consulta carrega todos os candidatos em memória. Melhoria possível: normalizar a queda pela queda mediana da carteira.
  - A API continua limitada a 500 UCs por consulta e não tem paginação (`offset`).
  - Taxas de 42% e 7% a remedir com mais dados; a de 0,93 segue confirmada pelo backtest (91 a 95%).
- **Configuração:** a competência fixada em 2025-07 foi comentada no `backend/.env` (a fila usa a mais recente, 2026-06). Reiniciar o backend para valer.
- **Validação:** `make lint-all` exit 0 (Ruff, Pylint 10/10, import-linter 4/4, ESLint, Fallow 0 acima do limite); `make test-all` exit 0: backend **543 passed** (6 novos), frontend **201 passed** (1 novo). **Não conferido no navegador.**

### [2026-10-27] - Fase 12: fila em abas (prioritárias, baixa chance e todas)
- **Autor:** Adrian César (Fatia 05)
- **Motivação:** a fila real (2026-06) tem 165 UCs, todas `queda_moderada`: 19 com chance de acerto de 42% e 146 com 7%. Misturadas, a posição 100 parecia tão boa quanto a 10. A primeira versão recolhia a baixa chance atrás de um botão no fim da lista; o usuário não descobria as outras UCs sem rolar a página, então virou abas acima da tabela.
- **O que foi feito (só frontend; o backend não mudou):**
  - `utils/queueBands.ts`: `PRIORITY_MIN_HIT_PROBABILITY` = 0,3 (entre 7% e 42%), `isPriorityUnit` e `splitQueueBands`, que mantêm a ordem do backend dentro de cada faixa.
  - `QueueBandTabs.tsx`: abas **Prioritárias**, **Baixa chance** e **Todas** acima da tabela, com a contagem em cada uma e uma linha que explica a faixa. Usam o estilo sublinhado (`Tabs variant="line"`, variante nova em `ui/tabs.tsx`; o padrão `segmented` não mudou), para não parecerem as abas da página. Abre nas prioritárias; aba sem UC fica desligada e, sem nenhuma prioritária, abre a primeira com UC. Avisa quando a fila foi cortada pelo limite da API.
  - `PrioritizedQueueTable.tsx`: `total` opcional e `label` próprio por tabela. A posição (#) vale dentro da aba.
  - `useQueueSelection.selectTop(count, include?)` e `QueueActionsBar`: o botão passou a "Selecionar top 10 prioritárias" e só marca UCs prioritárias, em qualquer aba. A seleção vale entre abas.
  - Testes: `queueBands.test.ts`, `QueueBandTabs.test.tsx` e um caso novo em `useQueueSelection.test.ts`.
- **Medições que sustentam a decisão** (consultas somente leitura no `v_energy.db`; D11 em `DECISOES_PERDAS.md`):
  - Funil: 45.000 UCs, 41.490 sem GD, 40.128 sem as 1.358 inspecionadas, 165 com queda de 20% ou mais. Antes de excluir as inspecionadas eram 656 (491 removidas, 93% delas com irregularidade).
  - Taxas no ponto do tempo (queda até o mês anterior à inspeção, 1.385 inspeções): 7% (12 de 161) em 20% a 30%, 42% (132 de 314) em 30% a 50% e 91% (713 de 780) a partir de 50%. Confirmam as taxas do código; a análise com a queda de hoje dava 93% na faixa de 20% a 30% por olhar para o futuro.
  - Sinais testados e não adotados: consumo frente à mediana das UCs da mesma classe e alimentador, e leituras estimadas nos 3 meses anteriores. Entre as 130 inspeções com queda abaixo de 20% (11 irregularidades), nenhum separa as irregulares.
- **Pendências com a equipe:** prazo de reincidência para UC com irregularidade constatada; autorização de um piloto de 40 a 50 inspeções fora da fila para validar um sinal novo. **Não conferido no navegador** (nem as abas dentro das abas da página, nos dois temas).
- **Validação:** `make lint-all` exit 0; `make test-all` exit 0: backend **543 passed**, frontend **227 passed**.

### [2026-10-27] - Fase 13: filtros da fila enxutos (sem "Score mínimo")
- **Autor:** Adrian César (Fatia 05)
- **Motivação:** com as abas por chance de acerto (Fase 12), o select "Score mínimo" (50, 70, 90) virou um segundo corte de prioridade, em outra escala e relativo à UC do topo, sem critério operacional.
- **O que foi feito (só frontend; o backend não mudou):**
  - `QueueFilters.tsx`: ficam Motivo, Município e Classe (grid de 3 colunas); saíram o select, `MIN_SCORE_OPTIONS` e o link "como calculamos o score".
  - `PrioritizedQueueTable.tsx`: o cabeçalho "Score" virou um botão com a explicação do score (abre com mouse e com foco de teclado).
  - `lossTypes.ts`: `score_minimo` saiu de `SuspiciousUnitsFilter`; `lossQueries.ts`: `compactFilters` só trata texto.
  - Testes: `SuspiciousQueueTab`, `lossQueries` e `lossApiRequests` sem `score_minimo`; caso novo em `PrioritizedQueueTable.test.tsx` para a explicação do score.
- **Backend (removido no mesmo dia, depois de conferir que ninguém mais usava):** `score_minimo` saiu de `SuspiciousUnitsFilterDTO` e de `GET /losses/suspicious-units` (a documentação OpenAPI foi ajustada); `min_score` saiu de `rank_suspicious_units` e do `LossService.list_suspicious_units`. O `score` de cada UC continua calculado sobre todas as candidatas, antes do filtro de motivo. Um cliente antigo que ainda mande `?score_minimo=` não recebe erro: o parâmetro é ignorado.
  - Testes removidos: corte por score mínimo no ranking e validação de `score_minimo` acima de 100. Os casos de motivo no serviço e na rota ficaram, sem o `score_minimo`.
- **Validação:** `make lint-all` exit 0; `make test-all` exit 0: backend **541 passed** (543 antes, menos os 2 testes removidos), frontend **228 passed** (1 novo). **Não conferido no navegador.**

### [2026-10-28] - Fila de Inspeção: passos 1 e 2 do raio-x (textos, formatação, kWh) e P5
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Menu "Gestão de Perdas" renomeado para "Fila de Inspeção".
  - Município, classe e tipo de irregularidade exibidos com acento e sem caixa alta (`utils/textFormat.ts`); o valor enviado à API continua o do banco.
  - Botão "Limpar filtros" e estado vazio "Nenhuma UC com esses filtros." com ação de limpar.
  - Toast "N ordens geradas." ao concluir o lote sem falhas; texto do cancelamento informa que o score é recalculado no próximo processamento.
  - `ErrorState` com "Tentar novamente" na fila e no resumo dos cartões.
  - Campo de kWh do resultado passou a texto com `inputMode="decimal"`; `parseKwh` aceita "1.240", "1240,5" e "1.240,5" e rejeita entradas ambíguas. Mensagem: "Informe o kWh recuperado (número maior que zero)."
  - P5: removido o botão "Exportar fila" da aba Fila; "Exportar planilha de campo" permanece na aba Ordens.
- **Fora desta entrega:** passo 3 em diante (RBAC de escrita, novas colunas, detalhe da UC) e atualização do protótipo.
- **Validação de Testes:**
  - `make lint-all` sem erros; `make test-all`: 541 passed (backend) e 268 passed (frontend).

### [2026-10-28] - Fila de Inspeção: passo 3, escrita só para o gerente de perdas (P10)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Backend: novo grupo `PERDAS_WRITE` (só `gerente_perdas`) em `shared/role_groups.py`; `POST /inspections`, `PATCH /inspections/{id}` e `POST /inspections/upload` passam a exigi-lo (403 para `diretor`). Os `GET`, inclusive a exportação da planilha de campo, seguem com `PERDAS_ACCESS`.
  - Frontend: hook `useCanWriteLosses`; para quem só consulta somem "Gerar N ordens", "Importar resultados de campo" e as ações dos cartões (enviar a campo, registrar resultado, cancelar). Seleção de UCs e cartões de resumo continuam visíveis.
- **Validação de Testes:**
  - Pytest: `diretor` lê os 5 `GET`, recebe 403 em `POST`/`PATCH`/upload e a ordem existente não muda. Vitest: hook por papel, botões escondidos para `diretor` e presentes para `gerente_perdas`.

### [2026-10-28] - Fila de Inspeção: passo 4 reduzido, colunas novas em `ordem_inspecao` (P3)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Banco: `ordem_inspecao` ganhou 3 colunas anuláveis: `data_inspecao` (data), `inspetor` (código `INSP-001` a `INSP-040`) e `motivo_cancelamento` (lista fechada). As 7 ordens existentes seguem válidas, com as colunas novas nulas. Sem `executar_ate`, distribuição e observações (fora da entrega).
  - Migração: o projeto não usa Alembic e não foi instalado. Novo `schema_upgrade.py`, idempotente (`ALTER TABLE ... ADD COLUMN` só se a coluna não existir), chamado na subida da API (`main.py`) e por `make db-upgrade`. Passo para bancos já criados documentado em `backend/README.md`.
  - Motivos de cancelamento (enum `CancellationReason`, única fonte, vinda do protótipo): `cliente_regularizou`, `ordem_duplicada`, `endereco_nao_localizado`, `repriorizacao_equipe`, `outro`. Os rótulos em pt-BR ficam para o passo 9.
  - Registrar resultado e importar planilha agora gravam `data_inspecao` e `inspetor` (antes a data era validada e descartada). O servidor rejeita inspetor fora de `INSP-001` a `INSP-040` e data futura (422 na API; na planilha, a linha é rejeitada com mensagem em pt-BR). O código do inspetor é normalizado (`insp-001` vira `INSP-001`).
  - Cancelar exige `motivo_cancelamento` da lista (422 se faltar ou for outro valor). A `justificativa_cancelamento` em texto livre continua aceita, mas deixou de ser obrigatória.
  - Planilha de campo: a coluna `inspetor` passou a gravar em `inspetor` (antes ia para `fiscal_responsavel`); a planilha exportada ganhou a coluna `inspetor`, em branco.
  - Permissões do passo 3 mantidas: só `gerente_perdas` escreve; `diretor` segue com 403.
  - Frontend: só tipos em `lossTypes.ts` (`CancellationReason` e campos novos opcionais). Nenhuma interface alterada.
- **Dificuldades / Desafios:**
  - O `uvicorn --reload` que estava rodando recarregou ao editar o `main.py` e aplicou a atualização no `v_energy.db` real, sem comando manual. Conferido depois: as 7 ordens seguem `gerada`, as 3 colunas estão nulas e o índice único parcial está intacto. O script foi validado também numa cópia do banco devolvida ao formato antigo (1ª execução adiciona as colunas, 2ª não faz nada, 7 ordens preservadas).
  - **Cancelar pela tela retorna 422 até o passo 9**: o `CancelOrderDialog` ainda envia só a justificativa em texto livre, e o servidor agora exige o motivo da lista.
- **Fora desta entrega:** passo 5 em diante (diálogos com lista de inspetor e motivo, endpoint de inspetores, detalhe da UC).
- **Validação de Testes:**
  - Pytest novos/ajustados: migração roda duas vezes e preserva as 7 ordens; resultado grava data e inspetor; inspetor inválido e data futura retornam 422; cancelamento sem motivo ou fora da lista retorna 422; motivo válido é gravado; `diretor` segue com 403.
  - `make lint-all` sem erros; `make test-all`: 572 passed (backend) e 278 passed (frontend); `tsc` do app sem erros. **Não conferido no navegador.**

### [2026-10-28] - Fila de Inspeção: passo 5 (inspetores e território nas ordens) e P13 (retorno esperado por UC)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Novo `GET /losses/inspectors` (leitura: `gerente_perdas` e `diretor`). A fonte real é `fato_inspecoes_perdas.id_inspetor` (40 códigos, `INSP-001` a `INSP-040`). A base **não tem nome de exibição** (nenhuma tabela de inspetores, nenhuma coluna de nome), então a resposta é só `[{"codigo": "INSP-001"}, ...]`. Sem a tabela de histórico responde 500, como os demais `GET` que leem a Gold.
  - `GET /losses/inspections` passa a trazer `municipio`, `bairro` e `classe_consumo` da UC, por um único LEFT JOIN com `dim_unidade_consumidora` (sem N+1; ordem de UC fora do cadastro vem com os três nulos). `POST`/`PATCH`/upload e a planilha de campo continuam sem esses campos. Frontend: o cartão do quadro mostra "Bairro · Município" (formatados como na fila) e "—" quando não há dado.
  - P13: `retorno_esperado_kwh_mes` e o novo `retorno_esperado_valor_ano_rs` passam a ser a soma, por UC selecionada, de `kwh_mes_recuperavel × probabilidade_acerto` (e de `valor_ano_rs × probabilidade_acerto`), não mais a taxa histórica global. O cálculo mora só no backend (`queue_summary.expected_return`); o front antes multiplicava `valor_ano × taxa` por conta própria e agora só exibe o valor do servidor. O card "Taxa de acerto" segue com a taxa histórica (62,7%). A tarifa continua a constante de hoje (R$ 0,714); a troca é o passo 12.
  - Correção pequena: `_distinct_values` usava `distinct(coluna)`, que gerava `SAWarning`; passou a `select(coluna).distinct()`.
- **Exemplo numérico do P13:** UC A com queda de 40% (chance 42%, déficit 80 kWh/mês) e UC B com queda de 25% (chance 7%, déficit 50 kWh/mês). Retorno por UC: 80 × 0,42 + 50 × 0,07 = 33,6 + 3,5 = **37,1 kWh/mês**, ou 685,44 × 0,42 + 428,40 × 0,07 = **R$ 317,87/ano** (a R$ 0,714). Com a taxa global de 62,7% o mesmo par daria 81,5 kWh/mês e R$ 698,35/ano, mais que o dobro.
- **Divergência registrada (não alterada):** sem UC selecionada, o resumo **não** mostra o retorno da fila filtrada: `GET /queue-summary` sem `ucs` devolve energia e retorno **zero** (há teste para isso), e o resumo ignora os filtros da tela. Mantido como está, à espera de decisão.
- **Fora desta entrega:** cliente da API de inspetores no front (entra no passo 9, com os diálogos); passo 6 em diante.
- **Validação de Testes:**
  - Pytest novos: inspetores (200, `diretor` 200, perfil sem permissão 403, sem tabela de histórico 500), ordens com bairro/município/classe e ordem de UC fora do cadastro, retorno esperado com o exemplo acima e com seleção vazia. O teste do resumo existente passou de 75,0 (150 × 50%) para 139,5 (150 × 93%, a UC é queda súbita).
  - Vitest novos: cartão com bairro e município, sem os dois ("—") e só com um; card "Retorno esperado" usa o valor do servidor.
  - `make lint-all` exit 0; `make test-all` exit 0: backend **580 passed**, frontend **281 passed**. **Não conferido no navegador.**

### [2026-10-28] - Fila de Inspeção: passo 8 (painel lateral de detalhe da UC)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - Clicar na linha da Fila (ou Enter com a linha focada) abre um `Sheet` com o detalhe da UC, lido de `GET /losses/suspicious-units/{id_uc}` e guardado em cache por UC. Clicar no link da UC ou no checkbox não abre o painel.
  - Conteúdo: cabeçalho (UC, bairro, município, classe, situação); "Por que está na fila" (motivo e frase da API); "Como o score é calculado" com os números (kWh/mês × meses da janela × chance de acerto = kWh esperado, relativo ao topo da fila = score); consumo dos 12 meses com `recharts` e token `chart-1`, mês sem leitura como lacuna; inspeções anteriores (data dd/mm/aaaa, resultado, inspetor).
  - Estados: skeleton, erro em pt-BR com "Tentar novamente", vazio (404) e "Nenhuma inspeção anterior para esta UC.".
  - Rodapé: "Gerar ordem desta UC" marca só essa UC e abre o diálogo de lote existente; desligado se a UC já tem ordem; oculto para o `diretor`.
- **Diferenças do protótipo:** sem pontos por motivo (P1) e sem linha dos vizinhos (fora da entrega); a conta mostra a janela de meses porque o backend calcula `kWh/mês × meses × chance`; sem rótulo "Gerado por IA", pois a frase é calculada por regra; foco visível da linha é o padrão do navegador (o lint proíbe estilizar `TableRow`).
- **Dificuldades / Desafios:** o resumo do diálogo é omitido ao gerar pelo painel, porque ele congela o valor ao abrir e o resumo da nova seleção ainda carrega.
- **Fora desta entrega:** passo 9 em diante; captura em modo escuro (o screenshot do Chrome expirou).
- **Validação de Testes:** Vitest novos (`UnitDetailSheet.test.tsx`, `UnitConsumptionChart.test.tsx`): abre por clique e por Enter, Esc fecha, checkbox não abre, carregando/erro/vazio, cache ao reabrir, gerar ordem, botão desligado com ordem, `diretor` sem o botão, lacuna no gráfico. `make lint-all` exit 0; `make test-all`: backend 607 passed, frontend 296 passed. Conferido no navegador com dados reais (UC106967), sem captura.

### [2026-10-28] - Fila de Inspeção: passo 9 (diálogos de campo com inspetor, data e motivo em lista)
- **Autor:** Adrian Cesar
- **O que foi feito:**
  - **Registrar resultado:** "Inspetor" (obrigatório) vem de `GET /losses/inspectors` e vira busca por digitação quando há mais de 15 itens (hoje 40); "Data da inspeção" (obrigatória, dd/mm/aaaa, máximo hoje). Inspetor, data e resultado são validados juntos antes de enviar. O payload passa a levar `inspetor` e `data_inspecao` e deixa de enviar `fiscal_responsavel`. O inspetor em texto livre saiu.
  - **Cancelar ordem:** motivo obrigatório em lista (`CANCELLATION_REASON_LABELS`, `Record` tipado sobre `CancellationReason`: um motivo novo na API deixa de compilar até ter rótulo) e observação opcional enviada em `justificativa_cancelamento`. O botão de confirmar fica desabilitado até escolher o motivo. Resolve o 422 ao cancelar pela tela, registrado no passo 4.
  - **Enviar a campo:** o "Fiscal responsável" em texto livre virou a lista de inspetores (opcional), seguindo a regra de trocar texto livre por lista. Fora das três telas pedidas.
  - **Gerar ordens:** sem alteração (não tem campo de inspetor e o raio-x não prevê campo novo).
  - **Erros do servidor:** 422 vira mensagem em pt-BR ao lado do campo (`apiFieldErrors.ts`); os demais erros aparecem no rodapé do diálogo. O diálogo só fecha com sucesso, e o erro some quando o usuário edita o campo.
  - **Sucesso:** toast curto e invalidação de fila e ordens, então o quadro atualiza sem recarregar.
  - **Cartão do quadro:** mostra inspetor, "Inspeção em dd/mm/aaaa" e "Cancelada: motivo · observação".
  - **Acessibilidade:** rótulos ligados aos campos, foco inicial no primeiro campo, Esc cancela, erros com `role="alert"` e `aria-describedby`.
- **Diferenças e limites:**
  - **Painel de detalhe da UC:** já mostrava inspetor e data nas inspeções anteriores. O motivo de cancelamento não aparece porque `GET /suspicious-units/{id_uc}` devolve só inspeções, não ordens canceladas; mostrá-lo exige mudar o backend, fora desta entrega.
  - **Seletor de data:** é o `<input type="date">` nativo; o dd/mm/aaaa depende do navegador em pt-BR (há `lang="pt-BR"` e o formato no rótulo).
  - **Busca de inspetores:** aparece já durante o carregamento, para não perder o foco inicial quando a lista chega; se a lista tiver 15 itens ou menos, o campo troca para a lista simples depois de carregar.
  - **Teste:** `src/test/setup.ts` ganhou stubs de `ResizeObserver` e `scrollIntoView`, exigidos pelo `cmdk` no jsdom.
- **Fora desta entrega:** passo 10 em diante; observações do resultado (fora por P3); backend intacto.
- **Validação de Testes:**
  - Vitest novos: validação de campos obrigatórios e data futura (`resultFormValidation.test.ts`), 422 por campo (`apiFieldErrors.test.ts`), diálogos de resultado e cancelamento com erro sem fechar, motivo obrigatório, foco e Esc, busca com 40 inspetores e quadro atualizado após salvar (`FieldDialogs.test.tsx`, `LossManagementPage.test.tsx`).
  - `make lint-all` exit 0; `make test-all`: backend 607 passed, frontend 330 passed. **Não conferido no navegador.**

### [2026-10-28] - Fila de Inspeção: passo 12 (tarifa média calculada da base, P4)
- **Autor:** Adrian Cesar (Fatia 05, Gestão de Perdas)
- **O que foi feito:**
  - Tarifa = `SUM(valor_total_rs) / SUM(consumo_faturado_kwh)` de `fato_faturamento`, nos 12 meses até a última competência faturada (média ponderada pelo consumo; não é a média simples de `tarifa_aplicada_rs_kwh`). Mesma fórmula da Visão Geral (`revenue/kpis.py::average_tariff`).
  - Ponto único no backend: `loss_management/tariff.py` (cálculo puro) e `tariff_repository.py` (`fetch_average_tariff`, cache por banco e por dia). A constante `TARIFA_MEDIA_RS_KWH` (0,714) foi removida; `build_suspicious_unit` e `rank_suspicious_units` recebem a tarifa como parâmetro. Lista da fila, resumo e detalhe da UC usam o mesmo valor.
  - `GET /losses/queue-summary` passa a trazer `tarifa_rs_kwh` calculada e `tarifa_periodo_inicio` / `tarifa_periodo_fim`.
  - Tabela vazia, sem energia faturada ou ausente devolve `DatabaseReadError` (500) com mensagem clara; não há tarifa de reserva e o erro não entra no cache.
  - Front: o cartão "Energia recuperável das selecionadas" mostra "Tarifa média de 12 meses: R$ 0,79/kWh (jul/2025–jun/2026)" (`formatTariffNote`); o texto fixo "a R$ 0,714/kWh" saiu.
- **Números na base real (`v_energy.db`, 2025-07 a 2026-06, 539.768 faturas):** receita R$ 169.683.459 / energia 215.432.924 kWh = **R$ 0,7876/kWh**, 10,3% acima dos 0,714 antigos; todo R$ da fila sobe cerca de 10%. Para comparação: `valor_energia_rs` / consumo = 0,5907 (sem tributos) e a média simples de `tarifa_aplicada_rs_kwh` = 0,7738. O 0,561 citado na D8 não corresponde a nenhuma janela de 12 meses medida.
- **Ocorrências de 0,714:** código (`scoring.py`, `queue_summary.py`) e testes de backend e frontend foram trocados pela tarifa semeada (0,75 no backend; 0,7876 nas fixtures do front). Os documentos (`DECISOES_PERDAS.md`, protótipo, raio-x, `gestao_perdas_campo.md` e entradas antigas deste diário) mantêm 0,714 como registro histórico.
- **Escopo da tarifa (esclarecido):** o período 2025-07 a 2026-06 é só a janela de tempo. A tarifa soma **todas** as faturas da base nesses 12 meses (539.768 faturas, todas as UCs), sem filtrar pelas UCs da fila (165 no momento da conferência). A tarifa é a mesma para qualquer UC; as UCs da fila só a usam para converter kWh em R$. Tarifa por classe ou só das UCs suspeitas ficaria fora da P4.
- **Operação:** a primeira chamada do dia a `/losses/queue-summary` levou cerca de 11 s (cálculo sobre 2,1 milhões de faturas); as seguintes saem do cache. Dois uvicorn na porta 8000 serviam o código antigo e causaram o erro `split` no front até um deles ser encerrado.
- **Fora desta entrega:** passo 13 em diante; o banco não foi alterado; pendente alinhar com a Fatia 02 se a tarifa deve ser por classe.
- **Validação de Testes:**
  - Pytest novos em `test_loss_tariff.py`: resultado exato (750 / 1000 = 0,75), ponderação (600 / 1100, e não 0,75 da média simples), janela de 12 meses, arredondamento, tabela vazia e ausente, cache por dia, tarifa e período no resumo, R$ da fila com a tarifa calculada e erro 500 claro.
  - Vitest novos: `formatTariffNote` em pt-BR e texto de apoio no `QueueSummaryCards`.
  - `make lint-all` exit 0; `make test-all`: backend 620 passed, frontend 332 passed. **Não conferido no navegador.**

### [2026-10-28] - Fase 15.1: consistência entre o painel do diretor e a Fila de Inspeção
- **Autor:** Adrian César
- **O que foi feito:**
  - `executive_dashboard/service.py`: o retrato de perdas do painel pedia à fila o limiar de queda de 50% (`LIMIAR_QUEDA_SUBITA`), e a tela de perdas usa 20% (`LIMIAR_QUEDA_MODERADA`). No `v_energy.db` real, o painel mostrava 0 UCs enquanto a fila mostrava 165. Agora os dois usam o mesmo limiar.
  - Merge de `origin/main` na branch: `rank_suspicious_units` exige `tariff_rs_kwh`, e o painel também passou a usar a tarifa média real (R$ 0,7876/kWh). O valor recuperável do teste do painel passou de 599,76 para 756,00.
  - `DECISOES_PERDAS.md`: D8 reescrita (tarifa calculada da base) e D9 com o funil de 2026-06 (45.000 cadastradas, 1.823 com queda de 20% ou mais, 656 sem GD, 165 sem as já inspecionadas). Pendências de tarifa fechadas em `gestao_perdas_campo.md`; nova Fase 15 com o plano de melhora.
- **Funil medido:** 559 quedas de 50% ou mais, todas em UCs com GD; 491 das 656 candidatas já foram inspecionadas desde 2025-04; 14.295 UCs com queda de 10% a 20% ficam fora porque o sinal acerta 7% ou menos.
- **Próximos Passos:** Fase 15.2 (a fila curta na tela) e 15.3 (motivo e valor).
- **Validação de Testes:**
  - Novo teste: o painel pede o mesmo limiar da fila. Escrito antes e visto falhar.
  - `make lint-all` e `make test-all` na validação final abaixo.

### [2026-10-28] - Fase 15.2: a Fila de Inspeção diz a verdade sobre a capacidade e a seleção
- **Autor:** Adrian César
- **O que foi feito:**
  - `QueueCapacityNotice`: alerta acima da fila quando as UCs prioritárias livres (chance de acerto de 30% ou mais) não enchem a capacidade mensal. Com a fila de hoje: "19 UCs prioritárias para uma capacidade de 200 inspeções por mês" e quantas UCs de baixa chance existem, com a melhor chance entre elas (7%).
  - `SelectionOutlookNote`: com UCs marcadas, mostra "cerca de X de N inspeções devem achar irregularidade; Y devem voltar sem achado" (soma da chance de acerto de cada UC) e, havendo UC abaixo de 30%, um aviso. Aparece na barra de ações e no diálogo de geração de ordens. O aviso não bloqueia: a decisão continua do gerente.
  - Lógica pura em `utils/queueOutlook.ts` (`selectionOutlook`, `describeCapacityGap`), reaproveitando `isPriorityUnit`. Só frontend; o backend não mudou.
  - Dois testes antigos de `SuspiciousQueueTab` ficaram mais específicos porque o texto novo repetia "de 200 inspeções" e usava `role="status"`.
- **Próximos Passos:** Fase 15.3 (motivo com a queda e valor com a razão observada de 1,87×).
- **Validação de Testes:**
  - Vitest novos escritos antes do código (RED visto): `queueOutlook.test.ts` (6) e `QueueExpectationNotes.test.tsx` (5), mais 2 cenários em `SuspiciousQueueTab.test.tsx`.
  - Frontend: 536 passed. Backend inalterado. **Não conferido no navegador.**

### [2026-10-28] - Fase 15.3: motivo com a faixa de queda e valor com a razão observada
- **Autor:** Adrian César
- **O que foi feito:**
  - Backend: `explain_reasons` (`unit_detail.py`) acrescenta à frase do motivo a faixa de queda e a taxa de acerto dela, por exemplo "Na faixa de queda de 30% a 50%, 42% das inspeções históricas acharam irregularidade". `drop_band_label` fica em `scoring.py`, junto dos limiares e das taxas, para os rótulos não divergirem do cálculo.
  - Frontend: o cartão "Energia recuperável das selecionadas" ganha a nota "Estimativa de 3 meses de déficit: em campo, o recuperado foi 1,87× o estimado (mediana)" (`recoveryEstimate.ts`). O número exibido não mudou: a janela de 3 meses segue como no D7.
  - **Decisão de desenho:** não criei coluna Motivo na tabela. Uma primeira tentativa foi desfeita porque as 165 UCs têm o mesmo motivo (`queda_moderada`) e o teste existente "não repete o motivo em cada linha" registra essa decisão. O motivo e a faixa ficam no painel de detalhe; a queda em % já está na coluna Queda.
- **Próximos Passos:** Fase 15.4 (remedir sinais, queda normalizada pela mediana, reincidência).
- **Validação de Testes:**
  - Pytest novos escritos antes (RED visto): faixa e taxa na frase do motivo nas três faixas, e as duas frases já existentes atualizadas.
  - Vitest novo: nota de valor no `QueueSummaryCards`.
  - `make lint-all` e `make test-all` abaixo. **Não conferido no navegador.**

### [2026-10-28] - Fase 15.4: remedição dos sinais na Gold real (só medição e documentação)
- **Autor:** Adrian César
- **O que foi feito:** consultas somente de leitura no `v_energy.db`, sem alterar código nem regra. Resultados em `DECISOES_PERDAS.md` D12.
  - GD confirmado (1 de 31, 3,2%) e queda de 50% ou mais confirmada (92,6%).
  - Leitura zerada e reincidência não são mensuráveis com a Gold atual (nenhuma leitura zerada; nenhuma UC inspecionada duas vezes).
  - Achado principal: a carteira inteira caiu em meados de 2025 (mediana da razão recente/base de 0,61 a 0,75). Com a queda normalizada pela mediana do mês, o acerto das inspeções acima de 20% fica entre 89,8% e 94,3% em cada mês, e abaixo de 20% entre 6,5% e 9,3%. Na fila de hoje, 31 das 165 UCs são fortes (cerca de 92%) e 134 fracas (cerca de 8%).
- **Pendente de decisão:** trocar a queda bruta pela normalizada muda os números principais da fila (42% e 7% para cerca de 92% e 8%) e a ordem das UCs. Limites: só UCs que o campo já inspecionou, sem período de teste separado.
- **Validação:** nenhum código alterado; `make lint-all` e `make test-all` não precisaram rodar de novo para esta entrada (o último passou na 15.3).

### [2026-10-28] - Fase 15.4: chance de acerto pela queda além da carteira
- **Autor:** Adrian César
- **O que foi feito:**
  - Backend: a chance de acerto da `queda_moderada` passa a depender da queda da UC descontada a queda geral da carteira (`normalized_drop_ratio`): **91,5%** quando é de 20% ou mais e **7,6%** abaixo, medido na população da fila (sem GD, queda bruta de 20% a 50%: 118 de 129 e 25 de 330). Antes eram 42% e 7% por faixa de queda bruta.
  - A mediana de recente/base de todas as UCs é calculada em `portfolio_repository.py` (uma consulta, cache por dia e por competência, como a tarifa) e viaja em `QueueCandidates.portfolio_ratio` até a lista, o resumo, o detalhe e o Painel do Diretor.
  - As taxas e `hit_probability`/`reason_hit_rate` saíram de `scoring.py` para `hit_rate.py` (o teto de 300 linhas por módulo); `has_field_history_table` foi para o mixin da fila, que já repetia a verificação.
  - A frase do motivo no detalhe agora diz: "Descontada a variação da carteira (mediana em N% do consumo base), a queda da UC é de X%; nessa situação, Y% das inspeções históricas acharam irregularidade". Substitui a frase por faixa da 15.3.
  - A **regra de entrada na fila não mudou** (queda bruta de 20% ou mais): a lista, a energia recuperável e os números do Painel do Diretor ficam iguais.
- **Resultado no `v_energy.db` real (2026-06):** as mesmas 165 UCs e 7.265 kWh/mês, com mediana da carteira 0,9176: **31 a 91,5% e 134 a 7,6%**, como a medição previu. O retorno esperado da fila inteira sobe de cerca de 908 para cerca de 2.046 kWh/mês, só pela classificação.
- **Limites:** nenhuma UC de fora da fila foi inspecionada; a maior parte das UCs com queda além da carteira na população da fila vem de agosto e dezembro de 2025. Reincidência e leitura zerada seguem sem dado.
- **Avisos a outros membros** em `docs/CORRECOES.md`: Célio (seção 6.2 do diagnóstico cita taxas e tarifa antigas) e Bernardo (ciência sobre o Painel). Nenhum arquivo de outro membro foi editado.
- **Validação de Testes:**
  - Pytest escritos antes (RED visto): queda normalizada, chance por motivo, ranking com e sem carteira, mediana da carteira no repositório (ímpar, par, com GD, com filtros, vazio), frase do motivo e detalhe da API (mediana 22% e queda de 26% conferidas à mão no seed).
  - Testes antigos que supunham 42% e 7% foram reescritos com a carteira explícita, sem enfraquecê-los.
  - `make lint-all` e `make test-all`: backend 750 passed, frontend 537 passed. **Não conferido no navegador.**

### [2026-10-28] - Fase 15.5: paginação no servidor e protocolo do piloto fora da fila
- **Autor:** Adrian César
- **O que foi feito:**
  - Backend: `offset` (inteiro, 0 ou mais) em `GET /losses/suspicious-units`. A página é `fila[offset : offset + limit]`; o `total` segue sendo o da fila inteira e `offset` além do fim devolve lista vazia. Offset negativo responde 422.
  - Frontend: a consulta da fila virou infinita (`infiniteQueryOptions`): a primeira página sai sem `offset`, como antes, e o botão "Carregar mais UCs" (ao lado do aviso "Carregadas as N primeiras UCs de M na fila") busca a seguinte. A ordem, as abas por chance de acerto e a seleção valem sobre tudo o que foi carregado. Antes a tela só via as 200 primeiras UCs e nunca chegava às demais nem ao teto de 500 por página.
  - `DECISOES_PERDAS.md` D13: protocolo do piloto de inspeção fora da fila, com os estratos medidos no banco real (31, 134, 459 e 39.504 UCs), amostra de cerca de 150 inspeções, critério de decisão e registro pelo motivo `PILOTO-*`. **Não executado:** depende do gerente de perdas e da equipe de campo.
- **Limite conhecido:** cada página recalcula o ranking no servidor (a consulta pesada da fila); o cálculo da tarifa e da carteira usa cache por dia, mas a lista não. Com a fila de 2026-06 (165 UCs) não há segunda página; ela aparece nas demonstrações com `LOSS_REFERENCE_COMPETENCIA` fixada.
- **Validação de Testes:**
  - Pytest novos escritos antes (RED visto): página seguinte com o mesmo total, offset além do fim e offset negativo (422).
  - Vitest novos escritos antes (RED visto): botão carrega a página seguinte com `offset` igual ao número de UCs carregadas e some quando a fila inteira está na tela; não aparece quando já está tudo carregado.
  - `make lint-all` e `make test-all` abaixo. **Não conferido no navegador.**
