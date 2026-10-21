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