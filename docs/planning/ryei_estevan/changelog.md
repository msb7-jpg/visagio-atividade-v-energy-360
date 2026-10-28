# 📝 Diário de Bordo — Fatia 02 (Ryei Estevan)
**Fatia:** Faturamento, Rede & Atendimento (Ponta a Ponta)  
**Dono:** Ryei Estevan

---

## Registros de Execução

### [2026-10-16] - Inicialização do Planejamento da Fatia 02
- **Autor:** Antigravity / Time V-Energy
- **O que foi feito:**
  - Estruturação do checklist operacional em `02_data_faturamento_rede.md`.
  - Mapeamento das 4 fontes: `faturas`, `ocorrencias_rede`, `atendimentos`, `inspecoes`.
- **Dificuldades / Desafios:**
  - Implementar cálculo oficial de DEC e FEC ANEEL por alimentador e competência, e parsing do JSON aninhado de atendimentos.
- **Próximos Passos:**
  - Iniciar ingestão Bronze e normalização Silver das faturas e ocorrências de rede.
- **Validação de Testes:**
  - Pendente início da fase de dados.

### [2026-10-22] - Fase 1: Ingestão Bronze no Databricks (Free Edition)
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **O que foi feito:**
  - Configurado Databricks CLI (perfil `DEFAULT`) e criados schema `workspace.v_energy` e Volume `workspace.v_energy.landing` (arquivos em `landing/fatia02/`).
  - Criado notebook `data-engineering/notebooks/fatia02_bronze.py` (publicado em `/Workspace/V_Energy_Analytics/fatia02_bronze`), lendo todas as colunas como texto e anexando `_ingested_at` e `_source_file`.
  - Tabelas Delta gravadas: `bronze_faturas` (2.184.623), `bronze_ocorrencias_rede` (180.000), `bronze_atendimentos` (318.871, `historico` preservado como Array<Struct>), `bronze_inspecoes` (1.389, aba de origem em `_source_sheet`).
- **Dificuldades / Desafios:**
  - Serverless não lê `.xlsx` nativamente: abas lidas via pandas/openpyxl com `dtype=str`.
  - `_source_file` via `_metadata.file_path` (`input_file_name()` não é suportado no Unity Catalog).
- **Achados de qualidade para a Silver:**
  - `faturas.csv` contém 2 linhas de cabeçalho repetidas no meio do arquivo; bandeiras como `Verde`/`Vermelha P1`; status `PAGA`/`EM ABERTO`; não há coluna de consumo em kWh (apenas `valor_energia`, `tributos`, `valor_total`).
  - `inspecoes.xlsx`: datas em formatos mistos (`2025-08-01`, `14.08.2025`, `09-01-2025`), decimais com vírgula, `resultado` com caixa inconsistente e `-` como nulo.
  - `ocorrencias_rede.csv`: uma linha por UC afetada, com `duracao_min` (minutos).
- **Próximos Passos:**
  - Fase 2 (Silver): `fatia02_silver` com tipagem, deduplicação e normalizações.
- **Validação de Testes:**
  - Execução do notebook no Databricks: SUCCESS; contagens conferidas contra os arquivos de origem.

### [2026-10-22] - Fase 2: Silver no Databricks + fonte ANEEL
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **O que foi feito:**
  - Decisões registradas em `docs/DECISOES.md`: ADR-001 (CSAT na escala 1–5), ADR-002 (C_total provisório via `unidades_consumidoras.csv`), ADR-003 (limites ANEEL, mapeamento alimentador → conjunto, apuração acumulada no ano).
  - Nova fonte externa: limites oficiais de DEC/FEC da ANEEL (Dados Abertos, gerado em 2026-10-05) em `bronze_aneel_limites` (Bronze reexecutada com sucesso).
  - Criado notebook `data-engineering/notebooks/fatia02_silver.py` (publicado em `/Workspace/V_Energy_Analytics/fatia02_silver`). Tabelas: `silver_uc_alimentador` (45.000), `silver_faturas` (2.184.621), `silver_ocorrencias_rede` (180.000), `silver_atendimentos` (318.871), `silver_atendimentos_tratativas` (636.857), `silver_inspecoes` (1.389), `silver_aneel_limites` (15.660, Neoenergia PE).
- **Regras de limpeza aplicadas:**
  - Faturas: 2 cabeçalhos repetidos removidos; `valor_total` em formato `R$ 1.000,11` convertido (energia + tributos = total em 100% das linhas); datas de emissão em 4 formatos, com dia/mês ambíguos resolvidos pelo `mes_referencia`; bandeiras canônicas `VERDE`, `AMARELA`, `VERMELHA_P1`, `VERMELHA_P2`; `status_pagamento` recalculado pelas datas (61.333 faturas `EM ABERTO` na origem já tinham pagamento → `PAGA`).
  - Ocorrências: `duracao_min` com sufixo ` min` (16.200) normalizada; 5.400 causas vazias (`-`, `N/A`, `NULL`, nulo) → `NAO INFORMADA`.
  - Inspeções: 8 grafias de resultado → booleano; datas ambíguas resolvidas pela janela da campanha (ago–dez/2025); decimais com vírgula convertidos; espaços removidos do inspetor; `-` → nulo.
  - Cadastro (provisório): 200 registros `TESTE*` e 1.256 duplicatas idênticas removidos.
- **Desvios do planejamento:**
  - Causas de ocorrência não foram mapeadas para "acidental / programada / emergência": a fonte não tem interrupções programadas; mantidas as 6 causas reais + `NAO INFORMADA`.
  - `consumo_faturado_kwh` e `tarifa_aplicada_rs_kwh` dependem das leituras da Fatia 01 (Renan).
- **Achados para o negócio:**
  - 32.285 faturas (`FTX*`) apontam para UCs inexistentes no cadastro (`UC9xxxxxx`), somando R$ 10.192.373,82. Ficam na Silver com `fl_uc_cadastrada = false` e serão excluídas da Gold.
- **Próximos Passos:**
  - Fase 3 (Gold): `fato_qualidade_alimentador` (DEC/FEC + limites ANEEL), `fato_atendimentos`, `fato_inspecoes_perdas`, `fato_faturamento` (kWh após Silver da Fatia 01).
- **Validação de Testes:**
  - Execução do notebook no Databricks: SUCCESS. Conferidos: nenhuma perda de linhas, 0 valores/datas nulos após conversão, CSAT entre 1,3 e 5,0, IDs únicos em todas as tabelas.

### [2026-10-22] - Validação da Fatia 01 + Fase 3: Gold no Databricks
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **Integração com a Fatia 01 (Renan):**
  - Notebooks `Landing_to_Bronze` e `Bronze_to_Silver` revisados e executados no catálogo `visagio_atividade_v_energy_360` (criado neste workspace, com os arquivos de landing da Fatia 01).
  - Versão corrigida pelo Renan ainda zerava `mes_referencia` (Bronze com `inferSchema=True` já grava DATE). Com `inferSchema=False` (testado em cópia em `/Workspace/V_Energy_Analytics/_validacao_fatia01/`): `silver_leituras` = 2.152.336 leituras, 100% das faturas válidas encontram leitura. Ajuste e achado de rollover negativo (292 leituras) enviados ao Renan.
  - ADR-002 concluída: `silver_uc_alimentador` passou a ler `silver_unidades_consumidoras` da Fatia 01.
- **O que foi feito (Gold):** notebook `data-engineering/notebooks/fatia02_gold.py` (publicado em `/Workspace/V_Energy_Analytics/fatia02_gold`):
  - `fato_faturamento` (2.152.336): faturas de UCs cadastradas + consumo da leitura do mês; tarifa mediana R$ 0,76/kWh (p01 0,67; p99 0,92). 7.502 sem tarifa (7.210 sem kWh na origem + 292 com kWh negativo da Fatia 01).
  - `fato_qualidade_alimentador` (5.856 = 122 alimentadores × 48 meses): DEC/FEC mensal e acumulado no ano vs. limite anual ANEEL (ADR-003). 59 alimentadores com limite do próprio conjunto, 63 pela mediana RMR.
  - `fato_atendimentos` (318.871) com tempo de resolução e CSAT 1–5; `fato_inspecoes_perdas` (1.389).
- **Achados para o negócio:**
  - DEC da empresa (todas as UCs): 1,49 h em 2023, 1,50 h em 2024 e **3,39 h em 2025** (mais que o dobro). Alimentadores que estouraram a meta no ano: 7 em 2023, 7 em 2024, 11 em 2025.
  - Os valores ficam bem abaixo dos limites ANEEL (~10 h/ano): a base é sintética e menor que a real.
- **Validação de Testes:**
  - Execuções no Databricks: SUCCESS. Conferidos: 122/122 alimentadores, 180.000 UCs interrompidas preservadas, 0 linhas sem limite ANEEL, 0 DEC/FEC negativos.
- **Próximos Passos:**
  - Fase 4: job.yaml, exportação SQLite + índices, `docs/DATA_DICTIONARY.md`. Fase 5: testes de qualidade automatizados.

### [2026-10-23] - Padrão de catálogo da Fatia 01 adotado
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **Decisão do time:** manter o padrão de nomes do Renan (Fatia 01): catálogo `visagio_atividade_v_energy_360` com schemas `bronze`, `silver` e `gold`, tabelas com prefixo da camada.
- **O que foi feito:**
  - `fatia02_bronze`, `fatia02_silver` e `fatia02_gold` deixaram de usar `workspace.v_energy` e passaram a gravar em `visagio_atividade_v_energy_360.bronze/silver/gold`.
  - Arquivos de landing da Fatia 02 copiados para o Volume `visagio_atividade_v_energy_360.bronze.landing` (mesma pasta da Fatia 01).
- **Validação de Testes:**
  - Três notebooks executados no Databricks com SUCCESS; contagens idênticas às da execução anterior (`fato_faturamento` 2.152.336, `fato_qualidade_alimentador` 5.856, `fato_atendimentos` 318.871, `fato_inspecoes_perdas` 1.389).
  - `make lint-all` e `make test-all`: 100% aprovados.

### [2026-10-23] - Fase 5: Testes automatizados de qualidade da Gold
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **O que foi feito:** notebook `data-engineering/notebooks/fatia02_testes_qualidade.py` (publicado em `/Workspace/V_Energy_Analytics/fatia02_testes_qualidade`), separado dos notebooks de transformação. Cada teste conta as linhas que violam uma regra (0 = aprovado); se algum falhar, o notebook levanta `AssertionError` e o job para antes da exportação para o SQLite.
- **19 testes nas 4 tabelas Gold:**
  - `fato_faturamento`: valor total = energia + tributos; nenhuma fatura órfã; valores e datas não nulos; tarifa só com consumo positivo; `id_fatura` único; mesma contagem da Silver.
  - `fato_qualidade_alimentador`: DEC/FEC (mensal e acumulado) ≥ 0; limite ANEEL preenchido; `C_total > 0`; grade completa sem repetição; toda UC interrompida contada no FEC.
  - `fato_atendimentos`: CSAT nulo ou 1–5; tempo de resolução ≥ 0; protocolo único; mesma contagem da Silver.
  - `fato_inspecoes_perdas`: data na campanha ago–dez/2025; kWh recuperado ≥ 0; `id_inspecao` único; mesma contagem da Silver.
- **Desvio do planejamento:** a regra "valor total = consumo × tarifa + encargos" seria circular, porque a Gold calcula a tarifa a partir do valor total. Substituída por "valor total = valor da energia + tributos", que a fonte permite verificar.
- **Validação de Testes:**
  - Execução no Databricks: SUCCESS, 19/19 aprovados.
  - Teste negativo: a mesma regra de órfãs aplicada à Silver (que ainda contém as faturas `FTX*`) encontra 32.285 violações, confirmando que o teste detecta falhas.
  - `make lint-all` e `make test-all`: 100% aprovados.
- **Próximos Passos:** incluir a tarefa de testes no `job.yaml` entre a Gold e a exportação SQLite (aguardando o job final do Renan).

### [2026-10-26] - Fase 4: Job completo, exportação SQLite e dicionário de dados
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **Integração com a versão final da Fatia 01 (Renan):** notebooks `Landing_to_Bronze`, `Bronze_to_Silver`, `Silver_to_Gold` e `Gold_Quality_Tests` e o `job.yml` recebidos e executados neste workspace com SUCCESS (0 falhas críticas, 1 aviso). `inferSchema=False` e a correção do rollover foram aplicados: `silver_leituras` com 2.152.336 leituras, 0 meses nulos e 0 consumos negativos.
- **O que foi feito:**
  - `data-engineering/job.yaml` reescrito no formato do Renan (Asset Bundle, mesmos nomes de tarefas e notebooks) com as 5 tarefas da Fatia 02. Pasta dos notebooks na variável `notebooks_dir`; agenda mensal mantida.
  - Novo notebook `fatia02_export_sqlite`: roda depois dos testes das duas fatias e acrescenta as 4 tabelas da Fatia 02 ao `v_energy.db` criado pelo `Silver_to_Gold`, com PK, FK para `dim_unidade_consumidora`, 6 índices e conferência de contagens, FK e `integrity_check`.
  - `docs/DATA_DICTIONARY.md` criado com a seção da Fatia 02 (seção da Fatia 01 reservada ao Renan).
  - Colunas exportadas conferidas contra o que o backend já consulta (Visão 360, Receita, Perdas, Qualidade): sem divergência de nomes.
- **Números com a Fatia 01 final:** `fato_faturamento` 2.152.336 (6.329 sem kWh, antes 7.210 + 292 negativos); demais tabelas inalteradas.
- **Validação de Testes:**
  - Job completo implantado como bundle de desenvolvimento e executado de ponta a ponta: 9 tarefas SUCCESS em 6,3 min.
  - `v_energy.db` final: 8 tabelas, `journal_mode=wal`, `integrity_check=ok`, 0 violações de FK; copiado para `backend/v_energy.db`.
  - `make lint-all` e `make test-all`: 100% aprovados.
- **Observação para o Renan:** no `Bronze_to_Silver`, a auditoria de leituras órfãs é gravada com `append` e logo depois a tabela `auditoria_qualidade` é sobrescrita (`Overwrite`) pela contagem de anomalias, apagando o registro de órfãs.

### [2026-10-26] - Ajustes após a leitura do PDF do case e a issue #23 (João Henrique)
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **Contexto:** perguntas da Fatia 06 na issue #23, conferidas contra `case-rocket-lab-2026-venergy.pdf`.
- **O que foi feito:**
  - Nova tabela Gold `fato_ocorrencias_rede` (180.000 linhas, 1 UC interrompida por linha, com tipo, causa e duração), exportada no SQLite com índices em `id_uc`, `id_alimentador` e `competencia`. Atende a lista de causas da Fatia 06 e as interrupções da Visão 360 (Fatia 03), pendentes nas issues #7 e #23.
  - 595 ocorrências anteriores à ligação da UC mantidas no DEC/FEC e marcadas com `fl_anterior_ligacao` (ADR-005).
  - ADR-003 revisado: pelo glossário do case (pág. 3), DEC/FEC servem para comparar alimentadores e períodos entre si; o limite ANEEL e as colunas `violou_*` passam a ser apenas referência. Contrato inalterado.
  - `fatia02_export_sqlite` passou a exportar as 5 tabelas Gold da Fatia 02 também em CSV no Volume `gold/exports` (exigência da pág. 4 do case).
  - Notebooks convertidos de `.py` (formato fonte do Databricks) para `.ipynb`, como pede a estrutura de repositório do case (pág. 7). Código conferido idêntico antes e depois.
  - Citação da Patrícia no plano corrigida: a versão anterior (mainframe, R$ 4,2 mi) não consta no PDF.
  - `docs/DATA_DICTIONARY.md` atualizado (nova tabela, limite de referência, CSV, 24 testes).
- **Validação de Testes:**
  - 5 testes novos em `fatia02_testes_qualidade` (24 no total), incluindo a soma das ocorrências por alimentador e mês contra `ucs_interrompidas`: todos aprovados.
  - `v_energy.db`: 9 tabelas, `integrity_check=ok`, 0 violações de FK.

### [2026-10-26] - Reprodutibilidade do pipeline: fonte ANEEL versionada, bundle e README
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **O que foi feito:**
  - Limites ANEEL versionados em `data-engineering/reference/aneel_limites_continuidade.csv` (só as 15.660 linhas da Neoenergia PE, 1,5 MB, sem alterar as linhas originais). Antes o arquivo existia só no Volume do workspace e não vem nos zips do case, então o pipeline não rodava em outro workspace.
  - `data-engineering/databricks.yml`: bundle que implanta o `job.yaml` (alvos `dev`, com agenda pausada, e `prod`). `.databricks/` (estado local do bundle) adicionado ao `.gitignore`.
  - README: nova seção "Pipeline de Dados (Databricks)" com o passo a passo (Volume, upload, import dos notebooks, deploy, execução e download do `v_energy.db`), a estratégia de agendamento justificada e o lugar do print do Workflow (pendente).
- **Validação de Testes:**
  - Job implantado a partir do bundle do repositório e executado de ponta a ponta: 9 tarefas SUCCESS em 8,3 min. `bronze_aneel_limites` passou de todas as distribuidoras para 15.660 linhas; Silver e Gold idênticas (mesmos limites, 11 alimentadores acima da referência em 2025).
  - Comandos do README conferidos no CLI (`import-dir` cria os notebooks com os nomes do job).
  - `make lint-all` e `make test-all`: 100% aprovados.

### [2026-10-27] - Integração final com a Fatia 01 e print do Workflow
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **Contexto:** a branch do Renan (`feat/fatia-01-cadastro`, commit `9ed2d9b`) foi criada a partir desta e traz os notebooks finais da Fatia 01 (`fatia01_*`) e uma tarefa nova de exportação. A branch foi trazida para cá (fast-forward, sem conflitos) para um PR único das duas fatias.
- **Problema encontrado no `job.yaml`:** `fatia01_export_sqlite` recria o `v_energy.db` do zero e rodava em paralelo com `fatia02_export_sqlite`, que acrescenta tabelas ao mesmo arquivo: o último a terminar apagava as tabelas do outro. Além disso, os testes da Fatia 01 leem o `v_energy.db`, mas rodavam antes da exportação dele (falha em workspace novo).
- **O que foi feito:**
  - `job.yaml`: ordem `Silver_to_Gold` → `fatia01_export_sqlite` → `Testes` → `fatia02_export_sqlite` (esta também depende de `fatia02_testes_qualidade`). Comentário do arquivo explica por que as duas exportações não podem rodar em paralelo.
  - `fatia02_export_sqlite`: textos e mensagem de erro passam a citar `fatia01_export_sqlite` como quem cria o banco.
  - Print da execução bem-sucedida do Workflow em `docs/img/workflow_databricks.png`, referenciado no README.
- **Validação de Testes:**
  - Os 10 notebooks importados do repositório (`import-dir`) e o job implantado pelo bundle: 10 tarefas SUCCESS em 8,7 min, na ordem acima.
  - `v_energy.db` final: 9 tabelas (4 da Fatia 01 + 5 da Fatia 02), `integrity_check=ok`, 0 violações de FK.
  - `make lint-all` e `make test-all`: 100% aprovados.

### [2026-10-28] - Correção do status de pagamento das faturas (`docs/CORRECOES.md`, item 1)
- **Autor:** Ryei Estevan (com apoio do Claude Code)
- **Contexto:** apontado pelo Bernardo na lista de correções da branch `feat/painel-diretor`. No `faturas.csv`, fatura não paga vem com `status = EM ABERTO` e `data_pagamento` vazia (113.835) **ou** `9999-12-31` (61.333). A Silver só tratava a data vazia: o texto `9999-12-31` virava data válida e a fatura saía `PAGA`. Além disso, `VENCIDA` era decidida com `current_date()`, então nenhuma fatura ficava `ABERTA` e o resultado mudava conforme o dia da execução.
- **O que foi feito:**
  - `fatia02_silver`: `9999-12-31` vira nulo em `data_pagamento` (mesma regra da Fatia 01 em `data_retirada`) e `VENCIDA` x `ABERTA` compara o vencimento com `BASE_CUTOFF_DATE = 2026-06-30` (fim da última competência).
  - Faturas com pagamento real continuam `PAGA` mesmo pagas depois do corte (a base registra pagamentos até 2026-08-06; 32.011 faturas pagas em jul–ago/2026).
  - `fatia02_testes_qualidade`: 2 testes novos (26 no total): nenhum `9999-12-31` na Gold e `status_pagamento` coerente com o pagamento e com a data de corte.
  - `docs/DATA_DICTIONARY.md` e regra do checklist atualizados.
- **Impacto esperado (simulado no `v_energy.db` atual):** 60.394 faturas (R$ 12,9 mi, 33.142 UCs) deixam de ser `PAGA`. Distribuição nova: `PAGA` 1.979.783, `VENCIDA` 170.853, `ABERTA` 1.700. Inadimplência por valor passa de 3,6% para 5,5%.
- **Validação de Testes:**
  - `make lint-all` e `make test-all`: 100% aprovados.
  - Consulta somente leitura no SQL Warehouse com as expressões novas sobre `bronze_faturas`: mesma distribuição da simulação, 0 marcadores e 0 status incoerentes.
  - Notebooks importados no workspace e job executado de ponta a ponta: 10 tarefas SUCCESS em 8,5 min, com os 26 testes de `fatia02_testes_qualidade` aprovados.
  - `v_energy.db` exportado: 9 tabelas, `integrity_check=ok`, 0 violações de FK, 0 faturas com `9999-12-31`, `PAGA` 1.979.783 / `VENCIDA` 170.853 / `ABERTA` 1.700, inadimplência por valor 5,45%.
