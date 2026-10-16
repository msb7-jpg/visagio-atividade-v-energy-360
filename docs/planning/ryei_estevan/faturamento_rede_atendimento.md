# ⚡ Fatia 02: Faturamento, Rede & Atendimento (Ponta a Ponta)

> **Dono Único:** Ryei Estevan  
> **Status:** Não Iniciado  
> **Skill de Referência:** [`.agents/skills/medallion-lakehouse-pipeline/SKILL.md`](.agents/skills/medallion-lakehouse-pipeline/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citação da Liderança (`atividade.pdf`, pág. 2 e 5):
> *"Como em boa parte do setor, o crescimento dos sistemas não veio acompanhado de uma estratégia de dados. O cadastro comercial vive em um sistema; a medição, em outro; as ocorrências de rede, em um terceiro; o call center exporta planilhas; e as inspeções de campo chegam em arquivos Excel preenchidos à mão. Cada área tem a sua versão do cliente, e nenhuma delas conversa com as outras."*

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
- [ ] Ingestão de `faturas.csv` e `ocorrencias_rede.csv` sem alterações de valores.
- [ ] Leitura e parsing de `atendimentos.json` preservando a estrutura original em colunas Struct/Array do Delta.
- [ ] Leitura das 3 abas da planilha `inspecoes.xlsx`.
- [ ] Adicionar metadados `_ingested_at` e `_source_file` em todas as tabelas.
- [ ] Gravar tabelas Delta Bronze:
  - `bronze_faturas`
  - `bronze_ocorrencias_rede`
  - `bronze_atendimentos`
  - `bronze_inspecoes`

### Fase 2: Higienização e Padronização na Camada Silver
- [ ] **Faturas:** Padronizar bandeiras tarifárias (verde, amarela, vermelha 1 e 2), converter valores em R$ para `DecimalType(18, 4)` e calcular status de adimplência.
- [ ] **Ocorrências de Rede:** Tipar início e fim da interrupção como `TimestampType`, calcular duração em horas e normalizar códigos de causa (acidental, programada, emergência).
- [ ] **Atendimentos:** Explodir/normalizar array de tratativas mantendo rastreabilidade do protocolo, motivo do chamado e nota CSAT (0 a 10).
- [ ] **Inspeções:** Unificar as 3 abas da planilha Excel, padronizando motivos de suspeita, irregularidade constatada (sim/não) e energia recuperada em kWh.

### Fase 3: Camada Gold & Cálculo Regulatório ANEEL
- [ ] Construir a tabela de fatos `fato_faturamento`:
  - `id_fatura`, `id_uc`, `competencia`, `valor_total_rs`, `consumo_faturado_kwh`, `bandeira_tarifaria`, `tarifa_aplicada_rs_kwh`, `data_vencimento`, `data_pagamento`, `status_pagamento`.
- [ ] **Cálculo Oficial do DEC e FEC ANEEL:**
  - Implementar fórmula por alimentador e competência:
    $$\text{DEC} = \frac{\sum (t \times C_{\text{int}})}{C_{\text{total}}}, \quad \text{FEC} = \frac{\sum C_{\text{int}}}{C_{\text{total}}}$$
  - Gerar tabela `fato_qualidade_alimentador` contendo `id_alimentador`, `competencia`, `dec_apurado_horas`, `fec_apurado_vezes`, `dec_limite_aneel`, `fec_limite_aneel` e status de estouro de meta.
- [ ] Construir `fato_inspecoes_perdas` e `fato_atendimentos`.

### Fase 4: Orquestração no Databricks & Exportação SQLite
- [ ] Atualizar e validar o Workflow em `data-engineering/job.yaml` orquestrando o DAG completo.
- [ ] Exportar tabelas Gold do domínio para o SQLite local `backend/v_energy.db`.
- [ ] Criar índices analíticos:
  - `CREATE INDEX IF NOT EXISTS idx_fato_fat_uc ON fato_faturamento(id_uc);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_fat_comp ON fato_faturamento(competencia);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_qualidade_alim ON fato_qualidade_alimentador(id_alimentador);`
  - `CREATE INDEX IF NOT EXISTS idx_fato_inspecoes_uc ON fato_inspecoes_perdas(id_uc);`
- [ ] Escrever o Dicionário de Dados oficial em `docs/DATA_DICTIONARY.md`.

### Fase 5: Testes Automatizados de Qualidade
- [ ] Implementar asserções PySpark para:
  - Consistência contábil das faturas (valor total = consumo $\times$ tarifa + encargos).
  - DEC $\ge 0$ e FEC $\ge 0$ em todos os alimentadores.
  - Ausência de registros órfãos entre faturas e cadastro.

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Ryei Estevan - YYYY-MM-DD]`.
2. Após implementar e validar os testes de dados, marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
