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
- **Alternativas descartadas:** limite fixo arbitrário (sem base regulatória); dividir o limite anual por 12 (sazonalidade de chuvas em PE concentra ocorrências no meio do ano).
- **Conformidade:** Teste na Gold valida que todo alimentador tem limite atribuído, sem nulos; `dec_limite_aneel` e `fec_limite_aneel` são positivos.
- **Atualização (2026-10-26):** o DEC/FEC real dos alimentadores do case (gerado por amostragem sintética) tem ordens de grandeza muito superiores aos limites de conjunto da ANEEL — praticamente 100% dos alimentadores violariam as metas em janeiro. Os limites ANEEL continuam calculados e exportados para `v_energy.db`, mas agora são documentados como **limites de referência**; a regra de negócio da Fatia 06 (João Henrique) define a criticidade do alimentador pelo ranking relativo (piores DEC/FEC) em vez de `violou_meta`.

## ADR-004 — Modelo de dados em catálogo Unity e separação por schemas Bronze/Silver/Gold

- **Data:** 2026-10-22 · **Fatia:** 02 (Ryei Estevan) · **Status:** Aceita
- **Contexto:** O projeto usava o catálogo `workspace` com o schema único `v_energy` para as três camadas. A consolidação dos pipelines das 7 fatias exige governança de dados e isolamento entre camadas.
- **Decisão:** Adotar o catálogo `visagio_atividade_v_energy_360` com três schemas: `bronze`, `silver` e `gold`. Cada tabela tem prefixo `bronze_*` na Bronze, `silver_*` na Silver ou `fato_*`/`dim_*` na Gold, e arquivos brutos no Volume `bronze.landing`.
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

- **Contexto:** Devido à dispersão de exportação dos sistemas legados da V-Energy, o campo `data_leitura` aparece como `yyyy-MM-dd`, `dd/MM/yyyy`, `dd.MM.yyyy` e o preenchimento de endereço e UFs flutua.
- **Decisão:** Uso do `safe_date_parse_v2` testando via `coalesce(try_to_date(...))` uma cascata de 6 formatos até encontrar padrão. Remoção de todos os acentos e padronização `UPPER()` nas colunas `bairro` e `municipio`. `PERNAMBUCO` convertido para a sigla canônica `PE`.
- **Impacto:** Evita perda por falha de casting ou criação de bairros duplicados no dashboard gerencial de filtro.

## ADR-017 — Limiar de ±10% para dizer que o consumo "subiu" ou "caiu"

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita
- **Contexto:** O atendente precisa responder se o consumo do cliente "realmente subiu" (case, user story do atendente). Pequenas oscilações mês a mês são normais e não devem virar "subiu".
- **Decisão:** Comparar o mês da conta com o mesmo mês do ano anterior (mesma estação) e classificar como `SUBIU` acima de +10%, `CAIU` abaixo de −10% e `ESTAVEL` entre os dois (`LIMIAR_VARIACAO_CONSUMO_PCT`). Sem leitura no ano anterior, `SEM_COMPARACAO`.
- **Alternativa descartada:** comparar com o mês anterior, que mistura o efeito da estação (verão e inverno) com a mudança de hábito.
- **Impacto:** a constante fica num só lugar do backend e pode ser ajustada pelo time sem mudar o frontend.
- **Conformidade:** teste `test_classify_trend_uses_ten_percent_threshold` (±10% exatos são estáveis).

## ADR-018 — Diagnóstico de conta alta com cinco causas

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita
- **Contexto:** A conta pode subir sem o consumo subir. As tabelas Gold trazem o que explica isso: período faturado (`dias_faturamento`), bandeira e preço médio do kWh (`fato_faturamento`) e se a leitura foi estimada (`tipo_leitura`).
- **Decisão:** O backend devolve o diagnóstico estruturado (sem texto) com cinco causas, e o frontend escreve as frases para o atendente:
  1. **Consumo** contra o mesmo mês do ano anterior (ADR-017).
  2. **Leitura estimada:** a leitura do mês foi fechada pela média, sem acesso ao medidor; a diferença é acertada na próxima leitura real.
  3. **Dias faturados:** só é citado com diferença de 3 dias ou mais e quando muda a conclusão (o total subiu, mas por dia ficou estável).
  4. **Bandeira tarifária:** diz se ficou mais cara ou mais barata.
  5. **Preço médio do kWh** (`tarifa_aplicada_rs_kwh`), só com variação de 1% ou mais. Ele já soma reajuste, bandeira e tributos, então o reajuste não é mostrado em separado.
  - Quando a UC tem geração solar, a tela lembra que a energia gerada é abatida. Se o painel foi ligado entre os dois meses comparados (`data_conexao_gd`), diz que a queda de consumo é esperada.
- **Alternativa descartada:** isolar o reajuste tarifário, que não existe como coluna na Gold e exigiria uma tabela de tarifas fora do escopo.
- **Conformidade:** testes do serviço (`test_diagnosis_*`), do router (`test_history_*`) e do frontend (`diagnosisMessages.test.ts`, `Customer360Page.test.tsx`).

## ADR-019 — Janela de 12 meses e totais só com meses comparáveis

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita
- **Contexto:** Cada UC tem sua última leitura em um mês diferente, e UCs ligadas há menos de dois anos não têm o ano anterior completo.
- **Decisão:** A janela tem 12 meses e termina na **última competência com leitura da própria UC**, não numa data fixa. Os totais dos 12 meses somam **apenas os meses que existem nos dois anos**, e a tela informa quantos meses foram comparados.
- **Alternativa descartada:** somar todos os meses de cada ano, o que faria uma UC nova parecer ter "subido" só por ter mais meses no ano recente.
- **Conformidade:** testes `test_history_builds_twelve_months_ending_at_latest_reading` e `test_totals_ignore_months_without_previous_year`.

## ADR-020 — Falta de luz: interrupções da própria UC e comparação do alimentador com ele mesmo

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita
- **Contexto:** O case pede que o atendente veja "se a rua dele teve falta de luz". O glossário diz que o DEC/FEC do case serve para comparar alimentadores e períodos entre si, não com limites regulatórios reais (ADR-003).
- **Decisão:**
  1. A aba de interrupções lista **cada interrupção que atingiu a UC** (`fato_ocorrencias_rede`: início, duração, tipo e causa), da mais recente para a mais antiga, com até 50 registros. Todos os tipos de ocorrência contam, como no DEC/FEC (dicionário de dados).
  2. Interrupções com `fl_anterior_ligacao = true` **não aparecem** na Visão 360. Elas continuam no DEC/FEC (ADR-005), mas o cliente não existia na data e a conversa com ele não deve citá-las.
  3. A região é mostrada pelo DEC/FEC mensal do alimentador, com "acima do normal" quando o mês passa de 1,5 vez a média dos 12 meses do **mesmo alimentador**. A tela não mostra limite ANEEL nem "violação".
- **Alternativa descartada:** usar `violou_meta` como alerta, o que contraria o glossário.
- **Conformidade:** testes `test_events_list_unit_outages_after_connection_most_recent_first` e `outageAnalysis.test.ts`.

## ADR-021 — Busca por número da UC, do medidor ou nome do titular

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita
- **Contexto:** O atendente recebe o número da conta em vários formatos (`100004`, `uc 100004`, `UC-100004`), às vezes só o número do medidor ou só o nome.
- **Decisão:**
  - O número é normalizado (sem espaços nem separadores, prefixo `UC` ou `MD` quando só há dígitos) e a busca usa "começa com" como intervalo (`id_uc >= 'UC1000' AND id_uc < 'UC1001'`), que aproveita o índice da chave.
  - O nome é buscado por "contém" (`LIKE '%texto%'`), com espaços normalizados e curingas escapados.
  - Sugestões a partir de 3 caracteres, 8 por padrão (até 20), em ordem de número da UC.
- **Impacto:** a busca por nome percorre a `dim_unidade_consumidora` (~45 mil linhas, poucos milissegundos). O `LIKE` do SQLite ignora maiúsculas só em letras sem acento.
- **Conformidade:** testes `test_customer360_search_terms.py` e `test_search_*` do router.

## ADR-022 — Quem acessa a Visão 360

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita (revisada em 2026-10-28)
- **Contexto:** O case diz que "o atendente, o analista de perdas e o diretor comercial" olham o mesmo cliente. Depois, a Qualidade da Rede (Fatia 06) passou a listar os clientes mais afetados de cada circuito, com link para a ficha.
- **Decisão:** Acesso pelo grupo central `CUSTOMER360_ACCESS` (ADR-024): atendente, gerente de atendimento, gerente de perdas, gerente de operação e diretor. O gerente de operação entra para abrir a ficha do cliente a partir do ranking de circuitos. O histórico de inspeções de perdas aparece para todos esses perfis: o atendente precisa saber de uma inspeção recente quando o cliente liga sobre ela.
- **Conformidade:** testes `test_authorized_profiles_can_access` (`test_customer360_router.py`) e a matriz papel x rota de `test_rbac.py`.

## ADR-023 — A Visão 360 só lê a Gold e falha de forma explícita

- **Data:** 2026-10-27 · **Fatia:** 03 (Bernardo H) · **Status:** Aceita
- **Contexto:** As tabelas Gold vêm de duas fatias de dados e podem chegar em momentos diferentes.
- **Decisão:** A feature só faz `SELECT`. Se uma tabela Gold estiver ausente, a API responde 500 com `DatabaseReadError`, nomeando a tabela, em vez de mostrar uma tela vazia que pareceria "cliente sem dados". A seed de desenvolvimento (`tests/customer360_seed.py`) reproduz o esquema exportado pelas Fatias 01 e 02 e se recusa a sobrescrever o `v_energy.db` real.
- **Conformidade:** teste `test_missing_gold_tables_return_database_error`.
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
- **Decisão:** "Horas sem energia por cliente" = Σ `duracao_horas` de `fato_ocorrencias_rede` ÷ UCs atendidas pela rede. "Interrupções por cliente" = nº de linhas (uma por UC atingida) ÷ as mesmas UCs atendidas. As UCs atendidas são a soma de `ucs_atendidas` de `fato_qualidade_alimentador`, uma vez por alimentador, com a mesma consulta da Continuidade (`feeder_ucs_query`, ADR-025), para o Painel e a Qualidade da Rede mostrarem o mesmo DEC/FEC. Todas as ocorrências contam, inclusive as anteriores à ligação (ADR-005). Sem limite ANEEL. Quando um dos períodos contém jul/2025, os dois indicadores avisam que o temporal daquele mês concentra boa parte das interrupções.
- **Alternativa descartada:** média do DEC dos alimentadores, que pesa igual um alimentador pequeno e um grande.
- **Revisão (2026-10-29):** a primeira versão dividia pelas UCs com fatura na janela (44.741 no primeiro ano), e a Continuidade, pelas UCs atendidas da Gold (45.000). O DEC do primeiro ano saía 1,48 no Painel e 1,47 na Qualidade da Rede. O Painel passou a usar a base da Gold, que é a fonte única de DEC/FEC (Fatia 02).
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

## ADR-024 — RBAC: papéis do `UserRole`, sem ADMIN, grupos centrais em `role_groups.py`

- **Data:** 2026-10-28 · **Fatia:** 06 (Joao Henrique) · **Status:** Aceita
- **Contexto:** O ROADMAP citava `UserRole.ATENDIMENTO`, `UserRole.DIRETORIA` e `UserRole.ADMIN`, que não existem. O enum real é `UserRole` (diretor, gerente_operacao, gerente_atendimento, atendente, gerente_perdas) e o grupo da Visão 360 precisou crescer a pedido da Fatia 03.
- **Decisão:** Os papéis são os membros de `UserRole`; não há perfil ADMIN (decisão de 2026-10-21). Cada grupo de acesso vive em `backend/app/shared/role_groups.py` (`DIRETORIA_ONLY`, `OPERACAO_ACCESS`, `ATENDIMENTO_ACCESS`, `PERDAS_ACCESS`, `CUSTOMER360_ACCESS`), com os aliases `Require*` em `backend/app/shared/dependencies.py`. `require_role(allowed_roles: Sequence[UserRole | str])` aceita membros do enum ou suas strings; string fora do enum levanta `ValueError`. `CUSTOMER360_ACCESS` inclui diretor, gerente_atendimento, atendente, gerente_perdas e gerente_operacao (este último para abrir a ficha do cliente a partir do ranking de circuitos).
- **Impacto:** Mudar quem acessa uma área é editar um único grupo. No frontend, `NAV_ITEMS` (`components/layout/navItems.ts`) é a fonte única dos papéis por tela e deve espelhar `role_groups.py`; as rotas de `AppRoutes.tsx` leem dele.
- **Conformidade:** `backend/tests/test_rbac.py` (matriz papel x rota em `ROUTE_BY_GROUP`, 401/403/200), `test_customer360_router.py` e, no frontend, `RbacNavigation.test.tsx` e `routes/__tests__/RbacMatrix.test.tsx` (papéis x rotas, tabela explícita). Novo grupo ou papel exige atualizar os dois lados e esses testes.

## ADR-025 — Continuidade: períodos de 12 meses, evento extremo (K=3) e causas atacáveis

- **Data:** 2026-10-28 · **Fatia:** 06 (Joao Henrique) · **Status:** Aceita
- **Contexto:** A aba Continuidade comparava dois períodos fixos de 4 meses sobre dados de exemplo. Com a Gold real (48 meses, 180.000 ocorrências), os períodos e o mês de evento precisam sair dos dados, e o cálculo precisa ser feito em SQL.
- **Decisão:**
  1. **Períodos:** A = primeiros 12 meses da série e B = últimos 12 (`MESES_POR_PERIODO`), sem datas fixas.
  2. **Evento extremo:** mês cujas UC-horas na rede inteira passam de 3 vezes (`LIMIAR_EVENTO_EXTREMO`) a mediana mensal da série de 48 meses. É o mesmo mês para qualquer município; os números do cartão são os do escopo. `incluir_evento=false` remove o mês de A e de B; sem mês acima do limiar, `event` é nulo.
  3. **Indicadores:** UC-horas = soma de `duracao_horas`. DEC = UC-horas ÷ soma de `ucs_atendidas` contada uma vez por alimentador no escopo; FEC = ocorrências ÷ a mesma soma. Sem limite ANEEL (ADR-003, ADR-012).
  4. **Causas atacáveis (suposição de negócio, a validar com a Fatia 02):** `VEGETACAO`, `FALHA DE EQUIPAMENTO` e `SOBRECARGA`. `NAO INFORMADA` aparece como "Sem causa registrada" e não é atacável.
  5. **Municípios no mapa:** coordenadas estáticas e aproximadas em `municipalities.py`, nunca dado do banco.
  6. **Escopo:** o município é resolvido em `scope_query` (alimentadores do escopo); as agregações só filtram por `id_alimentador`. O bairro entra no mesmo ponto.
- **Alternativa descartada:** denominador somando as linhas mensais de `fato_qualidade_alimentador`, que conta as mesmas UCs 12 vezes e divide o DEC por 12.
- **Impacto:** `GET /quality/continuity` responde sem carregar as ocorrências em Python; trocar K ou o tamanho do período é mudar uma constante.
- **Conformidade:** `backend/tests/test_grid_quality_continuity.py` (seed pequeno, valores à mão) e `test_grid_quality_router.py`.

## ADR-026 — Purgação dos nós de gráficos da FSM do Agente de IA em favor de síntese analítica tabular

- **Data:** 2026-10-25 · **Fatia:** 07 (Miguel) · **Status:** Aceita
- **Contexto:** A especificação inicial de Text-to-SQL previa um nó de geração de especificações visuais de gráficos (`chart_prompt`, `chart_schema`, `chart_builder`).
- **Decisão:** Remover integralmente a geração autônoma de gráficos do agente de IA e da interface de chat.
- **Justificativa:** A plataforma V-Energy Grid 360 já conta com dashboards analíticos visuais ricos e canônicos (Receita, Qualidade DEC/FEC, Perdas e Visão 360). Gerar gráficos dinamicamente no assistente aumentava a latência, a probabilidade de alucinações de eixos/dados e a duplicação de componentes, em contraste com o objetivo de entregar respostas analíticas diretas, síntese em Markdown executiva e tabelas com auditoria SQL, ordenação e exportação CSV.
- **Impacto:** FSM mais enxuta, confiável e determinística; código do backend e frontend simplificado sem componentes de gráficos dinâmicos órfãos.

## ADR-027 — Assistente IA em widget flutuante, redimensionável e não-bloqueante

- **Data:** 2026-10-25 · **Fatia:** 07 (Miguel) · **Status:** Aceita
- **Contexto:** A proposta original de gaveta modal lateral (`<Sheet>`) ocupando 400px fixos bloqueava a visão e a interação simultânea com as tabelas e gráficos da tela subjacente.
- **Decisão:** Implementar o assistente como um widget flutuante, arrastável e redimensionável globalmente acionável (ou expansível para tela cheia), com selo de modo seguro (Read-Only) e atalhos rápidos.
- **Justificativa:** Proporciona ao usuário não técnico e ao analista a liberdade de consultar dados operacionais sem perder o contexto visual da tela ativa, consultando métricas e comparando valores em tempo real.
- **Conformidade:** Testes unitários no Vitest cobrindo ativação, arraste, redimensionamento e acessibilidade via teclado.
