# Dicionário de Dados — Camada Gold (`v_energy.db`)

Este dicionário descreve as tabelas que o pipeline Databricks publica em CSV (Volume `gold/exports`, um arquivo `<tabela>.csv` por tabela) e no SQLite `backend/v_energy.db`, consumido pelo backend e pelo agente de IA. Cada métrica traz a regra de cálculo e as decisões de limpeza que a afetam, para que os números possam ser auditados.

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

Notebooks associados: `Landing_to_Bronze`, `Bronze_to_Silver`, `fatia01_gold`, e `fatia01_export_sqlite`. Decisões: [`DECISOES.md`](DECISOES.md).

### `dim_unidade_consumidora`

- **Grão:** 1 unidade consumidora (UC) consolidada. **Chave Primária:** `id_uc`.
- **Origem:** `unidades_consumidoras.csv`, com cruzamentos de `medidores.csv` e `geracao_distribuida.csv`.
- **Uso:** Filtros de região, painéis de inteligência comercial, e base para visão 360 do cliente.

| Coluna | Tipo | Descrição e Regra |
|---|---|---|
| `id_uc` | TEXT | Identificador único da unidade consumidora. PK. |
| `codigo_cliente` | TEXT | Documento do cliente associado (CNPJ/CPF normalizado na Silver, apenas números). |
| `nome_titular` | TEXT | Nome do responsável limpo sem caracteres especiais. |
| `logradouro` | TEXT | Rua/Avenida, padronizado para maiúsculas. |
| `numero` | TEXT | Número do endereço; nulo se inferior a zero na origem. |
| `bairro` | TEXT | Bairro padronizado (acentos e espaços em branco removidos). |
| `municipio` | TEXT | Município da Região Metropolitana do Recife. |
| `uf` | TEXT | UF consolidada (ex: conversão de 'PERNAMBUCO' para 'PE'). |
| `cep` | TEXT | CEP limpo (exatamente 8 dígitos); caso contrário, nulo. |
| `classe_consumo` | TEXT | Residencial, Comercial, Industrial, etc. (vem de `classe`). |
| `subgrupo_tarifario` | TEXT | B1, B2, B3, A4 (trim e maiúsculas). |
| `alimentador` | TEXT | Circuito da rede ao qual a UC está conectada. |
| `subestacao` | TEXT | Projetado como Nulo na primeira versão. |
| `numero_medidor_ativo` | TEXT | Número do medidor fisicamente instalado hoje (calculado via ADR-002: status = ATIVO ou retirada nula). |
| `possui_gd` | BOOLEAN | `1` se existe no cadastro de geração distribuída, senão `0`. |
| `potencia_gd_kw` | REAL | Potência instalada de geração solar em kW (se aplicável). |
| `data_conexao_gd` | TEXT | Data de ligação da geração própria. |
| `status` | TEXT | `ATIVA` ou `INATIVA`. |

### `fato_medicao`

- **Grão:** 1 leitura de consumo por competência por UC. **Chave Primária:** `id_medicao`. **FK:** `id_uc`.
- **Origem:** `leituras/*.csv`.
- **Uso:** Cálculo primário de volume físico (kWh) consumido, histórico 12m YoY. Exclui leituras anômalas.

| Coluna | Tipo | Descrição e Regra |
|---|---|---|
| `id_medicao` | TEXT | Conciliação do `id_uc` + `competencia`. |
| `id_uc` | TEXT | FK para `dim_unidade_consumidora`. Leituras sem UC (órfãs) foram descartadas e registradas em auditoria. |
| `id_medidor` | TEXT | Medidor associado à leitura no momento do faturamento. |
| `competencia` | TEXT | Mês de referência no formato `yyyy-MM`. |
| `data_leitura` | TEXT | Data real em que o relógio foi aferido (`yyyy-MM-dd`). |
| `leitura_anterior` | REAL | Índice anterior do medidor. |
| `leitura_atual` | REAL | Índice atual medido. |
| `consumo_kwh` | REAL | Consumo real faturável. Tratado para cenários de *rollover* de relógio (ADR-001). Sem valores negativos. |
| `dias_faturamento` | INTEGER | `data_leitura` atual menos a `data_leitura` anterior. Padrão de 30 dias se nulo. |
| `media_diaria_kwh` | REAL | Consumo / dias faturamento, útil para comparações independentemente de ciclos longos/curtos. |
| `tipo_leitura` | TEXT | `REAL` (leiturista) ou `ESTIMADA` (fechado pela média por impossibilidade de acesso). |

### `fato_anomalia_leitura`

- **Grão:** 1 leitura inválida/anômala identificada pela engenharia. **Chave Primária:** `id_anomalia`.
- **Origem:** Isolado das leituras brutas.
- **Uso:** Fila de prioridade de Perdas (Adrian César).

| Coluna | Tipo | Descrição e Regra |
|---|---|---|
| `id_anomalia` | TEXT | Identificador único (`id_uc` + `competencia`). |
| `id_uc` | TEXT | UC onde foi detectada anomalia. |
| `diferenca_leitura_kwh` | REAL | Quantidade de kWh "negativos" inexplicados (`leitura_atual` - `leitura_anterior`). |
| `motivo_anomalia` | TEXT | Definido como `LEITURA_ATUAL_MENOR_SEM_ROLLOVER_OU_TROCA` (indício de fraude ou by-pass). |

### `dim_tempo`

- **Grão:** 1 mês de competência (yyyy-MM).
- **Uso:** Agregação cronológica e gráficos de eixo X no portal analítico.

| Coluna | Tipo | Descrição e Regra |
|---|---|---|
| `competencia` | TEXT | Formato `yyyy-MM`. PK. |
| `ano` | INTEGER | Ano extraído. |
| `mes` | INTEGER | Mês do calendário (1 a 12). |

---

## Fatia 02 — Faturamento, Rede & Atendimento (Ryei Estevan)

Notebooks: `fatia02_bronze`, `fatia02_silver`, `fatia02_gold`, `fatia02_testes_qualidade` e `fatia02_export_sqlite` em [`data-engineering/notebooks/`](../data-engineering/notebooks/). Decisões: [`DECISOES.md`](DECISOES.md) (ADR-001 a ADR-005).

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
| `conjunto_aneel` | TEXT | Conjunto elétrico ANEEL usado para o limite de referência, ou `MEDIANA RMR`. |
| `criterio_limite` | TEXT | `CONJUNTO` (limite do próprio município) ou `MEDIANA_RMR` (Recife, Paulista, Abreu e Lima e Araçoiaba: mediana dos 10 conjuntos mapeados — aproximação). |
| `ucs_atendidas` | INTEGER | `C_total`: UCs do cadastro ligadas ao alimentador. |
| `ucs_interrompidas` | INTEGER | UCs interrompidas no mês (cada linha de ocorrência é 1 UC). |
| `dec_apurado_horas` | REAL | DEC do mês = soma das horas de interrupção das UCs / `C_total`. |
| `fec_apurado_vezes` | REAL | FEC do mês = UCs interrompidas / `C_total`. |
| `dec_acumulado_ano_horas` | REAL | Soma do DEC de janeiro até a competência, no mesmo ano. |
| `fec_acumulado_ano_vezes` | REAL | Soma do FEC de janeiro até a competência, no mesmo ano. |
| `dec_limite_aneel` | REAL | Limite **anual** de DEC do conjunto (horas). Apenas **referência** (ver abaixo). |
| `fec_limite_aneel` | REAL | Limite **anual** de FEC do conjunto (vezes). Apenas **referência**. |
| `violou_dec` | BOOLEAN | `dec_acumulado_ano_horas > dec_limite_aneel` (referência, não violação regulatória real). |
| `violou_fec` | BOOLEAN | `fec_acumulado_ano_vezes > fec_limite_aneel` (referência). |
| `violou_meta` | BOOLEAN | `violou_dec OR violou_fec` (referência). |

**Decisões que afetam a tabela**

- O case avisa que os valores de DEC/FEC são simplificados e servem para **comparar alimentadores e períodos entre si**, não com limites regulatórios reais. Por isso o uso principal é o ranking entre alimentadores; o limite ANEEL e as colunas `violou_*` são apenas referência e não devem ser apresentados como multa ou violação real (ADR-003, revisão de 2026-10-26).
- O limite da ANEEL é anual, então a comparação com ele usa sempre o **acumulado no ano**, nunca o valor de um mês.
- Causas vazias (`-`, `N/A`, `NULL`) viram `NAO INFORMADA`; duração com sufixo (`74 min`) é normalizada.
- 2022 (a partir de julho) e 2026 (até junho) são anos incompletos: o acumulado desses anos não é comparável a um ano cheio.
- Alimentadores com poucas UCs têm DEC/FEC altos com poucas interrupções. A média da empresa deve ser ponderada por `ucs_atendidas`.

### `fato_ocorrencias_rede`

- **Grão:** 1 UC interrompida por ocorrência (como na origem). **Chave:** `id_ocorrencia`. **FK:** `id_uc` → `dim_unidade_consumidora`.
- **Origem:** `ocorrencias_rede.csv`. **Linhas:** 180.000. **Índices:** `idx_fato_ocorr_uc` (`id_uc`), `idx_fato_ocorr_alim` (`id_alimentador`), `idx_fato_ocorr_comp` (`competencia`).
- **Uso:** lista de causas na Qualidade da Rede e interrupções do alimentador da UC na Visão 360. Contar linhas por alimentador e mês dá o `ucs_interrompidas` de `fato_qualidade_alimentador` (testado).

| Coluna | Tipo | Descrição e regra |
|---|---|---|
| `id_ocorrencia` | TEXT | Identificador da ocorrência. |
| `id_uc` | TEXT | UC interrompida. Sempre existe no cadastro e pertence ao mesmo alimentador (testado). |
| `id_alimentador` | TEXT | Alimentador onde ocorreu a interrupção. |
| `tipo_ocorrencia` | TEXT | `FALTA DE ENERGIA`, `OSCILACAO`, `SOBRECARGA`, `FIO PARTIDO` ou `DANO EM EQUIPAMENTO`. Todos contam no DEC/FEC (pelo case, cada registro é uma UC interrompida). |
| `causa` | TEXT | `CLIMATICA`, `VEGETACAO`, `TERCEIROS`, `FALHA DE EQUIPAMENTO`, `SOBRECARGA`, `NAO IDENTIFICADA` (valor da origem) ou `NAO INFORMADA` (causa vazia, `-`, `N/A` ou `NULL` na origem: 5.400 linhas). |
| `inicio_interrupcao` | TEXT | Data e hora de início. |
| `fim_interrupcao` | TEXT | Data e hora de fim. |
| `duracao_min` | INTEGER | Duração em minutos (16.200 valores como `217 min` normalizados). |
| `duracao_horas` | REAL | `duracao_min / 60`; é a parcela desta UC no numerador do DEC. |
| `competencia` | TEXT | Mês de início da interrupção (`yyyy-MM`). |
| `fl_anterior_ligacao` | BOOLEAN | `1` quando a interrupção começou antes da data de ligação da UC (595 linhas). Mantidas no DEC/FEC (ADR-005). |

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

O notebook `fatia02_testes_qualidade` roda antes da exportação e interrompe o job se qualquer regra falhar (24 testes): totais das faturas, ausência de órfãs, chaves únicas, DEC/FEC ≥ 0, limites ANEEL preenchidos, grade alimentador × mês completa, CSAT entre 1 e 5, datas das inspeções na campanha e contagens iguais às da Silver. Os 5 testes de `fato_ocorrencias_rede` conferem chave única, contagem igual à Silver, UC no cadastro e no mesmo alimentador, campos obrigatórios e a soma por alimentador e mês contra `fato_qualidade_alimentador`. O `fatia02_export_sqlite` confere ainda contagens SQLite = Gold, chaves estrangeiras e `PRAGMA integrity_check`.
