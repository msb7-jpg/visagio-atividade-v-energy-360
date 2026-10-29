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

### [2026-10-24] - Correção da contagem de faturas na pontualidade de pagamento
- **Autor:** Bernardo H
- **Branch:** `chore/refinamentos-portal`
- **O que foi feito:**
  - `faturas_avaliadas` passa a contar só as faturas com desfecho conhecido (pagas com datas válidas ou vencidas), de modo que é sempre a soma de pagas em dia, com atraso e vencidas em aberto. Antes, faturas ainda a vencer ou pagas sem data entravam no total e a frase da aba Faturas podia somar menos do que o número exibido.
  - Sem nenhuma fatura avaliável, `pontualidade` volta `None` e a frase não aparece.
  - Testes ajustados (unitário, router e Customer360Page) e novo teste para o caso sem faturas avaliáveis.
- **Validação de Testes:**
  - Backend: Ruff e pytest (511) aprovados.
  - Frontend: ESLint, Fallow e Vitest (86) aprovados.

### [2026-10-27] - Visão 360 com as tabelas novas da Gold
- **Autor:** Bernardo H
- **Branch:** `feat/fatia-03-visao360-gold`
- **O que foi feito:**
  - Aba "Interrupções e Chamados": nova seção "Falta de luz nesta unidade" com cada interrupção da própria UC (`fato_ocorrencias_rede`: início, duração, tipo e causa), mais recente primeiro, com total de horas e a interrupção mais longa. Interrupções anteriores à ligação da UC (`fl_anterior_ligacao`) ficam de fora.
  - Nova aba "Inspeções" com o histórico de inspeções de perdas da UC (`fato_inspecoes_perdas`): data, inspetor, resultado, tipo de irregularidade e kWh recuperado.
  - Diagnóstico de conta alta com a 5ª causa, leitura estimada (`tipo_leitura = ESTIMADA` no mês da conta).
  - Geração solar: o selo mostra "desde mês/ano" (`data_conexao_gd`), e o diagnóstico avisa quando o painel foi ligado entre os dois meses comparados.
  - Busca por nome do titular nas sugestões (`LIKE` com espaços normalizados e curingas escapados). O frontend deixou de juntar as palavras antes de enviar, e o limite do texto subiu de 30 para 80 caracteres.
  - Seed `tests/customer360_seed.py` no esquema exato exportado pelas Fatias 01 e 02, com nomes, data de conexão da GD, leitura estimada, ocorrências e inspeções. A nota CSAT da seed passou para a escala 1–5 (ADR-001).
  - ADR-017 a ADR-023 da Fatia 03 em `docs/DECISOES.md`.
  - Checklist atualizado: pendências resolvidas pelo #38 marcadas.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter e pytest (546) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (177) e build (`tsc -b` + Vite) aprovados.

### [2026-10-28] - Visão 360 validada com o banco real
- **Autor:** Bernardo H
- **Branch:** `feat/fatia-03-visao360-gold`
- **O que foi feito:**
  - Validação com o `v_energy.db` real em 9 UCs (painel solar recente, leitura estimada, muitas interrupções, interrupção antes da ligação, inspeção, faturas vencidas, mês sem leitura, bairro corrompido e 50 dias faturados): todas as abas respondem em até 0,06 s, e interrupções, inspeções, chamados, faturas vencidas e leituras batem com consultas diretas no banco.
  - Correção: o resumo de interrupções usava só as 50 listadas e dizia "teve 50 interrupções" em 33 UCs que têm mais (ex.: UC114218, com 81). O `/events` passou a devolver `resumo_interrupcoes_uc` (total, horas e a mais longa de todas), e a tela avisa quando a lista mostra só as mais recentes.
  - Correção: com o mês atual sem leitura, o diagnóstico culpava o mês do ano anterior ("Não há leitura de jun/2025"). Agora aponta o mês que falta.
  - Merge com a `main` (design novo e tela de Receita): conflito do `EventsTab.tsx` resolvido com os títulos na escala nova, e as ADRs da Fatia 03 renumeradas de ADR-006–012 para ADR-017–023, porque a `main` já usa 006–009 (Fatia 01) e o Painel do Diretor usa 010–016.
  - Achado nos dados registrado em `docs/CORRECOES.md` (branch `feat/painel-diretor`): 60.394 faturas não pagas viraram "PAGA" na Gold, o que distorce a pontualidade e as faturas em aberto.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (547) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (318) e build aprovados.
### [2026-10-27] - Planejamento do Painel do Diretor
- **Autor:** Bernardo H
- **Branch:** `feat/painel-diretor`
- **O que foi feito:**
  - Criado [`painel_diretor.md`](painel_diretor.md) com os requisitos do case, as decisões D1 a D6, os 12 indicadores e a regra de cálculo de cada um, o contrato da API para o Adrian, as etapas até 30/10, o checklist, a definição de pronto e os riscos.
  - Conferido nos arquivos brutos que cada indicador existe nos dois períodos comparados. Perdas fica como retrato atual, porque as inspeções só cobrem ago a dez/2025.
- **Decisões:**
  - Painel só para o perfil diretor; gerente de perdas abre na Fila de Perdas e gerente de operação, na Qualidade da Rede.
  - Períodos padrão do case (2022-07 a 2023-06 contra 2025-07 a 2026-06), com escolha livre.
  - Inadimplência como % do valor faturado vencido e não pago.
  - Quadro de IA do Miguel no Painel com os números reais, depois do merge do #35.
- **Próximos Passos:**
  - Enviar o contrato ao Adrian e implementar o backend (etapa 2).

### [2026-10-27] - Painel do Diretor: backend, frontend e menu
- **Autor:** Bernardo H
- **Branch:** `feat/painel-diretor`
- **O que foi feito:**
  - Backend `app/features/executive_dashboard/`: `GET /api/v1/dashboard/indicators` (11 indicadores em 5 grupos, comparados entre a janela base e a atual, com variação, avaliação e aviso do temporal de jul/2025) e `GET /api/v1/dashboard/losses` (retrato atual da Fila de Perdas). Só o diretor acessa (`RequireDiretoria`).
  - Receita, energia, tarifa e UCs saem da mesma consulta da tela de Receita (Fatia 04), e o retrato de perdas usa o mesmo ranking da Fila (Fatia 05).
  - Frontend `features/executive_dashboard/`: Painel com seletor dos dois períodos (na URL, com volta ao padrão do case), cards por área no padrão da Receita 1 do `design.md`, selo melhorou/piorou/estável, explicação do cálculo ao passar o mouse e card de perdas sem comparação.
  - Menu e rotas: Painel só para o diretor; menu reordenado para o gerente de perdas abrir na Gestão de Perdas e o de operação na Qualidade da Rede. O `DashboardPage` provisório foi removido.
  - ADR-010 a ADR-015 em `docs/DECISOES.md`; checklist e pendências atualizados em `painel_diretor.md`.
- **Pendências:** conferir com o banco real (etapa 4), revisão do Adrian e do João no PR, aviso ao Miguel sobre o #35 e o quadro de IA (etapa 7).
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (573) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (213) e build (`tsc -b` + Vite) aprovados.

### [2026-10-28] - Painel do Diretor validado com o banco real
- **Autor:** Bernardo H
- **Branch:** `feat/painel-diretor`
- **O que foi feito:**
  - Números conferidos com o `v_energy.db` real e com `/revenue/kpis` (seção 13 do `painel_diretor.md`).
  - Desempenho (ADR-016): consultas sem filtro de competência no `WHERE` (inclusive `period_totals_query` da Fatia 04), cache em memória por 30 minutos e pré-cálculo dos períodos padrão na subida da API. O Painel passou de cerca de 11 s para 0,01 s nos períodos padrão.
  - Indicadores em % avaliados em pontos percentuais (`variacao_pp`, ADR-011 revisada): a inadimplência de 3,55% para 3,60% deixou de aparecer como "piorou".
  - Card de perdas avisa quando a competência foi fixada para a demonstração e quando a fila está vazia (`competencia_fixada`).
  - Variação das taxas escrita por extenso ("+0,05 ponto percentual") e valor vencido em reais no card de inadimplência (`detalhe`).
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (578) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (215) e build aprovados.

### [2026-10-29] - Painel conferido com o banco regerado e DEC alinhado à Continuidade
- **Autor:** Bernardo H
- **Branch:** `fix/painel-dec-ucs-atendidas`
- **O que foi feito:**
  - Banco local trocado pelo `v_energy.db` regerado depois do PR #44. Os 11 indicadores do Painel conferem com SQL independente em dois pares de períodos (22 de 22).
  - DEC e FEC do Painel passaram a dividir pelas UCs atendidas de `fato_qualidade_alimentador`, com a mesma consulta da Continuidade (`feeder_ucs_query`). Antes, o primeiro ano saía 1,48 no Painel e 1,47 na Qualidade da Rede (ADR-012 revisada).
  - Varredura do portal com o banco novo: Receita (cascata e ranking fecham nos 3 níveis; Recife com 106 bairros), Visão 360 (faturas em aberto, inclusive `ABERTA`, e interrupções batem com o banco; pontualidade sem atrasos absurdos), Fila de Perdas (773 UCs, ordenada, com motivo e energia) e acesso dos 5 perfis.
  - Pendências de outras fatias registradas em `docs/CORRECOES.md`: o banco regerado ainda não tem a correção de bairros do #45, e a Receita leva cerca de 4,5 s por consulta.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (655) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (391) e build aprovados.

### [2026-10-29] - Testes repetidos removidos do backend e do frontend
- **Autor:** Bernardo H
- **Branch:** `chore/enxuga-testes`
- **O que foi feito:**
  - Removidos só os casos que já estavam cobertos em outro lugar; nenhuma regra de negócio ficou sem teste. Backend de 776 para 697 casos e frontend de 556 para 539.
  - Permissões: as rotas de Perdas e da Visão 360 exigem o perfil uma vez para o grupo inteiro de endpoints, e `test_rbac.py` já confere a matriz completa. Ficou um teste de 403 por grupo de rotas, e a matriz da Qualidade da Rede passou a cobrir só diretor, gerente de operação e atendente.
  - Validações repetidas entre rota e serviço (motivo de cancelamento, inspetor fora da lista, UC sem cadastro, janelas sobrepostas ou invertidas, 404 sem faturamento) ficaram em uma camada só.
  - Frontend: saíram os testes da tela que repetiam o teste do componente ou da função (diagnóstico da Visão 360, avisos da fila, cancelamento de ordem, menu por perfil já coberto por `RbacMatrix`).
  - Também saíram os testes que conferiam a própria semente de testes e o contrato de imports da Qualidade da Rede que o import-linter já cobre.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (697) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (539) e build aprovados.
