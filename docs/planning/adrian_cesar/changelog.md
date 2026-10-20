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
