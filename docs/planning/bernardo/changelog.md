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

### [2026-10-30] - Retrato de perdas com as UCs prioritárias, Visão 360 no padrão do design e README da Fatia 03
- **Autor:** Bernardo H
- **Branch:** `feat/fatia-03-pendencias-finais`
- **O que foi feito:**
  - Painel: o card de perdas passou a contar só as UCs prioritárias (chance de acerto de 30% ou mais, o corte da Fila) e a mostrar o retorno esperado, com o total da fila como informação secundária (ADR-028). No banco real: 7 de 165 em 2026-06; 587 de 39.243 e R$ 1,53 mi/ano em 2025-09, contra R$ 31,6 mi/ano da soma da fila inteira.
  - Visão 360: situação da fatura com o `StatusBadge kind="fatura"` (paga verde, em aberto âmbar, vencida vermelha) e "Tentar novamente" nos 4 erros das abas.
  - README: seção da Fatia 03 com o que cada tela responde, como demonstrar, suposições com links para as ADRs e limites.
  - `CHECKLIST.md`, `CORRECOES.md` e checklists da pasta atualizados; a consulta que reproduz as 887 UCs com queda de 40% foi registrada para o diagnóstico.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest e build aprovados.

### [2026-10-30] - Banco com bairros corrigidos, avaliação do CHECKLIST.md e chat sem IA que não inventa
- **Autor:** Bernardo H
- **Branch:** `docs/avaliacao-checklist-banco-corrigido` (a partir da `main` em `c3cc124`)
- **O que foi feito:**
  - Banco de 30/10 conferido: 0 bairros com caractere quebrado, 297 pares município + bairro (Recife com 86 bairros), integridade `ok` e os demais números idênticos ao banco de 29/10. Painel com 22 de 22 valores iguais a SQL independente; varredura do portal sem achados.
  - Achado: um `v_energy.db-wal` do banco antigo, que sobrou na pasta `backend/`, fazia o banco novo parecer corrompido. Registrado no README (download do banco) e no `CORRECOES.md`.
  - `CHECKLIST.md` avaliado item por item, com a prova anotada em cada `[x]` (64 marcados, 40 abertos).
  - `CORRECOES.md`: correção de bairros movida para "Já resolvido"; registrados a consulta das 887 UCs (894 no banco novo), os números do diagnóstico que mudam com os bairros unificados, o chat que inventa resposta sem chave de IA, as lacunas do README e duas decisões de dados em aberto.
  - Correção na fatia de IA (a pedido, com aviso ao Miguel): sem provedor de IA configurado, o chat inventava uma resposta (tabela fixa "Operacional, 25000" e texto de "conformidade" para qualquer pergunta, até para CPF). Agora a regra única `resolve_configured_provider` (`app/core/llm_factory/availability.py`) decide se há IA; sem provedor, o chat envia só o aviso "Assistente de IA indisponível" (evento `error`, código `AI_UNAVAILABLE`), a fábrica de modelos não cai mais em silêncio no modo simulado, e o modo simulado só liga com `AI_PROVIDER="mock"`, marcado como "Modo demonstração". README ganhou a seção "Inteligência Artificial" e o `.env.example` foi corrigido.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (720, com `test_ai_availability.py`, depois de trazer a `main` com os PRs #54 e #57) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação), Vitest (545) e build aprovados.
  - Ponta a ponta com o banco de 30/10 e sem `.env`: as perguntas do case e a de CPF recebem só o aviso de IA indisponível; `/ai/insights` responde 503.

### [2026-10-31] - Insight de IA na Visão 360, documentação da API e diagnóstico com o banco corrigido
- **Autor:** Bernardo H
- **Branch:** `feat/fatia-03-visao360-insight-e-diagnostico`
- **O que foi feito:**
  - Visão 360: `SmartInsightCard context="customer360"` abaixo do resumo rápido, com as métricas da própria UC (`buildCustomerInsightMetrics`): consumo e diagnóstico do mês, totais de 12 meses, faturas em aberto, interrupções, chamados, inspeções e painel solar. O card só aparece com o histórico e os eventos carregados, e some quando a IA está indisponível (503).
  - API da Visão 360 documentada no padrão `EndpointDoc` (`customer360/router_metadata.py`): resumo, descrição com as ADRs e respostas 401, 403, 404 e 500 nos 4 endpoints.
  - `DIAGNOSTICO_RECEITA.md` atualizado com o banco de bairros corrigidos: 835 de 871 irregularidades nos quatro bairros, queda de 2.735 MWh e até R$ 2,02 mi em jogo, ranking (Jardim Jordão −0,80 mi, Brasília Teimosa −0,34 mi, quatro bairros −1,41 mi), tabelas C5, C8 e C9 refeitas e a consulta C2d, que reproduz as UCs com queda de 40% ou mais (894; eram 887 no banco de 29/10). Acrescentada a resposta em uma frase para o slide principal.
  - Modo demonstração (`AI_PROVIDER="mock"`): o insight falhava com 503 em qualquer tela, porque o modelo simulado procurava uma frase que o pedido de insight não usa mais. Gatilho corrigido, com teste em `test_ai_availability.py`.
  - `CORRECOES.md`, `CHECKLIST.md` e checklist da Visão 360 atualizados.
- **Validação de Testes:**
  - Backend: Ruff, Pylint 10/10, import-linter (4 contratos) e pytest (725) aprovados.
  - Frontend: ESLint, Fallow (sem duplicação e sem função acima do limite), Vitest e build aprovados.

### [2026-10-31] - Login sem SSO falso, mapa geográfico da Continuidade e README completo
- **Autor:** Bernardo H
- **Branch:** `fix/login-readme-mapa-dec`
- **O que foi feito:**
  - Login: removido o botão "Entrar com SSO corporativo", que não era SSO; senhas das contas de demonstração guardadas só como hash Argon2, conferidas pelo `verify_password` (também para e-mail inexistente, com tempo de resposta igual).
  - Qualidade da Rede, Continuidade: o mapa de pontos sobrepunha os nomes; agora desenha o contorno real dos 14 municípios (malha municipal do IBGE), colorido pela faixa de DEC, com nome e DEC em duas colunas fora do mapa, ligados por uma linha.
  - Sidebar: título "V-Energy 360", sem subtítulo.
  - Continuidade: a tela escreve as datas ("07/2025 a 06/2026") em vez de "período A" e "período B". A API passou a devolver `periods` com a primeira e a última competência de cada período, calculadas da série, sem datas fixas no frontend.
  - README: introdução corrigida, link do diagnóstico, logins e telas de cada perfil, aviso sobre o `v_energy.db`, arquitetura do backend e seção de diferenciais.
  - `DECISOES.md`: ADR-009 unificada, ADRs em ordem, nome do menu na ADR-015 e o mapa na ADR-025.
  - `CHECKLIST.md`: marcados Bronze, cabeçalho repetido, filtros de cada tela e os itens do README.

### [2026-11-02] - Correções finais de documentação e nome do produto
- **Autor:** Bernardo H
- **Branch:** `docs/correcoes-finais`
- **O que foi feito:**
  - README: suposições das Fatias 01 e 02 (dados), 04 (Receita) e 07 (IA), com como demonstrar; a seção de suposições agora cobre todas as fatias.
  - `DATA_DICTIONARY.md`: tabela "que tabela responde a cada liderança", a tabela operacional `ordem_inspecao`, nomes dos notebooks da Fatia 01 e a concentração de irregularidades com o banco corrigido (835 de 871).
  - `DECISOES.md`: ADR-029, potência solar fora da faixa mantida como veio do bruto.
  - `CHECKLIST.md` e `CORRECOES.md`: itens já entregues marcados.
  - Removido o `docs/ROTEIRO_SCREENCAST.md`, que não será mais usado.
  - Sidebar volta a dizer "V-Energy Grid 360", o nome usado no login, no título da aba e no README.
  - Comentários desatualizados corrigidos (número de bairros na Receita e linha guia do mapa).

### [2026-11-02] - Hierarquia visual da Visão 360 (issue #66)
- **Autor:** Bernardo H
- **Branch:** `docs/correcoes-finais`
- **O que foi feito:**
  - Bloco "Precisa de atenção" no topo (`AttentionPanel` e `buildAttentionItems`): fatura vencida em vermelho; fatura em aberto no prazo, consumo em alta, leitura estimada, falta de luz acima do normal na região e chamado aberto em laranja. Os urgentes vêm primeiro; sem pendências, a tela diz "Nada pendente".
  - As quatro abas viraram três blocos sempre visíveis (`Customer360Sections`): "Cliente e consumo" (cadastro, consumo de 12 meses e inspeções de perdas), "Histórico financeiro" (diagnóstico da conta alta e faturas) e "Problemas técnicos" (interrupções da UC e da região e chamados).
  - Os três cards de resumo de mesmo peso (`CustomerQuickFacts`) saíram; o que eles mostravam está no bloco de atenção.
  - Testes: `attentionItems.test.ts` e os da página (ordem dos alertas, blocos sem abas e "Tentar novamente" dentro do bloco).
- **Validação de Testes:**
  - Frontend: ESLint, Fallow (sem duplicação e sem função acima do limite), Vitest (733) e build aprovados.

### [2026-11-03] - Inspeções da Visão 360 conferidas com o banco
- **Autor:** Bernardo H
- **Branch:** `fix/fatia-03-visao360-inspecoes`
- **O que foi feito:**
  - Conferido no `v_energy.db`: as 1.389 inspeções de `fato_inspecoes_perdas` (uma por UC, ago a dez/2025) chegam à tela com data, inspetor, resultado, tipo e kWh iguais ao banco.
  - "LIGACAO CLANDESTINA" (164 inspeções) aparecia como "Ligacao clandestina"; agora "Ligação clandestina".
  - Inspeção regular mostra "—" em energia recuperada, em vez de "0 kWh".
- **Validação de Testes:**
  - Frontend: ESLint, Fallow, Vitest (49 da Visão 360) e build aprovados.

### [2026-11-03] - Receita rápida e pendências de outras fatias
- **Autor:** Bernardo H
- **Branch:** `fix/receita-desempenho-e-pendencias`
- **O que foi feito:**
  - Receita: ADR-030 (agregação por UC e cache de 30 minutos), filtros no `FilterPopover` e "Tentar novamente" nos quatro erros. Cache do Painel movido para `app/shared/result_cache.py`, com cálculo único para chamadas simultâneas.
  - IA: métricas do insight calculadas no servidor (`chat/insight_metrics.py`) e realce de SQL só com a gramática de SQL.
  - Documentos: ADR-029 com os números exatos e o alcance do agente, ADR-030, README (limite da Receita), `CHECKLIST.md` (desempenho) e `CORRECOES.md` (`mmap_size`, insight, Receita, filtros e "Tentar novamente").

### [2026-11-03] - Fila de Inspeção rápida e insight na Receita
- **Autor:** Bernardo H
- **Branch:** `perf/fila-inspecao-e-insight-receita`
- **O que foi feito:**
  - Fila de Inspeção (ADR-031): de 4,6 a 5,8 s para 0,74 s na competência 2025-09 e 0,17 s em tempo real, com a fila idêntica à anterior.
  - Insight de IA na Receita (issue #11), com as métricas calculadas no servidor e acesso só do diretor.
  - `CHECKLIST.md`: desempenho marcado e seção da apresentação removida.

### [2026-11-04] - Nova identidade visual do portal
- **Autor:** Bernardo H
- **Branch:** `style/redesign-identidade-visual`
- **O que foi feito:**
  - Tokens novos no `index.css`: base neutra quente, um azul de marca (`#1B4D89`), âmbar só no símbolo, tema claro por padrão e escuro em grafite. Todos os pares passam no AA nos dois temas.
  - IBM Plex Sans e Plex Mono no lugar de Inter e JetBrains Mono; números com algarismos tabulares e mono só para código e identificadores.
  - Superfícies planas: saíram vidro, `backdrop-blur`, gradientes, sombras grandes, cartões que sobem no hover e ícones em caixinha colorida.
  - Componentes base (botão, cartão, selo, campo, abas, tabela, aviso, tooltip) mais compactos; cabeçalhos de tabela sem caixa alta; variante `inline` para termos com tooltip.
  - Shell: menu lateral agrupado (Diretoria, Operação, Atendimento), trilha da tela no cabeçalho, `BrandMark` e `PageHeader` compartilhados; botão "Assistente" com rótulo.
  - Textos: subtítulos das telas em uma frase, "Resumo da IA" no lugar de "Smart Insights IA EXECUTIVE", chamados sem caixa alta, rótulos como "Restaurar períodos padrão" e "Selecionar as 10 primeiras". Nenhum dado, coluna, filtro ou ação foi removido.
  - Correção: `CardHeader`/`CardContent` tinham ~40 px de vão a partir de 640 px porque `sm:p-5` vencia `pb-2`/`pt-0`.
  - `design.md` atualizado para a nova identidade (versão 2.0.0).
  - `AGENTS.md` e README alinhados ao novo `design.md` (raio de 6px, superfícies planas e o `variant="glass"` como card padrão); removido o `components/ui/separator.tsx`, que ficou sem uso.
- **Validação de Testes:**
  - Frontend: ESLint, Fallow, `tsc`, build e Vitest (762 testes) aprovados. Backend sem alteração.
  - Telas conferidas com o backend real: login, Painel, Receita, Fila de Inspeção, Qualidade da Rede (Visão atual e Continuidade), Visão 360 (UC100094, claro e escuro) e chat.

### [2026-11-05] - Reestruturação do layout do frontend (sem mudança de lógica)
- **Autor:** Bernardo H
- **Branch:** `style/redesign-estrutura-frontend`
- **O que foi feito:**
  - Novo bloco compartilhado `components/data/StatTile.tsx` (rótulo, valor, variação e nota curta; a fórmula vai para o ícone de ajuda) usado no Painel, na Receita, na Qualidade e na Visão 360.
  - Painel do Diretor: a tabela de indicadores virou grade de blocos agrupados por área; o retrato da Fila de Perdas usa os mesmos blocos; o seletor de períodos ficou numa linha só, sem card.
  - Inteligência Comercial: filtros numa linha, sem card; decomposição e ranking empilhados (sem abas); valores compactos na tabela, com o valor completo no `title`.
  - Qualidade da Rede: resumo numa faixa (DEC, FEC e barra empilhada da situação dos circuitos); barra de DEC contra o limite em cada linha; "Limite aproximado" virou `≈` com tooltip; filtro ao lado do título da tabela.
  - Fila de Inspeção: sem card em volta da fila; tarifa na linha dos filtros; aviso em uma linha; contagem "Mostrando" no rodapé, junto da paginação; bairro e queda sem quebra de linha.
  - Visão 360: cadastro no topo; consumo, inspeções e faturas na coluna principal; "Precisa de atenção" e insight de IA na lateral fixa; totais de 12 meses como blocos; títulos de bloco sem descrição.
  - `AppLayout`: folga no fim da página para o botão do Assistente não cobrir a paginação.
- **Validação de Testes:**
  - `bun run lint`, `bun run lint:fallow`, `bun run test` (762 testes) e `bun run build` aprovados.

### [2026-11-05] - Resumo da IA em destaque e refinamento dos componentes base
- **Autor:** Bernardo H
- **Branch:** `style/redesign-estrutura-frontend`
- **O que foi feito:**
  - Backend (`/ai/insights`, compatível com o contrato anterior): a resposta ganhou `manchete`, `tom`, `destaques` e `acao_recomendada`. Nos destaques, a IA só escolhe a métrica e o rótulo; o valor e a unidade são copiados das métricas calculadas pelo servidor (`insight_highlights.py`). Manchete e ação passam pela mesma verificação de fidelidade numérica. Prompt com limites de tamanho por campo; o modo simulado devolve o formato novo com métricas reais da tela.
  - Frontend: `SmartInsightCard` reescrito como bloco em destaque no topo do Painel, da Receita e da Visão 360 (manchete grande, tom, próximo passo e até três números ao lado); os pontos de apoio continuam em "Ver detalhes".
  - Componentes base: cabeçalho de tabela sem fundo, em caixa alta, linhas mais altas e números tabulares; abas principais na largura do conteúdo; `PageHeader` sem linha divisória.
  - Visão 360: faixas de texto de faturas em aberto e pontualidade viraram dois blocos de indicador.
  - Receita: cabeçalhos ordenáveis compactos e nome de bairro truncado; a tabela cabe sem rolagem horizontal.
- **Validação de Testes:**
  - Frontend: `lint`, `lint:fallow`, `test` e `build` aprovados. Backend: `ruff`, `pylint` (10/10), `lint-imports` e `pytest` (800 testes) aprovados.

### [2026-11-06] - Mapas da RMR, ficha da Visão 360 e atalhos do Painel (só frontend)
- **Autor:** Bernardo H
- **Branch:** `style/refino-interface-telas`
- **O que foi feito:**
  - `lib/geo/rmrMunicipalityShapes.ts`: contornos dos 14 municípios da RMR, gerados da malha pública do IBGE e projetados para SVG (sem biblioteca de mapa). `components/data/RegionMap.tsx`: mapa acessível (cada município é um botão com nome e valor).
  - Inteligência Comercial: card "Onde a receita mudou" com o mapa e barras divergentes por município, pintados pela variação, efeito-preço ou efeito-volume; clicar num município aplica o filtro de município que a tela já tinha. Usa o mesmo endpoint de ranking (`nivel=municipio`), sem mudança no backend.
  - Fila de Inspeção: bloco "Onde estão as suspeitas" com o mapa e os municípios com mais UCs suspeitas (contagens do `/losses/queue-filters`); o clique aplica o filtro de município da fila.
  - Inteligência Comercial: card "Receita por bairro" logo abaixo dos indicadores gerais, com receita atual, variação contra a base, volume e tarifa média (receita ÷ volume) de todos os bairros ou municípios do recorte numa tabela só, busca pelo nome (sem acento) e ordenação por coluna; o nome do bairro continua abrindo os 24 meses. Usa as linhas do ranking que a tela já consulta, sem mudança no backend.
  - Filtro de período do Painel e da Inteligência Comercial (`components/data/PeriodPicker.tsx`, mesmo componente nas duas telas): em vez de quatro datas, duas escolhas — "Período" (últimos 12, 6 ou 3 meses, ou um ano completo) e "Comparar com" (primeiro ano da base do case, mesmo período do ano anterior ou período imediatamente anterior); a base é calculada (`lib/periods/periodPresets.ts`). Uma frase confirma os meses comparados. "Personalizar datas" abre um calendário de meses próprio (`MonthPicker`), no lugar do campo de data nativo: ano com setas, meses em grade, trecho escolhido destacado e meses sem dados desabilitados. A abertura continua na pergunta do case (jul/2022 a jun/2023 contra jul/2025 a jun/2026), e a API recebe as mesmas quatro competências.
  - O seletor só oferece comparações cuja base cabe nos meses com dados e termina antes do período analisado (`validComparisons`), e esconde atalhos sem comparação possível ("Ano 2023" compararia com meses sem faturamento ou se sobreporia à base do case).
  - Painel: cada área com tela própria ganhou o atalho "Ver na …" (Comercial, Rede, Perdas).
  - `StatTile`: prefixo e sufixo do valor (R$, mi, %, kWh) menores e em cinza, com o número em destaque.
  - Visão 360 reorganizada como ficha: faixa do topo com a identificação da UC (número, titular, localização, classe, circuito e medidor) e o "Precisa de atenção" ao lado; resumo da IA; navegação fixa com atalhos numerados para os blocos; blocos em painéis numerados ("1 Consumo", "2 Contas", "3 Falta de luz e chamados", "4 Inspeções de perdas"). Em "Contas", a resposta a "Conta alta?" fica ao lado dos totais em aberto e da pontualidade. Listas longas (meses da região e chamados) com altura limitada e rolagem própria.
  - `ShareBar` movido para `components/data` (usado pela Qualidade e pela Fila); cabeçalhos com ajuda da Fila em caixa alta, como as demais tabelas.
  - `design.md` 2.1.0: regra de caixa alta restrita a rótulo de seção e cabeçalho de tabela, tipografia do valor com unidade, largura das telas e menu lateral, tabela dos componentes de `src/components/data/` (`StatTile`, `ShareBar`, `RegionMap`, `PeriodPicker`, `MonthPicker`), receitas novas (indicador, página, rótulo com atalho, filtro de período, mapa com lista ligada, ficha em blocos, resumo da IA) e itens novos no checklist; as receitas antigas, que usavam `max-w-7xl`, `backdrop-blur` e `font-bold`, foram substituídas. A navegação fixa da UC 360 deixou de usar `backdrop-blur`.
- **Validação de Testes:**
  - `bun run lint`, `bun run lint:fallow`, `bun run test` e `bun run build` aprovados. Backend sem alteração.

### [2026-11-06] - Receita, volume e tarifa mês a mês por bairro sem abrir bairro por bairro
- **Autor:** Bernardo H
- **Branch:** `style/refino-interface-telas`
- **O que foi feito:**
  - Tabela "Receita por bairro" (Inteligência Comercial): cada bairro mostra a receita média por mês, os últimos 12 meses de receita em barras (valor de cada mês ao passar o mouse) e o botão "Mês a mês", que abre na própria linha receita, volume e tarifa média de cada um dos 12 meses (dois blocos de seis meses). A gaveta de 24 meses continua no nome do bairro.
  - As séries são buscadas só para os bairros da página visível (`useNeighborhoodHistories`, uma consulta em cache por bairro, a mesma da gaveta), sem mudança no backend.
- **Validação de Testes:**
  - `bun run lint`, `bun run lint:fallow`, `bun run test` (775 testes) e `bun run build` aprovados.

### [2026-11-06] - Mapa da Continuidade no mesmo formato da Inteligência Comercial
- **Autor:** Bernardo H
- **Branch:** `style/refino-interface-telas`
- **O que foi feito:**
  - Qualidade da Rede › Continuidade, bloco "Onde estão as piores interrupções": o mapa passou a usar o `RegionMap` compartilhado (contornos do IBGE), pintado pelas quatro faixas de DEC numa escala de azul que escurece conforme o DEC piora (tokens novos `--map-1…4` no `index.css`, temas claro e escuro, todos com 3:1 sobre fundo e card; sem verde e vermelho, para não confundir com ganho e perda da Receita), com a legenda abaixo e a lista de municípios ao lado; passar o mouse destaca o município nos dois, clicar fixa o destaque.
  - Removidos o desenho antigo do mapa (`municipalityShapes.ts`, `mapLabelLayout.ts` e os testes deles), que ficaram sem uso. O campo `fill` das faixas continua, porque o teste de contraste usa.
- **Validação de Testes:**
  - `bun run lint`, `bun run lint:fallow`, `bun run test` e `bun run build` aprovados.


### [2026-11-08] - Painel de detalhe da UC na Fila de Inspeção (UI)
- **Autor:** Bernardo H
- **Branch:** `style/fatia-05-detalhe-da-uc-na-fila`
- **O que foi feito:**
  - Redesenho do painel lateral que abre ao clicar numa UC da fila (código da Fatia 05; só apresentação, sem mudança de API nem de regra).
  - Cabeçalho com a UC, o selo da situação e o local com ícone; bairro com iniciais maiúsculas; painel mais largo (`sm:max-w-xl`) com cabeçalho e rodapé fixos e o corpo rolando entre eles.
  - "Por que está na fila": selos dos motivos, a queda em destaque e barras de consumo "Antes (base)" e "Últimos 3 meses"; a frase completa do backend fica em "Como a queda foi medida" (recolhida).
  - "Score de prioridade": número grande, barra na cor da faixa (a mesma da tabela, agora em `utils/scoreTone.ts`) e a conta em três blocos (recuperável por mês × janela = a recuperar).
  - "Consumo mensal": seletor 12 meses/Tudo ao lado do título, médias da base e dos 3 últimos meses tracejadas sobre as faixas e legenda com amostras no lugar da frase.
  - "Inspeções anteriores": ícone e cor por resultado, data e inspetor em selo.
- **Validação de Testes:**
  - Frontend: `eslint`, Fallow, `tsc -b` e build sem erros; 785 testes aprovados (testes do painel e do gráfico atualizados).

### [2026-11-09] - Revisão do PR #104: conflito com a main, eixo da tarifa e paleta do assistente
- **Autor:** Bernardo H
- **Branch:** `style/fatia-06-melhorias-interface` (PR #104, João Henrique)
- **O que foi feito:**
  - Merge da `main` na branch do PR: em `LossesSnapshotCard.tsx` ficaram os textos de ajuda dos blocos de "Perdas" vindos da `main` e o texto do PR em "Retorno esperado por ano"; em `AreaRevenueTable.test.tsx` ficou a versão do PR.
  - Gráfico de comparação de bairros: na tarifa, o eixo Y vai do menor ao maior valor (arredondados de R$ 0,05 em R$ 0,05), com aviso de que não começa em zero; receita e volume continuam a partir do zero (`axisDomainOf` e `isZoomedAxis` em `comparisonSeries.ts`).
  - Assistente de IA no amarelo e preto da IA: ícone do cabeçalho, avatar do agente e botões de enviar e de tentar de novo em `brand`; destaques internos (passo em andamento, comandos, grifo, citação, link e foco do campo) trocaram o azul por fundo e borda âmbar com texto em preto (`design.md` atualizado).
- **Validação de Testes:**
  - Frontend: `eslint`, Fallow, `tsc -b` e build sem erros; 875 testes aprovados.
  - Backend: Ruff, Pylint 10/10, import-linter e 941 testes aprovados.

### [2026-11-09] - Painel do Diretor mais visual (UI)
- **Autor:** Bernardo H
- **Branch:** `style/painel-diretor-visual`
- **O que foi feito:**
  - Só apresentação: mesma API, mesmos indicadores e mesmas avaliações do backend; nada é recalculado no frontend.
  - Faixa de visão geral no topo, logo abaixo do resumo da IA, com dois cards lado a lado:
    - **Placar do período:** contagem grande de melhoraram, estáveis, pioraram e informativos (ícone e texto junto da cor), barra segmentada com a mesma conta e a lista "Por área", com uma pastilha por indicador na cor da avaliação e o nome da área levando ao bloco dela.
    - **Maiores variações:** barras divergentes a partir do zero, da maior para a menor variação, coloridas pela avaliação (subir pode ser bom ou ruim). Tooltip com antes, agora e p.p. nas taxas. Os indicadores sem base (painel solar) aparecem listados, e não somem.
  - "Indicadores por área": a grade passou a encaixar as áreas em linhas de até 4 indicadores que ocupam a largura toda (`packGroupSpans`), sem buracos. Em cada bloco, o texto "Antes: X" virou barras "Antes" e "Agora" na mesma escala, com o valor ao lado.
  - Perdas: barras de proporção (prioritárias sobre a fila, retorno esperado sobre o potencial e taxa de acerto) com o `ShareBar` compartilhado.
  - Textos enxutos: subtítulo fixo da página (a frase dos períodos já aparece no seletor), "Placar do período" sem frase de veredito, "Maiores variações" sem subtítulo, eixo "Queda" e "Alta", atalhos só com o nome da tela, selo "Retrato atual" e notas e dicas de Perdas mais curtas. `describeWindow` saiu por ficar sem uso.
  - Correção de exibição: o formato compacto em reais arredondava R$ 169,7 mi para "R$ 170 mi", diferente do resumo da IA e da Receita; agora mostra uma casa decimal.
  - Números conferidos contra a API com o banco real: receita +8,0%, energia −5,1%, tarifa +13,8%, inadimplência 5,52% → 5,42% (−0,09 p.p.), DEC 1,47 → 3,45 e FEC 0,89 → 1,31, iguais à seção 14 do plano.
  - Merge da `main` (PR #104 do João e ajustes do Miguel em Perdas): o `IndicatorTile.tsx` do João ficou, com a variação em cor neutra, e recebeu as barras "Antes" e "Agora"; o tooltip "não é comparado por decisão" foi para o selo "Retrato atual", que agora fica ao lado do título "Perdas"; a lista de avisos com ícone abaixo dos cards de Perdas ficou.
- **Validação de Testes:**
  - Frontend: `eslint`, Fallow, `tsc -b` e build sem erros; 862 testes aprovados (testes novos do placar, da ordem do gráfico e de `dashboardSummary`).

### [2026-11-10] - Paleta amarela em todas as telas (design system)
- **Autor:** Bernardo H
- **Branch:** `style/design-system-paleta-amarela`
- **O que foi feito:**
  - Troca feita nos tokens do `index.css`, e não tela por tela: todas as telas mudam juntas, inclusive o chat, sem reescrever os arquivos de outras fatias.
  - Tema claro (branco com amarelo): botão principal e selo padrão em `bg-brand` (amarelo `#F2B01E` com texto preto); `--primary` passa a ser a tinta `#18191C` (links e ícones), porque o amarelo sobre branco tem 1,9:1 e não serve para texto; foco em dourado escuro `#8F6600`; `--accent` creme `#FCF4DE` no lugar do azul-claro.
  - Tema escuro (preto com amarelo): `--primary` e `--ring` no amarelo `#F2B01E` com texto preto; `--accent` grafite quente.
  - "Atenção" no escuro passou de `#E6B045` (o mesmo tom do amarelo, ΔE 2,6) para laranja `#F0884A`, e "piorou" de `#F2897E` para `#F26B7A`, para os três não se confundirem.
  - Séries dos gráficos validadas com o script de paleta da skill de dataviz: dourado, verde-azulado, roxo, cinza e rosa (o laranja da série 2 saiu por ficar perto do dourado). Mapa de DEC em escala âmbar.
  - Ícone do Resumo da IA e números dos blocos da UC 360 em amarelo; indicador amarelo no item ativo do menu.
  - `design.md` atualizado para a versão 2.2.0. Comentários que falavam em "botão azul" corrigidos.
- **Validação de Testes:**
  - Frontend: `eslint`, Fallow, `tsc -b` e build sem erros; 877 testes aprovados, incluindo os 118 de contraste nos dois temas (testes do botão e do "Registrar achado" atualizados para `bg-brand`).

### [2026-11-10] - Painel do alimentador na Qualidade da Rede (UI)
- **Autor:** Bernardo H
- **Branch:** `style/design-system-paleta-amarela`
- **O que foi feito:**
  - Redesenho do painel lateral que abre ao clicar no código de um alimentador (código da Fatia 06; só apresentação, mesmas rotas e dados da API), no mesmo padrão do painel da UC na Fila de Inspeção.
  - Cabeçalho com o selo da situação (acima do limite, alerta ou conforme) e "Conjunto · UCs atendidas"; corpo com rolagem própria.
  - "No ano": DEC e FEC acumulados em barras com a marca do limite anual e a distância até ele ("2,81 h acima do limite"); a cor segue a situação da API.
  - "Horas sem energia por ano": o gráfico em dente de serra (acumulado que zera em janeiro, 48 meses) virou uma barra por ano contra o limite, com os anos incompletos marcados.
  - "Horas sem energia por mês": colunas dos últimos 12 meses com o pior mês em destaque (jul/2025, o temporal).
  - "Clientes mais afetados": a tabela de 5 colunas virou lista em que a linha inteira abre a UC 360; nomes legíveis e barra das horas. A lista não some mais quando o histórico falha.
  - `FeederTimeSeriesChart.tsx` e `FeederCustomersTable.tsx` removidos (sem uso); cálculos de leitura em `utils/feederSummary.ts`, com testes.
- **Validação de Testes:**
  - Frontend: `eslint`, Fallow, `tsc -b` e build sem erros; testes da Qualidade da Rede atualizados.

### [2026-11-10] - Ordenação da receita por bairro e paginação do "Fora da fila" (UI)
- **Autor:** Bernardo H
- **Branch:** `main`
- **O que foi feito:**
  - Inteligência Comercial › Receita por bairro (Fatia 04): os cabeçalhos "Receita atual", "Variação", "Volume atual" e "Tarifa média" só ordenavam do maior para o menor, e clicar de novo não fazia nada. Agora a coluna nova começa do maior para o menor, e o segundo clique inverte; a seta e o `aria-sort` acompanham a direção, e áreas sem valor ficam no fim nas duas direções (`nextAreaSort` e `searchAndSort` em `utils/areaRevenue.ts`).
  - Fila de Inspeção › Fora da fila (Fatia 05): o "Carregar mais" virou paginação de 25 em 25 ("Página X de Y" e "Mostrando 26–50 de N UCs"), como na fila priorizada; ao pular para uma página além do que já veio, os lotes seguintes são buscados no servidor; trocar o motivo volta para a página 1.
  - Conferido na tela com o banco real: o segundo clique em "Variação" leva Jardim Jordão e as outras quedas ao topo; "Fora da fila" com 73 páginas (1.814 UCs).
- **Validação de Testes:**
  - Frontend: `eslint`, Fallow, `tsc -b` e build sem erros; 883 testes aprovados (testes novos da direção da ordenação e da paginação com busca do lote seguinte).
