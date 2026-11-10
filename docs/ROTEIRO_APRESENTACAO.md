# Roteiro Oficial de Apresentação & Guia de Defesa da Banca

> **Projeto:** V-Energy Grid 360 · Case Final Rocket Lab 2026.2 (Visagio)  
> **Duração Total da Sessão:** 30 minutos cronometrados  
> • **15 minutos:** Apresentação Executiva & Demonstração ao Vivo da Solução  
> • **15 minutos:** Arguição Técnica e de Negócio pela Banca Avaliadora  
> **Apresentadores:**  
> • **Bernardo Heuer:** Blocos 1, 2 e 3 (00:00 a 09:00 — 9 min) · Abertura, TI/Dados, Inteligência Comercial e Perdas  
> • **Miguel Batista:** Blocos 4, 5 e 6 (09:00 a 15:00 — 6 min) · Qualidade da Rede, Atendimento/UC 360, Assistente IA e Fechamento  
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
- A **tarifa média realizada subiu 12,5%** (de R$ 0,6919 para R$ 0,7783/kWh, impulsionada por tributos e bandeiras tarifárias), gerando um acréscimo positivo de **+R$ 20,4 milhões** de receita (**efeito-preço**).
- No entanto, o volume total faturado recuou **4,0%** (de 227,1 mil MWh para 218,0 mil MWh — exatamente o "quase 4%" da fala do Diretor Comercial), subtraindo **R$ 6,2 milhões** de receita (**efeito-volume**).
- **As duas causas fundamentais da queda de volume identificadas nos dados:**
  1. **Geração Distribuída (GD - Painéis Solares):** 3.496 clientes (3.115 residenciais e 381 comerciais, nenhuma indústria) adotaram energia solar. Essa autogeração reduziu as compras da rede nessas unidades em **11.222 MWh** (queda de 61% no faturamento desses clientes), superando a queda líquida de toda a base mantida (-9.829 MWh), enquanto os clientes sem painel cresceram +0,7%.
  2. **Fraude Concentrada em 4 Bairros:** Nos bairros de **Iputinga**, **Macaxeira**, **Jardim Jordão** e **Prazeres**, o consumo despencou bruscamente a partir de maio de 2025. Do total de 1.389 inspeções de campo realizadas pela distribuidora com 871 irregularidades confirmadas, **835 (95,9%) estavam concentradas exatamente nesses 4 bairros**. Esse desvio representa um potencial de até **R$ 2,02 milhões** anuais de receita em jogo pela fiscalização.

> [!TIP]
> **Apoio ao Vivo na Interface:** Em todas as páginas do portal, na barra superior ao lado do caminho da página, há o botão **`Pergunta do Case`**. Se der um branco durante a apresentação, clique nele para abrir a citação exata e a pergunta que aquela tela responde!

---

## ⏱️ Roteiro de Apresentação (15 Minutos Cronometrados)

### 👥 Divisão de Apresentadores
- 🎙️ **Bernardo Heuer (00:00 – 09:00 · 9 min):**
  - **Bloco 1:** Abertura & A Fundação da TI (Painel Executivo)
  - **Bloco 2:** O Diagnóstico do Diretor Comercial (Inteligência Comercial)
  - **Bloco 3:** Gestão de Perdas & Fila de Fiscalização (Fila de Inspeção)
  - *Transição e passagem de bastão para Miguel*
- 🎙️ **Miguel Batista (09:00 – 15:00 · 6 min):**
  - **Bloco 4:** Qualidade da Rede & Indicadores DEC/FEC da ANEEL (Operação)
  - **Bloco 5:** Atendimento ao Consumidor & Visão 360 da UC (Atendimento)
  - **Bloco 6:** Assistente IA Text-to-SQL & Fechamento da Sessão (IA Embutida)

```
00:00 ── [Bernardo] Bloco 1: Abertura & A Fundação da TI (Painel Executivo) ───── 02:00
02:00 ── [Bernardo] Bloco 2: O Diagnóstico Comercial (Inteligência Comercial) ─── 06:00
06:00 ── [Bernardo] Bloco 3: Gestão de Perdas & Fiscalização em Campo ──────────── 09:00
09:00 ── [Miguel]   Bloco 4: Qualidade da Rede & DEC/FEC da ANEEL ──────────────── 11:00
11:00 ── [Miguel]   Bloco 5: Atendimento ao Consumidor & UC 360 ────────────────── 13:00
13:00 ── [Miguel]   Bloco 6: Assistente IA Text-to-SQL & Fechamento ────────────── 15:00
```

---

### Bloco 1: Abertura & A Fundação da TI (00:00 – 02:00) · 2 min

- **Apresentador:** Bernardo Heuer
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

- **Apresentador:** Bernardo Heuer
- **Stakeholder / Persona:** Henrique Duarte · Diretor Comercial (`atividade.pdf`, pág. 2 e 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião. [...] Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."*

- 👉 **O que apontar na tela (Inteligência Comercial):**
  1. No menu lateral, clique em **Comercial > Inteligência Comercial**.
  2. Aponte para o **gráfico de Decomposição da Receita**: destaque a barra verde do **Efeito-Preço (+R$ 20,4 mi)** e a barra vermelha do **Efeito-Volume (-R$ 6,2 mi)**.
  3. Aponte para o bloco de **Geração Distribuída (GD)**: mostre que os 3.496 clientes com painel solar deixaram de comprar 11,2 mil MWh da rede.
  4. Na tabela por município e bairro, aponte os quatro bairros críticos no topo de perda: **Iputinga, Macaxeira, Jardim Jordão e Prazeres**.

- 🗣️ **O que falar:**
  > *"Entramos agora no coração da pergunta de Henrique Duarte: por que a receita subiu apenas 8% se a tarifa aumentou?  
  > Aqui na tela de **Inteligência Comercial**, a matemática fecha centavo a centavo:  
  > O reajuste tarifário gerou um ganho de **R$ 20,4 milhões** — o **efeito-preço**. No entanto, o volume físico faturado caiu **4,0%** (exatamente o 'quase 4%' citado pelo diretor), o que subtraiu **R$ 6,2 milhões** de receita — o **efeito-volume**.  
  > Investigando os dados, encontramos as duas causas definitivas dessa queda:  
  > Primeira causa: **Energia Solar (GD).** 3.496 clientes de consumo relevante (3.115 residenciais e 381 comerciais) passaram a gerar sua própria energia no telhado. Eles faturaram 61% a menos e deixaram de comprar 11,2 mil MWh da rede — o que supera toda a queda líquida de volume da empresa. O cliente não parou de consumir energia; apenas consome a energia do próprio telhado.  
  > Segunda causa: **Fraude Concentrada.** O volume restante perdido está localizado em quatro bairros: Iputinga e Macaxeira no Recife, e Jardim Jordão e Prazeres em Jaboatão. Nesses locais, o consumo despencou bruscamente a partir de maio de 2025. Das 1.389 inspeções em campo com 871 irregularidades confirmadas, nada menos que **835 (95,9%) estavam nesses 4 bairros**, somando até **R$ 2,02 milhões** anuais de receita em jogo para recuperação."*

- 💡 **A Resposta Direta:**
  > *"A receita cresceu pouco porque a energia solar absorveu mais do que a queda líquida inteira (-11,2 mil MWh) e o restante foi furto concentrado em 4 bairros."*

---

### Bloco 3: Gestão de Perdas & Fila de Fiscalização (06:00 – 09:00) · 3 min

- **Apresentador:** Bernardo Heuer
- **Stakeholder / Persona:** Rafael Coutinho · Gerente de Perdas (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."*

- 👉 **O que apontar na tela (Fila de Inspeção):**
  1. No menu lateral, clique em **Perdas > Fila de Inspeção**.
  2. Aponte para a **tabela ordenada por Prioridade**: mostre que as unidades no topo têm o maior potencial de recuperação de energia (kWh).
  3. Aponte para a coluna **Motivo da Suspeita**: explique que o algoritmo cruza quebra de consumo com a lista de painéis solares para nunca fiscalizar quem tem solar honesto.
  4. Mostre o botão **Exportar CSV** (para a rota de campo) e a área de **Upload de Planilha** (para carregar o laudo dos fiscais sem digitação).
  5. Clique na aba **Efetividade** e aponte para a taxa histórica de acerto do modelo (62,7% geral e 92,5% no patamar alto da fila).

- 🗣️ **O que falar:**
  > *"Para o Gerente de Perdas Rafael Coutinho, cada inspeção em vão é um dia de equipe jogado fora.  
  > Na tela **Fila de Inspeção**, nós priorizamos quem realmente importa. O sistema analisa a queda abrupta de consumo e descarta automaticamente quem tem placas solares, evitando constranger clientes honestos.  
  > A tabela coloca no topo as unidades com maior volume de kWh a recuperar e o motivo claro da suspeita.  
  > E entregamos os diferenciais solicitados: o gestor exporta a lista em CSV para a equipe de rua em um clique. Quando a equipe volta, basta subir a planilha preenchida no portal — o sistema processa os laudos em lote e atualiza as ordens de serviço instantaneamente, sem redigitação.  
  > **Passo a palavra agora para o Miguel**, que vai demonstrar como a plataforma atende a Operação com os indicadores da ANEEL, agiliza o Atendimento ao Consumidor e traz o poder da IA generativa Text-to-SQL."*

- 💡 **A Resposta Direta:**
  > *"Acabamos com o desperdício em campo: o gestor tem uma fila inteligente que mira até R$ 2,02 milhões com acerto de 92,5% no patamar alto da fila."*

---

### Bloco 4: Qualidade da Rede & Indicadores DEC/FEC da ANEEL (09:00 – 11:00) · 2 min

- **Apresentador:** Miguel Batista
- **Stakeholder / Persona:** Beatriz Farias · Gerente de Operação (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."*

- 👉 **O que apontar na tela (Qualidade da Rede):**
  1. No menu lateral, clique em **Operação > Qualidade da Rede**.
  2. Aponte para os cards de indicadores: **DEC médio acumulado no ano (horas)** e **FEC médio no ano (vezes)**, e o bloco de **Situação dos 122 circuitos**.
  3. Na **tabela de ranking de alimentadores**, clique no código de um circuito para abrir a **gaveta lateral (Drawer)**, mostrando a série histórica mensal e os clientes mais afetados.
  4. Aponte para a decomposição por causa de falha (falhas atacáveis por poda/manutenção preventiva vs causas climáticas/externas).

- 🗣️ **O que falar:**
  > *"Obrigado, Bernardo. Boa tarde a todos os membros da banca.  
  > Para a Gerente de Operação Beatriz Farias, estabilidade da rede significa proteger a qualidade do fornecimento aos clientes.  
  > Na tela **Qualidade da Rede**, calculamos de forma automatizada no pipeline as métricas da ANEEL baseadas no PRODIST Módulo 8: o **DEC** — horas médias sem luz por cliente — e o **FEC** — quantidade média de quedas de energia.  
  > O sistema traz o panorama dos 122 circuitos de média tensão e permite ranquear os alimentadores mais críticos em relação aos limites regulatórios de referência.  
  > Clicando em qualquer alimentador, a gaveta lateral abre o histórico mensal e a lista de clientes mais atingidos, direcionando as turmas de campo e poda exatamente para os circuitos de maior retorno."*

- 💡 **A Resposta Direta:**
  > *"Monitoramento com base no PRODIST da ANEEL, priorizando a manutenção preventiva nos circuitos de maior impacto aos clientes."*

---

### Bloco 5: Atendimento ao Cliente & Visão 360 da UC (11:00 – 13:00) · 2 min

- **Apresentador:** Miguel Batista
- **Stakeholder / Persona:** Camila Barreto · Gerente de Atendimento (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."*

- 👉 **O que apontar na tela (UC 360):**
  1. No menu lateral, clique em **Atendimento > UC 360**.
  2. Digite no campo de busca o código de uma unidade: `UC100094`.
  3. Aponte para o **gráfico comparativo de consumo**: barras do ano atual lado a lado com o mesmo mês do ano anterior.
  4. Aponte para os cards de contexto: **badge de energia solar (GD)**, **histórico de faturas**, **interrupções no circuito da rua** e **chamados anteriores**.

- 🗣️ **O que falar:**
  > *"No atendimento ao cliente, cada segundo na linha custa dinheiro e satisfação. A Gerente Camila Barreto relatou que seus operadores precisavam abrir quatro sistemas diferentes e demoravam minutos para responder uma dúvida de conta alta.  
  > Na tela **UC 360**, basta digitar o código da UC — como a `UC100094`. Em milissegundos, o atendente visualiza:  
  > 1. O gráfico de consumo comparado com o ano passado — tirando a dúvida na hora se o consumo real subiu;  
  > 2. Se o cliente possui painel solar instalado;  
  > 3. Se a rua dele teve ocorrência de falta de energia recente;  
  > 4. E a lista de faturas e chamados anteriores.  
  > Se o consumidor reclamar da conta, o atendente esclarece na hora se o consumo físico dele aumentou ou se o valor subiu por conta de bandeira tarifária aprovada pela ANEEL."*

- 💡 **A Resposta Direta:**
  > *"Substituímos 4 sistemas legados por uma consulta em tela única em sub-segundo, garantindo resposta imediata ao cliente."*

---

### Bloco 6: Inteligência Artificial Text-to-SQL & Fechamento (13:00 – 15:00) · 2 min

- **Apresentador:** Miguel Batista
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

As 8 perguntas de maior probabilidade que a banca examinadora fará, com a resposta técnica e de negócio exata e o apresentador que lidera a resposta:

### 1. Pergunta sobre Escolha do Banco de Dados:
> *"Por que vocês escolheram SQLite no backend em vez de PostgreSQL?"*
- **Líder da Resposta:** Bernardo Heuer (ou apoio técnico conjunto)
- **Resposta:** *"O SQLite foi uma escolha técnica consciente para o escopo da área piloto (45 mil UCs e 2,1 milhões de registros). Ele torna a aplicação 100% autocontida, com portabilidade total e zero dependência de infraestrutura externa em homologação. Toda a camada Gold foi modelada em Star Schema (Modelo Dimensional com dimensões e fatos) e indexada nas chaves de maior tráfego (competência, alimentador e código de UC), atingindo tempos de resposta inferiores a 100 milissegundos nas rotas da API e nas consultas da IA."*

---

### 2. Pergunta sobre Prevenção de Alucinação na Inteligência Artificial:
> *"Como vocês garantem que o modelo de IA não alucina nem gera consultas perigosas que corrompam o banco?"*
- **Líder da Resposta:** Miguel Batista
- **Resposta:** *"Adotamos defesa em três níveis: 1. Segurança de Infraestrutura: a conexão disponibilizada para a IA é estritamente de leitura (SELECT), sem privilégios de escrita ou deleção. 2. Arquitetura FSM: o agente valida a sintaxe SQL contra o catálogo de tabelas Gold antes de disparar a consulta. 3. Golden Dataset: criamos uma bateria de testes com dezenas de perguntas de negócio auditadas, penalizando o modelo caso ele desvie do gabarito."*

---

### 3. Pergunta sobre o Impacto da Geração Distribuída (GD):
> *"Se apenas 3,5 mil UCs possuem energia solar de um total de 45 mil, como ela explica a queda de volume faturado?"*
- **Líder da Resposta:** Bernardo Heuer
- **Resposta:** *"A adoção de energia solar ocorreu em 3.496 UCs (3.115 residenciais e 381 comerciais, nenhuma indústria). Embora representem 7,8% das conexões, essas unidades faturaram 61% a menos após a instalação dos painéis. Elas deixaram de comprar 11.222 MWh da rede, o que supera toda a queda líquida de 9.829 MWh da base de clientes mantidos (as UCs sem painel solar cresceram +0,7%). A energia gerada pelo sol é consumida instantaneamente no imóvel e abatida antes da fatura, gerando uma redução estrutural de volume."*

---

### 4. Pergunta sobre a Fraude nos 4 Bairros:
> *"Qual é a evidência real nos dados de que houve fraude nos quatro bairros críticos a partir de maio de 2025?"*
- **Líder da Resposta:** Bernardo Heuer
- **Resposta:** *"Cruzamos as curvas mensais de faturamento com os laudos de campo. Em Iputinga, Macaxeira, Jardim Jordão e Prazeres, o consumo residencial despencou repentinamente a partir de maio de 2025 sem relação com placas solares. A confirmação definitiva veio da fiscalização: das 1.389 inspeções efetuadas pela distribuidora com 871 irregularidades confirmadas (62,7% de acerto geral), nada menos que 835 (95,9%) estavam concentradas nesses 4 bairros (violação de lacre, bobina adulterada ou ligação direta), isolando um potencial de até R$ 2,02 milhões anuais de receita em jogo."*

---

### 5. Pergunta sobre Metodologia Regulatória (DEC e FEC):
> *"Como vocês calcularam o DEC e o FEC a partir das ocorrências de rede?"*
- **Líder da Resposta:** Miguel Batista
- **Resposta:** *"Implementamos a fórmula da ANEEL baseada no PRODIST Módulo 8. Para cada alimentador em cada mês, o DEC é a soma da duração de cada interrupção ponderada pela quantidade de unidades consumidoras atingidas, dividida pelo total de UCs atendidas pelo alimentador. O FEC é análogo, ponderando a quantidade de interrupções. Como os limites regulatórios da ANEEL são anuais e por conjunto elétrico, nós os incorporamos como limites de referência para nortear o ranking operacional e priorizar a manutenção preventiva nos circuitos mais vulneráveis."*

---

### 6. Pergunta sobre Rotina da Equipe de Campo:
> *"Como a solução ajuda a equipe de campo que trabalha na rua sem acesso à internet?"*
- **Líder da Resposta:** Bernardo Heuer
- **Resposta:** *"A tela de fiscalização possui botão de exportação da fila priorizada em CSV. O supervisor exporta a rota do dia para o dispositivo da equipe. Ao retornarem à base com os laudos preenchidos, o gestor utiliza o botão de upload de planilha no portal: o backend processa o arquivo em lote, atualiza os status das ordens de serviço e computa a energia recuperada, poupando centenas de horas de redigitação manual."*

---

### 7. Pergunta sobre Escalabilidade para Produção:
> *"Se a diretoria decidir colocar esse sistema em produção para 2 milhões de clientes no estado inteiro, o que mudaria na arquitetura?"*
- **Líder da Resposta:** Miguel Batista
- **Resposta:** *"A arquitetura já foi desenhada para isso: 1. O pipeline de dados já está em PySpark no Databricks, bastando escalar horizontalmente o cluster de processamento. 2. Substituiríamos o SQLite local por uma instância distribuída gerenciada (como PostgreSQL particionado ou BigQuery). 3. O backend FastAPI e o portal React viabilizam escalabilidade imediata sob contêineres e balanceamento de carga com cache Redis e banco de suporte."*

---

### 8. Pergunta sobre Rastreabilidade nas Tabelas Gold:
> *"Quais tabelas e colunas específicas comprovaram essa tese da GD e da Fraude?"*
- **Líder da Resposta:** Bernardo Heuer & Miguel Batista
- **Resposta:** *"1. Na `fato_faturamento`, medimos que o volume faturado recuou de 227,1 mil para 218,0 mil MWh (-4,0%). 2. Na `dim_unidade_consumidora`, filtramos `possui_gd = 1` e medimos que as 3.496 UCs com solar deixaram de comprar 11.222 MWh (-61% no faturamento delas). 3. Filtrando as UCs sem GD na `fato_faturamento`, isolamos a queda abrupta a partir de maio de 2025 em Iputinga, Macaxeira, Jardim Jordão e Prazeres (onde 894 UCs caíram mais de 40%). 4. Na `fato_inspecoes_perdas`, confirmamos que 835 de 871 irregularidades atestadas estavam nesses 4 bairros."*

---

## 📊 Números para Saber de Cor (Guia Rápido da Apresentação)

> **A resposta em uma frase:** A receita subiu só 8,0% porque a alta de 12,5% da tarifa média foi em parte anulada pela queda de 4,0% do volume, causada pelos clientes com painel solar, que deixaram de comprar mais do que a queda líquida inteira da empresa; a fraude em quatro bairros é a segunda causa e a única recuperável pela fiscalização.

| Tema / Métrica | Número Exato | Como Dizer na Fala Executiva |
|---|---|---|
| **Receita Total** | R$ 157,1 mi $\rightarrow$ R$ 169,7 mi | **+8,0%** (ou +R$ 12,6 milhões) |
| **Volume Faturado** | 227,1 mil $\rightarrow$ 218,0 mil MWh | **Queda de 4,0%** (a mesma ordem da fala do Diretor Comercial) |
| **Tarifa Média Realizada** | R$ 0,6919 $\rightarrow$ R$ 0,7783/kWh | **+12,5%** (reajuste homologado de 10,5% + bandeiras tarifárias e tributos) |
| **Ponte de Receita (Preço vs Volume)** | Preço +R$ 20,4 mi \| Volume -R$ 6,2 mi | O efeito-preço impulsionou, mas o efeito-volume consumiu R$ 6,2 mi de receita |
| **Geração Distribuída (GD Solar)** | **-11.222 MWh** nas UCs com painel | Mais que a queda líquida total (-9.829 MWh); UCs sem painel cresceram +0,7% |
| **Perfil dos Clientes com GD** | **3.496 UCs** (3.115 residenciais e 381 comerciais) | 7,8% das conexões; faturaram 61% a menos após a instalação |
| **Fraude nos 4 Bairros Críticos** | Iputinga, Macaxeira, Jardim Jordão e Prazeres | Consumo caiu a partir de mai/2025; 894 UCs despencaram $\ge$ 40% |
| **Receita em Jogo na Fraude** | **Até R$ 2,02 milhões / ano** | Potencial máximo estimado de recuperação nas áreas fraudadas |
| **Inspeções de Campo Realizadas** | **1.389 inspeções**, com **871 irregularidades** | 62,7% de acerto geral; **835 das 871 irregularidades (95,9%)** nos 4 bairros |
| **Inadimplência da Carteira** | 5,5% $\rightarrow$ 5,4% | R$ 9,2 milhões vencidos sob gestão comercial |
| **DEC Médio Anual (Horas/Cliente)** | 1,47 h $\rightarrow$ 3,45 h | Sem o evento atípico de jul/2025: 1,51 h |
| **FEC Médio Anual (Quedas/Cliente)** | 0,89 $\rightarrow$ 1,31 vezes | Sem o evento atípico de jul/2025: 0,91 vezes |
| **Fila de Inspeção de Perdas** | Priorização calibrada para 200 inspeções/mês | 62,7% de acerto histórico geral e 92,5% nas faixas de alta prioridade |

---

## 📋 Checklist Prático para a Dupla no Dia D

- [ ] **Ambiente Local Iniciado:** Garantir que o comando `make run-all` (ou `make run-all-ngrok`) esteja rodando e que as páginas abram instantaneamente em `http://localhost:5173`.
- [ ] **Abas Pré-carregadas:** Deixar o navegador aberto com as telas da Navbar já carregadas em abas individuais (para evitar qualquer atraso de renderização durante a fala).
- [ ] **Bernardo com Telas Prontas:** Painel Executivo, Inteligência Comercial e Fila de Inspeção (com arquivo CSV de exemplo na pasta se quiser demonstrar upload).
- [ ] **Miguel com Telas Prontas:** Qualidade da Rede (testar o clique no alimentador para abrir o Drawer), UC 360 (código `UC100094` testado com todos os blocos) e Assistente IA (pergunta de demonstração copiada na área de transferência: *"Qual bairro teve a maior queda de volume faturado residencial no último ano?"*).
- [ ] **Controle do Relógio:** Manter um cronômetro visível com a transição aos 09:00 minutos de Bernardo para Miguel e término cravado em 15:00 minutos.
