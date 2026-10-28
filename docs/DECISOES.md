# Registro de Decisões de Arquitetura (ADRs)

Documento mestre de decisões arquiteturais e técnicas de todas as fatias do **V-Energy Grid 360**.

---

## ADR-001 — Escala da nota de satisfação (CSAT) dos atendimentos mantida em 1–5

- **Data:** 2026-10-22 · **Fatia:** 02 (Ryei Estevan) · **Status:** Aceita
- **Contexto:** O planejamento da Fatia 02 previa `nota_csat` como INT de 0 a 10, mas o campo `nota_satisfacao` de `atendimentos.json` é decimal em escala 1–5 (mín. 1,3; máx. 5,0; 38 valores distintos; 9.566 de 318.871 chamados sem nota).
- **Decisão:** Manter a escala original 1–5 com uma casa decimal (`DECIMAL(3,1)`) em Silver e Gold. Chamados sem nota permanecem `NULL` (não são convertidos em 0).
- **Impacto:** `fato_atendimentos.nota_csat` passa a ser REAL 1,0–5,0 no SQLite, e não INT 0–10. Portal (Bernardo/Célio) e agente de IA (Miguel) devem exibir e interpretar a nota na escala 1–5. Médias de CSAT ignoram nulos.
- **Alternativa descartada:** Reescalar para 0–10 (`nota × 2`) — criaria um valor que não existe na fonte e dificultaria a auditoria contra o sistema de Atendimento.
- **Conformidade:** Teste de qualidade na Silver: `nota_csat IS NULL OR nota_csat BETWEEN 1.0 AND 5.0`.

## ADR-002 — Base de UCs por alimentador (C_total do DEC/FEC) lida provisoriamente de `unidades_consumidoras.csv`

- **Data:** 2026-10-22 · **Fatia:** 02 (Ryei Estevan) · **Status:** Concluída — substituída pela Silver da Fatia 01 em 2026-10-22
- **Contexto:** O DEC e o FEC dividem pelo total de UCs atendidas pelo alimentador (`C_total`). Esse cadastro (coluna `alimentador` de `unidades_consumidoras.csv`) pertence à Fatia 01 (Renan), cujas tabelas Bronze/Silver ainda não foram compartilhadas.
- **Decisão:** Até a entrega da Silver de cadastro da Fatia 01, a Fatia 02 calcula `C_total` lendo diretamente `unidades_consumidoras.csv` do landing, contando UCs distintas por `alimentador`. Quando a Silver de Renan estiver disponível, a leitura passa a ser dela, sem mudar a fórmula.
- **Impacto:** Números de DEC/FEC podem variar levemente após a troca, caso a Silver da Fatia 01 remova duplicadas ou UCs inválidas. A troca deve ser registrada no changelog da Fatia 02.
- **Conformidade:** Teste de qualidade na Gold: todo alimentador presente em `ocorrencias_rede` deve ter `C_total > 0`; alimentadores sem cadastro são contados e reportados.
- **Atualização (2026-10-22):** a Silver da Fatia 01 (`visagio_atividade_v_energy_360.silver.silver_unidades_consumidoras`) foi validada (45.000 UCs, mesmos alimentadores da base provisória) e passou a ser a fonte de `silver_uc_alimentador`, antes do primeiro cálculo de DEC/FEC na Gold.

## ADR-003 — Limites regulatórios de DEC/FEC: fonte ANEEL, mapeamento alimentador → conjunto e apuração acumulada no ano

- **Data:** 2026-10-22 · **Fatia:** 02 (Ryei Estevan) · **Status:** Revisada em 2026-10-26 — limites passam a ser apenas referência (ver atualização no fim)
- **Contexto:** Os arquivos do case não trazem limites de DEC/FEC. A ANEEL (PRODIST Módulo 8) fixa limites **anuais** por **conjunto elétrico** (grupo de UCs, em geral um município ou um bairro), não por alimentador. Os alimentadores do case são fictícios, mas o código do meio indica o município (`ALM-REC-046` = Recife) e o cadastro de UCs confirma 14 municípios da Região Metropolitana do Recife, área da Neoenergia Pernambuco.
- **Decisão:**
  1. **Fonte:** arquivo oficial `indicadores-continuidade-coletivos-limite.csv` do [Portal de Dados Abertos da ANEEL](https://dadosabertos.aneel.gov.br/dataset/indicadores-coletivos-de-continuidade-dec-e-fec) (gerado em 2026-10-05), ingerido na Bronze como `bronze_aneel_limites` e filtrado para o agente `Neoenergia PE` na Silver.
  2. **Mapeamento por município:** `CAB→CABO`, `CAM→CAMARAGIBE`, `IGA→IGARASSU`, `ILH→ITAMARACA`, `IPO→IPOJUCA`, `ITA→ITAPISSUMA`, `JAB→JABOATAO`, `MOR→MORENO`, `OLI→OLINDA`, `SAO→SAO LOURENCO DA MATA`.
  3. **Sem conjunto único** (`REC` Recife — dividido em ~20 conjuntos de bairro; `PAU` Paulista, `ABR` Abreu e Lima, `ARA` Araçoiaba — sem conjunto próprio): usa-se a **mediana anual** dos 10 conjuntos mapeados acima.
  4. **Apuração:** como o limite é anual e a Gold é mensal, cada competência recebe o DEC/FEC do mês e o **acumulado no ano**; `violou_meta = true` quando o acumulado no ano ultrapassa o limite anual do conjunto (DEC ou FEC).
- **Impacto:** `fato_qualidade_alimentador` ganha `conjunto_aneel`, `criterio_limite` (`CONJUNTO` ou `MEDIANA_RMR`), `dec_acumulado_ano_horas` e `fec_acumulado_ano_vezes`. Limites de Recife, Paulista, Abreu e Lima e Araçoiaba são aproximações e devem ser apresentados como tal no portal.
- **Alternativas descartadas:** limite fixo arbitrário (sem base regulatória); dividir o limite anual por 12 (a ANEEL não define limite mensal para indicadores coletivos neste arquivo).
- **Conformidade:** teste na Gold: todo alimentador tem limite DEC e FEC não nulo para cada ano apurado; `dec_apurado_horas >= 0` e `fec_apurado_vezes >= 0`.
- **Atualização (2026-10-26):** o glossário do case (`case-rocket-lab-2026-venergy.pdf`, pág. 3, verbete "DEC e FEC") diz que *"os valores absolutos são simplificados: servem para comparar alimentadores e períodos entre si, não para comparar com os limites regulatórios reais"*, e as user stories pedem *"acompanhar DEC e FEC por alimentador ao longo do tempo e identificar os piores"*, sem exigir limite. Decisão revisada:
  1. O sinal principal da qualidade da rede é a **comparação entre alimentadores e períodos** (ranking pelo DEC/FEC acumulado no ano).
  2. As colunas `dec_limite_aneel`, `fec_limite_aneel`, `violou_dec`, `violou_fec` e `violou_meta` são mantidas (o backend da Fatia 06 já as consome), mas passam a ser **limite de referência**: o portal não deve apresentá-las como violação regulatória real nem como risco de multa.
  - **Impacto:** nenhuma mudança de dados ou de contrato; mudam os textos de tela e a interpretação. Decisão a confirmar com o time na issue #20.

## ADR-004 — Catálogo único do Lakehouse no padrão da Fatia 01

- **Data:** 2026-10-23 · **Fatia:** 02 (Ryei Estevan) · **Status:** Aceita (decisão do time em reunião)
- **Contexto:** A Fatia 01 gravava em `visagio_atividade_v_energy_360` (schemas `bronze`/`silver`/`gold`) e a Fatia 02 em `workspace.v_energy`. O `job.yaml` precisa de um único padrão para encadear todas as fatias.
- **Decisão:** Todas as fatias usam o catálogo `visagio_atividade_v_energy_360`, um schema por camada (`bronze`, `silver`, `gold`), tabelas com o prefixo da camada (`bronze_*`, `silver_*`) ou `fato_*`/`dim_*` na Gold, e arquivos brutos no Volume `bronze.landing`.
- **Impacto:** Notebooks da Fatia 02 atualizados; o schema `workspace.v_energy` fica obsoleto.

## ADR-005 — Ocorrências de rede datadas antes da ligação da UC

- **Data:** 2026-10-26 · **Fatia:** 02 (Ryei Estevan) · **Status:** Aceita
- **Contexto:** 595 das 180.000 ocorrências (0,33%, em 94 alimentadores) têm início antes de `data_ligacao` da UC interrompida, de 3 dias a 3,5 anos antes (mediana de 381 dias). O case não orienta esse caso.
- **Decisão:** as ocorrências **continuam no DEC/FEC**: a interrupção aconteceu no alimentador, e o erro mais provável está na data de ligação do cadastro. A nova tabela `fato_ocorrencias_rede` traz `fl_anterior_ligacao = true` nessas linhas, para auditoria e para o portal poder filtrá-las.
- **Alternativa descartada:** excluir do cálculo, o que reduziria o DEC de 94 alimentadores com base numa data de cadastro de qualidade incerta.
- **Conformidade:** teste na Gold: `fato_ocorrencias_rede` tem as mesmas 180.000 linhas da Silver, e a contagem por alimentador e mês bate com `ucs_interrompidas` de `fato_qualidade_alimentador`.

## ADR-006 — Regra de Virada de Medidor (Rollover) vs. Fraude (Anomalia)

- **Data:** 2026-10-22 · **Fatia:** 01 (Renan) · **Status:** Aceita
- **Contexto:** Nos arquivos de leituras, há casos onde a `leitura_atual` é substancialmente menor que a `leitura_anterior`. Na vida real, isso pode ser um medidor que "virou" (chegou a 99999 e reiniciou em 0) ou uma irregularidade técnica (fraude, by-pass, religação invertida).
- **Decisão:** Assumir **rollover de medidor de 5 dígitos** estrito se: `leitura_anterior >= 90000` E `leitura_atual <= 10000`. O consumo faturável nesses casos é recalculado como `(100000 - leitura_anterior) + leitura_atual`. Se a leitura recuar *fora* desses limiares, marcamos a flag `anomalia_leitura = True`.
- **Impacto:** Protege a `fato_medicao` (e subsequentemente a `fato_faturamento` do Ryei) de faturar consumos negativos absurdos. Alimenta de forma limpa a Gestão de Perdas (Adrian) gerando a `fato_anomalia_leitura` de alta precisão. (Este dado justifica D5 das Decisões de Perda).
- **Conformidade:** Testes de PySpark automatizados: `assert df.filter("consumo_kwh < 0").count() == 0` passa 100%.

## ADR-007 — Identificação do Medidor Ativo na Dimensão de UC

- **Data:** 2026-10-24 · **Fatia:** 01 (Renan) · **Status:** Aceita
- **Contexto:** Uma mesma UC pode ter múltiplos registros na tabela `medidores.csv` referentes ao histórico de trocas de hardware. O Atendimento (Visão 360) precisa saber qual o medidor exato está lá *hoje*.
- **Decisão:** A subquery que cruza com a UC fará uma partição (Window) por `id_uc`, ordenada pela `data_instalacao_medidor` descendente, retendo apenas a linha onde `data_retirada IS NULL` ou `status = 'ATIVO'`.
- **Impacto:** Garante unicidade e relação 1:1 entre a UC e seu medidor fisicamente ativo. Evita explosão cartesiana de registros durante os JOINs.
- **Conformidade:** Teste de unicidade validando que `count(distinct id_uc) == count(id_uc)` na `dim_unidade_consumidora`.

## ADR-008 — Enriquecimento Ativo da Geração Distribuída (GD Solar)

- **Data:** 2026-10-22 · **Fatia:** 01 (Renan) · **Status:** Aceita
- **Contexto:** Para responder o dilema do Diretor Comercial (por que volume caiu 4% mesmo com base subindo?), precisamos rastrear quem gera própria energia via painéis solares.
- **Decisão:** Executar um `LEFT JOIN` determinístico da tabela de cadastro principal contra o arquivo `geracao_distribuida.csv` injetando uma booleana explícita (`possui_gd`) na camada Gold. 
- **Impacto:** É a métrica mais valiosa da modelagem. Permite ao módulo de Receita (Célio) filtrar o painel, comprovando matematicamente que o "consumo desaparecido" migrou para Geração Distribuída em bairros de alta classe. (Isso também valida D3 das decisões da fila de perdas, onde UCs com GD são cortadas da fila de fiscalização).
- **Conformidade:** A flag booleana é validada. Valores nulos resultantes do left join são transformados em `False/0`.

## ADR-009 — Normalização Resiliente de Datas e Textos (Silver)

- **Data:** 2026-10-22 · **Fatia:** 01 (Renan) · **Status:** Aceita (revisada em 2026-10-28)
- **Contexto:** Devido à dispersão de exportação dos sistemas legados da V-Energy, o campo `data_leitura` aparece como `yyyy-MM-dd`, `dd/MM/yyyy`, `dd.MM.yyyy` e o preenchimento de endereço e UFs flutua. Além disso, o arquivo bruto `unidades_consumidoras.csv` mistura textos íntegros em UTF-8 com textos em dupla codificação (*mojibake*: UTF-8 lido como Latin-1/Windows-1252 e re-salvo em UTF-8), corrompendo 61 bairros em 348 UCs (ex.: `Brasília Teimosa` virando `BRASA\xadLIA TEIMOSA`).
- **Decisão:**
  1. **Datas e siglas:** Uso do `safe_date_parse_v2` testando via `coalesce(try_to_date(...))` uma cascata de 6 formatos até encontrar padrão. `PERNAMBUCO` convertido para a sigla canônica `PE`.
  2. **Reversão de Mojibake e remoção de acentos:** Antes da remoção de acentos, reverter a dupla codificação com o UDF `fix_mojibake` (`texto.encode("latin-1").decode("utf-8")` com tratamento de erro `UnicodeEncodeError`/`UnicodeDecodeError`). Em seguida, aplicar remoção de acentos via `translate` e padronização `UPPER()` e `trim()` nos campos cadastrais (`bairro`, `municipio`, `logradouro` e `nome_titular`).
- **Impacto:** Evita perda por falha de casting e unifica os 61 bairros duplicados, eliminando bairros "fantasmas" no filtro de bairro, no ranking da Receita e na Visão 360.
- **Conformidade:** Teste no Spark `dim_unidade.filter(F.col("bairro").rlike(r"[^ -~]")).count() == 0` e no SQLite `SELECT count(*) FROM dim_unidade_consumidora WHERE bairro GLOB '*[^ -~]*' == 0`.

## ADR-010 — Painel do Diretor: indicadores das cinco áreas e períodos padrão do case

- **Data:** 2026-10-27 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** A user story do diretor (seção 5.2) pede "os principais indicadores do negócio" comparados "entre períodos". A pergunta do diretor (seção 1) compara os últimos 12 meses com o primeiro ano da base.
- **Decisão:**
  - Onze indicadores em cinco grupos: **Comercial** (faturamento, energia faturada, tarifa média, UCs ativas), **Cobrança** (inadimplência), **Rede** (horas sem energia e interrupções por cliente), **Atendimento** (satisfação média e tempo médio de resolução) e **Medição** (leituras estimadas e clientes com painel solar). Perdas entram como retrato à parte (ADR-014).
  - Períodos padrão: base 2022-07 a 2023-06 e atual 2025-07 a 2026-06, os mesmos da tela de Receita e do diagnóstico. O diretor pode trocar, e as janelas ficam na URL.
  - Os indicadores comerciais reutilizam `RevenueRepository.fetch_period_totals` e `kpis.py` da Fatia 04, então são **idênticos** aos de `/revenue/kpis` nas mesmas janelas.
- **Alternativa descartada:** comparar mês contra mês, que mistura sazonalidade e não responde à pergunta do diretor.
- **Conformidade:** `test_commercial_indicators_match_revenue_kpis` e `test_defaults_to_case_periods_and_lists_all_groups`.

## ADR-011 — Avaliação "melhorou / piorou / estável" calculada no backend

- **Data:** 2026-10-27 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** O diretor quer saber "rapidamente se estamos indo bem ou mal". Subir é bom para o faturamento e ruim para a inadimplência.
- **Decisão:** Cada indicador tem um sentido (`MAIOR_MELHOR`, `MENOR_MELHOR` ou `NEUTRO`). A variação é (atual − base) ÷ base. Abaixo de 1% em módulo, `ESTAVEL`. Com base zero não há variação (`SEM_COMPARACAO`). Indicadores neutros (tarifa média e painel solar) são sempre `INFORMATIVO`, porque não são bons nem ruins por si só.
- **Taxas em pontos percentuais (revisão de 2026-10-28):** indicadores em % (inadimplência e leituras estimadas) são avaliados pela diferença em pontos percentuais (`variacao_pp`), com `ESTAVEL` abaixo de 0,1 p.p. No banco real, a inadimplência foi de 3,55% para 3,60%: +1,4% relativo, que aparecia como "piorou", mas só +0,05 p.p. A tela escreve por extenso ("+0,05 ponto percentual") e, na inadimplência, mostra também o valor vencido em reais nos dois períodos (`detalhe`): a taxa diz se a cobrança piorou, e o valor mostra quanto dinheiro está em jogo (cerca de R$ 5,6 mi para R$ 6,1 mi, porque o faturamento cresceu).
- **Impacto:** a regra fica num só lugar (`indicators.py`) e o frontend só exibe o selo.
- **Conformidade:** `test_evaluate_uses_direction_and_one_percent_threshold` e `test_rates_are_evaluated_in_percentage_points`.

## ADR-012 — DEC/FEC da área no Painel e aviso do temporal de jul/2025

- **Data:** 2026-10-27 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** O glossário diz que o DEC/FEC do case serve para comparar períodos entre si, não com limites ANEEL (ADR-003). O Painel precisa de um número da rede inteira por período.
- **Decisão:** "Horas sem energia por cliente" = Σ `duracao_horas` de `fato_ocorrencias_rede` ÷ UCs ativas da janela. "Interrupções por cliente" = nº de linhas (uma por UC atingida) ÷ UCs ativas. Todas as ocorrências contam, inclusive as anteriores à ligação (ADR-005). Sem limite ANEEL. Quando um dos períodos contém jul/2025, os dois indicadores avisam que o temporal daquele mês concentra boa parte das interrupções.
- **Alternativa descartada:** média do DEC dos alimentadores, que pesa igual um alimentador pequeno e um grande.
- **Conformidade:** `test_storm_warning_only_when_period_contains_july_2025` e `test_area_indicators_from_seed`.

## ADR-013 — Inadimplência como % do valor faturado vencido e não pago

- **Data:** 2026-10-27 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** A inadimplência pode ser medida por número de faturas ou por valor.
- **Decisão:** Σ `valor_total_rs` das faturas com `status_pagamento = VENCIDA` ÷ Σ `valor_total_rs` faturado, por competência da fatura. Faturas `ABERTA` (ainda no prazo) não contam como inadimplência.
- **Impacto:** mostra o dinheiro que não entrou. As faturas mais recentes ainda podem ser pagas, então o período atual tende a cair um pouco com o tempo.
- **Conformidade:** `test_area_indicators_from_seed` (cenário de inadimplência).

## ADR-014 — Perdas no Painel como retrato atual, sem comparação

- **Data:** 2026-10-27 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** O histórico de inspeções (`fato_inspecoes_perdas`) só cobre ago a dez/2025: não existe primeiro ano para comparar.
- **Decisão:** Rota separada `GET /dashboard/losses` com UCs suspeitas, energia (kWh/mês) e valor (R$/ano) recuperáveis e a taxa de acerto das inspeções. Ela usa o mesmo ranking (`rank_suspicious_units`) e a mesma taxa (`hit_rate_dto`) da Fila de Perdas (Fatia 05). A tela mostra o selo "Retrato atual, sem histórico para comparar". A rota é separada porque o cálculo da fila é o mais pesado e não deve atrasar os demais cards.
- **Conformidade:** `test_losses_snapshot_uses_loss_queue_ranking`.

## ADR-015 — Painel só para o diretor; tela inicial pela ordem do menu

- **Data:** 2026-10-27 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** A user story é do diretor, e a API de receita já é restrita a ele (`RequireDiretoria`). Antes, o item "Painel" aparecia para os gerentes de operação e de perdas.
- **Decisão:** `/dashboard` e `/api/v1/dashboard/*` só para o diretor. O menu (`navItems.ts`) foi reordenado para que a primeira tela de cada cargo seja a dele: o diretor abre no Painel, o gerente de perdas na Gestão de Perdas, o gerente de operação na Qualidade da Rede e o atendimento na Visão 360. O `DashboardPage` provisório foi removido.
- **Conformidade:** `test_returns_403_for_profiles_other_than_director` e `RbacNavigation.test.tsx`.

## ADR-016 — Desempenho do Painel: leitura sequencial, cache e pré-cálculo

- **Data:** 2026-10-28 · **Fatia:** 03 / Painel (Bernardo H) · **Status:** Aceita
- **Contexto:** No `v_energy.db` real (2,1 milhões de faturas e de leituras), a primeira versão do Painel levava cerca de 11 s. A meta era menos de 2 s.
- **Decisão:**
  1. As consultas do Painel e a de totais da Receita (`period_totals_query`, Fatia 04) não filtram a competência no `WHERE`: cada soma já limita a janela no `CASE`. Ler a tabela em sequência é mais rápido no SQLite do que ir pelo índice de `competencia` para metade das linhas (faturas: 2,9 s → 0,4 s; totais da Receita: 5,1 s → 2,8 s). Isso também acelera a `/revenue/kpis`.
  2. Os resultados ficam em cache na memória por 30 minutos, por par de janelas, porque a Gold só muda a cada carga do pipeline. Erros não entram no cache.
  3. Na subida da API, os períodos padrão e o retrato de perdas são calculados em segundo plano (cerca de 5 s). O diretor abre o Painel na hora.
- **Impacto:** períodos padrão em 0,01 s; outro período em cerca de 2,6 s na primeira vez e instantâneo depois. Ao trocar o `v_energy.db`, reiniciar a API para limpar o cache.
- **Conformidade:** `test_indicators_are_cached_per_window_pair`, `test_executive_dashboard_cache.py` e a medição registrada em `docs/planning/bernardo/painel_diretor.md` (seção 13).
