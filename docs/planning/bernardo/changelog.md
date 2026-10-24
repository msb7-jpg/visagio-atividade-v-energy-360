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

### [2026-10-21] - Frontend da Visão 360 (`/customers`)
- **Autor:** Bernardo H
- **Branch:** `feat/fatia-03-visao360`
- **O que foi feito:**
  - Criada a feature `frontend/src/features/customer360/` no mesmo padrão da Fatia 05 (`api`, `types`, `queries`, `hooks`, `utils`, `components`, `__tests__`).
  - Busca da UC pelo número da conta (Enter ou botão), com normalização (` uc100004 ` → `UC100004`) e aviso de UC não encontrada.
  - Card do cliente: titular (quando houver), localização, classe/subgrupo, alimentador, medidor e badge de GD solar com tooltip.
  - Aviso "Conta alta?": frase pronta dizendo se o consumo subiu, ficou estável ou caiu contra o mesmo mês do ano anterior e se a bandeira tarifária mudou.
  - Abas: Consumo (gráfico de barras 12 meses × ano anterior, tooltip com kWh, R$, Δ% e bandeira, tabela acessível equivalente), Faturas (total em aberto e badges Paga/Aberta/Vencida) e Interrupções e Chamados (falta de luz mês a mês no alimentador e chamados com nota).
  - Componente `components/ui/chart.tsx` no padrão do chart do shadcn, adaptado às regras do design system (sem estilos inline), sobre Recharts 2.15.
  - Rota protegida `/customers` em `AppRoutes.tsx` com os mesmos perfis do backend.
- **Decisões:**
  - Busca só com Enter/botão (sem debounce) para não disparar consultas com número incompleto.
  - Sem badge de "meta ANEEL" na tela até o time decidir (glossário do case).
  - Sem "Espelho da fatura": TUSD/TE não existem nos dados.
- **Dificuldades:**
  - `ResizeObserver` inexistente no jsdom: simulado apenas no teste da Visão 360.
  - Regra `shadcn/no-restyle` exigiu variantes de cor na legenda do gráfico em vez de classes passadas por fora.
- **Validação de Testes:**
  - Frontend: `bun run lint` (ESLint) e `bun run lint:fallow` (sem duplicação, 0 acima do limite) aprovados; `tsc -b` e `bun run build` ok; Vitest 8 testes aprovados (7 novos).
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (50) aprovados.
- **Próximos Passos:**
  - Integrar `AppLayout` (Fatia 06) e `SmartInsightCard` (Fatia 07), trocar a seed pelo banco real e fechar as pendências da seção 5 do checklist.

### [2026-10-21] - Revisão de responsividade e regras de negócio da Visão 360
- **Autor:** Bernardo H
- **O que foi feito:**
  - Validação visual em celular (375px), tablet (768px) e desktop (1440px): removida a rolagem horizontal no celular (abas com rótulo curto e tabela acessível do gráfico corrigida).
  - Resumo rápido acima das abas (faturas em aberto, falta de luz na região e chamados), para o atendente ver tudo "numa tela só" sem trocar de aba.
  - Interrupções comparadas entre os meses do próprio alimentador (destaque "Acima do normal" para meses acima de 1,5× a média), em linha com o glossário do case; tabela mensal com horas e vezes por cliente (DEC/FEC).
  - Aviso de conta alta lembra o efeito da geração solar quando a UC tem GD.
  - Faturas com Situação e Valor logo após a competência; potência e quantidades no padrão pt-BR; eixo do gráfico sem quebra de linha.
  - Busca não pisca o carregamento quando o cache é atualizado em segundo plano.
- **Validação de Testes:**
  - Vitest 13 testes aprovados (12 da Visão 360), ESLint, Fallow, `tsc -b` aprovados; zero rolagem horizontal nas 3 larguras e 3 abas.

### [2026-10-22] - Diagnóstico de conta alta com 4 causas e totais de 12 meses
- **Autor:** Bernardo H
- **O que foi feito:**
  - Backend: média diária (kWh/dia) a partir de `dias_faturamento`, variação do preço médio do kWh (`tarifa_aplicada_rs_kwh`) e tendência do consumo por dia no diagnóstico; novo `resumo_12_meses` (consumo e valor somando só meses comparáveis) em `yoy_totals.py`.
  - Frontend: aviso "Conta alta?" lista dias faturados, bandeira, preço do kWh e geração solar; totais de 12 meses acima do gráfico; tooltip com kWh/dia e dias faturados.
  - Seed: novo cenário `UC100006` (240 kWh em 36 dias vs 200 kWh em 30 dias: total sobe 20%, consumo por dia estável).
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (57) aprovados.
  - Frontend: ESLint, Fallow, `tsc -b` e Vitest (15) aprovados; capturas em celular e desktop sem rolagem horizontal.

### [2026-10-22] - Busca da UC com sugestões, medidor, recentes e link
- **Autor:** Bernardo H
- **O que foi feito:**
  - Número aceito em qualquer formato: `100004`, `uc 100004`, `UC-100004` e `UC100004` abrem a mesma UC (backend `search_terms.py` e frontend `searchTerms.ts` com a mesma regra).
  - Nova rota `GET /api/v1/customers/search?q=` com sugestões pelo começo do número da UC ou do medidor (até 8, busca por intervalo para usar o índice do cadastro).
  - Campo de busca com sugestões enquanto digita (componente `components/ui/command.tsx` sobre `cmdk`), navegação por setas e Enter seguro: se as sugestões ainda não chegaram para o texto atual, abre o texto digitado.
  - Buscas recentes como atalhos (salvas só no navegador do atendente) e UC no endereço da página (`/customers?uc=UC100004`).
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter e pytest (76) aprovados.
  - Frontend: ESLint, Fallow, `tsc -b` e Vitest (29) aprovados; fluxo validado no navegador (digitar, setas, Enter, recentes) em celular e desktop.

### [2026-10-22] - Validação com dados reais e ajustes nas frases do diagnóstico
- **Autor:** Bernardo H
- **O que foi feito:**
  - Validação da API contra um banco montado a partir dos arquivos brutos no formato do contrato (45 mil UCs, 2,15 mi de leituras e faturas, fora do repositório): 300 UCs sorteadas, 0 divergências entre a API e o recálculo independente (referência, kWh, comparação anual, tendência, valores, faturas em aberto e totais de 12 meses). Tempo das 3 chamadas da tela: 8 ms (mediana); busca: 2 a 9 ms.
  - Frase de dias faturados só aparece com diferença de 3 dias ou mais e quando muda a conclusão (total vs por dia).
  - Frase da bandeira diz se a conta ficou mais cara ou mais barata pela bandeira.
- **Achados nos dados:**
  - Em jul/2025 houve ~5x mais interrupções que a média, em todos os 122 alimentadores (evento compartilhado com a Fatia 06).
  - As datas de leitura do bruto geram intervalos de 19 a 47 dias; a confiabilidade da média por dia depende do `dias_faturamento` da Fatia 01.
- **Validação de Testes:**
  - Frontend: ESLint, Fallow, `tsc -b` e Vitest (34) aprovados.

### [2026-10-24] - Refinamentos do portal: componentes compartilhados, carregamento sob demanda e pontualidade
- **Autor:** Bernardo H
- **Branch:** `chore/refinamentos-portal`
- **O que foi feito:**
  - Componentes compartilhados para eliminar repetição entre as telas: `components/feedback/AsyncState.tsx` (carregando, erro, vazio ou conteúdo; substitui `AsyncListState` da Fatia 05, `QuerySection` da Fatia 03 e os blocos manuais da Fatia 06), `TableColumns` em `components/ui/table.tsx` (cabeçalho de tabela a partir da lista de colunas, usado em 5 tabelas) e `ActionDialog` na Fatia 05 (moldura dos 3 diálogos de ordem). Fallow: de 0,9% de duplicação para 0%.
  - Telas carregadas sob demanda (`React.lazy` no `AppRoutes` e `Suspense` no `AppLayout`): arquivo inicial de 1.103 kB para 274 kB.
  - Visão 360 passa a usar o grupo central `CUSTOMER360_ACCESS` (Fatia 06) no lugar da lista local de perfis.
  - Pontualidade de pagamento nas últimas 12 faturas (pagas em dia, com atraso, atraso médio e vencidas em aberto), na aba Faturas.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter e pytest (510) aprovados.
  - Frontend: ESLint, Fallow (0% de duplicação), `tsc -b`, Vitest (86) e build aprovados.
