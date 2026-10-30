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


### [2026-10-28] - Correção: Reversão de Mojibake nos Nomes de Bairros (Silver e Testes)
- **Autor:** Renan
- **O que foi feito:**
  - Identificada a causa da duplicação de 61 bairros em `dim_unidade_consumidora` (348 UCs corrompidas com dupla codificação UTF-8/Latin-1 no `unidades_consumidoras.csv`).
  - Implementado o UDF `fix_mojibake` em `data-engineering/notebooks/fatia01_silver.ipynb`, revertendo strings double-encoded (`texto.encode("latin-1").decode("utf-8")`) com tratamento estrito de exceção antes da remoção de acentos.
  - Integrado o `fix_mojibake` à função `clean_string`, corrigindo automaticamente `bairro`, `municipio`, `logradouro` e `nome_titular`.
  - Adicionados testes de qualidade em `data-engineering/notebooks/fatia01_testes_qualidade.ipynb`:
    - PySpark: asserção de que nenhum bairro possui caracteres fora do intervalo ASCII padrão `[^ -~]`.
    - SQLite: conferência via `SELECT COUNT(*) FROM dim_unidade_consumidora WHERE bairro GLOB '*[^ -~]*'` retornando zero.
  - Atualizada a especificação na **ADR-009** em `docs/DECISOES.md`.
  - Movido o apontamento correspondente em `docs/CORRECOES.md` para "Já resolvido".
- **Validação:**
  - Simulação direta na base bruta confirmou a unificação exata de todos os bairros apontados (ex.: `Brasília Teimosa` unificada de 2.075 + 55 para 2.130 UCs; `Águas Compridas` de 224 + 12 para 236 UCs) e zero violações na consulta GLOB.

### [2026-10-30] - Evidências para o diagnóstico da receita e conferência da IA
- **Autor:** Renan
- **O que foi feito:**
  - Atualizado `docs/DIAGNOSTICO_RECEITA.md` com a conclusão de fraude nos quatro bairros, concentração de 828 das 871 irregularidades confirmadas, comparações de volume e tarifa, e valores estimados separados entre perda, saldo vencido e retorno esperado.
  - Atualizado `docs/DATA_DICTIONARY.md` explicando a tabela de anomalias vazia e a preservação dos 35 valores de GD acima de 100 kWp.
  - Conferidos os CSVs brutos: 6.327 quedas de índice com valores numéricos coincidem com retirada de medidor na mesma UC e competência segundo a regra atual; 35 potências de GD excedem 100 kWp, com máximo de 8.994,91.
  - Revisados o serviço e os testes da IA; registrada em `docs/CORRECOES.md` a aceitação de métricas livres do cliente e a ausência de comparação do resultado esperado no avaliador.
  - Reconstruída a contagem territorial a partir dos CSVs com uma aproximação local das regras atuais da Silver: 888 UCs com queda ≥40% comparando totais de maio/2024–abril/2025 e maio/2025–abril/2026; 890 comparando médias mensais dos meses disponíveis; 880 exigindo 12 meses completos nas duas janelas. Nenhuma definição reproduz os 887 divulgados.
- **Pendências de evidência:** obter a consulta e os critérios originais da contagem de 887 UCs e validá-los na Gold; a comparação dos sete valores territoriais com a tela também precisa ser anexada.
- **Validação:** testes focados da IA não executaram: `uv` não está instalado e `python -m pytest` não conseguiu coletar por dependências ausentes (`langchain_core`, `email_validator`). Nenhum código de aplicação ou notebook foi alterado.

### [2026-10-30] - Benchmark das consultas analíticas do SQLite
- **Autor:** Renan
- **O que foi feito:**
  - Medidos planos e tempos no `v_energy.db` da raiz, em modo somente leitura, com 773,6 MB e 2.152.336 faturas e medições. Os scans de faturamento e medição, os `COUNT(DISTINCT)` da Receita e o `GROUP BY` da fila foram confirmados nos planos.
  - Comparados os PRAGMAs padrão com `mmap_size=268435456`, `cache_size=-64000` e `temp_store=MEMORY`. O mmap isolado foi o principal ganho: fila de perdas 3,72 s → 1,31 s e leituras 1,02 s → 0,88 s; os demais tiveram regressões pequenas. Cache maior e armazenamento temporário em memória isoladamente não melhoraram consistentemente.
  - Identificada outra consulta pesada no warmup: a agregação da razão da carteira (`PortfolioRepositoryMixin`) faz scan/agrupamento de medições e retornou 44.996 razões; mediana 4,07 s no padrão e 1,44 s com mmap.
  - Executado o warmup completo com os repositórios/serviços reais: 17,4 s no padrão e 12,0 s com mmap de 256 MiB. Duas execuções concorrentes levaram 19,7 s e 13,6 s; o pico RSS subiu 16 MiB no padrão, 121 MiB com 64 MiB mmap, 214 MiB com 128 MiB e 396 MiB com 256 MiB. Os resultados permaneceram em 165 UCs e cinco grupos de indicadores.
  - Confirmada a equivalência da Receita sem o JOIN no caso sem filtros (3,64 s → 2,66 s; oito resultados iguais; zero UCs órfãs) e do intervalo semiaberto de datas em atendimentos (227 ms → 184 ms; mesmos resultados).
  - Registradas as recomendações e ressalvas por fatia em `docs/CORRECOES.md`; nenhum código de outras fatias foi alterado.
- **Limite:** a base somente leitura não continha `ordem_inspecao`; a consulta da fila usou uma tabela temporária vazia, portanto deve ser repetida após o startup/migração operacional.
- **Decisão:** não aplicar `mmap_size` globalmente sem orçamento de memória para a concorrência observada; preferir primeiro as otimizações locais e reavaliar com a configuração real do pool.
- **Validação:** medições repetidas em conexões SQLite novas e warmup em modo somente leitura; sem alteração de código, não se aplicam testes de aplicação.
