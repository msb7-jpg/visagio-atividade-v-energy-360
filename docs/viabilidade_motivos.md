# Auditoria de viabilidade — motivos de suspeita da Fila de Inspeção

> Auditoria **somente leitura**. Todo número abaixo vem de código em [`_auditoria/`](../_auditoria/) (saídas em `_auditoria/out/*.md`). Onde não deu para verificar, está escrito "não verificado".
> Dados: `base_dados_1.zip` e `base_dados_2.zip`, extraídos fora do repositório. Nada existente foi alterado.
> Reprodução: `AUDIT_DATA=<pasta com os dados extraídos>` e depois `python 00_carga.py … 11_verificacoes.py` (pandas, duckdb, openpyxl, tabulate).

---

## 1. Resumo executivo

1. **P1 — implementar:** (a) **queda de consumo sazonal persistente** (motivos 1 e 4 são o mesmo fenômeno nos dados); (b) **exclusão por GD** como filtro obrigatório; (c) **tipo de medidor eletromecânico** como fator de ranking; (d) **concentração por alimentador** como visão agregada.
2. A regra de queda sozinha (últimos 3 meses ≤ 60% do baseline dessazonalizado) separa **90,3%** de irregularidade (n=795) contra **25,5%** (n=591). Isso vale **só dentro da amostra já inspecionada**, que é **direcionada** (ver seção 3).
3. **Sem filtro de GD a fila se contamina:** das 1.788 UC com queda em jun/2026, **1.107 (62%) têm GD conectada**. O consumo cai para ~30% do baseline no mês seguinte à conexão. Entre as inspecionadas com queda e GD, 1 de 17 era irregular.
4. **P2 — complemento sem poder comprovado:** consumo baixo persistente (subconjunto da queda), 4 leituras estimadas seguidas (n=33, IC cruza zero), sazonalidade invertida (n=1 inspecionada).
5. **Descartar (inviável com estes dados):** consumo zero, consumo chapado, leitura regressiva como fraude, gap leitura×consumo, manutenção atrasada, retirada sem substituto, reincidência, denúncia/titularidade, perda agregada por alimentador, queda anterior à GD.
6. **Descartar (viável, mas sem poder):** reclamação de conta alta, inadimplência, interrupção de rede. Servem no máximo como contexto na Visão 360.
7. **Risco para a banca:** quase todas as UC com queda e sem GD (671 de 681) **já foram inspecionadas**. Uma fila "nova" teria só 10 UC. Mostre o backtest em T=jul/2025 (antes das inspeções), não a fila atual.
8. **A taxa de irregularidade é 62,7%**, não "pouco mais de 50%" (residencial 56,4%, comercial 84,2%).
9. **Não há reincidência:** 1.389 inspeções em 1.389 UC distintas, numa única janela (ago–dez/2025).
10. **Escopo recomendado:** seção 9.

---

## 2. Perfil dos dados e mapa de chaves

Perfil completo (colunas, nulos, distintos, categóricas, 3 exemplos): [`_auditoria/out/01_perfil.md`](../_auditoria/out/01_perfil.md).

| Arquivo | Sep./encoding | Linhas brutas | Chave | Observação |
|---|---|---:|---|---|
| unidades_consumidoras.csv | `,` UTF-8 | 46.461 | `id_uc` | 45.000 UC canônicas após limpeza |
| leituras/*.csv (5) | `,` UTF-8 | 2.182.468 | `id_leitura` (UC+mês) | 2022-07 a 2026-06; 2.152.336 após limpeza |
| faturas.csv | `;` UTF-8 | 2.184.623 | `id_fatura` (UC+mês) | 2022-07 a 2026-06 |
| medidores.csv | `,` UTF-8 | 51.812 | `id_medidor` | 100% de `data_ultima_manutencao` nulo |
| ocorrencias_rede.csv | `,` UTF-8 | 180.000 | `id_ocorrencia` | tem `id_uc` e `alimentador` |
| atendimentos.json | UTF-8, array | 318.871 | `protocolo` | `historico` aninhado, 5 ações |
| geracao_distribuida.csv | `,` UTF-8 | 3.510 | `id_uc` | `data_conexao` 100% preenchida |
| inspecoes.xlsx (3 abas) | — | 1.389 | `id_inspecao` | ago-set 511, out-nov 495, dez 383 |

**Junções contra o cadastro limpo** (`10_extras`):

| Tabela | Registros órfãos | % |
|---|---:|---:|
| leituras, medidores, atendimentos, ocorrências, GD, inspeções | 0 | 0% |
| faturas | 32.285 (31.705 UC `UC`+7 dígitos que não existem no cadastro) | 1,48% |

- A chave tem formato canônico `UC`+6 dígitos em todas as tabelas, sem espaços nem minúsculas. A exceção são as 200 UC `TESTE*` e as faturas com 7 dígitos.
- `ocorrencias_rede.alimentador` coincide com o do cadastro em 100% dos 180.000 registros.
- Cobertura inversa: leituras, faturas e medidores 100%; atendimentos 99,87%; ocorrências 92,25%; GD 7,8%; inspeções 3,09%.
- Cadastro: alimentador, bairro, município, classe e status 100% preenchidos; `data_ligacao` 99,8%. **Todas as 45.000 UC estão `ATIVA`**, então não há UC inativa para tratar.
- Classe após normalização: residencial 38.336, comercial 4.909, industrial 877, rural 656, poder público 222.

---

## 3. Resultado da Etapa 3 — `inspecoes.xlsx`

Detalhe: [`04_inspecoes.md`](../_auditoria/out/04_inspecoes.md), [`09_complementos.md`](../_auditoria/out/09_complementos.md).

**Estrutura.** As 3 abas têm o mesmo esquema: `id_inspecao, id_uc, data, inspetor, resultado, tipo_irregularidade, kwh_recuperado`. São partições temporais da mesma tabela, sem relação entre si.

| Pergunta | Resposta |
|---|---|
| Chave da UC, data e resultado? | Sim: `id_uc`, `data`, `resultado`. O resultado tem 8 grafias que viram 2 valores (`IRREGULARIDADE CONFIRMADA`/`CONFIRMADA` = 1; `SEM IRREGULARIDADE`/`NADA CONSTA` = 0). Nenhum não mapeado. |
| Tipo de irregularidade? | Sim, só nas confirmadas: DESVIO DIRETO 182, BY-PASS 181, MEDIDOR ADULTERADO 180, LACRE VIOLADO 164, LIGACAO CLANDESTINA 164. Os 518 sem irregularidade têm tipo vazio (`-` ou nulo). Nenhuma confirmada sem tipo. |
| Inspeções por mês | ago 267, set 291, out 277, nov 278, dez 276 (**ago–dez/2025 apenas**). |
| UC distintas e reincidência | 1.389 inspeções = **1.389 UC distintas**. **0 reinspeções.** |
| Taxa de irregularidade | **62,71%** (871 de 1.389). Por mês: 59,9 / 64,9 / 69,7 / 58,3 / 60,5%. |
| Por classe | residencial 56,4% (n=1.032); comercial 84,2% (n=341); industrial 10% (n=10); rural 25% (n=4); poder público 0% (n=2). |
| Compatível com "pouco mais de 50%"? | **Não.** O total é 62,7%. Só o residencial fica perto de 56%. |
| Backtest com corte temporal | Corte 01/10/2025: 558 treino e 831 teste (522 irregulares, 309 regulares). Corte 01/11/2025: 835 e 554. **Amostra suficiente** para avaliar regras. As regras testadas são fixas e não foram treinadas. |

**Viés de seleção — as inspeções NÃO foram aleatórias:**
- **Classe:** comercial é 10,9% das UC e 24,6% das inspecionadas. Residencial é 85,2% e 74,3%.
- **GD:** 2,23% das inspecionadas têm GD, contra 7,8% da base.
- **Alimentador:** ALM-REC-024 tem 23,2% das UC inspecionadas (taxa 91%), ALM-JAB-007 24,6% (89%) e ALM-JAB-014 24,1% (91,6%). ALM-REC-008, com 2.285 UC, teve 1,2% inspecionadas (17,9%).
- **Padrão de consumo:** 57% das inspecionadas (795 de 1.386) têm a queda M1a, contra 4% da base. A mediana de consumo (143,6 kWh) é parecida com a da base (145,7 kWh).
- **Conclusão:** a taxa de acerto condicional à amostra **não** estima a precisão na população.

**Observações de qualidade (inspeções):**
- 46 datas vêm no formato `MM-DD-YYYY` (hífen). Elas só caem na janela ago–dez sob essa leitura (46 de 46; como DD-MM só 4).
- Essas 46 linhas estão na aba "dez", mas têm datas de ago a dez. A aba **não** corresponde ao mês.
- Também há `kwh_recuperado` com vírgula decimal e `inspetor` com espaços (107 grafias para 40 inspetores).
- Inspetores: 40, cada um com 24 a 48 inspeções. As taxas por inspetor vão de 46,9% a 80% (n≥24). Isso é variação plausível entre inspetores, mas não verifiquei se é significativa.

---

## 4. Viabilidade por motivo

**Definições usadas** (`07_features.py`, `08_poder_preditivo.py`):
- **Índice sazonal:** mediana por classe e mês do ano, estimada só com 2023–2024.
- **Consumo dessazonalizado:** `x = consumo / índice`.
- **Baseline:** mediana de `x` nos meses T−19..T−8. **Últimos 3 meses:** T−2..T. `ratio3 = últimos3 / baseline`.
- **M1a:** `ratio3 ≤ 0,60` e `max3/baseline ≤ 0,70`.
- **T:** mês anterior ao da inspeção, para não vazar dado.
- **Volume:** UC sinalizadas em T = jun/2026 (45.000 UC).

| # | Motivo | Campos | Veredito | Evidência | Volume (jun/2026) | Esforço |
|---|---|---|---|---|---|---|
| 1 | Queda sazonal persistente (3 meses), por pares | `consumo_kwh`, `mes_referencia`, classe, alimentador | **VIÁVEL (P1)** | 44.859 UC com 12 meses completos e 44.758 com 24 (jul/2024–jul/2025, contagem bruta). Na série limpa: 44.434 e 43.883. Sazonalidade forte: amplitude residencial 2,44 e comercial 1,76. M1a: 90,3% (n=795) vs 25,5% (n=591). Contra pares (M1b): 89,9% vs 35,6%. | M1a 1.788 (3,97%); sem GD 681; M1b 1.759 | Médio |
| 2 | Consumo zero ou muito baixo | `consumo_kwh` | **VIÁVEL COM RESSALVA (P2)** | Há **0** leituras com consumo ≤ 0,5 kWh e só 26 com ≤ 10 kWh. "Zero" não existe. Usando ≤ p5 da classe por 3 meses: 75,1% (n=229) vs 60,2%. É subconjunto da queda. | 1.684 | Baixo |
| 3 | Consumo chapado | `consumo_kwh` | **INVIÁVEL** | CV de 12 meses ≤ 0,03: **0** UC. Consumo idêntico ao mês anterior: 1,14% (real) e 1,12% (estimada), ou seja, ruído. | 0 | — |
| 4 | Queda súbita em degrau | `consumo_kwh` | **VIÁVEL COM RESSALVA** | 91,6% (n=906) vs 8,1% (n=480), a maior diferença da tabela. É o mesmo fenômeno do motivo 1: a queda em mai–jun/2025 aparece como degrau de 2 meses. | 625; 5 já inspecionadas; composição por GD **não verificada** | Baixo (reaproveita o 1) |
| 5 | Leitura atual − anterior ≠ consumo | `leitura_*`, `consumo_kwh` | **INVIÁVEL** | 74,28% consistentes. 23,95% têm diferença ≤ 5 kWh (ruído; causa não verificada). 7.900 linhas têm `leitura_anterior = -1` (sentinela). Excluídos sentinela e troca de medidor, **0** UC restam. | 0 | — |
| 6 | Leitura regressiva sem troca | `leitura_*`, `id_medidor` | **INVIÁVEL como fraude** | 6.215 regressivas, **100% com troca de medidor**. 0 UC com ≥ 2. O consumo vem negativo (artefato da troca). | 0 | — |
| 7 | Estimada repetida | `tipo_leitura` | **VIÁVEL COM RESSALVA (P2)** | O campo existe (REAL 82%, ESTIMADA 18%, estável por classe). 4 estimadas seguidas: 75,8% (n=33) vs 62,4%, IC [-1,5; 28,2] → **sem diferença**. | 300 | Baixo |
| 8a | Manutenção atrasada / múltiplas manutenções | `data_ultima_manutencao` | **INVIÁVEL** | Campo **100% nulo** (51.812 de 51.812). | — | — |
| 8b | Retirada sem substituto | `status`, `data_retirada` | **INVIÁVEL** | 0 UC sem medidor ativo. 0 retirados sem data real. | 0 | — |
| 8c | Medidor antigo (≥ 15 anos) | `data_instalacao` | **INVIÁVEL (fraco)** | 65,6% vs 59,6% (+6 pp, IC [0,9; 11,1]) e marca 50% da base. Dentro da queda: 90,7% vs 89,8%. | 22.576 | Baixo |
| 8d | **Tipo eletromecânico** | `tipo` | **VIÁVEL (P1, ranking)** | 78,5% (n=1.070) vs 9,2% (n=316). Sem queda: 43,1% vs 8,6%. Com queda: 91,7% (n=780) vs 20,0% (**n=15, inconclusivo**). 24% da base é eletromecânica. | 10.832 | Baixo |
| 8e | Troca recente seguida de queda | `data_retirada` | **VIÁVEL COM RESSALVA** | A troca **explica** quedas: troca + queda 40% (n=5), troca sem queda 6,7% (n=15), **inconclusivo**. | 82 (troca em 6m + queda); 181 (troca em 12m + queda) | Baixo |
| 9 | Reincidência / reinspeção pós-regularização | `inspecoes` | **INVIÁVEL** | 0 reinspeções, janela única, nada anterior a ago/2025. | — | — |
| 10 | GD: exclusão e "queda antes da conexão" | `data_conexao` | **Exclusão VIÁVEL (P1, filtro). "Queda antes da GD" INVIÁVEL** | `data_conexao` existe (3.510 UC, 7,8%). Consumo/baseline: -1 mês = 1,00; mês 0 = 0,65; +1 = 0,30, estável. Queda **com** GD: 5,9% (n=17) vs **sem** GD: 92,2% (n=778). **0 de 3.503** UC com GD têm queda nos 3 meses antes da conexão. | 1.107 de 1.788 quedas têm GD | Baixo |
| 11 | Atendimento | `assunto`, `subassunto` | **INVIÁVEL** | Há 6 assuntos e 17 pares. **Não existe** denúncia, mudança de titularidade nem religação por suspeita. Existem religação (urgência, após pagamento) e FATURA/VALOR ALTO (10.856) e CONTESTACAO (11.022). Nenhum par discrimina (IC cruza 0 em todos). Queda após conta alta (n=78): 91,0% vs queda sozinha 90,7%, sem ganho. Conta alta sem queda: 10,7% (n=28). | — | — |
| 12a | Rede: queda após interrupção | `ocorrencias_rede` | **INVIÁVEL** | ≥ 1 interrupção em 6m: 41,1% (n=302) vs 68,7% (**anti-preditivo**, -27,7 pp). Interrupção + queda: 84,6% (n=130), pior que a queda sozinha. | — | — |
| 12b | Concentração por alimentador | `alimentador` | **VIÁVEL (P1, agregado)** | **99,5%** das 873 UC com queda e sem GD (nov/2025) estão em 8 alimentadores. Top: ALM-REC-024 (293 de 1.336), JAB-007 (275 de 1.221), JAB-014 (88 de 394). | 4.613 em alimentador top-decil | Baixo |
| 12c | Perda agregada por alimentador | energia injetada | **INVIÁVEL** | `ocorrencias_rede` só traz incidentes. Nenhum arquivo traz energia injetada/entregue por alimentador. Só dá proxy (% de UC com queda, consumo faturado). | — | — |
| 13 | Inadimplência crônica + consumo baixo | `faturas` | **INVIÁVEL (sem poder)** | Inadimplência (≥ 2 faturas abertas em 6m): 61,9% vs 62,9% (-0,9 pp). Dentro da queda: 89,6% vs 90,5%. Combinada com queda = só o efeito da queda (91,1%). `status` EM ABERTO é pouco confiável (60.394 com `data_pagamento`). | 8.195 (≥ 2); 1.279 (combinada) | Baixo |
| 14 | Sazonalidade invertida / incompatível com classe | `consumo_kwh`, classe | **NÃO VERIFICÁVEL** | Correlação com o índice < 0,2: 396 UC (0,88%), só 1 inspecionada. "Consumo incompatível com a classe" **não foi avaliado**. Não compensa agora. | 396 | Médio |

**Ressalvas do motivo 1:**
- A regra exige 3 meses persistentes. A queda dos irregulares começa em **mai–jun/2025** (mediana de `x` ~291 → 211 → 137), no **mesmo calendário para todos**, independentemente da data da inspeção.
- Por isso, em T=jul/2025 só 59 de 266 inspecionadas passam em M1a (79,7% delas irregulares) e 207 não passam (54,6% irregulares). É atraso de detecção, não falha do sinal. De ago a nov, M1a=1 dá 88,2–93,0% e M1a=0 dá 6,4–16,8%.
- Entre os irregulares, a proporção com queda é parecida em todos os tipos (80,6–85,6%), então a queda não depende do tipo de irregularidade.
- 151 irregulares **não** têm M1a (111 residenciais, 38 comerciais, 1 industrial e 1 rural; ratio3 mediano ~0,5–0,55 nas duas classes maiores). Em geral são quedas que ainda não completaram 3 meses de persistência. Não investiguei a fundo.
- Há 77 UC com queda que foram inspecionadas e deram **regulares** (60 residenciais, 17 comerciais). 27% das residenciais têm GD.
- **Recall aproximado** da regra entre irregulares inspecionados: ~83% (718 de 868, calculado das taxas por classe).

---

## 5. Poder preditivo

Cálculo: `08_poder_preditivo.py`, com sinais usando só dados até o mês anterior à inspeção. IC95% de Wald na diferença de taxas. Tabela completa: [`08_poder_preditivo.md`](../_auditoria/out/08_poder_preditivo.md).

| Sinal | n sinal. | Taxa sinal. | n não | Taxa não | Dif. (pp) | IC95% | Leitura |
|---|---:|---:|---:|---:|---:|---|---|
| M4 degrau | 906 | 91,6% | 480 | 8,1% | +83,5 | [80,4; 86,5] | preditivo |
| M1c queda moderada (ratio3 ≤ 0,75) | 916 | 90,7% | 470 | 8,1% | +82,6 | [79,5; 85,7] | preditivo |
| M12a alimentador top-decil | 885 | 88,1% | 501 | 17,8% | +70,4 | [66,4; 74,3] | preditivo (confundido pela seleção) |
| M8a eletromecânico | 1.070 | 78,5% | 316 | 9,2% | +69,3 | [65,3; 73,4] | preditivo |
| M10b queda **sem** GD | 778 | 92,2% | 608 | 25,0% | +67,2 | [63,2; 71,1] | preditivo |
| **M1a queda sazonal 3m** | 795 | 90,3% | 591 | 25,5% | +64,8 | [60,7; 68,8] | preditivo |
| M1b queda vs pares | 692 | 89,9% | 694 | 35,6% | +54,3 | [50,1; 58,5] | preditivo |
| M13b inadimplência + queda | 541 | 91,1% | 845 | 44,5% | +46,6 | [42,5; 50,7] | = efeito da queda |
| M1d queda forte (≤ 0,45) | 441 | 89,1% | 945 | 50,4% | +38,7 | [34,4; 43,1] | preditivo |
| M11x conta alta + queda | 78 | 91,0% | 1.308 | 61,0% | +30,0 | [23,1; 36,9] | = efeito da queda |
| M12d interrupção + queda | 130 | 84,6% | 1.256 | 60,4% | +24,2 | [17,4; 31,0] | = efeito da queda |
| M2 consumo baixo persistente | 229 | 75,1% | 1.157 | 60,2% | +14,9 | [8,6; 21,1] | preditivo (subconjunto) |
| M7 4 estimadas seguidas | 33 | 75,8% | 1.353 | 62,4% | +13,4 | [-1,5; 28,2] | sem diferença |
| M8b medidor ≥ 15 anos | 718 | 65,6% | 668 | 59,6% | +6,0 | [0,9; 11,1] | fraco |
| M13a inadimplência (≥ 2) | 239 | 61,9% | 1.147 | 62,9% | -0,9 | [-7,7; 5,8] | sem diferença |
| M12c ≥ 1 interrupção em 6m | 302 | 41,1% | 1.084 | 68,7% | -27,7 | [-33,9; -21,5] | anti-preditivo |
| M10c queda **com** GD | 17 | 5,9% | 1.369 | 63,4% | -57,5 | [-69,0; -46,0] | **n<30, não conclusivo** |
| M10a GD conectada | 23 | 4,3% | 1.363 | 63,7% | -59,3 | [-68,1; -50,6] | **n<30, não conclusivo** |
| M8c troca de medidor em 12m | 20 | 15,0% | 1.366 | 63,4% | -48,4 | [-64,3; -32,5] | **n<30, não conclusivo** |
| M8d troca em 6m + queda | 5 | 40,0% | 1.381 | 62,8% | -22,8 | [-65,8; 20,2] | **n<30, não conclusivo** |
| M14 sazonalidade invertida | 1 | 0,0% | 1.385 | 62,7% | -62,7 | — | **n<30, não conclusivo** |
| M3 chapado / M5 gap leitura | 0 | — | 1.386 | 62,7% | — | — | sem UC sinalizada |

Atendimentos (cada par assunto/subassunto, janela de 6 meses): **nenhum** teve IC que exclua zero. Os maiores ficam em +10,1 pp (FATURA/CONTESTACAO e FATURA/PARCELAMENTO, n=58 cada, IC [-1,7; 21,9]).

**Ressalvas importantes:**
1. **Viés de seleção** (seção 3): as taxas valem para a amostra inspecionada, não para a população.
2. **Limiares escolhidos depois de ver o perfil temporal** das inspecionadas (`06_perfil_temporal.py`). Há otimismo leve. O índice sazonal usa só 2023–2024, antes de qualquer inspeção.
3. **O sinal é quase determinístico nos dados.** A queda dos irregulares ocorre num calendário fixo (mai–jun/2025) e se mantém em ~47% do baseline até jun/2026, sem "recuperação pós-regularização". Isso sugere dados sintéticos e vale declarar à banca.
4. **Alimentador e eletromecânico** podem refletir **onde os inspetores foram** ou como os dados foram gerados. O alimentador foi construído a partir das quedas, então sua diferença é em parte circular.

---

## 6. Problemas de qualidade e tratamento sugerido (Silver)

Detalhe: [`03_diagnostico_qualidade.md`](../_auditoria/out/03_diagnostico_qualidade.md), [`02_chaves_formatos.md`](../_auditoria/out/02_chaves_formatos.md).

| Problema | Contagem | Exemplo | Tratamento |
|---|---:|---|---|
| UC de teste no cadastro | 200 | `TESTE0000`, titular "a" | Filtrar `id_uc !~ '^UC[0-9]{6}$'` |
| Cabeçalho repetido no meio do arquivo | 1 (UC) e 2 (faturas) | linha `id_uc,cpf_cnpj,...` | Descartar |
| UC duplicada (conteúdo idêntico) | 1.260 linhas extras | 46.260 → 45.000 | `DISTINCT` / `row_number` |
| Classe em 16 grafias; UF em 6 | — | `residencial`, `Poder Público` | `upper(strip_accents(trim()))` → 5 classes |
| Mojibake em bairro | 59 bairros | `Ãrea Rural…` | Reparar encoding (`latin-1` → `utf-8`) |
| `data_ligacao` sentinela (1900-01-01) | 90 | — | Nulificar (< 1950) |
| Datas em 4 formatos | leituras 262 mil; faturas 183 mil | `01.01.2023`, `01/01/2023`, `01-01-2023` | `.` e `/` = DD/MM; **hífen = MM-DD** (comprovado em leituras: 87.144 de 87.144) |
| Leituras duplicadas por `id_leitura` | 21.523 | — | Manter 1 |
| Leituras fantasma `LTX*` (medidor `MD99…`) | 8.609 | todas com par real na mesma UC/mês | Descartar |
| Consumo negativo | 8.016 | consumo −79.176 numa troca de medidor | Tratar como troca; não usar o consumo |
| Leitura regressiva | 6.215 | 100% em troca de medidor | Sinalizar troca; recalcular consumo |
| `leitura_anterior` nula ou −1 | 24.323 nula; 7.900 = −1 | — | Nulificar; não usar diferença de leituras |
| Consumo ≥ 9.999 | 10.691 | quase todo industrial (10.653) | **Não** é sentinela. Aplicar outlier por classe |
| UC com competências faltantes | 362 de 45.000 | 44.638 com 48 meses | Marcar cobertura; exigir ≥ 9 meses na baseline |
| Faturas de UC inexistente (`UC`+7 dígitos) | 32.285 | `UC9290667` | Descartar na Silver |
| Fatura EM ABERTO com data de pagamento | 60.394 | — | Derivar inadimplência de `data_pagamento`, não de `status` |
| Medidores duplicados | 513 | — | `DISTINCT` |
| Tipo de medidor em 10 grafias | — | `eletrônico`, `smart meter` | Normalizar → 3 tipos |
| `data_retirada` = 9999-12-31 | 13.649 | — | Nulificar |
| Inspeção: 8 grafias de resultado, 4 formatos de data, vírgula decimal | — | — | Normalizar como em `04_inspecoes.py` |

Ainda sem contagem própria: UC sem classe (0 após normalização, pois as 16 grafias viram 5 classes), outliers extremos fora da classe industrial e leituras fora de ordem. **Não verificado.**

---

## 7. Colunas e tabelas que o pipeline precisaria criar

| Tabela / coluna | Para | Origem |
|---|---|---|
| `silver_uc` (limpa, 45.000 UC) | todos | cadastro + regras da seção 6 |
| `silver_leituras_mensal` (`id_uc`, `ym`, `consumo`, `tipo_leitura`, `flag_troca_medidor`) | 1, 4, 7 | leituras limpas, sem negativos de troca |
| `indice_sazonal` (`classe`, `mes`, `indice`) | 1 | mediana por classe/mês em 2023–2024 |
| `feat_queda` (`id_uc`, `t`, `ratio3`, `max3_ratio`, `ratio3_peer`, `n12`, `n_base`) | 1, 4 | consumo dessazonalizado |
| `flag_gd_conectada` (`id_uc`, `data_conexao`) | 10 | geração distribuída |
| `feat_medidor` (`tipo_ativo`, `idade_anos`, `trocas6`, `trocas12`) | 8 | medidores limpos |
| `gold_alimentador_suspeitas` (`alimentador`, `ucs`, `ucs_com_queda`, `pct`) | 12b | agrega `feat_queda` |
| `gold_fila_inspecao` (`id_uc`, `score`, `motivos[]`, `data_ref`) | fila | regra M1 + filtro GD + ranking |

---

## 8. O que NÃO foi possível verificar

- **Precisão na população:** só há resultado de inspeção para 3,09% das UC, escolhidas de forma direcionada. A taxa de irregularidade das UC não inspecionadas é desconhecida.
- **Efeito pós-regularização:** nenhuma UC foi reinspecionada. Os dados não mostram recuperação do consumo.
- **Manutenção de medidor:** o campo é 100% nulo.
- **Energia injetada por alimentador:** não existe no repositório de dados.
- **Denúncia, religação por suspeita e mudança de titularidade:** não há esses assuntos nos atendimentos.
- **Causa do gap ≤ 5 kWh** entre leituras e consumo (24% das leituras): não investigada.
- **Composição por GD dos 625 casos de degrau em jun/2026:** não cruzada.
- **Motivo 14 ("consumo incompatível com a classe"):** não avaliado. Só a sazonalidade invertida foi medida.
- **UC sem classe, outliers extremos fora da classe industrial e leituras fora de ordem:** sem contagem própria (seção 6).
- **Se as taxas por inspetor diferem de forma significativa:** não testado.
- **Databricks/Delta:** não usei Bronze/Silver do projeto. Tudo parte dos arquivos de origem, então a correspondência com o pipeline **não foi conferida**.

---

## 9. Recomendação de escopo (prazo curto, banca em poucos dias)

Qualidade acima de quantidade: **uma regra central, bem defendida, e três apoios simples**.

1. **Regra central — queda sazonal persistente (motivo 1) com filtro de GD.** Reaproveita índice sazonal por classe, razão últimos-3-meses/baseline e exclusão por `data_conexao`. É a única com evidência forte (92,2% vs 25,0% sem GD) e cobre também o degrau (motivo 4).
2. **Apoio 1 — eletromecânico como fator de ranking.** É um `join` com medidores. Peso modesto, pelo risco de viés declarado na seção 5.
3. **Apoio 2 — visão agregada por alimentador** (% de UC com queda). É um painel barato e narrativamente forte (99,5% em 8 alimentadores). Não use como regra por UC.
4. **Apoio 3 — flag de troca de medidor** para não confundir troca com fraude.
5. **Não implemente:** os motivos de dados ausentes, zero/chapado/regressiva/gap, nem os "viáveis sem poder" (conta alta, inadimplência, interrupção). Cada um custa tempo e a banca perguntará o resultado.
6. **Como demonstrar:** mostre o backtest em **T=jul/2025** (sinal calculado antes das inspeções de ago–dez), com taxa por faixa de score. Diga abertamente que a amostra é direcionada e que a fila "de hoje" tem poucas UC novas (10 sem GD em jun/2026).
7. **Declare as limitações:** dados com cara de sintéticos, queda em calendário fixo e ausência de reincidência.
