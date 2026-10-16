# 🏢 Manual de Domínio de Negócio da Distribuição de Energia & Matriz 5W2H

> **Documento Oficial de Engenharia de Negócio, Regulação do Setor Elétrico & Operação**  
> **Concessionária:** V-Energy (Área Piloto — Região Metropolitana do Recife)  
> **Metodologia:** 5W2H (*What, Why, Where, When, Who, How, How Much*)

---

## 1. Visão Geral do Modelo de Negócio da Distribuição de Energia

### 1.1 A Função da Distribuidora no Setor Elétrico Brasileiro (SEB)
Uma distribuidora de energia elétrica (como a **V-Energy**) é uma concessionária de serviço público regulada pela **ANEEL** (Agência Nacional de Energia Elétrica). Ela atua como a ponta final da cadeia do setor:

```
[Geração (Usinas)] ──▶ [Transmissão (Linhas Alta Tensão)] ──▶ [Subestações da Distribuidora]
                                                                        │
                                                              [Rede de Média Tensão]
                                                            (Alimentadores troncais)
                                                                        │
                                                              [Transformadores de Poste]
                                                                        │
                                                              [Rede de Baixa Tensão]
                                                                        │
                                                            [Unidades Consumidoras (UCs)]
```

### 1.2 Como a Distribuidora é Remunerada e Fatura
A fatura de energia que o cliente paga (em R$) é composta por quatro grandes blocos:
1. **Energia Comprada (TE - Tarifa de Energia):** Custo de geração nas hidrelétricas, térmicas, eólicas e solares contratadas em leilões regulados.
2. **Uso dos Sistemas de Transmissão e Distribuição (TUSD):**
   - **Fio A:** Custo de transporte pela rede básica de transmissão nacional (ONS).
   - **Fio B:** A remuneração própria da distribuidora (Capex de postes, cabos, transformadores e Opex operacional). É daqui que sai a margem e o lucro da concessionária!
3. **Encargos Setoriais:** Taxas regulatórias obrigatórias (CDE, Proinfa, Reserva Global de Reversão).
4. **Tributos:** ICMS (estadual), PIS e COFINS (federais) e CIP/COSIP (iluminação pública municipal).

> [!IMPORTANT]
> **A Regra de Ouro do Volume Faturado:**  
> A receita da distribuidora é diretamente dependente do **Volume Físico Entregue e Faturado (kWh)** multiplicado pela **Tarifa Homologada (R$/kWh)**. Se o volume físico faturado cai, a arrecadação da concessionária encolhe, gerando desequilíbrio econômico-financeiro imediato.

---

## 2. A Voz das Lideranças: O Diagnóstico do Caos e as Dores Reais (`atividade.pdf`)

Na reunião de diretoria que originou o projeto e nas entrevistas com as áreas operacionais, as lideranças da V-Energy sintetizaram com clareza os nós górdios que a plataforma deve resolver:

### 2.1 A Inquietação Central da Diretoria Comercial
> **Henrique Duarte · Diretor Comercial (`atividade.pdf`, pág. 2):**  
> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião."*  
> *"Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."* (`atividade.pdf`, pág. 6)

### 2.2 O Diagnóstico da Tecnologia: Por que Ninguém Consegue Responder
> **Patrícia Lins · Diretora de Tecnologia (`atividade.pdf`, pág. 2 e 7):**  
> *"Cada sistema exporta de um jeito. O faturamento sai em CSV com ponto e vírgula, o call center manda JSONs, as inspeções chegam em Excel preenchido à mão. Cada área tem um número diferente para a mesma coisa. Antes de qualquer dashboard, precisamos de engenharia de dados séria. Depois, quero que qualquer pessoa da empresa faça uma pergunta em português e receba a resposta na hora, sem abrir chamado para o meu time."*  
> *"Hoje, se o time de perdas quer saber quantas unidades com painel solar em Olinda tiveram queda de consumo acima de 30%, alguém abre um chamado, meu analista escreve a consulta e a resposta chega dois dias depois. Quero que a pessoa pergunte em português e tenha a resposta na hora. Com uma condição: se o agente não souber, ele tem que dizer que não sabe. Dados inventados são mais prejudiciais do que não ter."*

### 2.3 A Linha de Frente do Atendimento ao Cliente
> **Camila Barreto · Gerente de Atendimento (`atividade.pdf`, pág. 6):**  
> *"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."*

### 2.4 O Custo de Oportunidade da Fiscalização de Perdas
> **Rafael Coutinho · Gerente de Perdas (`atividade.pdf`, pág. 6):**  
> *"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."*

### 2.5 A Pressão Regulatória da Operação de Rede
> **Beatriz Farias · Gerente de Operação (`atividade.pdf`, pág. 6):**  
> *"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."*

---

## 3. A Matriz 5W2H Global do Sistema V-Energy Grid 360

Com base nas dores acima, a solução completa é modelada na matriz 5W2H do sistema:

| Dimensão | Especificação Concreta no Case V-Energy |
|---|---|
| **WHAT (O quê)** | **O Paradoxo da Receita & Plataforma Unificada:** A base de clientes cresceu e a tarifa residencial subiu homologada $+10,5\%$ desde meados de 2022. No entanto, o volume de energia faturada caiu $-3,8\%$ e a receita total subiu apenas $+8,0\%$. Os sistemas operacionais estão em silos. A solução é o **V-Energy Grid 360**, integrando cadastro, medição, faturamento, rede e atendimento com dashboards analíticos, visão 360 e Text-to-SQL. |
| **WHY (Por quê)** | 1. Canibalização por GD solar (3,5 mil clientes gerando energia e abatendo da conta).<br/>2. Perdas não técnicas em expansão com taxa de fiscalização improcedente de ~50%.<br/>3. Descolamento tarifário e oscilação de bandeiras.<br/>4. Multas regulatórias e ressarcimentos ANEEL por estouro de DEC/FEC.<br/>5. Backlog de 2 a 3 dias na equipe de TI para responder a consultas analíticas simples. |
| **WHERE (Onde)** | Área de concessão piloto da Região Metropolitana do Recife, cobrindo **14 municípios**, quase **300 bairros** e **mais de 120 alimentadores elétricos**. |
| **WHEN (Quando)** | Histórico de **4 anos** (2022 a 2025) analisado por **regime de competência mensal** (MM/YYYY). |
| **WHO (Quem)** | • *Comercial:* Henrique Duarte.<br/>• *Tecnologia e Dados:* Patrícia Lins.<br/>• *Atendimento:* Camila Barreto.<br/>• *Perdas e Fiscalização:* Rafael Coutinho.<br/>• *Operação de Rede:* Beatriz Farias. |
| **HOW (Como)** | Pipeline Medallion PySpark no Databricks (Bronze $\to$ Silver $\to$ Gold), exportação local em SQLite WAL (`v_energy.db`), backend FastAPI, portal React 19 com Tailwind e LangGraph FSM com AST read-only. |
| **HOW MUCH (Quanto)** | • **45.000 UCs** e **2,18M faturas e leituras** processadas.<br/>• **180k ocorrências de rede** e **319k chamados**.<br/>• Reversão da perda de volume, elevação do hit rate de campo de 52% para >70% e redução do TMA de 4 min para 45s. |

---

## 4. Matrizes 5W2H Específicas por Domínio Operacional


### 4.1 Desafio 1: Inteligência Comercial & Decomposição da Receita (Henrique Duarte)

| Dimensão | Detalhamento 5W2H |
|---|---|
| **What** | Decomposição formal da variação de receita entre períodos, isolando o **Efeito-Preço** (ganho por reajuste homologado da ANEEL) do **Efeito-Volume** (destruição de faturamento por queda física de kWh), com ranking territorial por município, bairro e classe de consumo. |
| **Why** | Para que a diretoria comercial tome decisões embasadas em dados matemáticos, diferenciando onde a queda ocorreu por eficiência energética/GD solar de onde decorreu de perdas comerciais ou evasão de consumidores. |
| **Where** | Bairros de alta renda da RMR (Boa Viagem, Casa Forte, Parnamirim) onde a GD solar explodiu, contra bairros periféricos e industriais. |
| **When** | Comparação entre os últimos 12 meses da concessão contra o primeiro ano da base histórica. |
| **Who** | Henrique Duarte (Diretor Comercial) e gerentes de inteligência de mercado. |
| **How** | Aplicação da fórmula clássica de Price-Volume-Mix:<br/>$$\text{Efeito-Volume} = \Delta \text{Volume} \times \text{Tarifa}_{\text{base}}$$ <br/>$$\text{Efeito-Preço} = \Delta \text{Tarifa} \times \text{Volume}_{\text{base}}$$ <br/>$$\text{Efeito Cruzado} = \Delta \text{Tarifa} \times \Delta \text{Volume}$$ <br/>Exibição em gráfico de cascata (*Waterfall*) e tabela de ranking territorial. |
| **How Much** | Volume faturado caiu $-3,8\%$, receita bruta subiu apenas $+8,0\%$ contra $+10,5\%$ de reajuste tarifário homologado na classe B1. |

---

### 4.2 Desafio 2: Atendimento 360 & Diagnóstico de Conta Alta (Camila Barreto)

| Dimensão | Detalhamento 5W2H |
|---|---|
| **What** | Uma tela operacional única (`Customer360Page`) que reúne cadastro completo da UC, histórico de consumo de 12 meses YoY, faturas abertas e pagas com bandeiras tarifárias, medidor instalado, presença de geração solar própria, ocorrências na rede e chamados anteriores. |
| **Why** | O processo legado força o atendente a abrir 4 sistemas diferentes enquanto o cliente aguarda na linha telefônica. Isso eleva o TMA (Tempo Médio de Atendimento) para mais de 4 minutos e derruba o FCR (*First Call Resolution*), gerando insatisfação e reabertura de reclamações no Procon e na ANEEL. |
| **Where** | Call center central da V-Energy e postos presenciais de atendimento ao cliente em toda a RMR. |
| **When** | Em tempo real durante a chamada ativa do consumidor (busca instantânea em menos de 1 segundo). |
| **Who** | Camila Barreto (Gerente de Atendimento) e os operadores de teleatendimento da concessionária. |
| **How** | O atendente digita o número da UC no topo da tela. O sistema carrega os dados unificados e aplica a **árvore de diagnóstico de conta alta**:<br/>1. *Consumo Físico:* O gráfico YoY mostra se o consumo em kWh subiu em relação ao mesmo mês do ano anterior.<br/>2. *Bandeira Tarifária:* Verifica se a bandeira mudou (ex: de verde para vermelha P2).<br/>3. *Reajuste Homologado:* Verifica se houve aplicação de novo índice tarifário anual.<br/>4. *Geração Distribuída:* Identifica se o cliente tem GD e se a injeção solar caiu por falha técnica no inversor. |
| **How Much** | Redução estimada do TMA de ~4 min para ~45 segundos; elevação do First Call Resolution de ~60% para >85%. |

---

### 4.3 Desafio 3: Gestão de Perdas Não Técnicas & Campo (Rafael Coutinho)

| Dimensão | Detalhamento 5W2H |
|---|---|
| **What** | Fila inteligente de fiscalização de unidades suspeitas priorizada por **valor esperado** (risco de fraude $\times$ energia estimada a recuperar), geração de Ordens de Serviço (OS), cancelamento controlado, exportação em lote e upload de planilhas de campo com conciliação automática. |
| **Why** | A equipe de campo tem capacidade operacional fixa de realizar apenas **200 inspeções por mês**. No modelo legado sem inteligência de dados, pouco mais de 50% das vistorias encontram irregularidade. Isso significa que metade do tempo das viaturas é gasto visitando clientes honestos, gerando custo inútil de combustível e homem-hora. |
| **Where** | Unidades consumidoras das classes B1, B2, B3 e A4 distribuídas pelos 14 municípios da RMR, com foco nas áreas de maior densidade de anomalias. |
| **When** | Ciclo operacional mensal contínuo: geração da fila no início do mês, despacho para campo e conciliação de laudos técnicos semanalmente. |
| **Who** | Rafael Coutinho (Gerente de Perdas) e os fiscais de campo da concessionária. |
| **How** | O sistema calcula um score analítico combinando queda súbita de consumo sem aviso, medidores com histórico antigo, e ausência de GD. O gerente visualiza a fila ordenada, gera as OSs, exporta para planilha Excel e, no retorno, faz upload do arquivo preenchido para baixa transacional automática no SQLite. |
| **How Much** | Elevação da taxa de assertividade (*Hit Rate*) de ~52% para >70%, recuperando centenas de milhares de kWh furtados e gerando milhões de reais em cobrança retroativa (TOI - Termo de Ocorrência e Inspeção). |

---

### 4.4 Desafio 4: Qualidade da Rede & Indicadores Regulatórios ANEEL (Beatriz Farias)

| Dimensão | Detalhamento 5W2H |
|---|---|
| **What** | Painel analítico de monitoramento dos indicadores de continuidade **DEC** (Duração Equivalente de Interrupção) e **FEC** (Frequência Equivalente de Interrupção) calculados por alimentador ao longo de 24 meses, confrontados contra as metas regulatórias fixadas pela ANEEL. |
| **Why** | O estouro dos limites regulatórios de DEC e FEC acarreta **multas pecuniárias diretas da ANEEL** e obriga a distribuidora a efetuar **compensações financeiras compulsórias** nas faturas dos consumidores atingidos (créditos de DIC/FIC/DMIC). Além disso, a manutenção preventiva precisa ser alocada onde gera maior redução de interrupções. |
| **Where** | Nos mais de **120 alimentadores de média tensão** que conectam as subestações às redes de distribuição da RMR. |
| **When** | Série temporal mensal contínua com histórico de 24 meses e visão consolidada anual. |
| **Who** | Beatriz Farias (Gerente de Operação) e engenheiros de planejamento da rede e manutenção. |
| **How** | Apuração mensal das interrupções programadas e acidentais conforme as fórmulas regulatórias: <br/>$$\text{DEC} = \frac{\sum (t_i \times C_i)}{C_{\text{total}}}, \quad \text{FEC} = \frac{\sum C_i}{C_{\text{total}}}$$ <br/>Ranking decrescente de alimentadores críticos com alerta visual por badges semânticos e abertura de série histórica em gaveta lateral `<Sheet>`. |
| **How Much** | Mitigação de multas regulatórias milionárias e priorização inteligente do Capex/Opex de poda de árvores e substituição de isoladores/transformadores nos 10 piores alimentadores. |

---

### 4.5 Desafio 5: Democratização Confiável via Text-to-SQL & IA Embutida (Patrícia Lins)

| Dimensão | Detalhamento 5W2H |
|---|---|
| **What** | Agente conversacional integrado ao portal que recebe perguntas em português do dia a dia sobre consumo, faturamento, rede e atendimento, consulta o banco analítico local via SQL e devolve respostas auditáveis, somado a cards de IA contextual embutidos nas páginas de negócio. |
| **Why** | Atualmente, diretores e gerentes abrem chamados manuais para a equipe de TI/BI para extrair consultas básicas (ex: *"Quantas UCs com painel solar em Olinda tiveram queda de consumo > 30%?"*), com tempo de espera de 2 a 3 dias úteis. A diretora exige respostas imediatas sem onerar seu time, com uma condição inegociável: **o agente jamais pode inventar dados; se não souber, deve dizer que não sabe**. |
| **Where** | Em gaveta lateral global expansível (`ChatDrawer`) presente em todas as páginas do portal, e nos cards de IA (`SmartInsightCard`) nas telas de Receita e Visão 360. |
| **When** | Em tempo real sob demanda do usuário via streaming Server-Sent Events (SSE). |
| **Who** | Patrícia Lins (Diretora de Tecnologia), executivos, analistas comerciais e regulatórios. |
| **How** | Máquina de estados LangGraph FSM em Python: nó classificador de intenção $\to$ nó gerador de SQL com catálogo semântico de sinônimos $\to$ nó validador sintático AST (`sqlparse`) estritamente `SELECT` $\to$ nó executor no SQLite com conexão `mode=ro` (read-only) $\to$ auto-correção (*self-healing*) em caso de erro $\to$ sintetizador de resposta honesta com auditoria técnica. |
| **How Much** | Redução do tempo de resposta analítica de **2 dias úteis para menos de 3 segundos**, com garantia absoluta de segurança de dados (zero mutações no banco) e acurácia medida via Golden Dataset. |

---

## 5. Glossário Canônico do Setor Elétrico Brasileiro (SEB)

| Termo / Sigla | Definição Regulatória e de Negócio |
|---|---|
| **Unidade Consumidora (UC)** | Ponto de entrega de energia dotado de medição própria. Um único cliente (CPF/CNPJ) pode ser titular de várias UCs (uma casa, uma loja, uma fábrica). |
| **Competência** | O mês de referência da leitura física ou do faturamento. A fatura de competência `03/2025` cobra o consumo apurado em março, mesmo com vencimento em abril. Toda a análise contábil é feita por competência (regime de competência). |
| **Classes de Consumo e Subgrupos Tarifários** | Categorias de atendimento reguladas pela ANEEL:<br/>• **B1:** Residencial (baixa tensão < 2,3 kV)<br/>• **B2:** Rural (baixa tensão com subsídio tarifário)<br/>• **B3:** Comercial, Serviços e Poder Público (baixa tensão)<br/>• **A4:** Industrial e Grandes Clientes atendidos em Média Tensão (2,3 kV a 25 kV), sujeitos à medição horossazonal e demanda contratada em kW. |
| **Alimentador (*Feeder*)** | Circuito elétrico de média tensão (geralmente 13,8 kV) que sai de uma subestação e abastece ruas, bairros ou municípios inteiros. Se o alimentador cai, todas as UCs conectadas a ele sofrem desabastecimento. |
| **Bandeira Tarifária** | Mecanismo regulatório da ANEEL para repassar mensalmente o custo extraordinário da geração térmica:<br/>• **Verde:** Condições normais (sem acréscimo na tarifa).<br/>• **Amarela:** Sinal de alerta (acréscimo moderado por 100 kWh).<br/>• **Vermelha (Patamares 1 e 2):** Custo elevado (acréscimo substancial por 100 kWh).<br/>*Nota de Negócio:* A bandeira altera o valor em R$ sem alterar o consumo físico de kWh! |
| **Geração Distribuída (GD)** | Energia gerada pela própria UC (painéis solares fotovoltaicos), regulada pela Lei 14.300/2022 e Resoluções ANEEL 482/2012 e 1.059/2023. A energia excedente injetada na rede gera créditos em kWh que abatem a fatura da distribuidora. |
| **Perdas Não Técnicas (Comerciais)** | Energia entregue pela rede que é consumida mas não é faturada: furto ("gato"), adulteração de medidor (*by-pass* ou shunts) e irregularidades de cadastro. Recuperáveis por inspeção de campo. |
| **DEC e FEC (PRODIST Módulo 8)** | **DEC:** Duração Equivalente de Interrupção por Unidade Consumidora (tempo médio em horas que as UCs ficaram sem luz).<br/>**FEC:** Frequência Equivalente de Interrupção por Unidade Consumidora (número médio de quedas de luz).<br/>Ultrapassar os limites acarreta multas da ANEEL e créditos automáticos de ressarcimento na fatura do cliente. |
| **TOI (Termo de Ocorrência e Inspeção)** | Instrumento legal lavrado pelos fiscais de campo durante a constatação de fraude ou irregularidade no medidor (Res. Normativa ANEEL nº 1.000/2021, Art. 595), base para cobrança retroativa dos kWh desviados. |
| **First Call Resolution (FCR)** | Indicador de atendimento que mede a porcentagem de chamados resolvidos logo no primeiro contato, sem necessidade de reabertura ou escalonamento. |
| **Tempo Médio de Atendimento (TMA)** | Tempo que o atendente passa na linha com o cliente para resolver a demanda. No V-Energy Grid 360, cai sensivelmente pela unificação de dados em tela única. |

