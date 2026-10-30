# 📝 Diário de Bordo — Fatia 04 (Celio)
**Fatia:** Inteligência Comercial, Receita & Decomposição (Fullstack)  
**Dono:** Celio

---

## Registros de Execução

### [2026-10-16] - Inicialização do Planejamento da Fatia 04
- **Autor:** Antigravity / Time V-Energy
- **O que foi feito:**
  - Estruturação do checklist operacional em `04_dev_revenue.md`.
  - Formalização matemática da decomposição Efeito-Preço vs Efeito-Volume.
- **Dificuldades / Desafios:**
  - Garantir consistência exata entre a agregação por bairros e os totais homologados pela ANEEL.
- **Próximos Passos:**
  - Implementar backend em `backend/app/features/revenue/` e testes com cenários reais.
- **Validação de Testes:**
  - Aguardando implementação.

### [2026-10-19] - Início da execução da Fatia 04
- **Autor:** Celio
- **O que foi feito:**
  - Branch `feat/fatia-04-receita` criada a partir da `main` (d90fe16); checklist marcado como em andamento.
- **Dificuldades / Desafios:**
  - Ainda não há `v_energy.db`; os nomes de colunas vêm só dos contratos escritos.
- **Próximos Passos:**
  - Seed de testes e `seeded_client` (20/10).
- **Validação de Testes:**
  - Não se aplica (apenas documentação).

### [2026-10-20] - Seed de testes, service puro e endpoint de decomposição
- **Autor:** Celio
- **O que foi feito:**
  - `backend/tests/revenue_seed.py`: seed de `dim_unidade_consumidora` e `fato_faturamento` com 5 UCs e duas janelas de 12 competências (primeiro ano da base e últimos 12 meses), mais o `seeded_client`.
  - `backend/tests/test_revenue_seed.py`: 3 testes (contagem de linhas, exemplo-ouro 9600 para 9504 e limpeza do `dependency_overrides`).
  - `backend/app/features/revenue/`: `schemas.py`, `exceptions.py`, `decomposition.py` (cálculo puro) e `service.py`, mais o service no contrato 1 do import-linter.
  - `backend/tests/test_revenue_service.py`: 16 testes (exemplo-ouro 800 para 792, caso só de mix, identidade da soma dos efeitos em 7 cenários, segmentos novo e perdido, janelas inválidas e sem dados).
  - `backend/app/features/revenue/repository.py`: SQL agregado de faturamento por classe, município e bairro nas duas janelas (base e atual), com filtros opcionais e erro de leitura convertido em exceção de domínio.
  - `backend/app/features/revenue/dependencies.py` e `router.py`: rota `GET /api/v1/revenue/decomposition`, restrita à Diretoria (RBAC), com janelas e filtros recebidos por query string, registrada em `app/api/v1/router.py`.
  - `backend/tests/test_revenue_router.py`: 10 testes de integração do endpoint usando o seed (200 com identidade dos efeitos, filtros, 400 para janelas inválidas ou sobrepostas, 403 para perfil sem permissão, 404 sem dados).
- **Dificuldades / Desafios:**
  - Decisão: a decomposição é feita por segmento e o efeito de volume total é dividido em volume puro e mix, porque no agregado os números do case não fecham. Segmento novo ou perdido tem toda a variação atribuída ao volume.
  - Decisão: o RBAC usa o alias `RequireDiretoria`, que continua valendo mesmo se o PR do João alterar a assinatura de `require_role`.
  - Premissas a confirmar com Dados: `classe_consumo` com o nome da classe, município e bairro em maiúsculas, e valor faturado conforme a Gold.
  - `app/api/v1/router.py` é um arquivo compartilhado e pode gerar conflito de merge com os PRs de outras fatias.
- **Próximos Passos:**
  - Endpoints de KPIs e breakdown, histórico por bairro e ranking com paginação (23/10).
  - `EXPLAIN QUERY PLAN` e contador de queries, `EndpointDoc` (quando `app/shared/docs.py` entrar na `main`) e ADR (23/10).
- **Validação de Testes:**
  - `make lint-all` e `make test-all` passando (41 testes); `uv run pytest tests/test_revenue_seed.py`: 3 passed; `uv run pytest tests/test_revenue_service.py`: 16 passed; `uv run pytest tests/test_revenue_router.py`: 10 passed.

### [2026-10-22] - Endpoints de KPIs e detalhamento da receita
- **Autor:** Celio
- **O que foi feito:**
  - `backend/app/features/revenue/kpis.py`: cálculo puro de faturamento, volume, tarifa média ponderada, ticket médio e UCs ativas, com variação percentual entre a janela base e a atual.
  - `backend/app/features/revenue/breakdown.py`: agrupamento dos segmentos por município, bairro ou classe, com efeito-preço, efeito-volume e efeito cruzado de cada linha, e ordenação do ranking.
  - `repository.py`: nova consulta SQL com os totais gerais das duas janelas (receita, volume, faturas e UCs distintas) em uma única leitura.
  - `service.py`, `dependencies.py` e `router.py`: rotas `GET /api/v1/revenue/kpis` e `GET /api/v1/revenue/breakdown` (paginada com `PaginatedResponse`), restritas à Diretoria.
  - `backend/tests/test_revenue_kpis_breakdown.py` (23 testes) e `test_revenue_router.py` (22 testes): cálculo puro, ranking, paginação, 401, 403, 404, 400 e 422.
  - `queries.py`: consultas de faturamento migradas de SQL bruto (`text()`) para SQLAlchemy Core (`table()`/`column()`), com filtros opcionais aplicados só quando preenchidos (portável para PostgreSQL), conforme revisão do Adrian. `test_revenue_queries.py`: 2 testes.
- **Dificuldades / Desafios:**
  - Decisão: o ranking soma os efeitos de cada segmento (classe x município x bairro), então a soma de todas as linhas é a variação total de receita, em qualquer nível.
  - Decisão: ticket médio = receita / número de faturas, assumindo uma fatura por UC por competência (a confirmar com Dados).
  - Pendente: penetração de GD (kWp) por bairro, que a tabela do plano pede, depende de confirmar `potencia_gd_kw` na Gold.
- **Próximos Passos:**
  - Histórico mensal por bairro, `EXPLAIN QUERY PLAN` com contador de queries, `EndpointDoc` e ADR (23/10).
- **Validação de Testes:**
  - `make lint-all` e `make test-all` passando (76 testes no backend).

### [2026-10-23] - Histórico mensal por bairro
- **Autor:** Celio
- **O que foi feito:**
  - `backend/app/features/revenue/history.py`: cálculo puro da série mensal contínua de volume, receita e tarifa média, preenchendo com zero os meses sem faturamento.
  - `queries.py`, `repository.py`, `service.py`, `dependencies.py` e `router.py`: rota `GET /api/v1/revenue/history` (bairro, `competencia_fim`, `meses`, `classe_consumo`), restrita à Diretoria.
  - `backend/tests/test_revenue_history.py` (7 testes) e `test_revenue_router.py` (+6 testes de integração).
- **Dificuldades / Desafios:**
  - Pendente: confirmar com Dados se a receita usa `valor_total_rs` (com tributos) ou `valor_energia_rs`, e validar contra os números do diretor com dados reais.
- **Próximos Passos:**
  - Base real (script ou banco do Bernardo), `EXPLAIN QUERY PLAN`, ADR e `EndpointDoc`; depois o frontend `/revenue`.
- **Validação de Testes:**
  - `make test-all`: 310 testes no backend passando; lint sem erros novos (o `unsorted-imports` em `api/v1/router.py` vem da `main` e é corrigido no PR de integração do João).

### [2026-10-23] - Frontend `/revenue` (PR #34)
- **Autor:** Celio
- **O que foi feito:**
  - `frontend/src/features/revenue/`: página `RevenueDashboardPage`, filtros (período base e de comparação por data, município e classe), 4 cards de KPI, cascata Preço-Volume-Mix, ranking territorial (bairros, municípios e classes) ordenável e paginado, e gaveta com o histórico de 24 meses do bairro.
  - Camada de dados com TanStack Query (`api/`, `queries/`, `hooks/`), controlador headless, tipos, formatadores e utilitários de datas, cascata e opções dos seletores.
  - Rota `/revenue` (só diretor) em `AppRoutes.tsx` e item "Inteligência Comercial" no menu (`navItems.ts`), com o teste de menu do diretor atualizado.
  - Testes Vitest de API, formatadores, filtros, cascata, ranking, gaveta e dashboard.
- **Dificuldades / Desafios:**
  - Decisão: gráficos feitos em HTML/CSS com `motion/react` (sem recharts) para controlar o eixo truncado da cascata, que é avisado na tela.
  - Decisão: períodos escolhidos por data, mas a API trabalha por competência; qualquer dia vale como o mês inteiro.
  - O `main` andou 74 commits durante o desenvolvimento (novo layout, menu e rotas lazy), então a tela foi adaptada ao layout novo.
- **Próximos Passos:**
  - Corrigir os pontos da revisão do PR #34 e escrever o `docs/DIAGNOSTICO_RECEITA.md` com os números do Renan.
- **Validação de Testes:**
  - `make lint-all` e `make test-all` passando.

### [2026-10-27] - Correções da revisão do PR #34 e esqueleto do diagnóstico
- **Autor:** Celio
- **O que foi feito:**
  - Filtro de bairro na barra de filtros: lista os bairros do município escolhido (o seletor só abre depois de escolher o município) e é limpo ao trocar de município. Também vale para KPIs, cascata e ranking.
  - Ranking: nova coluna "Efeito cruzado" e rodapé explicando que preço + volume + cruzado = variação de cada linha (o volume da linha já inclui o mix).
  - Tooltips acessíveis: títulos dos KPIs e colunas da cascata agora recebem foco do teclado e têm o texto lido por leitores de tela; o `Tooltip` compartilhado passou a abrir e fechar por toque (antes abria e fechava no mesmo toque) e a fechar ao tocar fora.
  - Seta do seletor movida para `components/ui/select.tsx`, valendo para todas as telas; `color-scheme` por tema em `index.css` no lugar do `in-[.light]:scheme-light` (colchetes proibidos pelo `AGENTS.md`).
  - Texto da fórmula do efeito-preço, volume, mix e cruzado alinhado ao cálculo do backend (por segmento, somado); comentário de premissa das janelas padrão removido.
  - Paginação única em `components/ui/pagination.tsx`, usada pelo ranking (o `TablePagination` próprio foi removido).
  - `docs/DIAGNOSTICO_RECEITA.md`: esqueleto com períodos, definições, método da decomposição, tabela das causas e consultas, sem números finais.
  - Checklist da Fatia 04 atualizado.
- **Dificuldades / Desafios:**
  - `QueuePagination` (perdas) e o componente de paginação do chat continuam próprios porque são código de outros membros; ficam como sugestão de adoção do `Pagination` compartilhado em cada PR.
  - Tooltip, select e `index.css` são arquivos compartilhados: as mudanças são pequenas e estão descritas no PR para revisão dos donos.
- **Próximos Passos:**
  - Preencher o diagnóstico com os números do Renan, usando as mesmas janelas e definições da tela.
  - Conferir as janelas padrão com o banco real entregue pelo Ryei.
- **Validação de Testes:**
  - `make lint-all` e `make test-all` passando (frontend 302 testes; backend 537).

### [2026-10-28] - Diagnóstico da receita com os números do banco real
- **Autor:** Celio
- **O que foi feito:**
  - Conferido o `v_energy.db` real: 2.152.336 faturas, competências de 2022-07 a 2026-06 (48 meses), sem fatura sem UC e sem par UC x competência duplicado. As janelas padrão da tela estão certas.
  - `docs/DIAGNOSTICO_RECEITA.md` preenchido com as consultas D1 e C0 a C9 e com a cascata e o ranking (classe, município e bairro) da tela `/revenue`. Receita +8,0%, volume -5,1% e tarifa média +13,8%. A geração distribuída (3.496 UCs mantidas com GD, consumo cerca de 62% menor) responde por 97% da queda líquida de volume. Inadimplência, leituras estimadas e anomalias de leitura não explicam a queda.
  - Achado em aberto: nas UCs sem GD, o consumo de Iputinga, Macaxeira, Jardim Jordão e Prazeres cai de uma vez a partir de maio de 2025 (de 10% a 21% por mês), em seis alimentadores diferentes. Causa não identificada.
  - Registro do que entrou no módulo de receita por outras mãos (pedido em `docs/CORRECOES.md`, seção 7): a lista de bairros do filtro agora lê todas as páginas (commit `07a69c0`, Recife tem 106 bairros) e a `period_totals_query` perdeu o filtro de competência no `WHERE` (mesmos números, de 5,1 s para 2,8 s, ADR-016).
- **Dificuldades / Desafios:**
  - Os números do case não batem com o banco: volume "quase -4%" contra -5,1%, e tarifa de 10,5% contra +13,8% (residencial +14,6%). A receita bate (+8,0%). Diferença registrada no diagnóstico.
  - Dados da Gold a confirmar: `potencia_gd_kw` com valores de até 9.000 kW em residência, coluna `subestacao` vazia e tabela `fato_anomalia_leitura` sem linhas.
  - Faturas com `data_pagamento = 9999-12-31` marcadas como pagas (`docs/CORRECOES.md`, seção 1): a consulta C3b, que as conta como não pagas, deu o mesmo resultado da C3 no banco usado (5,52% na base e 5,42% na atual); falta o Ryei confirmar se esta versão do banco já é a corrigida.
  - Respostas de Adrian (tarifa média real de R$ 0,7876/kWh e taxa de acerto por sinal) e de Renan (ações e valores de GD, fraude e leituras estimadas) incorporadas ao diagnóstico, com os pontos que ainda não fecham marcados como `[a confirmar]`.
  - Nas abas Município e Classe do ranking, a tela mostra as linhas da aba anterior enquanto a nova consulta carrega.
- **Próximos Passos:**
  - Receber de Renan, Adrian e Ryei as ações, os ganhos em R$ e as conferências marcadas `[a confirmar]` no diagnóstico.
  - Corrigir o carregamento das abas do ranking.
- **Validação de Testes:**
  - Não se aplica (apenas documentação).
