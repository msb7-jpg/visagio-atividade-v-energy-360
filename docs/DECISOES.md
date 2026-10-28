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

- **Data:** 2026-10-22 · **Fatia:** 01 (Renan) · **Status:** Aceita
- **Contexto:** Devido à dispersão de exportação dos sistemas legados da V-Energy, o campo `data_leitura` aparece como `yyyy-MM-dd`, `dd/MM/yyyy`, `dd.MM.yyyy` e o preenchimento de endereço e UFs flutua.
- **Decisão:** Uso do `safe_date_parse_v2` testando via `coalesce(try_to_date(...))` uma cascata de 6 formatos até encontrar padrão. Remoção de todos os acentos e padronização `UPPER()` nas colunas `bairro` e `municipio`. `PERNAMBUCO` convertido para a sigla canônica `PE`.
- **Impacto:** Evita perda por falha de casting ou criação de bairros duplicados no dashboard gerencial de filtro.

## ADR-010 — Purgação dos nós de gráficos da FSM do Agente de IA em favor de síntese analítica tabular

- **Data:** 2026-10-25 · **Fatia:** 07 (Miguel) · **Status:** Aceita
- **Contexto:** A especificação inicial de Text-to-SQL previa um nó de geração de especificações visuais de gráficos (`chart_prompt`, `chart_schema`, `chart_builder`).
- **Decisão:** Remover integralmente a geração autônoma de gráficos do agente de IA e da interface de chat.
- **Justificativa:** A plataforma V-Energy Grid 360 já conta com dashboards analíticos visuais ricos e canônicos (Receita, Qualidade DEC/FEC, Perdas e Visão 360). Gerar gráficos dinamicamente no assistente aumentava a latência, a probabilidade de alucinações de eixos/dados e a duplicação de componentes, em contraste com o objetivo de entregar respostas analíticas diretas, síntese em Markdown executiva e tabelas com auditoria SQL, ordenação e exportação CSV.
- **Impacto:** FSM mais enxuta, confiável e determinística; código do backend e frontend simplificado sem componentes de gráficos dinâmicos órfãos.

## ADR-011 — Assistente IA em widget flutuante, redimensionável e não-bloqueante

- **Data:** 2026-10-25 · **Fatia:** 07 (Miguel) · **Status:** Aceita
- **Contexto:** A proposta original de gaveta modal lateral (`<Sheet>`) ocupando 400px fixos bloqueava a visão e a interação simultânea com as tabelas e gráficos da tela subjacente.
- **Decisão:** Implementar o assistente como um widget flutuante, arrastável e redimensionável globalmente acionável (ou expansível para tela cheia), com selo de modo seguro (Read-Only) e atalhos rápidos.
- **Justificativa:** Proporciona ao usuário não técnico e ao analista a liberdade de consultar dados operacionais sem perder o contexto visual da tela ativa, consultando métricas e comparando valores em tempo real.
- **Conformidade:** Testes unitários no Vitest cobrindo ativação, arraste, redimensionamento e acessibilidade via teclado.
