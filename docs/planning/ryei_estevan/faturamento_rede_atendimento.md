# ⚡ Fatia 02: Faturamento, Rede & Atendimento (Ponta a Ponta)

> **Dono Único:** Ryei Estevan  
> **Status:** Concluída (Fases 1 a 5)  
> **Skill de Referência:** [`.agents/skills/medallion-lakehouse-pipeline/SKILL.md`](.agents/skills/medallion-lakehouse-pipeline/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Fala da Executiva (`atividade.pdf`, pág. 2):
> **Patrícia Lins · Diretora de Tecnologia:**  
> *"Cada sistema exporta de um jeito. O faturamento sai em CSV com ponto e vírgula, o call center manda JSONs, as inspeções chegam em Excel preenchido à mão. Cada área tem um número diferente para a mesma coisa. Antes de qualquer dashboard, precisamos de engenharia de dados séria. Depois, quero que qualquer pessoa da empresa faça uma pergunta em português e receba a resposta na hora, sem abrir chamado para o meu time."*

> Citação corrigida em 2026-10-26: a versão anterior (mainframe, R$ 4,2 milhões) não consta no PDF do case (apontado pelo João Henrique na issue #23).

### Glossário do case sobre DEC e FEC (`atividade.pdf`, pág. 3):
> *"Nos dados deste case, cada registro de ocorrência corresponde a uma unidade consumidora interrompida, e os valores absolutos são simplificados: servem para comparar alimentadores e períodos entre si, não para comparar com os limites regulatórios reais."*

### User Stories do Case (`atividade.pdf`, pág. 8):
> - *"• Como engenheiro de dados, quero modelar a camada Gold a partir das perguntas de negócio das lideranças, para que o portal e a IA consumam métricas consolidadas."*
> - *"• Como engenheiro de dados, quero calcular DEC e FEC por alimentador conforme a definição da ANEEL, para que a operação acompanhe a continuidade do serviço."*
> - *"• Como engenheiro de dados, quero orquestrar o pipeline em um Workflow do Databricks, para que ele seja reprodutível de ponta a ponta."*
> - *"• Como engenheiro de dados, quero publicar um dicionário de dados da camada Gold, com a definição de cada métrica e as decisões de limpeza que a afetam, para que os indicadores possam ser auditados."*
> - *"• Como engenheiro de dados, quero testes de qualidade automatizados no pipeline, para que uma falha nos dados seja detectada antes de chegar ao portal. (Diferencial)"*

---

## 2. Tabelas sob Responsabilidade

| Arquivo Origem | Volume Aprox. | Descrição do Domínio |
|---|---|---|
| `data/landing/faturas.csv` | 2,18 milhões | Faturamento mensal, bandeira tarifária, vencimento e pagamento. |
| `data/landing/ocorrencias_rede.csv` | 180 mil registros | Interrupções de fornecimento, alimentador afetado, causa e duração. |
| `data/landing/atendimentos.json` | 319 mil registros | Chamados do call center, histórico de tratativas aninhadas e nota de satisfação. |
| `data/landing/inspecoes.xlsx` | 1,4 mil registros | Fiscalizações de campo (3 abas) com resultados de fraude e perdas. |

---

## 3. Checklist Operacional de Execução

### Fase 1: Ingestão na Camada Bronze
- [x] Ingestão de `faturas.csv` e `ocorrencias_rede.csv` sem alterações de valores.
- [x] Leitura e parsing de `atendimentos.json` preservando a estrutura original em colunas Struct/Array do Delta.
- [x] Leitura das 3 abas da planilha `inspecoes.xlsx`.
- [x] Adicionar metadados `_ingested_at` e `_source_file` em todas as tabelas.
- [x] Gravar tabelas Delta Bronze:
  - `bronze_faturas`
  - `bronze_ocorrencias_rede`
  - `bronze_atendimentos`
  - `bronze_inspecoes`

### Fase 2: Higienização e Padronização na Camada Silver
- [x] **Faturas:** Padronizar bandeiras tarifárias (verde, amarela, vermelha 1 e 2), converter valores em R$ para `DecimalType(18, 4)` e calcular status de adimplência.
- [x] **Ocorrências de Rede:** Tipar início e fim da interrupção como `TimestampType`, calcular duração em horas e normalizar códigos de causa (acidental, programada, emergência).
- [x] **Atendimentos:** Explodir/normalizar array de tratativas mantendo rastreabilidade do protocolo, motivo do chamado e nota CSAT (0 a 10).
- [x] **Inspeções:** Unificar as 3 abas da planilha Excel, padronizando motivos de suspeita, irregularidade constatada (sim/não) e energia recuperada em kWh.

### Fase 3: Camada Gold & Cálculo Regulatório ANEEL
- [x] Construir a tabela de fatos `fato_faturamento`:
  - `id_fatura`, `id_uc`, `competencia`, `valor_total_rs`, `consumo_faturado_kwh`, `bandeira_tarifaria`, `tarifa_aplicada_rs_kwh`, `data_vencimento`, `data_pagamento`, `status_pagamento`.
- [x] **Cálculo Oficial do DEC e FEC ANEEL:**
  - Implementar fórmula por alimentador e competência:
    $$\text{DEC} = \frac{\sum (t \times C_{\text{int}})}{C_{\text{total}}}, \quad \text{FEC} = \frac{\sum C_{\text{int}}}{C_{\text{total}}}$$
  - Gerar tabela `fato_qualidade_alimentador` contendo `id_alimentador`, `competencia`, `dec_apurado_horas`, `fec_apurado_vezes`, `dec_limite_aneel`, `fec_limite_aneel` e status de estouro de meta.
- [x] Construir `fato_inspecoes_perdas` e `fato_atendimentos`.

### Fase 4: Orquestração no Databricks & Exportação SQLite
- [x] Atualizar e validar o Workflow em `data-engineering/job.yaml` orquestrando o DAG completo.
- [x] Exportar tabelas Gold do domínio para o SQLite local `backend/v_energy.db` (`fatia02_export_sqlite`).
- [x] Criar índices analíticos:
  - `CREATE INDEX IF NOT EXISTS idx_fato_fat_uc ON fato_faturamento(id_uc);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_fat_comp ON fato_faturamento(competencia);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_qualidade_alim ON fato_qualidade_alimentador(id_alimentador);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_inspecoes_uc ON fato_inspecoes_perdas(id_uc);`
- [x] Escrever o Dicionário de Dados oficial em `docs/DATA_DICTIONARY.md` (seção da Fatia 02).
- [x] Exportar as tabelas Gold também em CSV (Volume `gold/exports`), como pede o case (pág. 4).
- [x] Publicar `fato_ocorrencias_rede` (ocorrências individuais com causa) para as Fatias 03 e 06 (issues #7 e #23).
- [x] Versionar os notebooks em `.ipynb`, como pede a estrutura de repositório do case (pág. 7).

### Fase 5: Testes Automatizados de Qualidade
- [x] Implementar asserções PySpark para (`data-engineering/notebooks/fatia02_testes_qualidade.ipynb`):
  - Consistência contábil das faturas (valor total = valor da energia + tributos; ver changelog 2026-10-23).
  - DEC $\ge 0$ e FEC $\ge 0$ em todos os alimentadores.
  - Ausência de registros órfãos entre faturas e cadastro.

---

## 4. Regras Concretas dos Dados & Contratos de Integração (Fatia 02)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Comportamento e Regras dos Dados (Zero Abstração)
1. **Regra de Faturamento e Bandeira Tarifária:**
   - Padronizar bandeiras tarifárias para string canônica: `'VERDE'`, `'AMARELA'`, `'VERMELHA_P1'`, `'VERMELHA_P2'`.
   - Calcular tarifa aplicada: `tarifa_aplicada_rs_kwh = valor_total_rs / consumo_faturado_kwh`.
   - Adimplência: se `data_pagamento IS NULL` e `data_vencimento < CURRENT_DATE`, `status_pagamento = 'VENCIDA'`; se `data_pagamento IS NULL`, `'ABERTA'`; se preenchida, `'PAGA'`.
2. **Regra do Cálculo Oficial de DEC e FEC:**
   - Para cada `id_alimentador` e `competencia`:
     $$\text{DEC} = \frac{\sum (\text{duracao\_horas} \times \text{ucs\_atingidas})}{C_{\text{total\_alimentador}}}$$
     $$\text{FEC} = \frac{\sum \text{ucs\_atingidas}}{C_{\text{total\_alimentador}}}$$
   - Flag de violação: se `dec_apurado > dec_limite_aneel`, `violou_dec = true`.
3. **Regra de Normalização de Atendimentos JSON:**
   - O array de tratativas dentro de `atendimentos.json` é explodido via `pyspark.sql.functions.explode`.
   - Colunas resultantes: `id_atendimento`, `id_uc`, `numero_protocolo`, `motivo_chamado`, `canal_atendimento`, `data_abertura`, `status_chamado`, `nota_csat` (INT de 0 a 10).
4. **Regra de Unificação das Inspeções:**
   - As 3 abas da planilha `inspecoes.xlsx` são empilhadas em uma única estrutura com schema comum, convertendo `irregularidade_encontrada` em booleano estrito.

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que Ryei Estevan ENTREGA para os outros colegas:**
  - Tabela `fato_faturamento` no SQLite `v_energy.db`:
    - Colunas: `id_fatura` (PK), `id_uc` (FK), `competencia` (TEXT 'YYYY-MM'), `valor_total_rs` (REAL), `consumo_faturado_kwh` (REAL), `bandeira_tarifaria` (TEXT), `tarifa_aplicada_rs_kwh` (REAL), `data_vencimento` (TEXT), `data_pagamento` (TEXT), `status_pagamento` (TEXT).
  - Tabela `fato_qualidade_alimentador` no SQLite `v_energy.db`:
    - Colunas: `id_alimentador` (PK), `competencia` (PK), `dec_apurado_horas` (REAL), `fec_apurado_vezes` (REAL), `dec_limite_aneel` (REAL), `fec_limite_aneel` (REAL), `violou_meta` (BOOLEAN).
  - Tabela `fato_atendimentos` no SQLite `v_energy.db`:
    - Colunas: `id_atendimento` (PK), `id_uc` (FK), `numero_protocolo` (TEXT), `motivo_chamado` (TEXT), `data_abertura` (TEXT), `status_chamado` (TEXT), `nota_csat` (INT).
  - Tabela `fato_inspecoes_perdas` no SQLite `v_energy.db`:
    - Colunas: `id_inspecao` (PK), `id_uc` (FK), `data_inspecao` (TEXT), `irregularidade_constatada` (BOOLEAN), `tipo_irregularidade` (TEXT), `kwh_recuperado` (REAL).
  - Dicionário de dados documentado em `docs/DATA_DICTIONARY.md`.
- **O que Ryei Estevan RECEBE dos outros colegas:**
  - Recebe os dados brutos de `faturas.csv`, `ocorrencias_rede.csv`, `atendimentos.json` e `inspecoes.xlsx` em `data/landing/`.
  - Conecta com `dim_unidade_consumidora` de Renan para garantir integridade referencial nas chaves estrangeiras.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Ryei Estevan - YYYY-MM-DD]`.
2. Após implementar e validar os testes de dados, marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


