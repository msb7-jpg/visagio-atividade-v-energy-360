# 📊 Fatia 01: Cadastro, Medição & Geração Própria (Ponta a Ponta)

> **Dono Único:** Renan  
> **Status:** Não Iniciado  
> **Skill de Referência:** [`.agents/skills/medallion-lakehouse-pipeline/SKILL.md`](.agents/skills/medallion-lakehouse-pipeline/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## Trabalho compartilhado atual — Diagnóstico da Receita

- [- Em andamento por Renan - 2026-10-30] Contribuição para fechar `docs/DIAGNOSTICO_RECEITA.md`: consolidar a evidência de fraude nos quatro bairros, explicar divergências de receita/volume e reconciliar a contagem divulgada de 887 UCs com queda ≥40% antes de validar os sete valores territoriais contra a tela.
- [x] Documentar no dicionário de dados por que `fato_anomalia_leitura` está vazia e a origem/tratamento dos 35 valores de GD acima de 100 kWp.
- [x] Conferir a fatia de IA de Miguel usando `docs/CHECKLIST.md` e registrar evidências ou pendências transversais sem editar o checklist coordenado por João.

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
- [x] Ler `unidades_consumidoras.csv` sem alteração de schemas ou valores brutos.
- [x] Ler os 5 arquivos da pasta `leituras/` unificando a partição histórica de medições.
- [x] Ler `medidores.csv` e `geracao_distribuida.csv`.
- [x] Anexar metadados obrigatórios em todas as tabelas: `_ingested_at` (timestamp atual) e `_source_file` (nome do arquivo de origem).
- [x] Gravar tabelas Delta Bronze:
  - `bronze_unidades_consumidoras`
  - `bronze_leituras`
  - `bronze_medidores`
  - `bronze_geracao_distribuida`

### Fase 2: Higienização e Enriquecimento na Camada Silver
- [x] **Tipagem e Padronização:**
  - Converter datas (`data_leitura`, `data_instalacao_medidor`, `data_conexao_gd`) para `DateType` / `TimestampType`.
  - Converter consumos (`consumo_apurado_kwh`, `potencia_instalada_kw`) para `DoubleType` ou `DecimalType(18, 4)`.
  - Aplicar `trim()` e normalização de maiúsculas em municípios e bairros.
- [x] **Deduplicação Canônica:**
  - Deduplicar `id_uc` determinando a foto cadastral mais atualizada.
  - Eliminar registros duplicados de leituras com a mesma competência e `id_uc`.
- [x] **Integridade Referencial & Órfãos:**
  - Identificar e isolar leituras que referenciam UCs inexistentes.
  - Criar log/métrica de contagem de órfãos para auditoria.
- [x] **Enriquecimento:**
  - Adicionar flag booleano `possui_geracao_solar` e coluna `potencia_solar_kw` no cadastro da UC via junção com `geracao_distribuida`.

### Fase 3: Modelagem Star Schema na Camada Gold
- [x] Construir a dimensão `dim_unidade_consumidora` com atributos desnormalizados:
  - `id_uc`, `codigo_cliente`, `classe_consumo`, `subgrupo_tarifario`, `municipio`, `bairro`, `alimentador`, `subestacao`, `numero_medidor_ativo`, `possui_gd`, `potencia_gd_kw`.
- [x] Construir a dimensão `dim_tempo` / `dim_calendario` (ano, mês, competência formatada MM/YYYY).
- [x] Construir a tabela de fatos `fato_medicao`:
  - `id_medicao`, `id_uc`, `competencia`, `leitura_anterior`, `leitura_atual`, `consumo_kwh`, `dias_faturamento`, `media_diaria_kwh`.

### Fase 4: Exportação para o SQLite Local (`backend/v_energy.db`)
- [x] Script de exportação das tabelas Gold do seu domínio para SQLite em modo WAL (`PRAGMA journal_mode=WAL;`).
- [x] Criar índices analíticos essenciais:
  - `CREATE INDEX IF NOT EXISTS idx_dim_uc_id ON dim_unidade_consumidora(id_uc);`
  - `CREATE INDEX IF NOT EXISTS idx_dim_uc_bairro ON dim_unidade_consumidora(bairro);`
  - `CREATE INDEX IF NOT EXISTS idx_dim_uc_mun ON dim_unidade_consumidora(municipio);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_med_uc ON fato_medicao(id_uc);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_med_comp ON fato_medicao(competencia);`

### Fase 5: Testes Automatizados de Qualidade
- [x] Implementar asserções PySpark / Great Expectations testando:
  - Unicidade da chave primária de `dim_unidade_consumidora` (zero duplicatas).
  - Ausência de valores negativos em `consumo_kwh` sem justificativa regulatória.
  - Integridade referencial: 100% dos `id_uc` em `fato_medicao` presentes na dimensão.
- [x] Executar testes e garantir validação verde.

---

## 4. Regras Concretas dos Dados & Contratos de Integração (Fatia 01)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Comportamento e Regras dos Dados (Zero Abstração)
1. **Regra de Virada de Medidor (*Rollover*):**
   - Se `leitura_atual < leitura_anterior` e `leitura_anterior >= 90000` e `leitura_atual <= 10000`, calcular:  
     $$\text{Consumo} = (100000 - \text{leitura\_anterior}) + \text{leitura\_atual}$$
2. **Regra de Troca Física de Medidor:**
   - Cruzar com `medidores.csv`. Se houve desinstalação na competência, o consumo do mês é a soma residual do medidor retirado com o início do novo medidor.
3. **Regra de Consumo Negativo sem Justificativa:**
   - Leituras onde `leitura_atual < leitura_anterior` sem rollover ou troca física registrada são isoladas com flag `anomalia_leitura = true` e descartadas do consumo oficial, gerando evento para a fila de perdas de Adrian Cesar.
4. **Regra de Enriquecimento de GD Solar:**
   - Realizar `LEFT JOIN` do cadastro com `geracao_distribuida.csv` por `id_uc`. Se existir correspondência:
     - `possui_gd = true`
     - `potencia_gd_kw = valor_do_arquivo`
     - `data_conexao_gd = data_do_arquivo`
   - Se não existir correspondência: `possui_gd = false` e `potencia_gd_kw = 0.0`.

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que Renan ENTREGA para os outros colegas:**
  - Tabela `dim_unidade_consumidora` no SQLite `v_energy.db`:
    - Colunas: `id_uc` (PK), `codigo_cliente`, `classe_consumo`, `subgrupo_tarifario`, `municipio`, `bairro`, `alimentador`, `subestacao`, `numero_medidor_ativo`, `possui_gd` (BOOLEAN), `potencia_gd_kw` (REAL).
  - Tabela `fato_medicao` no SQLite `v_energy.db`:
    - Colunas: `id_medicao` (PK), `id_uc` (FK), `competencia` (TEXT 'YYYY-MM'), `leitura_anterior` (REAL), `leitura_atual` (REAL), `consumo_kwh` (REAL), `dias_faturamento` (INT).
- **O que Renan RECEBE dos outros colegas:**
  - Recebe os dados brutos extraídos em `data/landing/` (unidades, leituras, medidores, geracao_distribuida).
  - Não depende de código de frontend ou backend dos outros desenvolvedores para rodar seus notebooks e exportar o SQLite.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Renan - YYYY-MM-DD]`.
2. Após implementar e validar os testes de dados, marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).