# 📊 Fatia 01: Cadastro, Medição & Geração Própria (Ponta a Ponta)

> **Dono Único:** Renan  
> **Status:** Não Iniciado  
> **Skill de Referência:** [`.agents/skills/medallion-lakehouse-pipeline/SKILL.md`](.agents/skills/medallion-lakehouse-pipeline/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citação da Liderança (`atividade.pdf`, pág. 10):
> *"Os dados são o coração da solução. Um portal que exibe dados sujos ou inconsistentes é pior do que um portal simples com dados limpos. Invistam tempo na etapa de engenharia de dados, pois ela impacta todas as outras."*

### User Stories do Case (`atividade.pdf`, pág. 8):
> - *"Como engenheiro de dados, quero ingerir todos os arquivos do dataset na camada Bronze preservando o conteúdo original, para garantir a rastreabilidade dos dados brutos."*
> - *"Como engenheiro de dados, quero que a camada Silver entregue dados confiáveis para análise, com os problemas de qualidade identificados e tratados."*
> - *"Como engenheiro de dados, quero garantir a integridade referencial entre medição, faturamento e cadastro, para que nenhuma análise dependa de registros órfãos."*
> - *"Como engenheiro de dados, quero exportar a camada Gold para um banco local integrado ao backend do portal, para que o time de desenvolvimento trabalhe sem depender do Databricks."*

---

## 2. Tabelas sob Responsabilidade

| Arquivo Origem | Volume Aprox. | Descrição do Domínio |
|---|---|---|
| `data/landing/unidades_consumidoras.csv` | 46 mil registros | Cadastro das UCs (14 municípios, ~300 bairros, 120 alimentadores, classes B1, B2, B3, A4). |
| `data/landing/leituras/` (5 arquivos) | 2,18 milhões | Medição mensal por ano: leitura anterior, atual e consumo apurado em kWh. |
| `data/landing/medidores.csv` | 52 mil registros | Parque de medidores, datas de instalação, retirada e status. |
| `data/landing/geracao_distribuida.csv` | 3,5 mil registros | Unidades com geração solar conectada, potência instalada e data de conexão. |

---

## 3. Checklist Operacional de Execução

### Fase 1: Ingestão na Camada Bronze
- [ ] Ler `unidades_consumidoras.csv` sem alteração de schemas ou valores brutos.
- [ ] Ler os 5 arquivos da pasta `leituras/` unificando a partição histórica de medições.
- [ ] Ler `medidores.csv` e `geracao_distribuida.csv`.
- [ ] Anexar metadados obrigatórios em todas as tabelas: `_ingested_at` (timestamp atual) e `_source_file` (nome do arquivo de origem).
- [ ] Gravar tabelas Delta Bronze:
  - `bronze_unidades_consumidoras`
  - `bronze_leituras`
  - `bronze_medidores`
  - `bronze_geracao_distribuida`

### Fase 2: Higienização e Enriquecimento na Camada Silver
- [ ] **Tipagem e Padronização:**
  - Converter datas (`data_leitura`, `data_instalacao_medidor`, `data_conexao_gd`) para `DateType` / `TimestampType`.
  - Converter consumos (`consumo_apurado_kwh`, `potencia_instalada_kw`) para `DoubleType` ou `DecimalType(18, 4)`.
  - Aplicar `trim()` e normalização de maiúsculas em municípios e bairros.
- [ ] **Deduplicação Canônica:**
  - Deduplicar `id_uc` determinando a foto cadastral mais atualizada.
  - Eliminar registros duplicados de leituras com a mesma competência e `id_uc`.
- [ ] **Integridade Referencial & Órfãos:**
  - Identificar e isolar leituras que referenciam UCs inexistentes.
  - Criar log/métrica de contagem de órfãos para auditoria.
- [ ] **Enriquecimento:**
  - Adicionar flag booleano `possui_geracao_solar` e coluna `potencia_solar_kw` no cadastro da UC via junção com `geracao_distribuida`.

### Fase 3: Modelagem Star Schema na Camada Gold
- [ ] Construir a dimensão `dim_unidade_consumidora` com atributos desnormalizados:
  - `id_uc`, `codigo_cliente`, `classe_consumo`, `subgrupo_tarifario`, `municipio`, `bairro`, `alimentador`, `subestacao`, `numero_medidor_ativo`, `possui_gd`, `potencia_gd_kw`.
- [ ] Construir a dimensão `dim_tempo` / `dim_calendario` (ano, mês, competência formatada MM/YYYY).
- [ ] Construir a tabela de fatos `fato_medicao`:
  - `id_medicao`, `id_uc`, `competencia`, `leitura_anterior`, `leitura_atual`, `consumo_kwh`, `dias_faturamento`, `media_diaria_kwh`.

### Fase 4: Exportação para o SQLite Local (`backend/v_energy.db`)
- [ ] Script de exportação das tabelas Gold do seu domínio para SQLite em modo WAL (`PRAGMA journal_mode=WAL;`).
- [ ] Criar índices analíticos essenciais:
  - `CREATE INDEX IF NOT EXISTS idx_dim_uc_id ON dim_unidade_consumidora(id_uc);`
  - `CREATE INDEX IF NOT EXISTS idx_dim_uc_bairro ON dim_unidade_consumidora(bairro);`
  - `CREATE INDEX IF NOT EXISTS idx_dim_uc_mun ON dim_unidade_consumidora(municipio);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_med_uc ON fato_medicao(id_uc);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_med_comp ON fato_medicao(competencia);`

### Fase 5: Testes Automatizados de Qualidade
- [ ] Implementar asserções PySpark / Great Expectations testando:
  - Unicidade da chave primária de `dim_unidade_consumidora` (zero duplicatas).
  - Ausência de valores negativos em `consumo_kwh` sem justificativa regulatória.
  - Integridade referencial: 100% dos `id_uc` em `fato_medicao` presentes na dimensão.
- [ ] Executar testes e garantir validação verde.

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Renan - YYYY-MM-DD]`.
2. Após implementar e validar os testes de dados, marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
