# 📝 Diário de Bordo — Fatia 03 (Bernardo H)
**Fatia:** Visão 360 da Unidade Consumidora (Fullstack)  
**Dono:** Bernardo H

---

## Registros de Execução

### [2026-10-16] - Inicialização do Planejamento da Fatia 03
- **Autor:** Antigravity / Time V-Energy
- **O que foi feito:**
  - Estruturação do checklist operacional em `visao_360_uc.md`.
  - Definição da arquitetura de endpoints (`/summary`, `/history`, `/events`) e componentes React 19.
- **Dificuldades / Desafios:**
  - Garantir que todos os subcomponentes da tela obedeçam ao limite de $\le 150$ linhas (`maxUnitSize`).
- **Próximos Passos:**
  - Implementar backend em `backend/app/features/customer360/` e testes unitários.
- **Validação de Testes:**
  - Aguardando implementação.

### [2026-10-19] - Backend da Visão 360 (`/summary`, `/history`, `/events`)
- **Autor:** Bernardo H
- **Branch:** `feat/fatia-03-visao360`
- **O que foi feito:**
  - Criada a feature `backend/app/features/customer360/` (`schemas`, `repository`, `service`, `consumption_analysis`, `exceptions`, `dependencies`, `router`).
  - Rotas `GET /api/v1/customers/{id_uc}/summary`, `/history` e `/events`, protegidas no nível do router por `require_role` com `UserRole` (atendente, gerente de atendimento, gerente de perdas, diretor), compatível com o RBAC tipado da Fatia 06. O gerente de perdas entra porque o case pede que "o atendente, o analista de perdas e o diretor comercial" vejam o mesmo cliente.
  - `/history`: 12 meses terminados na última competência da UC, cada um ao lado do mesmo mês do ano anterior (kWh e R$, com Δ%); faturas em aberto (`ABERTA` + `VENCIDA`) e valor total em aberto.
  - Diagnóstico de conta alta: veredito de consumo (`SUBIU`/`ESTAVEL`/`CAIU`/`SEM_COMPARACAO`, limiar de ±10%) e se a bandeira tarifária mudou contra o mesmo mês do ano anterior.
  - `/events`: DEC/FEC dos últimos 12 meses do alimentador da UC (`fato_qualidade_alimentador`) e chamados (`fato_atendimentos`).
  - Número digitado é normalizado (espaços e caixa: ` uc100000 ` → `UC100000`).
  - `nome_titular` opcional: aparece automaticamente se a `dim_unidade_consumidora` passar a ter a coluna.
  - Service e `consumption_analysis` adicionados ao contrato "Pure Python Services" do import-linter.
  - Seed `backend/tests/customer360_seed.py` no formato documentado pelas Fatias 01/02 (`UC100000`, `ALM-REC-004`, `YYYY-MM`); gera também `v_energy_dev.db` via `uv run python -m tests.customer360_seed`.
- **Decisões:**
  - Conta alta = consumo + bandeira (o case pede só "se o consumo realmente subiu"; a bandeira já existe em `fato_faturamento`). Reajuste tarifário não foi incluído.
  - Interrupções usam o DEC/FEC mensal do alimentador até a Fatia 02 confirmar uma tabela de ocorrências individuais.
- **Pendências com outras fatias:**
  - Renan: inclusão de `nome_titular` na `dim_unidade_consumidora`.
  - Ryei: tabela de ocorrências individuais de rede.
- **Validação de Testes:**
  - `ruff check`, `pylint app` (10/10) e `lint-imports` (4 contratos mantidos) aprovados.
  - `pytest`: 50 testes aprovados (38 novos da Visão 360).
- **Próximos Passos:**
  - Frontend `frontend/src/features/customer360/` e rota `/customers`.
