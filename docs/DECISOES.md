aq vamos documentar as decisões que tomamos no formato adr

qual decisao

impacto

como garantir confirmidade

etc etc...
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
