# Dicionário de Dados — Camada Gold (`v_energy.db`)

Este dicionário descreve as tabelas que o pipeline Databricks publica no SQLite `backend/v_energy.db`, consumido pelo backend e pelo agente de IA. Cada métrica traz a regra de cálculo e as decisões de limpeza que a afetam, para que os números possam ser auditados.

**Convenções do SQLite**

| Tipo lógico | Como é gravado | Exemplo |
|---|---|---|
| Competência (mês) | `TEXT` `yyyy-MM` | `2025-12` |
| Data | `TEXT` `yyyy-MM-dd` | `2025-08-01` |
| Data e hora | `TEXT` `yyyy-MM-dd HH:mm:ss` | `2022-07-02 15:51:00` |
| Decimal / moeda (R$) | `REAL` | `102.57` |
| Booleano | `BOOLEAN` (`0` / `1`) | `1` |

**Origem:** catálogo `visagio_atividade_v_energy_360`, schema `gold` (ADR-004). Job: [`data-engineering/job.yaml`](../data-engineering/job.yaml).

---

## Fatia 01 — Cadastro, Medição & GD (Renan)

Tabelas `dim_unidade_consumidora`, `dim_tempo`, `fato_medicao` e `fato_anomalia_leitura`: seção a ser preenchida pelo dono da Fatia 01.

---

## Fatia 02 — Faturamento, Rede & Atendimento (Ryei Estevan)

Notebooks: `fatia02_bronze`, `fatia02_silver`, `fatia02_gold`, `fatia02_testes_qualidade` e `fatia02_export_sqlite` em [`data-engineering/notebooks/`](../data-engineering/notebooks/). Decisões: [`DECISOES.md`](DECISOES.md) (ADR-001 a ADR-004).

### `fato_faturamento`

- **Grão:** 1 fatura de uma UC cadastrada. **Chave:** `id_fatura`. **FK:** `id_uc` → `dim_unidade_consumidora`.
- **Origem:** `faturas.csv` (Fatia 02) + `silver_leituras` (Fatia 01) para o consumo.
- **Linhas:** 2.152.336. **Índices:** `idx_fato_fat_uc` (`id_uc`), `idx_fato_fat_comp` (`competencia`).

| Coluna | Tipo | Descrição e regra |
|---|---|---|
| `id_fatura` | TEXT | Identificador da fatura na origem. |
| `id_uc` | TEXT | Unidade consumidora faturada. |
| `competencia` | TEXT | Mês de referência da fatura (`yyyy-MM`). |
| `valor_energia_rs` | REAL | Valor da energia, em R$. |
| `tributos_rs` | REAL | Tributos da fatura, em R$. |
| `valor_total_rs` | REAL | Total da fatura, em R$. Sempre igual a `valor_energia_rs + tributos_rs` (testado). |
| `consumo_faturado_kwh` | REAL | Consumo do mês, vindo da leitura da Fatia 01 com a mesma UC e competência. Nulo quando a leitura não tem consumo válido (6.329 faturas). |
| `bandeira_tarifaria` | TEXT | `VERDE`, `AMARELA`, `VERMELHA_P1` ou `VERMELHA_P2` (grafias da origem padronizadas). |
| `tarifa_aplicada_rs_kwh` | REAL | `valor_total_rs / consumo_faturado_kwh`. Só calculada quando o consumo é maior que zero; caso contrário, nula. |
| `data_emissao` | TEXT | Data de emissão. A origem mistura 4 formatos; quando dia e mês são ambíguos, vale a leitura cujo mês bate com a competência. |
| `data_vencimento` | TEXT | Data de vencimento. |
| `data_pagamento` | TEXT | Data do pagamento; nula se não paga. |
| `status_pagamento` | TEXT | Recalculado pelas datas: `PAGA` (tem pagamento), `VENCIDA` (sem pagamento e vencimento já passou), `ABERTA` (sem pagamento e ainda no prazo). A origem trazia `EM ABERTO` com pagamento registrado, por isso não é usada. |

**Decisões de limpeza que afetam a tabela**

- Valores monetários chegam em dois formatos (`242.56` e `R$ 1.000,11`) e são convertidos para decimal.
- Linhas de cabeçalho repetidas no meio do arquivo (2) são descartadas.
- 32.285 faturas (`FTX*`) apontam para UCs que não existem no cadastro (`UC9xxxxxx`), somando R$ 10.192.373,82. Ficam fora da Gold e permanecem auditáveis em `silver.silver_faturas` (`fl_uc_cadastrada = false`).

### `fato_qualidade_alimentador`

- **Grão:** 1 alimentador × 1 competência (grade completa: meses sem interrupção têm DEC = FEC = 0). **Chave:** (`id_alimentador`, `competencia`).
- **Origem:** `ocorrencias_rede.csv`, cadastro de UCs da Fatia 01 (`C_total`) e limites oficiais da ANEEL (ADR-003).
- **Linhas:** 5.856 (122 alimentadores × 48 meses). **Índices:** `idx_fato_qualidade_alim` (`id_alimentador`), `idx_fato_qualidade_comp` (`competencia`).

| Coluna | Tipo | Descrição e regra |
|---|---|---|
| `id_alimentador` | TEXT | Alimentador. O código do meio indica o município (`ALM-JAB-016` = Jaboatão). |
| `competencia` | TEXT | Mês apurado (`yyyy-MM`). |
| `conjunto_aneel` | TEXT | Conjunto elétrico ANEEL usado para o limite, ou `MEDIANA RMR`. |
| `criterio_limite` | TEXT | `CONJUNTO` (limite do próprio município) ou `MEDIANA_RMR` (Recife, Paulista, Abreu e Lima e Araçoiaba: mediana dos 10 conjuntos mapeados — aproximação). |
| `ucs_atendidas` | INTEGER | `C_total`: UCs do cadastro ligadas ao alimentador. |
| `ucs_interrompidas` | INTEGER | UCs interrompidas no mês (cada linha de ocorrência é 1 UC). |
| `dec_apurado_horas` | REAL | DEC do mês = soma das horas de interrupção das UCs / `C_total`. |
| `fec_apurado_vezes` | REAL | FEC do mês = UCs interrompidas / `C_total`. |
| `dec_acumulado_ano_horas` | REAL | Soma do DEC de janeiro até a competência, no mesmo ano. |
| `fec_acumulado_ano_vezes` | REAL | Soma do FEC de janeiro até a competência, no mesmo ano. |
| `dec_limite_aneel` | REAL | Limite **anual** de DEC do conjunto (horas). |
| `fec_limite_aneel` | REAL | Limite **anual** de FEC do conjunto (vezes). |
| `violou_dec` | BOOLEAN | `dec_acumulado_ano_horas > dec_limite_aneel`. |
| `violou_fec` | BOOLEAN | `fec_acumulado_ano_vezes > fec_limite_aneel`. |
| `violou_meta` | BOOLEAN | `violou_dec OR violou_fec`. |

**Decisões que afetam a tabela**

- O limite da ANEEL é anual, então a comparação usa sempre o **acumulado no ano**, nunca o valor de um mês (ADR-003).
- Causas vazias (`-`, `N/A`, `NULL`) viram `NAO INFORMADA`; duração com sufixo (`74 min`) é normalizada.
- 2022 (a partir de julho) e 2026 (até junho) são anos incompletos: o acumulado desses anos não é comparável a um ano cheio.
- Alimentadores com poucas UCs têm DEC/FEC altos com poucas interrupções. A média da empresa deve ser ponderada por `ucs_atendidas`.

### `fato_atendimentos`

- **Grão:** 1 protocolo de atendimento. **Chave:** `id_atendimento`.
- **Origem:** `atendimentos.json`. **Linhas:** 318.871. **Índice:** `idx_fato_atend_uc` (`id_uc`).

| Coluna | Tipo | Descrição e regra |
|---|---|---|
| `id_atendimento` | TEXT | Protocolo do atendimento. |
| `id_uc` | TEXT | UC que abriu o chamado. |
| `numero_protocolo` | TEXT | Igual a `id_atendimento` (mantido para o contrato do portal). |
| `motivo_chamado` | TEXT | Assunto do chamado. |
| `submotivo_chamado` | TEXT | Subassunto do chamado. |
| `canal_atendimento` | TEXT | Canal de abertura: `APP`, `PRESENCIAL`, `SITE`, `TELEFONE` ou `WHATSAPP`. |
| `data_abertura` | TEXT | Data e hora de abertura. |
| `data_fechamento` | TEXT | Data e hora de encerramento; nula se aberto. |
| `status_chamado` | TEXT | `ENCERRADO` se tem data de fechamento, senão `ABERTO`. |
| `tempo_resolucao_horas` | REAL | Horas entre abertura e fechamento; nulo se aberto. |
| `qtd_tratativas` | INTEGER | Quantidade de tratativas no histórico do chamado (detalhe em `silver.silver_atendimentos_tratativas`). |
| `nota_csat` | REAL | Nota de satisfação na escala **1 a 5**, como na origem (ADR-001). Nula quando o cliente não avaliou (9.566 protocolos); médias ignoram nulos. |

### `fato_inspecoes_perdas`

- **Grão:** 1 inspeção de campo. **Chave:** `id_inspecao`.
- **Origem:** `inspecoes.xlsx` (3 abas unificadas). **Linhas:** 1.389. **Índice:** `idx_fato_inspecoes_uc` (`id_uc`).

| Coluna | Tipo | Descrição e regra |
|---|---|---|
| `id_inspecao` | TEXT | Identificador da inspeção. |
| `id_uc` | TEXT | UC inspecionada. |
| `data_inspecao` | TEXT | Data da inspeção. Datas ambíguas são resolvidas pela janela da campanha (ago–dez/2025). |
| `id_inspetor` | TEXT | Inspetor responsável. |
| `irregularidade_constatada` | BOOLEAN | `1` quando o resultado indica irregularidade confirmada (8 grafias da origem unificadas). |
| `tipo_irregularidade` | TEXT | Tipo de irregularidade (ex.: `BY-PASS`); nulo quando não há. |
| `kwh_recuperado` | REAL | Energia recuperada pela inspeção, em kWh (decimais com vírgula convertidos). |

### Testes de qualidade da Fatia 02

O notebook `fatia02_testes_qualidade` roda antes da exportação e interrompe o job se qualquer regra falhar (19 testes): totais das faturas, ausência de órfãs, chaves únicas, DEC/FEC ≥ 0, limites ANEEL preenchidos, grade alimentador × mês completa, CSAT entre 1 e 5, datas das inspeções na campanha e contagens iguais às da Silver. O `fatia02_export_sqlite` confere ainda contagens SQLite = Gold, chaves estrangeiras e `PRAGMA integrity_check`.
