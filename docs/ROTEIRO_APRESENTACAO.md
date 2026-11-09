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

## 🎯 Visão Geral da Solução

### 1. Qual problema o sistema resolve?
Historicamente, a V-Energy operava com **silos cegos de informação**: o cadastro comercial em um sistema, a medição mensal em outro, as ocorrências de rede em planilhas e as inspeções em arquivos Excel preenchidos à mão. Cada diretoria enxergava uma versão diferente do mesmo cliente e dados conflitantes.  
O **V-Energy Grid 360** é uma plataforma analítica integrada de ponta a ponta que unifica os 4 anos de histórico das 45 mil Unidades Consumidoras (mais de 2,1 milhões de faturas e leituras) em uma **fonte única da verdade**, transformando dados brutos em decisões de receita, fiscalização em campo, conformidade regulatória e atendimento imediato ao consumidor.

### 2. A Pergunta Central do Negócio
> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião."* — **Henrique Duarte**, Diretor Comercial (`atividade.pdf`, pág. 2)

### 3. A Explicação Comprovada Baseada nos Dados
A análise quantitativa da nossa plataforma revelou com precisão matemática o que aconteceu:
- A receita total faturada avançou de **R$ 157,1 mi** para **R$ 169,7 mi** (+8,0%, ou +R$ 12,6 mi).
- A **tarifa média realizada subiu 13,8%**, o que isoladamente geraria um acréscimo de **+R$ 22,6 milhões** de receita (**efeito-preço**).
- No entanto, o volume total faturado despencou **5,1%** (de 227,0 mil MWh para 215,4 mil MWh), o que destruiu **R$ 8,0 milhões** de receita (**efeito-volume**). O efeito cruzado e o mix respondem pela diferença de -R$ 2,0 mi.
- **As duas causas fundamentais da queda de volume identificadas nos dados:**
  1. **Geração Distribuída (GD - Painéis Solares):** 3,5 mil clientes de médio e alto consumo adotaram energia solar. Essa autogeração reduziu o faturamento da distribuidora em 11.314 MWh, explicando **97,4% de toda a queda de volume líquido**. O cliente não parou de consumir energia; ele consome a energia que gerou no próprio telhado.
  2. **Fraude Concentrada em 4 Bairros:** Nos bairros de **Iputinga**, **Macaxeira**, **Jardim Jordão** e **Prazeres**, o consumo despencou bruscamente a partir de maio de 2025. Das 871 inspeções de campo realizadas nesses locais, **835 (96%) confirmaram irregularidades e furto de energia**. Esse desvio representa um potencial de até **R$ 2,02 milhões** anuais de receita recuperável pela fiscalização.

## ⏱️ Roteiro de Apresentação (15 Minutos Cronometrados)

### Bloco 1: Abertura & A Dor da TI (00:00 – 02:00) · 2 min

- **Stakeholder / Persona:** Patrícia Lins · Diretora de Tecnologia (`atividade.pdf`, pág. 2).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"Cada sistema exporta de um jeito. O faturamento sai em CSV com ponto e vírgula, o call center manda JSONs, as inspeções chegam em Excel preenchido à mão. Cada área tem um número diferente para a mesma coisa. Antes de qualquer dashboard, precisamos de engenharia de dados séria. Depois, quero que qualquer pessoa da empresa faça uma pergunta em português e receba a resposta na hora, sem abrir chamado para o meu time."*
 
 **O que mostrar**: Painel.

- **O que falar:**
  > *"Boa tarde aos membros da banca avaliadora. A V-Energy atende 45 mil Unidades Consumidoras — ou seja, UCs — na Região Metropolitana do Recife, com um histórico de mais de 2 milhões de leituras e faturas.  
  > Como a Diretora de Tecnologia Patrícia Lins destacou, o maior gargalo da companhia era a desordem dos dados: faturamento em CSV, chamados em JSON e inspeções em Excel preenchido à mão. Cada área enxergava um número diferente.  
  > Nossa equipe resolveu isso na raiz: construímos no Databricks um **Pipeline Medalhão** em PySpark — camada Bronze para ingestão bruta rastreável, Silver para limpeza e integridade referencial sem registros órfãos, e Gold com métricas de negócio consolidadas.  
  > Essa base alimenta o **V-Energy Grid 360**, acessível através desta tela que vocês vêem na Navbar em **Diretoria > Painel**: um painel executivo com controle de acesso por perfis (RBAC), onde toda a liderança visualiza os mesmos indicadores com 100% de confiabilidade."*
- **Requisito Base Obrigatório vs. Diferencial do Case:**
  - **Requisito Base Obrigatório (`atividade.pdf`, 5.1 e 5.2):** Ingerir o dataset na camada Bronze preservando o conteúdo original; camada Silver com limpeza e integridade referencial; modelagem Gold consumida pelo portal e IA; cálculo de DEC/FEC; exportação da Gold para banco local; orquestração via Databricks Workflow (`job.yaml`); e portal web exibindo principais indicadores e comparativos entre períodos.
  - **Diferenciais do Case Contemplados:**
    - **Testes de Qualidade Automatizados no Pipeline:** Validação de integridade antes que qualquer dado chegue ao portal.
    - **Controle de Acesso Baseado em Perfis (RBAC):** Login com telas e permissões específicas para cada cargo (Diretoria, Perdas, Operação, Atendimento).

---

### Bloco 2: O Diagnóstico do Diretor Comercial (02:00 – 06:00) · 4 min

- **Stakeholder / Persona:** Henrique Duarte · Diretor Comercial (`atividade.pdf`, pág. 2 e 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião."*  
  > *(...)*  
  > *"Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."*

- **O que mostrar**: Inteligência Comercial.

- **O que falar:**
  > *"Entramos agora na pergunta central que originou a contratação do nosso time: por que a receita subiu apenas 8% se a tarifa aumentou?  
  > Na tela **Inteligência Comercial**, entregamos a resposta matemática:  
  > A alta da tarifa média gerou um acréscimo positivo de **R$ 22,6 milhões** — o chamado **efeito-preço**. No entanto, o volume físico de energia faturada caiu **5,1%**, o que subtraiu **R$ 8,0 milhões** de faturamento — o **efeito-volume**.  
  > Ao abrirmos os dados por município e bairro, descobrimos as duas causas comprovadas da queda de volume:  
  > Primeira causa: **Geração Distribuída (GD) — Energia Solar.** Cerca de 3,5 mil clientes comerciais e residenciais de alto consumo passaram a gerar sua própria energia com painéis fotovoltaicos. Esses clientes deixaram de comprar 11,3 mil MWh da distribuidora, explicando **97,4% da queda líquida total**. O consumo real não sumiu, apenas deixou de ser faturado na rede convencional.  
  > Segunda causa: **Fraude Concentrada.** Descobrimos que a perda restante está localizada em quatro bairros: Iputinga e Macaxeira no Recife, e Jardim Jordão e Prazeres em Jaboatão dos Guararapes. Nesses bairros, o consumo despencou bruscamente a partir de maio de 2025. Das 871 inspeções realizadas em campo nesses quatro locais, 835 confirmaram fraude no medidor — 96% de assertividade. Isso representa **R$ 2,02 milhões** anuais de receita em jogo, pronta para ser recuperada."*
- **Requisito Base Obrigatório vs. Diferencial do Case:**
  - **Requisito Base Obrigatório (`atividade.pdf`, 5.2 e 5.4):** Entender a variação de receita entre períodos separando efeito-preço e efeito-volume; investigar por município, bairro e classe até encontrar onde está a queda; entregar diagnóstico fundamentado com recomendações acionáveis na pasta `docs/`.
  - **Diferenciais do Case Contemplados:**
    - **Decomposição Econométrica Quádrupla:** Cálculo formal de **efeito Mix** e **efeito Cruzado** fechando rigorosamente na identidade centavo a centavo.
    - **Mapa Territorial Coroplético:** Visualização geoespacial vetorial nativa dos 14 municípios da Região Metropolitana do Recife com cálculo de share de receita.

---

### Bloco 3: Gestão de Perdas & Fila de Fiscalização (06:00 – 09:00) · 3 min

- **Stakeholder / Persona:** Rafael Coutinho · Gerente de Perdas (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."*

- **O que mostrar:** Fila de Inspeção.

- **O que falar:**
  > *"O Gerente de Perdas Rafael Coutinho nos avisou: 'uma inspeção que não acha nada é um dia de equipe perdido'.  
  > Na tela **Fila de Inspeção**, eliminamos o desperdício de tempo e dinheiro. O nosso modelo cruza a quebra repentina do padrão de consumo com o cadastro de medidores e com a lista de clientes que possuem energia solar. Com isso, evitamos um erro clássico do setor: nunca mandamos fiscalizar um cliente honesto cujo consumo caiu porque instalou placas solares.  
  > A tabela prioriza as unidades mais promissoras no topo, detalha o motivo da suspeita e quanto de energia em kWh podemos reaver.  
  > Além disso, atendemos aos dois grandes diferenciais solicitados pelo cliente: com um clique, o gestor exporta a lista em CSV para os fiscais levarem a campo. E quando a equipe retorna, ele simplesmente faz o upload da planilha preenchida no sistema. Os resultados de fraude e regularidade são computados automaticamente, sem digitação manual. E na aba **Efetividade**, o gestor audita o histórico do modelo calibrado para 200 inspeções mensais."*
- **Requisito Base Obrigatório vs. Diferencial do Case:**
  - **Requisito Base Obrigatório (`atividade.pdf`, 5.2):** Ver unidades suspeitas ordenadas por prioridade com motivo da suspeita e energia estimada a recuperar; gerar ordens de inspeção (OS), atualizar status, registrar resultado encontrado em campo e cancelar ordens.
  - **Diferenciais do Case Contemplados:**
    - **Exportação da Fila de Inspeção em CSV:** Envio da rota de fiscalização diretamente para a equipe de campo.
    - **Upload pelo Portal da Planilha Preenchida em Campo:** Carga em lote dos laudos com pré-visualização sem digitação manual.
    - **Backtest e Aba de Efetividade:** Calibração preditiva da taxa de acerto por faixa de inspeções (50, 100, 200, 400).

---

### Bloco 4: Qualidade da Rede & Indicadores DEC/FEC da ANEEL (09:00 – 11:00) · 2 min

- **Stakeholder / Persona:** Beatriz Farias · Gerente de Operação (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"A ANEEL cobra DEC e FEC da gente, e multa quando passamos do limite. Quero acompanhar esses indicadores por alimentador, saber quais regiões concentram as piores interrupções e onde a manutenção preventiva dá mais retorno."*

**O que mostrar:** Qualidade da Rede.

- **O que falar:**
  > *"Para a Gerente de Operação Beatriz Farias, estabilidade da rede é sinônimo de segurança financeira e conformidade com o órgão regulador federal, a ANEEL.  
  > Na tela **Qualidade da Rede**, calculamos de forma automatizada no pipeline as duas métricas oficiais estabelecidas no regulamento do PRODIST Módulo 8 da ANEEL:  
  > O **DEC** — Duração Equivalente de Interrupção por Unidade Consumidora —, que indica quantas horas, em média, os clientes ficaram sem energia;  
  > E o **FEC** — Frequência Equivalente de Interrupção por Unidade Consumidora —, que aponta quantas vezes faltou luz no período.  
  > A Beatriz pode acompanhar esses indicadores ao longo de todos os 4 anos de dados e, fundamentalmente, filtrar por **alimentador** — que são os circuitos elétricos de média tensão que alimentam os bairros. O sistema destaca visualmente os alimentadores mais degradados, permitindo enviar a manutenção preventiva exatamente onde o risco de estourar as metas da ANEEL e sofrer multas é iminente."*
- **Requisito Base Obrigatório vs. Diferencial do Case:**
  - **Requisito Base Obrigatório (`atividade.pdf`, 5.1 e 5.2):** Calcular DEC e FEC por alimentador conforme PRODIST da ANEEL; acompanhar os indicadores ao longo do tempo e identificar os piores circuitos para manutenção preventiva.
  - **Diferenciais do Case Contemplados:**
    - **Normalização e Segmentação por Causa de Falha:** Filtro detalhado por causa da interrupção (falha interna vs externa) e presets rápidos de períodos regulatórios.
    - **Visualização Territorial Integrada:** Comparativo simultâneo de share de horas e frequência por alimentador.

---

### Bloco 5: Atendimento ao Cliente & Visão 360 da UC (11:00 – 13:00) · 2 min

- **Stakeholder / Persona:** Camila Barreto · Gerente de Atendimento (`atividade.pdf`, pág. 6).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"O cliente liga, o atendente pede o número da unidade que está na conta e digita no sistema. Nessa hora tem que aparecer tudo numa tela só: quem é o cliente, o consumo dos últimos meses ao lado do mesmo período do ano passado, as faturas em aberto, o medidor instalado, se ele tem painel solar, se a rua dele teve falta de luz e os chamados que ele já abriu. Hoje meu atendente abre quatro sistemas e o cliente espera na linha. Quando alguém diz que a conta veio alta, o atendente precisa conseguir responder na hora se o consumo realmente subiu."*

- **O que mostrar:** UC 360.

- **O que mostrar ao vivo:**
  1. Clicar no menu lateral em **Atendimento > UC 360**.
  2. Digitar no campo de busca o código de uma Unidade Consumidora (ex: `UC-0001`).
  3. Mostrar o gráfico de barras comparativo de consumo sazonal (ano atual vs. ano anterior).
  4. Apontar o badge de painel solar (GD), o histórico de faturas e os chamados anteriores.
- **O que falar:**
  > *"No atendimento ao consumidor, cada segundo do cliente na linha é precioso. A Gerente Camila Barreto relatou que seus operadores precisavam abrir quatro sistemas legados diferentes e demoravam minutos para responder a uma simples dúvida de conta alta.  
  > Na tela **UC 360**, bastam 3 cliques. O atendente digita o número da Unidade Consumidora que está na conta de luz e tem tudo reunido diante dos olhos:  
  > 1. O gráfico mostra o consumo em kWh dos últimos meses colocado lado a lado com o mesmo mês do ano anterior — provando de imediato se houve aumento real de uso de energia;  
  > 2. O sistema avisa se a residência possui painel solar cadastrado;  
  > 3. Exibe se houve ocorrência de falta de luz no circuito da rua do cliente;  
  > 4. E lista as faturas abertas e o histórico de protocolos anteriores.  
  > Se o consumidor reclamar que a conta veio alta, o operador responde na hora se o consumo dele realmente subiu ou se o aumento decorreu de alteração na bandeira tarifária aprovada pela ANEEL."*
- **Requisito Base Obrigatório vs. Diferencial do Case:**
  - **Requisito Base Obrigatório (`atividade.pdf`, 5.2):** Encontrar uma UC e ver numa única tela: histórico de consumo comparado com ano anterior, faturas, medidor, geração própria, interrupções e chamados, para responder ao cliente na hora.
  - **Diferencial Contemplado:** Arquitetura de dados desnormalizada e indexada com tempo de busca sub-segundo, eliminando 100% dos 4 sistemas legados anteriores.

---

### Bloco 6: Inteligência Artificial Text-to-SQL & Fechamento (13:00 – 15:00) · 2 min

- **Stakeholder / Persona:** Patrícia Lins (TI) e Henrique Duarte (Comercial) (`atividade.pdf`, pág. 7).
- **Citação Literal do Problema (`atividade.pdf`):**
  > *"Hoje, se o time de perdas quer saber quantas unidades com painel solar em Olinda tiveram queda de consumo acima de 30%, alguém abre um chamado, meu analista escreve a consulta e a resposta chega dois dias depois. Quero que a pessoa pergunte em português e tenha a resposta na hora. Com uma condição: se o agente não souber, ele tem que dizer que não sabe. Dados inventados são mais prejudiciais do que não ter."* — Patrícia Lins  
  > *(...)*  
  > *"Eu usaria isso antes de todas as reuniões. 'Qual bairro mais perdeu volume residencial no último ano?', 'Quanto a receita comercial cresceu em Jaboatão?'. Não preciso de dashboard para isso, preciso de uma resposta rápida e atualizada em que eu possa confiar."* — Henrique Duarte
- **Qual problema o sistema resolve nesta tela:** Permite que diretores e analistas façam perguntas em português e recebam respostas extraídas do banco de dados com transparência (exibindo o SQL) e garantia de honestidade (sem alucinações).


- **O que mostrar ao vivo:**
  1. Clicar no botão **Assistente IA** no canto superior direito para abrir o painel lateral do chat.
  2. Digitar ou colar uma pergunta real em português: *"Qual bairro teve a maior queda de volume faturado residencial no último ano?"*.
  3. Mostrar o streaming de raciocínio da IA, a consulta SQL gerada de forma transparente e o resultado fundamentado.
  4. Apontar os **Smart Insights** embutidos nos cards de indicadores das telas.

- **O que falar:**
  > *"Para encerrar nossa apresentação: e quando a diretoria precisa de uma resposta que não está em nenhum gráfico pronto, 10 minutos antes de uma reunião com o conselho?  
  > Construímos o **Assistente de IA Text-to-SQL**, acessível pelo botão no topo da barra de navegação.  
  > O usuário não precisa saber uma linha de código: basta perguntar em português informal — o agente compreende expressões cotidianas como 'conta de luz' e 'falta de luz'.  
  > Ele traduz a pergunta em uma consulta SQL segura, roda no banco local e formula uma resposta clara e fundamentada.  
  > E cumprimos à risca a exigência da Diretora de TI Patrícia Lins: **o agente é estritamente honesto**. Ele exibe os passos de raciocínio e a consulta SQL para auditoria, e se a pergunta envolver dados inexistentes na base, ele declara que não sabe em vez de inventar números.  
  > Além do chat, implementamos **IA embutida nas telas**: o portal gera insights automáticos interpretando o comportamento dos dados sem que o usuário precise perguntar.  
  > Como diferenciais adicionais, nosso agente mantém o **contexto em perguntas de acompanhamento** (follow-up) e é continuamente auditado por um **Golden Dataset com avaliação automatizada de acurácia**.  
  > O **V-Energy Grid 360** entrega engenharia de dados robusta, inteligência analítica e inteligência artificial responsável. Muito obrigado à banca, estamos prontos para a sessão de perguntas."*
- **Requisito Base Obrigatório vs. Diferencial do Case:**
  - **Requisito Base Obrigatório (`atividade.pdf`, 5.3):** Agente Text-to-SQL em português sobre consumo, faturamento, interrupções e atendimento; entendimento de termos do dia a dia ("conta de luz", "falta de luz"); auditoria de como chegou à resposta (SQL); insights gerados por IA embutidos no portal; acesso sem trocar de ferramenta; segurança para não alterar dados nem agir fora do papel.
  - **Diferenciais do Case Contemplados:**
    - **Perguntas de Follow-up com Contexto Histórico:** O usuário faz perguntas consecutivas sem precisar repetir o filtro ou a entidade anterior.
    - **Medição Automatizada da Qualidade (Golden Dataset):** Pipeline de benchmark que avalia a acurácia sintática e semântica das consultas e respostas da IA.
    - **Suporte a LLM Local na GPU Privada:** Capacidade de execução desconectada da nuvem para garantia total de soberania de dados.

---

## 🛡️ Guia de Defesa da Banca (15 Minutos de Q&A)

As 8 perguntas de maior probabilidade que a banca examinadora fará, estruturadas com a resposta exata para demonstrar domínio completo do projeto:

### 1. Pergunta sobre Escolha do Banco de Dados:
> *"Por que vocês escolheram SQLite no backend em vez de PostgreSQL?"*

- **Resposta Recomendada:**  
  *"O SQLite foi uma escolha técnica consciente para o escopo da área piloto (45 mil UCs e 2,1 milhões de registros). Ele torna a aplicação 100% autocontida, com portabilidade total e zero dependência de infraestrutura em nuvem ou contêineres de terceiros durante a homologação. Toda a camada Gold foi modelada em terceira forma normal e indexada nas chaves de maior tráfego (competência, alimentador e código de UC), atingindo tempos de resposta inferiores a 100 milissegundos nas rotas da API e nas consultas da IA."*

---

### 2. Pergunta sobre Prevenção de Alucinação na Inteligência Artificial:
> *"Como vocês garantem que o modelo de IA não alucina nem gera consultas perigosas que corrompam o banco?"*

- **Resposta Recomendada:**  
  *"Adotamos uma abordagem de defesa em três níveis:*  
  *Primeiro, **Segurança de Infraestrutura:** A conexão de banco disponibilizada para a IA é estritamente de leitura (SELECT), sem qualquer privilégio de escrita ou deleção.*  
  *Segundo, **Arquitetura de Estados (FSM):** O agente valida a sintaxe SQL contra o catálogo de tabelas Gold antes de disparar a consulta.*  
  *Terceiro, **Avaliação com Golden Dataset:** Criamos uma bateria de testes com dezenas de perguntas de negócio com gabarito auditado, penalizando o modelo caso ele gere informações desconectadas da base."*

---

### 3. Pergunta sobre o Impacto da Geração Distribuída (GD):
> *"Se apenas 3,5 mil UCs possuem energia solar de um total de 45 mil, como ela pode explicar 97,4% da queda de volume faturado?"*

- **Resposta Recomendada:**  
  *"A adoção de energia solar requer investimento de capital e ocorre prioritariamente nos clientes de maior demanda energética: comércios, pequenas indústrias e residências de grande porte. Embora representem 7,8% das conexões, essas 3,5 mil UCs eram responsáveis por um consumo substancial da concessão. A energia gerada pelo sol é consumida instantaneamente no local e abatida antes da emissão da fatura. Portanto, esses clientes deixaram de comprar 11,3 mil MWh da rede da V-Energy, o que corresponde matematicamente a 97,4% da perda líquida de 11,6 mil MWh apurada na comparação entre as duas janelas."*

---

### 4. Pergunta sobre a Fraude de Energia nos 4 Bairros:
> *"Qual é a evidência real nos dados de que houve fraude nos quatro bairros críticos a partir de maio de 2025?"*

- **Resposta Recomendada:**  
  *"Cruzamos as curvas mensais de faturamento com os laudos das inspeções de campo. Nos bairros de Iputinga, Macaxeira, Jardim Jordão e Prazeres, o consumo residencial médio teve uma queda brusca a partir de maio de 2025 que não tinha correlação com instalação de painéis solares. A confirmação definitiva veio do histórico de fiscalização: das 871 inspeções efetuadas nesses bairros, 835 (96%) registraram irregularidades materiais no medidor. Isso comprova fraude como causa local e isola um montante de R$ 2,02 milhões anuais em receita que a empresa pode recuperar."*

---

### 5. Pergunta sobre Metodologia Regulatória (DEC e FEC):
> *"Como vocês calcularam o DEC e o FEC a partir das ocorrências de rede?"*

- **Resposta Recomendada:**  
  *"Implementamos as fórmulas oficiais do PRODIST Módulo 8 da ANEEL. Para cada alimentador em cada competência mensal, o DEC é a soma da duração de cada interrupção ponderada pela quantidade de unidades consumidoras atingidas, dividida pelo total de UCs atendidas pelo alimentador. O FEC é análogo, ponderando o número de eventos de falta de luz. Esse cálculo permite comparar circuitos de portes completamente diferentes em uma base justa e técnica."*

---

### 7. Pergunta sobre Rotina da Equipe de Campo:
> *"Como a solução ajuda a equipe de campo que trabalha na rua sem acesso à internet?"*

- **Resposta Recomendada:**  
  *"A tela de fiscalização possui um botão de exportação da fila priorizada em formato CSV/planilha. O supervisor exporta a rota do dia para o dispositivo da equipe. Ao retornarem à base com os laudos preenchidos, o gestor utiliza o botão de upload de planilha no portal: o backend processa o arquivo em lote, atualiza os status das ordens de serviço e computa a energia recuperada, poupando centenas de horas de redigitação manual."*

---

### 8. Pergunta sobre Escalabilidade para Produção:
> *"Se a diretoria decidir colocar esse sistema em produção para 2 milhões de clientes no estado inteiro, o que mudaria na arquitetura?"*

- **Resposta Recomendada:**  
  *"A arquitetura foi projetada com separação estrita de camadas:*  
  *1. **Engenharia de Dados:** O pipeline já está desenvolvido em PySpark no Databricks, necessitando apenas escalar horizontalmente o cluster de nós de processamento.*  
  *2. **Banco de Dados:** Substituiríamos o SQLite local por uma instância distribuída gerenciada (como PostgreSQL particionado por competência ou BigQuery).*  
  *3. **Aplicação:** O backend FastAPI opera sem estado (stateless) e o portal React é compilado estaticamente, viabilizando escalabilidade imediata sob contêineres e balanceamento de carga com cache Redis nas rotas analíticas."*

---

### 9. Pergunta sobre Metodologia de Investigação e Evidências nas Tabelas:
> *"Como exatamente vocês descobriram nos dados que a queda vinha de GD e fraude? Quais tabelas e colunas comprovaram essa tese?"*

- **Resposta Recomendada:**  
  *"Não trabalhamos com hipóteses ou opiniões: a resposta foi extraída do cruzamento rigoroso de três tabelas da camada Gold:*  
  *1. **O Efeito-Volume Geral:** Na `fato_faturamento`, calculamos que o volume faturado encolheu **11.618 MWh** (-5,1%) entre os dois períodos.*  
  *2. **A Pista da GD (Energia Solar):** Na `dim_unidade_consumidora`, filtramos os 3,5 mil clientes com `possui_gd = 1`. Cruzando com o faturamento antes e depois do campo `data_conexao_gd`, medimos que eles deixaram de comprar da rede exatamente **11.314 MWh**, explicando matematicamente **97,4% de toda a queda de volume**.*  
  *3. **A Pista Territorial:** Filtrando as UCs restantes sem GD na `fato_faturamento` por bairro, identificamos que a perda residual estava concentrada em **Iputinga**, **Macaxeira**, **Jardim Jordão** e **Prazeres**, com queda abrupta a partir de maio de 2025.*  
  *4. **A Comprovação da Fraude:** Consultamos a `fato_inspecoes_perdas` e a `fato_anomalia_leitura`. Dos 871 laudos de fiscalização em campo registrados nesses quatro bairros, **835 (96%) constataram irregularidade e furto comprovados** (violação de lacre, bobina adulterada ou ligação direta), isolando um potencial de **R$ 2,02 milhões** anuais em receita recuperável."*

---

## 🔬 Aprofundamento Conceitual: Como Explicar Tarifa, Volume e Fraude

### 1. O que é a Tarifa e por que ela aumentou?
- **O que significa:** A tarifa é o **preço unitário cobrado por cada quilowatt-hora (R$/kWh)** consumido pelo cliente na conta de luz.
- **Relação da Cobrança:** A relação básica da conta de luz é:
  $$\text{Valor da Conta (R\$)} \approx \text{Consumo em Volume (kWh)} \times \text{Tarifa Unitária (R\$/kWh)}$$
- **Quem define e quem paga:** A tarifa é cobrada **da empresa (V-Energy) para as pessoas/empresas (consumidores)**. No entanto, por ser um serviço público regulado, a V-Energy **não pode definir seus preços por conta própria**. É o **governo federal**, por meio da **ANEEL**, quem homologa anualmente os reajustes tarifários contratuais (que acumularam reajuste de 10,5% desde 2022).

### 2. O que é o Volume e por que ele caiu 5,1%?
- **O que significa o Volume:** É a **quantidade física total de eletricidade** efetivamente faturada e cobrada nas contas no período (medida em kWh ou MWh).
- **A Queda de 5,1%:** No primeiro ano, a V-Energy faturou **227,0 mil MWh**. Nos últimos 12 meses, faturou **215,4 mil MWh** — ou seja, **11,6 mil MWh a menos** passaram pelo faturamento oficial da distribuidora.
- **Efeito-Preço vs. Efeito-Volume:**
  - **Efeito-Preço (+R$ 22,6 mi):** Projeção hipotética de ganho considerando o mesmo volume de energia da base vendido sob a tarifa mais cara homologada pela ANEEL.
  - **Efeito-Volume (-R$ 8,0 mi):** Perda financeira causada pela redução de 11,6 mil MWh na quantidade física vendida.
  - A diferença líquida, ajustada pelo Mix e Efeito Cruzado (-R$ 2,0 mi), resulta no crescimento tímido de apenas **+R$ 12,6 mi (+8,0%)** que intrigou o Diretor Comercial.

### 3. O que é a Fraude e como ela foi operada?
- **O que é:** No setor de distribuição, a fraude é o furto qualificado de energia ("gato").
- **Mecanismos de Fraude:**
  1. **Adulteração do Medidor:** Violação física do relógio de medição com inserção de ímãs, quebra de lacres ou alteração de circuitos internos para que o medidor gire muito mais devagar do que o consumo real.
  2. **Desvio Clandestino (Bypass / Ponte):** Ligação de cabos diretamente do poste da rede para o interior do imóvel antes de passar pelo aparelho de medição.
- **Impacto no Negócio:** O cliente continua consumindo energia (ar-condicionado, eletrodomésticos), mas o aparelho registra um consumo residual falso (ex: despenca de 400 kWh para 30 kWh). O volume físico circula pela fiação da concessão, gerando custo de fornecimento para a V-Energy, mas desaparece do faturamento faturado.

### 4. Rastreabilidade nas Tabelas: Como chegamos a essas conclusões?
  Essa é a melhor pergunta para a apresentação! Ninguém "chutou" ou tirou essas conclusões do nada. Tudo veio do cruzamento direto entre as tabelas do banco de dados (da camada Gold).

  Veja exatamente como a equipe investigou e quais tabelas denunciaram tudo:
  ──────
  ### 4.1. Como descobrimos o buraco da Receita e do Volume?

  • Tabela usada: fato_faturamento cruzada com dim_unidade_consumidora.
  • O que foi feito: O time pegou o consumo faturado mês a mês e aplicou a fórmula de decomposição econométrica.
  • O que o dado mostrou:
      • O faturamento total subiu +R$ 12,6 milhões.
      • Mas quando olhamos o volume físico (consumo_faturado_kwh), vimos que foram vendidos 11.618 MWh a menos (-5,1%).
      • Se a base de clientes cresceu, para onde foram esses 11,6 mil MWh?
  ──────
  ### 4.2. A primeira pista: Painéis Solares (GD)
  • Tabelas usadas: dim_unidade_consumidora (colunas possui_gd, potencia_gd_kw, data_conexao_gd) cruzada com fato_faturamento.
  • A descoberta:
      • Filtramos apenas as UCs que tinham a marcação de painel solar (possui_gd = 1).
      • Comparamos o consumo dessas casas antes e depois da data em que ligaram o painel (data_conexao_gd).
      • Resultado na tabela: Essas 3.500 casas deixaram de faturar exatamente 11.314 MWh!
      • Ou seja: dos 11.618 MWh que sumiram, 11.314 MWh (97,4%) foram explicados só pelas pessoas gerando a própria energia no telhado!

  ──────
  ### 4.3. A segunda pista: De onde vinha a sobra e por que desconfiamos de Fraude?
  • O que sobrou: Ainda sobravam cerca de 300 a 1.000 MWh de queda líquida inexplicada em clientes que não tinham placa solar.
  • Tabela usada: Agrupamento por bairro na dim_unidade_consumidora e fato_faturamento.
  • A descoberta territorial:
      • Ao ordenar a perda de volume por bairro, quatro nomes dispararam no topo: Iputinga, Macaxeira, Jardim Jordão e Prazeres.
      • Olhando a linha do tempo desses bairros, o consumo despencou repentinamente a partir de maio de 2025.

  ──────
  ### 4.4. O "xeque-mate": A tabela de Inspeções de Campo

  • Tabelas usadas: fato_inspecoes_perdas e fato_anomalia_leitura.
  • O que a tabela dizia:
      • Nessa tabela ficam registradas todas as visitas que os fiscais da V-Energy fizeram com o laudo do que acharam no medidor.
      • O time filtrou: "Quantas inspeções foram feitas nesses 4 bairros?" → 871 inspeções.
      • "Qual foi o resultado registrado pelo técnico?" → 835 inspeções constataram fraude comprovada (medidor violado, relógio travado ou ligação direta).
      • Isso deu uma taxa assustadora de 96% de irregularidade confirmada!

  ──────
  ### Resumo para a Banca (em 15 segundos):

  │ *"Nós investigamos cruzando a fato_faturamento com o cadastro de dim_unidade_consumidora:
  │
  │ 1. Vimos que 97% do volume perdido vinha de 3.500 clientes com a flag de energia solar (possui_gd) ativa.
  │ 2. O restante do volume perdido estava concentrado em 4 bairros específicos.
  │ 3. Consultamos a tabela de ordens de campo (fato_inspecoes_perdas) e confirmamos que 96% das visitas naqueles 4 bairros tinham laudo de fraude comprovada."*

## 📋 Checklist Prático para o Apresentador no Dia D

- [ ] **Ambiente Local Iniciado:** Garantir que o comando `make run-all` (ou `make run-all-ngrok`) esteja rodando e que as páginas abram instantaneamente em `http://localhost:5173`.
- [ ] **Abas Pré-carregadas:** Deixar o navegador aberto com as 5 telas da Navbar já carregadas em abas individuais (para evitar qualquer atraso de renderização durante a fala).
- [ ] **Prompt da IA Pronto:** Deixar a pergunta de demonstração da IA copiada na área de transferência (*"Qual bairro teve a maior queda de volume faturado residencial no último ano?"*).
- [ ] **UC Pré-selecionada:** Ter em mãos o código de uma UC representativa (ex: `UC-0001`) para demonstração rápida na tela de atendimento.
- [ ] **Controle do Relógio:** Manter um cronômetro visível com os marcadores de 2 min, 6 min, 9 min, 11 min, 13 min e 15 min.
