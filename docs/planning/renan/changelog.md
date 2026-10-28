# 📝 Diário de Bordo — Fatia 01 (Renan)
**Fatia:** Cadastro, Medição & Geração Distribuída (Ponta a Ponta)  
**Dono:** Renan

---

## Registros de Execução

### [2026-10-16] - Inicialização do Planejamento da Fatia 01
- **Autor:** Renan
- **O que foi feito:**
  - Estruturação do checklist operacional em `cadastro_medicao_gd.md`.
  - Mapeamento das 4 fontes principais de aterrissagem (`landing`): `unidades_consumidoras.csv`, `leituras/*.csv`, `medidores.csv`, `geracao_distribuida.csv`.
- **Dificuldades / Desafios:**
  - Lidar com a alta volumetria de medições históricas (2,18 milhões) divididas em 5 partições.
  - Definir a regra algorítmica exata para tratamento de virada de disco de medidor (rollover) vs. fraude/anomalia.
- **Próximos Passos:**
  - Iniciar a ingestão da camada Bronze no Databricks.

### [2026-10-20] - Fase 1: Ingestão Bronze no Databricks
- **Autor:** Renan
- **O que foi feito:**
  - Catálogo definido como `visagio_atividade_v_energy_360` e schema `bronze`.
  - Criado notebook `Landing_to_Bronze.ipynb` para leitura bruta sem inferência agressiva de schema (`inferSchema=False`).
  - Tabelas Delta criadas com sucesso: `bronze_unidades_consumidoras` (~46 mil), `bronze_leituras` (~2,18 mi), `bronze_medidores` (~52 mil) e `bronze_geracao_distribuida` (~3,5 mil).
  - Adicionadas colunas de auditoria: `_ingested_at` e `_source_file`.
- **Achados de qualidade para a Silver:**
  - `unidades_consumidoras.csv`: Inconsistência na UF (`PE` vs `PERNAMBUCO`), espaços em branco nos nomes de bairros.
  - `leituras`: O dataset tem datas em vários formatos (`YYYY-MM-DD`, `DD/MM/YYYY`, etc.) e leituras com o campo `consumo_apurado_kwh` negativo.
  - `medidores`: Necessidade de isolar qual é o medidor ativo atual de cada UC.
- **Validação de Testes:**
  - Execução: SUCCESS. A volumetria bate exatamente com os arquivos brutos.

### [2026-10-22] - Fase 2: Silver e Tratamento de Anomalias (Zero Abstração)
- **Autor:** Renan
- **O que foi feito:**
  - Criado o notebook `Bronze_to_Silver.ipynb` para higienização e aplicação de regras de negócio.
  - **Decisões Registradas (ADRs):** Tratamento de Rollover (ADR-001) e Identificação de Anomalias de Leitura (ADR-002) que afetam diretamente a fatia de Perdas (Adrian).
  - Parser flexível criado `safe_date_parse_v2` para lidar com 6 padrões de data diferentes.
  - Enriquecimento da UC com os dados de Geração Distribuída (GD) através de `LEFT JOIN`.
  - **Deduplicação Canônica:** Aplicado `Window.partitionBy` em leituras e deduplicação de UCs pelo cadastro mais recente.
- **Achados para o negócio (O enigma da Receita):**
  - Identifiquei que as ~3.500 UCs com GD solar têm seus consumos medidos reduzidos ativamente pela injeção própria. Esse é o principal ofensor da queda de volume físico faturado apontada pelo Diretor Comercial!
- **Próximos Passos:**
  - Modelar o Star Schema da camada Gold.

### [2026-10-24] - Fase 3: Modelagem Gold (Star Schema)
- **Autor:** Renan
- **O que foi feito:**
  - Criado notebook `fatia01_gold.ipynb`.
  - **Dimensão Cadastral:** `dim_unidade_consumidora` gerada contendo os atributos desnormalizados de UC, o número do medidor ativo (lógica de `data_retirada IS NULL`) e a flag `possui_gd`.
  - **Fato de Medição:** `fato_medicao` gerada, calculando `dias_faturamento` via função `lag()` da data anterior e `media_diaria_kwh`.
  - **Isolamento:** Leituras não justificadas negativas foram ejetadas da `fato_medicao` e alocadas na `fato_anomalia_leitura` para alimentar a fila de perdas.
- **Validação de Testes:**
  - Execução: SUCCESS. Integridade referencial garantida; a Gold só contém leituras limpas para análise de faturamento e consumo.

### [2026-10-26] - Fase 4 e 5: Testes de Qualidade e Exportação SQLite (WAL)
- **Autor:** Renan
- **O que foi feito:**
  - Integrado notebook `fatia01_export_sqlite.ipynb`.
  - Passou nos 3 testes rígidos de PySpark (100% de chaves primárias únicas, 0 consumos negativos, 0 leituras órfãs na `fato_medicao`).
  - Exportação via Pandas para SQLite, criando o ficheiro `v_energy.db` na pasta temporária.
  - Habilitado `PRAGMA journal_mode=WAL;` e criados os 5 índices analíticos de alta performance necessários para o portal backend.
  - Ficheiro exportado com sucesso para CSV no Unity Catalog.
- **Validação de Testes:**
  - O banco de dados está íntegro (`PRAGMA integrity_check = ok`).
  - Trabalho destrancado para o Ryei (Faturamento), Célio (Receita), Bernardo (Visão 360) e Miguel (IA).


### [2026-10-27] - Governança: Reorganização de ADRs e Ajuste no Workflow (job.yaml)
- **Autor:** Renan
- **O que foi feito:**
  - Migração das 4 ADRs da Fatia 01 (Rollover, Medidor Ativo, GD Solar e Normalização de Datas/Textos) do documento do Adrian (`DECISOES_PERDAS.md`) para o documento mestre unificado (`DECISOES.md`), reenumerando-as de forma não colidente como ADR-006 a ADR-009.
  - Limpeza do rascunho textual residual no topo de `DECISOES.md`.
  - Atualização do `data-engineering/job.yaml`:
    - Atualizado `notebooks_dir` padrão para `/Workspace/V_Energy_Analytics` (removendo e-mail pessoal).
    - Invertida a precedência para rodar `Testes` (fatia01_testes_qualidade) antes de `fatia01_export_sqlite`, garantindo paridade com a Fatia 02.
    - Atualizada a dependência de `fatia02_export_sqlite` para aguardar o término de `fatia01_export_sqlite`.
  - Atualização dos apontamentos no `DATA_DICTIONARY.md` para as novas ADR-006 e ADR-007.
- **Validação:**
  - `job.yaml`, `DECISOES.md` e `DECISOES_PERDAS.md` revisados e validados.
