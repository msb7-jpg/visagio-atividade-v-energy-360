# Roteiro Oficial de Apresentação & Guia de Defesa da Banca

> **Projeto:** V-Energy Grid 360 · Case Final Rocket Lab 2026.2 (Visagio)  
> **Duração Total da Sessão:** 30 minutos cronometrados  
> • **15 minutos:** Apresentação Executiva & Demonstração ao Vivo da Solução  
> • **15 minutos:** Arguição Técnica e de Negócio pela Banca Avaliadora  
> **Composição da Banca:** Lideranças Executivas da V-Energy (Diretoria Comercial, TI, Operação, Perdas e Atendimento) e Consultores Técnicos da Visagio.

---

## 🧭 Glossário Canônico de Termos

| Sigla | Significado Completo | Explicação Rápida de 5 Segundos |
|---|---|---|
| **UC** | **Unidade Consumidora** | O ponto físico (residência, comércio ou fábrica) que recebe energia e possui um medidor próprio. |
| **DEC** | **Duração Equivalente de Interrupção por Unidade Consumidora** | Média de horas que os clientes daquela região ficaram sem luz no período (indicador de continuidade da ANEEL). |
| **FEC** | **Frequência Equivalente de Interrupção por Unidade Consumidora** | Média de vezes (quantidade de faltas de luz) que os clientes ficaram sem energia no período. |
| **GD** | **Geração Distribuída** | Energia gerada no próprio local de consumo (majoritariamente painéis solares fotovoltaicos), abatida da fatura. |
| **ANEEL** | **Agência Nacional de Energia Elétrica** | Órgão regulador federal do setor elétrico que estabelece metas e aplica multas por interrupções. |
| **PRODIST** | **Procedimentos de Distribuição de Energia Elétrica** | Normas técnicas reguladas pela ANEEL (em especial o Módulo 8, que define o cálculo oficial de DEC e FEC). |

---

## 🎯 O Grande Enigma da V-Energy & Visão Geral da Solução

### 1. A Pergunta Central do Negócio (Abertura do Pitch)
Toda a contratação da nossa equipe nasceu de uma inquietante constatação na mesa da diretoria:

> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião."*  
> — **Henrique Duarte**, Diretor Comercial (`atividade.pdf`, pág. 2)

### 2. A Resposta Comprovada Baseada nos Dados
A investigação quantitativa da nossa plataforma revelou com precisão matemática o que aconteceu com o faturamento:
- A receita total avançou de **R$ 157,1 mi** para **R$ 169,7 mi** (+8,0%, ou +R$ 12,6 mi).
- A **tarifa média realizada subiu 13,8%**, gerando um acréscimo positivo de **+R$ 22,6 milhões** de receita (**efeito-preço**).
- No entanto, o volume total faturado despencou **5,1%** (de 227,0 mil MWh para 215,4 mil MWh), subtraindo **R$ 8,0 milhões** de receita (**efeito-volume**).
- **As duas causas fundamentais da queda de volume identificadas nos dados:**
  1. **Geração Distribuída (GD - Painéis Solares):** 3,5 mil clientes de médio e alto consumo adotaram energia solar. Essa autogeração reduziu o faturamento da distribuidora em 11.314 MWh, explicando **97,4% de toda a queda de volume líquido**. O cliente não parou de consumir energia; ele consome a energia que gerou no próprio telhado.
  2. **Fraude Concentrada em 4 Bairros:** Nos bairros de **Iputinga**, **Macaxeira**, **Jardim Jordão** e **Prazeres**, o consumo despencou bruscamente a partir de maio de 2025. Das 871 inspeções de campo realizadas nesses locais, **835 (96%) confirmaram irregularidades e furto de energia**. Esse desvio representa um potencial de até **R$ 2,02 milhões** anuais de receita recuperável pela fiscalização.

> [!TIP]
> **Apoio ao Vivo na Interface:** Em todas as páginas do portal, na barra superior ao lado do caminho da página, há o botão **`Pergunta do Case`**. Se der um branco durante a apresentação, clique nele para abrir a citação exata e a pergunta que aquela tela responde!

---

## ⏱️ Roteiro de Apresentação (15 Minutos Cronometrados)

```
00:00 ── Bloco 1: Abertura & A Fundação da TI (Painel Executivo) ─────── 02:00
02:00 ── Bloco 2: O Diagnóstico Comercial (Inteligência Comercial) ───── 06:00
06:00 ── Bloco 3: Gestão de Perdas & Fiscalização em Campo ────────────── 09:00
09:00 ── Bloco 4: Qualidade da Rede & DEC/FEC da ANEEL ────────────────── 11:00
11:00 ── Bloco 5: Atendimento ao Consumidor & UC 360 ──────────────────── 13:00
13:00 ── Bloco 6: Assistente IA Text-to-SQL & Fechamento ──────────────── 15:00
```

---

### Bloco 1: Abertura & A Fundação da TI (00:00 – 02:00) · 2 min

- **Stakeholder / Persona:** Patrícia Lins · Diretora de Tecnologia (`atividade.pdf`, pág. 2).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"Cada sistema exporta de um jeito. O faturamento sai em CSV com ponto e vírgula, o call center manda JSONs, as inspeções chegam em Excel preenchido à mão. Cada área tem um número diferente para a mesma coisa. Antes de qualquer dashboard, precisamos de engenharia de dados séria. [...]"*

- 👉 **O que apontar na tela (Painel Executivo):**
  1. Aponte para a barra superior e mostre o botão **Pergunta do Case** e a trilha de navegação.
  2. Destaque os **cards de indicadores consolidados** (total de 45 mil UCs, faturamento e medições) mostrando que toda a diretoria agora compartilha da mesma fonte da verdade.
  3. Aponte no canto superior direito para o **Menu do Usuário**, mostrando a troca de perfis de acesso (RBAC: Diretoria, Perdas, Operação, Atendimento).

- 🗣️ **O que falar:**
  > *"Boa tarde aos membros da banca avaliadora. A V-Energy atende 45 mil Unidades Consumidoras na Região Metropolitana do Recife, com um histórico de mais de 2 milhões de leituras e faturas.  
  > Como a Diretora de Tecnologia Patrícia Lins apontou, o maior obstáculo da companhia era a desordem dos dados: faturamento em CSV, chamados em JSON e inspeções em planilhas manuais. Cada área enxergava um número diferente.  
  > Nós resolvemos isso na raiz: construímos no Databricks um **Pipeline Medalhão** em PySpark — camada Bronze para ingestão bruta, Silver para limpeza e integridade referencial sem registros órfãos, e Gold com métricas consolidadas.  
  > Essa base alimenta o **V-Energy Grid 360**, acessível através deste **Painel Executivo** com controle de acesso por perfis (RBAC), onde todas as lideranças visualizam os mesmos indicadores com 100% de confiabilidade."*

- 💡 **A Resposta Direta:**
  > *"Acabamos com os silos cegos: saímos de planilhas desiguais para uma base de dados única, auditada e governada no Databricks."*

---

### Bloco 2: O Diagnóstico do Diretor Comercial (02:00 – 06:00) · 4 min

- **Stakeholder / Persona:** Henrique Duarte · Diretor Comercial (`atividade.pdf`, pág. 2 e 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião. [...] Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."*

- 👉 **O que apontar na tela (Inteligência Comercial):**
  1. No menu lateral, clique em **Comercial > Inteligência Comercial**.
  2. Aponte para o **gráfico de Decomposição da Receita**: destaque a barra verde do **Efeito-Preço (+R$ 22,6 mi)** e a barra vermelha do **Efeito-Volume (-R$ 8,0 mi)**.
  3. Aponte para o bloco de **Geração Distribuída (GD)**: mostre que os 3,5 mil clientes com painel solar deixaram de comprar 11,3 mil MWh da rede.
  4. Na tabela por município e bairro, aponte os quatro bairros críticos no topo de perda: **Iputinga, Macaxeira, Jardim Jordão e Prazeres**.

- 🗣️ **O que falar:**
  > *"Entramos agora no coração da pergunta de Henrique Duarte: por que a receita subiu apenas 8% se a tarifa aumentou?  
  > Aqui na tela de **Inteligência Comercial**, a matemática fecha centavo a centavo:  
  > O reajuste tarifário gerou um ganho de **R$ 22,6 milhões** — o **efeito-preço**. No entanto, o volume físico faturado caiu **5,1%**, o que destruiu **R$ 8,0 milhões** de receita — o **efeito-volume**.  
  > Investigando os dados, encontramos as duas causas definitivas dessa queda:  
  > Primeira causa: **Energia Solar (GD).** Cerca de 3,5 mil clientes de alto consumo passaram a gerar sua própria energia no telhado. Eles deixaram de comprar 11,3 mil MWh da rede, explicando **97,4% de toda a queda líquida de volume**. O cliente não parou de consumir energia; apenas consome a energia do próprio telhado.  
  > Segunda causa: **Fraude Concentrada.** O volume restante perdido está localizado em quatro bairros: Iputinga e Macaxeira no Recife, e Jardim Jordão e Prazeres em Jaboatão. Nesses locais, o consumo despencou bruscamente a partir de maio de 2025. E as 871 inspeções em campo confirmaram que 96% eram fraude no medidor, somando mais de **R$ 2 milhões** em receita recuperável."*

- 💡 **A Resposta Direta:**
  > *"A receita cresceu pouco porque a energia solar absorveu 97% da queda de volume e o restante foi furto concentrado em 4 bairros."*

---

### Bloco 3: Gestão de Perdas & Fila de Fiscalização (06:00 – 09:00) · 3 min

- **Stakeholder / Persona:** Rafael Coutinho · Gerente de Perdas (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."*

- 👉 **O que apontar na tela (Fila de Inspeção):**
  1. No menu lateral, clique em **Perdas > Fila de Inspeção**.
  2. Aponte para a **tabela ordenada por Prioridade**: mostre que as unidades no topo têm o maior potencial de recuperação de energia (kWh).
  3. Aponte para a coluna **Motivo da Suspeita**: explique que o algoritmo cruza quebra de consumo com a lista de painéis solares para nunca fiscalizar quem tem solar honesto.
  4. Mostre o botão **Exportar CSV** (para a rota de campo) e a área de **Upload de Planilha** (para carregar o laudo dos fiscais sem digitação).
  5. Clique na aba **Efetividade** e aponte para a taxa histórica de acerto do modelo calibrado para 200 inspeções por mês.

- 🗣️ **O que falar:**
  > *"Para o Gerente de Perdas Rafael Coutinho, cada inspeção em vão é um dia de equipe jogado fora.  
  > Na tela **Fila de Inspeção**, nós priorizamos quem realmente importa. O sistema analisa a queda abrupta de consumo e descarta automaticamente quem tem placas solares, evitando constranger clientes honestos.  
  > A tabela coloca no topo as unidades com maior volume de kWh a recuperar e o motivo claro da suspeita.  
  > E entregamos os diferenciais solicitados: o gestor exporta a lista em CSV para a equipe de rua em um clique. Quando a equipe volta, basta subir a planilha preenchida no portal — o sistema processa os laudos em lote e atualiza as ordens de serviço instantaneamente, sem redigitação."*

- 💡 **A Resposta Direta:**
  > *"Acabamos com o desperdício em campo: o gestor tem uma fila inteligente que mira R$ 2,02 milhões com 96% de assertividade comprovada."*

---

### Bloco 4: Qualidade da Rede & Indicadores DEC/FEC da ANEEL (09:00 – 11:00) · 2 min

- **Stakeholder / Persona:** Beatriz Farias · Gerente de Operação (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."*

- 👉 **O que apontar na tela (Qualidade da Rede):**
  1. No menu lateral, clique em **Operação > Qualidade da Rede**.
  2. Aponte para os cards de indicadores oficiais: **DEC** (duração média em horas) e **FEC** (frequência de interrupções).
  3. Aponte para o seletor de **Alimentador** e destaque os circuitos com sinalização visual de alerta (próximos ou acima do limite da ANEEL).
  4. Aponte para a decomposição por causa de falha (falhas internas atacáveis vs causas climáticas/externas).

- 🗣️ **O que falar:**
  > *"Para a Gerente de Operação Beatriz Farias, estabilidade da rede significa evitar multas pesadas da ANEEL.  
  > Na tela **Qualidade da Rede**, calculamos de forma automatizada no pipeline as duas métricas oficiais do PRODIST Módulo 8 da ANEEL: o **DEC** — horas que os clientes ficaram sem luz — e o **FEC** — quantidade de vezes que faltou energia.  
  > O sistema permite acompanhar esses números ao longo dos 4 anos e, principalmente, filtrar por **alimentador** — que são os circuitos de média tensão dos bairros.  
  > Destacamos visualmente os alimentadores mais críticos, orientando a manutenção preventiva exatamente onde o risco de estourar as metas regulatórias é iminente."*

- 💡 **A Resposta Direta:**
  > *"Monitoramento em conformidade estrita com o PRODIST da ANEEL, direcionando a manutenção para onde ela mais previne multas."*

---

### Bloco 5: Atendimento ao Cliente & Visão 360 da UC (11:00 – 13:00) · 2 min

- **Stakeholder / Persona:** Camila Barreto · Gerente de Atendimento (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."*

- 👉 **O que apontar na tela (UC 360):**
  1. No menu lateral, clique em **Atendimento > UC 360**.
  2. Digite no campo de busca o código de uma unidade: `UC-0001`.
  3. Aponte para o **gráfico comparativo de consumo**: barras do ano atual lado a lado com o mesmo mês do ano anterior.
  4. Aponte para os cards de contexto: **badge de energia solar (GD)**, **histórico de faturas**, **interrupções no circuito da rua** e **chamados anteriores**.

- 🗣️ **O que falar:**
  > *"No atendimento ao cliente, cada segundo na linha custa dinheiro e satisfação. A Gerente Camila Barreto relatou que seus operadores precisavam abrir quatro sistemas diferentes e demoravam minutos para responder uma dúvida de conta alta.  
  > Na tela **UC 360**, basta digitar o código da UC. Em milissegundos, o atendente visualiza:  
  > 1. O gráfico de consumo comparado com o ano passado — tirando a dúvida na hora se o consumo real subiu;  
  > 2. Se o cliente possui painel solar instalado;  
  > 3. Se a rua dele teve ocorrência de falta de energia recente;  
  > 4. E a lista de faturas e chamados anteriores.  
  > Se o consumidor reclamar da conta, o atendente esclarece na hora se o consumo físico dele aumentou ou se o valor subiu por conta de bandeira tarifária aprovada pela ANEEL."*

- 💡 **A Resposta Direta:**
  > *"Substituímos 4 sistemas legados por uma consulta em tela única em sub-segundo, garantindo resposta imediata ao cliente."*

---

### Bloco 6: Inteligência Artificial Text-to-SQL & Fechamento (13:00 – 15:00) · 2 min

- **Stakeholders / Personas:** Patrícia Lins (TI) & Henrique Duarte (Comercial) (`atividade.pdf`, pág. 2 e 7).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"[...] Quero que qualquer pessoa da empresa faça uma pergunta em português e receba a resposta na hora, sem abrir chamado para o meu time. Com uma condição: se o agente não souber, ele tem que dizer que não sabe. Dados inventados são mais prejudiciais do que não ter."*

- 👉 **O que apontar na tela (Assistente IA):**
  1. Clique no botão **Assistente IA** no canto superior direito para abrir o painel lateral do chat.
  2. Digite ou envie a pergunta de demonstração: *"Qual bairro teve a maior queda de volume faturado residencial no último ano?"*
  3. Mostre o **streaming de raciocínio da IA** e expanda o bloco sanfonado **Ver raciocínio da IA (Auditoria)** para exibir a consulta SQL gerada sobre as tabelas Gold.
  4. Mostre a resposta em português fundamentada nos dados reais.

- 🗣️ **O que falar:**
  > *"Para encerrar nossa apresentação: e quando a liderança precisa de uma resposta urgente minutos antes de uma reunião de diretoria, sobre algo que não está em nenhum gráfico pronto?  
  > Criamos o **Assistente de IA Text-to-SQL**, integrado diretamente no portal.  
  > O usuário não precisa saber SQL: pergunta em português claro, inclusive usando termos do dia a dia como 'conta de luz' e 'falta de luz'.  
  > E cumprimos a exigência inegociável da Diretora de TI: **o agente é estritamente honesto**. Ele exibe o raciocínio e a consulta SQL para auditoria, e se a pergunta envolver dados inexistentes na base, ele declara que não sabe em vez de inventar números.  
  > Além disso, o agente conta com **memória de contexto para perguntas de acompanhamento** e é continuamente validado por um **Golden Dataset automatizado** com dezenas de perguntas de negócio testadas.  
  > O **V-Energy Grid 360** entrega engenharia de dados robusta, inteligência analítica e inteligência artificial responsável. Muito obrigado à banca, estamos prontos para a arguição."*

- 💡 **A Resposta Direta:**
  > *"Democratização de dados em linguagem natural com segurança de leitura, auditoria total do SQL e zero alucinações."*

---

## 🛡️ Guia de Defesa da Banca (15 Minutos de Q&A)

As 8 perguntas de maior probabilidade que a banca examinadora fará, com a resposta técnica e de negócio exata:

### 1. Pergunta sobre Escolha do Banco de Dados:
> *"Por que vocês escolheram SQLite no backend em vez de PostgreSQL?"*
- **Resposta:** *"O SQLite foi uma escolha técnica consciente para o escopo da área piloto (45 mil UCs e 2,1 milhões de registros). Ele torna a aplicação 100% autocontida, com portabilidade total e zero dependência de infraestrutura externa em homologação. Toda a camada Gold foi modelada em terceira forma normal e indexada nas chaves de maior tráfego (competência, alimentador e código de UC), atingindo tempos de resposta inferiores a 100 milissegundos nas rotas da API e nas consultas da IA."*

---

### 2. Pergunta sobre Prevenção de Alucinação na Inteligência Artificial:
> *"Como vocês garantem que o modelo de IA não alucina nem gera consultas perigosas que corrompam o banco?"*
- **Resposta:** *"Adotamos defesa em três níveis: 1. Segurança de Infraestrutura: a conexão disponibilizada para a IA é estritamente de leitura (SELECT), sem privilégios de escrita ou deleção. 2. Arquitetura FSM: o agente valida a sintaxe SQL contra o catálogo de tabelas Gold antes de disparar a consulta. 3. Golden Dataset: criamos uma bateria de testes com dezenas de perguntas de negócio auditadas, penalizando o modelo caso ele desvie do gabarito."*

---

### 3. Pergunta sobre o Impacto da Geração Distribuída (GD):
> *"Se apenas 3,5 mil UCs possuem energia solar de um total de 45 mil, como ela explica 97,4% da queda de volume faturado?"*
- **Resposta:** *"A adoção de energia solar exige investimento inicial e ocorreu nos maiores consumidores da concessão: comércios, pequenas indústrias e residências de grande porte. Embora sejam 7,8% das conexões, essas 3,5 mil UCs tinham consumo elevado. A energia gerada pelo sol é consumida instantaneamente no imóvel e abatida antes da fatura. Portanto, eles deixaram de comprar 11,3 mil MWh da rede, o que corresponde matematicamente a 97,4% do recuo de 11,6 mil MWh entre os períodos."*

---

### 4. Pergunta sobre a Fraude nos 4 Bairros:
> *"Qual é a evidência real nos dados de que houve fraude nos quatro bairros críticos a partir de maio de 2025?"*
- **Resposta:** *"Cruzamos as curvas mensais de faturamento com os laudos de campo. Em Iputinga, Macaxeira, Jardim Jordão e Prazeres, o consumo residencial despencou repentinamente a partir de maio de 2025 sem relação com placas solares. A confirmação definitiva veio da fiscalização: das 871 inspeções efetuadas nesses bairros, 835 (96%) registraram irregularidade material no medidor (violação de lacre, bobina adulterada ou ligação direta), isolando um potencial de R$ 2,02 milhões anuais de receita recuperável."*

---

### 5. Pergunta sobre Metodologia Regulatória (DEC e FEC):
> *"Como vocês calcularam o DEC e o FEC a partir das ocorrências de rede?"*
- **Resposta:** *"Implementamos as fórmulas oficiais do PRODIST Módulo 8 da ANEEL. Para cada alimentador em cada mês, o DEC é a soma da duração de cada interrupção ponderada pela quantidade de unidades consumidoras atingidas, dividida pelo total de UCs atendidas pelo alimentador. O FEC é análogo, ponderando a quantidade de interrupções. Esse cálculo permite comparar circuitos de portes completamente diferentes de forma justa e regulatória."*

---

### 6. Pergunta sobre Rotina da Equipe de Campo:
> *"Como a solução ajuda a equipe de campo que trabalha na rua sem acesso à internet?"*
- **Resposta:** *"A tela de fiscalização possui botão de exportação da fila priorizada em CSV. O supervisor exporta a rota do dia para o dispositivo da equipe. Ao retornarem à base com os laudos preenchidos, o gestor utiliza o botão de upload de planilha no portal: o backend processa o arquivo em lote, atualiza os status das ordens de serviço e computa a energia recuperada, poupando centenas de horas de redigitação manual."*

---

### 7. Pergunta sobre Escalabilidade para Produção:
> *"Se a diretoria decidir colocar esse sistema em produção para 2 milhões de clientes no estado inteiro, o que mudaria na arquitetura?"*
- **Resposta:** *"A arquitetura já foi desenhada para isso: 1. O pipeline de dados já está em PySpark no Databricks, bastando escalar horizontalmente o cluster de processamento. 2. Substituiríamos o SQLite local por uma instância distribuída gerenciada (como PostgreSQL particionado ou BigQuery). 3. O backend FastAPI é sem estado (stateless) e o portal React é compilado estaticamente, viabilizando escalabilidade imediata sob contêineres e balanceamento de carga com cache Redis."*

---

### 8. Pergunta sobre Rastreabilidade nas Tabelas Gold:
> *"Quais tabelas e colunas específicas comprovaram essa tese da GD e da Fraude?"*
- **Resposta:** *"1. Na `fato_faturamento`, medimos que o volume faturado encolheu 11.618 MWh (-5,1%). 2. Na `dim_unidade_consumidora`, filtramos `possui_gd = 1` e medimos que esses 3,5k clientes deixaram de comprar 11.314 MWh (97,4% da perda). 3. Filtrando as UCs restantes sem GD na `fato_faturamento`, isolamos a queda abrupta a partir de maio de 2025 em Iputinga, Macaxeira, Jardim Jordão e Prazeres. 4. Na `fato_inspecoes_perdas`, confirmamos que 835 de 871 laudos nesses 4 bairros atestaram irregularidade comprovada (96% de assertividade)."*

---

## 📋 Checklist Prático para o Apresentador no Dia D

- [ ] **Ambiente Local Iniciado:** Garantir que o comando `make run-all` (ou `make run-all-ngrok`) esteja rodando e que as páginas abram instantaneamente em `http://localhost:5173`.
- [ ] **Abas Pré-carregadas:** Deixar o navegador aberto com as telas da Navbar já carregadas em abas individuais (para evitar qualquer atraso de renderização durante a fala).
- [ ] **Prompt da IA Pronto:** Deixar a pergunta de demonstração da IA copiada na área de transferência (*"Qual bairro teve a maior queda de volume faturado residencial no último ano?"*).
- [ ] **UC Pré-selecionada:** Ter em mãos o código `UC-0001` para demonstração rápida na tela de atendimento.
- [ ] **Controle do Relógio:** Manter um cronômetro visível com os marcadores de 2 min, 6 min, 9 min, 11 min, 13 min e 15 min.
