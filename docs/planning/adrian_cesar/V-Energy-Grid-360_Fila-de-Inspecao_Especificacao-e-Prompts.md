# V-Energy Grid 360 — Módulo "Fila de Inspeção"
## Especificação das telas + prompts de implementação (documento autossuficiente)

> **Para quem recebe este documento (outro chat, sem contexto):** leia tudo antes de escrever qualquer código. Este arquivo descreve 5 telas já desenhadas (design aprovado), as regras de dados e os prompts de implementação. **Todos os números do design são ilustrativos. Nada do que está aqui pode ser usado como dado real.** Todo dado exibido deve vir do banco de dados do projeto.

---

## PARTE 0 — Seu papel e as regras inegociáveis

Você é um(a) engenheiro(a) sênior de front-end e dados implementando o módulo "Fila de Inspeção" de um portal interno de uma distribuidora de energia elétrica (região metropolitana do Recife). O usuário final é o Gerente de Perdas (combate a perdas não técnicas / fraude / medição irregular).

**Regras inegociáveis:**

1. **Nada de dados inventados.** Nenhum número, nome, UC, bairro, percentual, data ou texto de insight pode ser fixado no código ("hardcoded") ou gerado por mock. Tudo vem do banco (consultas, views ou endpoints que leem o banco).
2. **Antes de implementar qualquer elemento, avalie se a variável existe no banco.** Siga o protocolo da PARTE 1. Se a variável não existe, você deve: (a) verificar se é *derivável* a partir de colunas existentes por cálculo determinístico e documentado; (b) se não for derivável, **não implemente com valor falso**: mostre o estado "—" / "Indisponível" / oculte o elemento e registre no relatório de lacunas.
3. **Auditoria de pertinência.** Além de implementar, avalie criticamente se cada elemento do design faz sentido para o negócio e para o que o banco consegue sustentar, e se vale adicionar algum elemento novo. Proponha, justifique e **peça aprovação** antes de adicionar ou remover elementos (PARTE 1, Fase 3).
4. **Preserve o design.** Identidade visual, navegação, componentes e textos em pt-BR descritos aqui devem ser mantidos. Mudanças só após a auditoria e aprovação.
5. **Nada de bloqueios baseados em "200".** A capacidade de 200 inspeções é uma *estimativa editável* (referência), nunca um limite que impede ações.
6. **Cálculos explicáveis.** Toda métrica calculada tem tooltip com a fórmula e os valores usados, e o valor exibido deve ser reproduzível a partir dos dados mostrados.
7. **Formato brasileiro** em todos os números: `1.234,56`, com unidade (`kWh`, `MWh`, `R$`, `%`, `p.p.`). Datas `dd/mm/aaaa` ou `mmm/aaaa` (ex.: `nov/2026`). Fuso America/Sao_Paulo.
8. **Todos os estados:** carregando (skeleton), vazio, erro (com ação de tentar novamente) e sucesso, para cada tabela/cartão/gráfico.
9. **Acessibilidade:** foco visível (contorno de 2px na cor de destaque), rótulos `aria-label` em controles só com ícone, contraste adequado, navegação por teclado, tooltips acessíveis por foco.
10. **Ao terminar cada fase, entregue relatório** no formato da PARTE 9.

---

## PARTE 1 — Protocolo obrigatório (executar nesta ordem)

### Fase 0 — Descoberta do projeto
- Identifique stack (framework, estilização, biblioteca de gráficos, camada de dados/ORM, autenticação), convenções existentes e componentes reaproveitáveis. **Reutilize o que já existe**; não crie sistema paralelo.
- Descubra o esquema do banco: liste tabelas/views/colunas relevantes (unidades consumidoras, faturamento/consumo mensal em kWh, medidores, ordens de inspeção, resultados de campo, atendimentos, inadimplência/financeiro, geração distribuída, eventos de rede, alimentadores, tarifas, resultados do modelo/score). Se houver documentação, dicionário de dados ou migrations, leia-os.

### Fase 1 — Inventário e mapeamento de variáveis (entregável: tabela)
Para **cada variável/campo** listado nas telas da PARTE 5, produza uma linha:

| Campo na UI | Tela(s) | Existe no banco? (tabela.coluna) | Se não existe: derivável? Como (fórmula/consulta) | Risco (dado nulo, qualidade, defasagem) | Decisão |
|---|---|---|---|---|---|

Valores permitidos em "Decisão": `IMPLEMENTAR (existe)`, `IMPLEMENTAR (derivado)`, `ESTADO "—"/OCULTAR (não existe e não deriva)`, `PENDENTE (precisa de decisão do negócio)`.

Critérios para aceitar uma **derivação**:
- usa apenas colunas existentes, com regra determinística e documentada;
- não depende de suposição de negócio não confirmada (se depender, marque `PENDENTE`);
- tem comportamento definido para nulo/zero/histórico curto;
- pode ser explicada em tooltip.

**Proibido:** preencher lacunas com valores padrão, médias "para ficar bonito", amostras aleatórias, textos de insight escritos à mão ou sequências plausíveis.

### Fase 2 — Backend/dados
- Para cada campo `IMPLEMENTAR`, crie/ajuste as consultas, views ou endpoints (paginação, ordenação, filtros no servidor, contagens totais). Prefira cálculo no banco/servidor, não no cliente, para listas grandes (a fila pode ter ~1.000+ linhas).
- Documente cada fórmula num único lugar (módulo/constante) e reutilize no tooltip e no cálculo.
- Retorne metadados de qualidade: ex. `historico_insuficiente` (menos de 12 meses de histórico), `backtest_executado` (booleano), data de referência dos dados.

### Fase 3 — Auditoria de pertinência (entregável: relatório curto)
Antes/ao implementar, responda para cada tela:
1. **Faz sentido para o gerente?** Algum elemento é ruído, duplica outro ou não leva a uma decisão? (O design já foi enxugado: o foco da Fila é a tabela. Não adicione densidade.)
2. **O banco sustenta o elemento com honestidade?** Se a qualidade do dado não sustenta (ex.: poucos pontos, muitos nulos), proponha esconder, rotular a limitação ou trocar a métrica.
3. **Falta algo essencial?** Proponha novos elementos **somente** se (a) resolvem uma decisão real do gerente, (b) são sustentados por dados existentes, (c) não aumentam a densidade da tela principal. Para cada proposta: o quê, onde, de qual coluna vem, por que ajuda, custo de complexidade.
4. **Riscos:** vieses (ex.: reinspecionar sempre as mesmas UCs), vazamento temporal no backtest, métrica enganosa, ações irreversíveis sem confirmação.

**Não implemente propostas novas sem aprovação explícita do usuário.** Entregue-as como lista separada "Propostas para aprovação".

### Fase 4 — Implementação das telas
Implemente na ordem da PARTE 8, usando os prompts da PARTE 6.

### Fase 5 — Verificação
Checklist da PARTE 7 + testes (formatação pt-BR, estados vazio/erro/carregando, regras de habilitação de botões, ausência de dados fixos no código).

---

## PARTE 2 — Contexto do produto

- **Produto:** V-Energy Grid 360, portal web interno de uma distribuidora de energia elétrica. Área: região metropolitana do Recife (municípios: Recife, Olinda, Jaboatão dos Guararapes, Paulista; bairros como Boa Viagem, Ibura, Casa Amarela, Madalena, Várzea). Unidades consumidoras (UC) pertencem a **alimentadores** (identificados como `ALM-0147`).
- **Módulo:** Fila de Inspeção. O sistema detecta UCs suspeitas de perda não técnica, calcula uma **prioridade (score)**, o gerente seleciona as de maior prioridade, gera **ordens de inspeção**, equipes vão a campo, retornam o **resultado** (planilha ou registro), e o módulo mede a **efetividade** (backtest e acerto real).
- **Princípio de detecção:** a detecção é feita em **kWh**; R$ aparece apenas na estimativa de valor (energia × tarifa). Essa nota aparece no Detalhe.
- **Idioma:** toda a interface em português do Brasil.
- **Telas (desktop 1440px, SaaS analítico denso, tema escuro):**
  1. Fila de Inspeção (abas: Fila (suspeitas) · Fora da fila · Ordens · Efetividade)
  2. Detalhe da suspeita (gaveta à direita sobre a Fila)
  3. Ordens de inspeção (Kanban/Tabela, cancelar, registrar resultado, lote, histórico)
  4. Efetividade (backtest)
  5. Upload da planilha de campo (área de soltar + pré-visualização)

---

## PARTE 3 — Sistema visual (somente as tokens; tema escuro)

**Cor de destaque (accent):** amarelo `#FFC72C`. Texto sobre o destaque: `#0A0A0B`. Foco: contorno de 2px no destaque.

**Superfícies:** `#0A0A0B` (fundo da página) · `#0E0E10` (sidebar) · `#121214` (cartões) · `#19191C` (cabeçalho de tabela / elevado) · `#1E1E22` (hover / divisores suaves).
**Bordas:** `#2B2B30` · `#3A3A40` (fortes) · `#4A4A52` (muito fortes/tooltips).
**Texto:** `#F4F4F2` (principal) · `#D6D6DA` · `#C9C9CF` · `#A6A6AD` (secundário/mudo).
**Cores semânticas de dados:** positivo `#3DDC97` · negativo `#FF7A66` · info `#6CB4FF` · misto `#B79CFF` · alerta `#FFA94D` · ciano `#2DD4D4`.

**Tipografia:** Inter (corpo) e Space Grotesk (títulos e números grandes). Tabelas densas: 12–13px; cabeçalho de coluna em caixa alta 11px, peso 700, espaçamento .05em.

**Tags de motivo por FAMÍLIA** (cada família tem uma cor; a legenda fica visível na tela):
| Família | Cor sugerida |
|---|---|
| Consumo | alerta (âmbar) |
| Medidor | info (azul) |
| Histórico | misto (roxo) |
| Rede | ciano |
| Atendimento | positivo (verde) |
| Financeiro | negativo (coral) |
| Geração distribuída | accent (amarelo) |

Variantes: **principal** (`pri`, preenchida com ponto colorido), **secundária** (`sec`, contorno), **cinza** para "Histórico insuficiente".

**Barra de score:** classes por faixa — alto (≥ 90), médio (80–89), baixo (< 80) — com cores distintas e o número ao lado.

**Componentes padrão:** botão primário (fundo accent, texto escuro), secundário (contorno), chips de filtro, abas, tooltip por CSS (hover + foco), modal com sobreposição, gaveta (drawer) de 740px, skeleton, selo "Dados ilustrativos" (ver abaixo), paginação.

> **Selo "Dados ilustrativos":** no design aparece discreto no rodapé de cada tela porque os números do design são fictícios. **Na implementação real, só exiba esse selo se a fonte de dados for ambiente de demonstração/sandbox.** Com dados reais, remova-o.

---

## PARTE 4 — Regras globais de UX

1. Foco da Fila = **a tabela**. Filtros e parâmetros ficam recolhidos por padrão (seções clicáveis/acordeão), mostrando só chips dos filtros ativos.
2. Capacidade 200 = referência editável. Ao ultrapassar, mostrar aviso suave âmbar **"Acima da capacidade estimada"** (sem bloquear nada).
3. Botões desabilitados sempre explicam o motivo (tooltip ou texto auxiliar).
4. Ações destrutivas/irreversíveis (cancelar ordem, gerar lote) exigem confirmação com resumo.
5. Tabelas: cabeçalho fixo quando fizer sentido, números alinhados à direita, colunas com larguras estáveis, linha com altura uniforme, conteúdo centralizado verticalmente, hover sutil, linha selecionada com fundo accent translúcido.
6. Mensagens de erro de validação específicas e em linguagem de negócio.
7. Consistência: mesmos nomes de motivos, mesmas cores de família, mesmos formatos em todas as telas.

---

## PARTE 5 — Especificação das telas e dos dados (o que cada elemento precisa)

> Para cada campo "**[VAR]**" aplique a Fase 1. Os exemplos entre aspas são **apenas ilustrativos do design**.

### TELA 1 — Fila de Inspeção (suspeitas)

**Layout:** sidebar de navegação (216px) + área principal. Cabeçalho (título, ações), abas, faixa de KPIs compacta e fixa, barra de ferramentas, painéis recolhíveis, tabela, paginação, selo, e **dock inferior fixo** com o botão **"Gerar ordens de inspeção (N)"**.

**Abas:** `Fila (suspeitas)` (contagem) · `Fora da fila` (contagem) · `Ordens` (contagem) · `Efetividade`.
- **[VAR]** contagens de cada aba.

**Faixa de KPIs (compacta, 5 itens):**
1. **Selecionadas** — nº de UCs marcadas, com barra de progresso vs. capacidade estimada e marcador de referência. **[VAR]** seleção (estado do usuário), capacidade estimada (configuração editável; se não existir tabela de configuração, avaliar criar — Fase 3).
2. **Energia estimada** (MWh) — soma da energia recuperável das selecionadas. **[VAR]** energia recuperável por UC.
3. **Valor estimado** (R$) — energia × tarifa. **[VAR]** tarifa por UC/classe.
4. **Precisão estimada da seleção** — vem **exclusivamente do backtest**. Tooltip: "Comparado à linha de base histórica da operação (~50%)". Se o backtest não foi executado: mostrar "—" com texto "Backtest ainda não executado". **[VAR]** resultado do backtest, linha de base histórica (calculada dos dados, não fixa).
5. **Acima da capacidade** (condicional) — aviso suave âmbar "Acima da capacidade estimada" com a diferença (+N).

> A nota de que o "~50%" é a base histórica deve ser **calculada** das inspeções passadas do banco; se não houver dados suficientes, não exibir.

**Barra de ferramentas (recolhível):**
- Botões **Filtros** e **Parâmetros da detecção** (alternam seções recolhíveis).
- Chips dos filtros ativos.
- Campo numérico **N** (digitável) + botão **"Selecionar top N"** (padrão = capacidade estimada, mas qualquer valor é aceito).

**Painel de filtros (acordeão, 4 seções: Localização · Perfil · Motivo · Score):**
- Localização: município, bairro, alimentador. **[VAR]**
- Perfil: classe de consumo (B1, B2, B3, A4…), situação de inspeção (nunca inspecionada / com achado / sem achado), histórico insuficiente. **[VAR]**
- Motivo: **Família** (multi), **Nº mínimo de sinais**. **[VAR]** famílias e sinais por UC.
- Score: faixa mínima/máxima.

**Painel "Parâmetros da detecção" (recolhível):**
- Limiar (padrão 0,70) · meses consecutivos (3) · janela de análise (meses) · janela-base (meses) · "ignorar inspecionadas sem achado nos últimos N meses" · botão **"Recalcular fila"**.
- **[VAR]** parâmetros atuais do modelo/detecção. Se os parâmetros não forem configuráveis no backend, **mostre somente leitura** e registre a lacuna. O botão "Recalcular fila" só deve existir se houver processo de recálculo real.

**Tabela (colunas, nesta ordem e alinhamento):**
| # | Coluna | Conteúdo | Alinhamento |
|---|---|---|---|
| 1 | Checkbox | seleciona a UC (checkbox do cabeçalho: página) | centro |
| 2 | # | posição no ranking | esquerda |
| 3 | UC | número da UC + linha pequena com situação de inspeção ("Nunca inspecionada" / "Insp. mmm/aaaa · com achado" / "sem achado") + selo cinza **"Histórico insuficiente"** (< 12 meses) | esquerda |
| 4 | Bairro / Município | duas linhas | esquerda |
| 5 | Classe | B1, B3, A4… | esquerda |
| 6 | Motivo principal · outros sinais | linha 1: tag **principal** (com ponto colorido da família); linha 2: tags **secundárias** (sem quebrar linha) | esquerda |
| 7 | Sinais | chip "n sinais" (destaque amarelo se houver **mais de uma família**) + pontos coloridos, um por família distinta | esquerda |
| 8 | kWh | energia recuperável estimada, com unidade | **direita** |
| 9 | R$ | valor estimado | **direita** |
| 10 | Score | barra + número (0–100) + **tooltip**: "Prioridade = probabilidade × energia", com probabilidade da UC, energia recuperável e a conta | esquerda |

- Cabeçalhos com ordenação nas colunas ordenáveis (ícone ↑↓; ordenação ativa em destaque).
- **[VAR]** por UC: identificador, bairro, município, classe, situação/ data/ resultado da última inspeção, nº de meses de histórico, motivo principal (+família), motivos secundários (+família), probabilidade, energia recuperável (kWh), tarifa/valor, score. **Score = probabilidade × energia recuperável (normalizado 0–100 — documente a normalização).**
- **Legenda das famílias** visível sobre a tabela (chips compactos).
- Paginação com "Mostrando 1–N de TOTAL unidades · X selecionadas".
- Linha com a UC aberta no detalhe: o botão "Adicionar à seleção" do Detalhe e o checkbox da linha devem refletir o mesmo estado.

**Dock inferior:** "Gerar ordens de inspeção (N)" (habilitado com N ≥ 1; **nunca desabilitar por N > capacidade**) → abre o **modal de confirmação em lote** (Tela 3d).

**Estados (variante "Estados"):** skeleton de carregamento (KPIs + 8 linhas), vazio ("Nenhuma suspeita com os filtros atuais" + ação "Limpar filtros"), erro ("Não foi possível carregar a fila" + "Tentar novamente").

**Variantes de design a reproduzir:**
- **Normal** (seleção dentro da referência).
- **Acima da capacidade e sem backtest** (aviso âmbar; KPI "—").
- **Filtros abertos** (acordeão expandido).

---

### TELA 1d — Aba "Fora da fila"
UCs avaliadas mas **excluídas** da fila. Tabela com coluna **"Motivo da exclusão"**, **"Detalhe"** e **"Volta a ser avaliada"**.
- Resumo por motivo de exclusão (cartões/chips com contagem). Exemplos de motivos do design: inspecionada sem achado recentemente; ordem aberta; score abaixo do limiar; dados insuficientes; **Histórico insuficiente** (< 12 meses).
- **[VAR]** motivo de exclusão por UC, data/regra de reavaliação (ex.: "em 90 dias", "ao fechar a ordem"). Só exiba "Volta a ser avaliada" se a regra existir no backend ou for derivável (ex.: data da última inspeção + janela de exclusão).
- Os motivos listados devem ser **os que o backend realmente produz**; não inventar categorias.

---

### TELA 2 — Detalhe da suspeita (gaveta de 740px sobre a Fila)
Cabeçalho: UC, bairro/município, classe, alimentador, botão fechar. **Cartão de score**: score, probabilidade × energia recuperável, e botão **"Adicionar à seleção"** (alterna para "Remover da seleção").

**Seções (de cima para baixo; cada uma com altura própria, a gaveta rola):**
1. **Consumo — últimos 24 meses (gráfico).** 3 séries: consumo faturado, consumo esperado, referência de pares (ou as 3 séries que o modelo usa — confirmar). **Meses abaixo do limiar** destacados em âmbar. **Marcadores de eventos** (troca de medidor, inspeção, atendimento, reclamação etc.). **[VAR]** série mensal de kWh faturado, esperado (modelo), pares; eventos datados.
2. **UC vs. pares** (razão mensal do consumo da UC pelo consumo dos pares).  **[VAR]** definição de "pares" (mesma classe/bairro/faixa — confirmar no banco).
3. **Insight de IA (opcional).** Texto curto que **cita somente valores presentes na tabela de memória de cálculo**. Se não houver serviço de geração de texto ou não for possível garantir a restrição, **omita a seção** (Fase 3) ou gere por template determinístico a partir dos campos.
4. **Memória de cálculo (tabela com tooltips):** consumo esperado médio (kWh/mês), consumo faturado médio, razão, razão dos pares, índice sazonal, nº de meses abaixo do limiar, meses de exposição, tarifa (R$/kWh), energia recuperável (kWh), valor estimado (R$). **Nota fixa:** "Detecção feita em kWh; R$ apenas na estimativa de valor."  **Todos os valores devem coincidir com os usados no score.**
5. **Cartões de contexto (3 colunas):** ex. medidor (tipo, idade, última leitura/troca), atendimento/ocorrências, financeiro (inadimplência/parcelamentos), geração distribuída, rede (perdas do alimentador). **[VAR]** cada um; **ocultar o cartão se não houver dado** (não preencher com texto genérico).
6. **Linha do tempo de inspeções** da UC (data, equipe, resultado, tipo de irregularidade, energia recuperada).
7. **Rodapé:** "Fechar" e "Adicionar à seleção".

---

### TELA 3 — Ordens de inspeção
**Visão Kanban** (colunas: **Gerada · Em campo · Concluída · Canceladas**, com contagens) e **visão Tabela** alternativa (seletor Kanban/Tabela). Coluna vazia mostra estado vazio ("Nenhuma ordem cancelada").
- **Cartão da ordem:** código (ex.: `OI-26110006`), UC, bairro, motivo principal (tag de família), energia estimada (kWh), equipe, data. Link de **histórico** (ícone relógio).
- **Ações por estado:** `Gerada` → cancelar; `Em campo` → **Registrar resultado** (habilitado **apenas em "Em campo"**; nos demais aparece desabilitado com explicação "só em campo"); `Concluída` → ver resultado.
- **[VAR]** ordens (código, estado, equipe, datas, UC, energia estimada), resultado de campo.

**3b — Modal "Cancelar ordem":** motivo obrigatório (lista + observação). **Erro de validação:** motivo não informado.
**3c — Modal "Registrar resultado":** campos: houve achado (sim/não), tipo de irregularidade, energia recuperada (kWh), data da inspeção, observações. **Erros de validação** por campo (obrigatórios, formato numérico pt-BR, data futura inválida).
**3d — Modal "Gerar ordens em lote" (confirmação):** resumo — quantas ordens serão geradas, quantas UCs excluídas e por quê (erro: **"Já existe ordem aberta para esta UC"**), distribuição por equipe, energia/valor totais estimados. Botões "Cancelar" e "Confirmar geração (N)". A geração só inclui UCs válidas; as inválidas aparecem listadas com o erro, sem impedir as demais.
**3e — Histórico da ordem (auditoria):** gaveta com a trilha cronológica: quem, quando, o que mudou (geração, atribuição de equipe, início de campo, resultado, cancelamento), valores antes/depois. **[VAR]** log de auditoria — se não existir tabela de eventos, avaliar criar (Fase 3) e **não** exibir histórico sintético.

---

### TELA 4 — Efetividade
- **Cartão de backtest:** seletor de **data de corte** e de **N** (tamanho da seleção); resultado: precisão da seleção vs. linha de base histórica (~50% no design, **calcular**), diferença em p.p., n de inspeções avaliadas, energia recuperada vs. potencial. Tooltip com fórmula. **Importante:** o backtest deve usar **apenas informação disponível até a data de corte** (sem vazamento temporal).
- **KPIs reais de campo:** ordens concluídas, com achado, taxa de acerto real, energia recuperada (MWh).
- **Barras por família** (com opção de alternar para "por motivo"): taxa de acerto por família, com **n em cada barra**; famílias com **amostra insuficiente** mostram "sem inspeções suficientes" (defina o mínimo, ex. n < 10 — confirmar com o negócio).
- **Linha mensal vs. linha de base:** taxa de acerto por mês e a linha de base.
- **Estado vazio:** "Sem inspeções suficientes para calcular".
- **[VAR]** inspeções concluídas com resultado, score/seleção no momento da geração, família/motivo, energia recuperada. Se a seleção/score histórico não foram guardados, o backtest **não** é possível → mostrar estado "Backtest ainda não executado" e registrar a lacuna.

---

### TELA 5 — Upload da planilha de campo
**5a — Área de soltar:** arrastar/soltar ou selecionar arquivo (`.xlsx`/`.csv`), lista das **colunas esperadas**, link para modelo da planilha, tamanho máximo, histórico dos últimos envios.
**5b — Pré-visualização:** resumo (X linhas válidas, Y com erro), tabela com os dados lidos, **erros no nível de célula** (célula destacada + mensagem: UC inexistente, ordem não encontrada/não "Em campo", número inválido, data inválida, duplicidade). Ações: "Importar N linhas válidas" (habilitada se N ≥ 1), "Baixar relatório de erros", "Cancelar".
- **[VAR]** colunas esperadas devem espelhar os campos de resultado da ordem (Tela 3c). Validação **no servidor** contra as ordens reais do banco. Importação idempotente (evitar duplicar o resultado de uma ordem).

---

## PARTE 6 — Prompts de implementação (copie e cole, na ordem)

### Prompt 0 — Descoberta e mapeamento (obrigatório antes de tudo)
```
Você vai implementar o módulo "Fila de Inspeção" do portal V-Energy Grid 360 seguindo o documento anexo (PARTES 0 a 5). Antes de escrever qualquer tela:
1) Execute a Fase 0: descreva a stack do projeto, os componentes reaproveitáveis e o esquema do banco relevante (tabelas, views, colunas, chaves).
2) Execute a Fase 1: entregue a tabela de mapeamento de TODAS as variáveis das telas (campo na UI × existe no banco × derivável × risco × decisão), sem inventar nenhum dado. Onde a variável não existir, diga se é derivável por fórmula determinística; se não for, marque "ESTADO — / OCULTAR" ou "PENDENTE".
3) Execute a Fase 3: entregue a auditoria de pertinência (o que faz sentido, o que o banco não sustenta, o que pode ser adicionado) como "Propostas para aprovação".
NÃO implemente nada ainda. Pare e aguarde minha aprovação do mapeamento e das propostas.
```

### Prompt 1 — Camada de dados e fórmulas
```
Com o mapeamento aprovado, implemente a camada de dados do módulo (Fase 2): consultas/views/endpoints com paginação, ordenação e filtros no servidor para a fila, a aba "Fora da fila", ordens, efetividade e upload. Centralize as fórmulas (score = probabilidade × energia recuperável normalizado 0–100; energia recuperável; valor = kWh × tarifa; precisão do backtest; linha de base histórica; contagem de sinais e famílias; histórico insuficiente < 12 meses) em um módulo único e documentado. Nenhum valor pode ser fixo no código. Retorne metadados (backtest_executado, data de referência, historico_insuficiente). Inclua testes unitários das fórmulas (incluindo nulos, zeros e histórico curto) e formatação pt-BR.
```

### Prompt 2 — Tela 1 (Fila) e variantes
```
Implemente a TELA 1 conforme a PARTE 5: abas, faixa de KPIs compacta (Selecionadas, Energia, Valor, Precisão estimada da seleção com "—" quando não houver backtest, aviso âmbar "Acima da capacidade estimada"), barra de ferramentas (Filtros e Parâmetros recolhíveis, chips ativos, campo N digitável + "Selecionar top N"), painel de filtros em acordeão (Localização, Perfil, Motivo [Família, Nº mínimo de sinais], Score), painel "Parâmetros da detecção", tabela com as 10 colunas, alinhamentos e larguras especificados (coluna "Motivo principal · outros sinais" com tag principal na linha 1 e secundárias na linha 2; coluna "Sinais" com chip "n sinais" e pontos por família; kWh e R$ à direita), legenda de famílias, paginação, dock "Gerar ordens de inspeção (N)". A capacidade (200) é referência editável, NUNCA bloqueio. Implemente estados de carregamento, vazio e erro. Todos os dados vêm do banco via a camada do Prompt 1. Se algum campo estiver marcado "OCULTAR/—" no mapeamento aprovado, respeite.
```

### Prompt 3 — Aba "Fora da fila" e Detalhe da suspeita
```
Implemente a aba "Fora da fila" (coluna "Motivo da exclusão", "Detalhe", "Volta a ser avaliada" somente se a regra existir) e a gaveta de DETALHE (740px): cartão de score, gráfico de 24 meses com 3 séries, meses abaixo do limiar em âmbar e marcadores de eventos, gráfico UC vs. pares, memória de cálculo com tooltips e a nota fixa "Detecção feita em kWh; R$ apenas na estimativa de valor.", cartões de contexto (ocultar os sem dado), linha do tempo de inspeções. O "insight de IA" só pode citar valores da tabela de memória de cálculo; se não for possível garantir isso, omita ou gere por template determinístico. Cada seção deve ter altura própria (sem sobreposição): a gaveta rola, as seções não encolhem. O estado de "Adicionar à seleção" deve ser o mesmo do checkbox da linha da tabela.
```

### Prompt 4 — Ordens (Kanban/Tabela, modais, lote, histórico)
```
Implemente a tela de ORDENS: Kanban (Gerada, Em campo, Concluída, Canceladas com estado vazio) e visão Tabela; "Registrar resultado" habilitado APENAS em "Em campo" (nos demais, desabilitado com explicação); modal Cancelar (motivo obrigatório, erro de validação); modal Registrar resultado (validações por campo, números pt-BR); modal de confirmação em LOTE com resumo (nº de ordens, UCs excluídas e motivo — erro "Já existe ordem aberta para esta UC" —, distribuição por equipe, energia/valor totais), gerando apenas as UCs válidas; gaveta de histórico/auditoria da ordem lendo o log real (se a tabela de eventos não existir, proponha criá-la e aguarde aprovação; não exiba histórico sintético).
```

### Prompt 5 — Efetividade
```
Implemente a tela de EFETIVIDADE: cartão de backtest (seletores de data de corte e N; precisão vs. linha de base calculada; diferença em p.p.; n; tooltip com fórmula; SEM vazamento temporal — usar só dados até a data de corte), KPIs reais de campo, barras por família com alternância por motivo e n em cada barra (amostra insuficiente → "sem inspeções suficientes"), linha mensal vs. linha de base, estado vazio "Sem inspeções suficientes para calcular". Se o score/seleção histórico não foi persistido, exiba "Backtest ainda não executado" e registre a lacuna no relatório.
```

### Prompt 6 — Upload da planilha de campo
```
Implemente o UPLOAD: área de soltar (.xlsx/.csv), lista de colunas esperadas (espelhando os campos do modal Registrar resultado), modelo para download, e a pré-visualização com resumo (válidas/erro), erros no nível de célula, ações "Importar N linhas válidas", "Baixar relatório de erros" e "Cancelar". A validação ocorre no servidor contra as ordens reais (UC inexistente, ordem inexistente ou não "Em campo", número/data inválidos, duplicidade). Importação idempotente e transacional.
```

### Prompt 7 — Revisão final
```
Execute a Fase 5: percorra o checklist da PARTE 7, rode os testes, procure no código por qualquer número/nome/texto de dados fixo (grep por UCs, bairros e valores do design), confirme formatação pt-BR, estados (carregando/vazio/erro), acessibilidade (foco 2px, aria-labels, teclado) e que nada é bloqueado por "200". Entregue o relatório final no formato da PARTE 9, incluindo lacunas de dados e propostas pendentes.
```

---

## PARTE 7 — Checklist de verificação

- [ ] Nenhum dado fixo/mock no código de produção (UCs, bairros, valores, textos de insight).
- [ ] Todas as variáveis mapeadas; lacunas tratadas com "—"/ocultar/PENDENTE, nunca com valor falso.
- [ ] Score = probabilidade × energia recuperável (documentado, reproduzível no tooltip).
- [ ] Precisão estimada vem só do backtest; "—" quando não executado.
- [ ] Linha de base histórica calculada do banco (não fixa).
- [ ] Backtest sem vazamento temporal.
- [ ] Capacidade 200 editável; nenhum botão bloqueado por ela; aviso âmbar apenas informativo.
- [ ] "Registrar resultado" só em "Em campo".
- [ ] Erro "Já existe ordem aberta para esta UC" no lote, sem impedir as válidas.
- [ ] Formato pt-BR em todos os números/datas; unidades presentes.
- [ ] Estados carregando/vazio/erro em todas as listas, cartões e gráficos.
- [ ] Tabela da Fila: colunas e alinhamentos conforme especificado; "Histórico insuficiente" (< 12 meses) em cinza.
- [ ] Detalhe sem sobreposição de seções; insight cita só valores da memória de cálculo.
- [ ] Acessibilidade: foco visível, aria-labels, teclado, tooltips por foco.
- [ ] Selo "Dados ilustrativos" apenas em ambiente de demonstração.
- [ ] Propostas novas só implementadas após aprovação.

---

## PARTE 8 — Ordem de entrega sugerida

1. Prompt 0 (descoberta + mapeamento + auditoria) → **aprovação do usuário**
2. Prompt 1 (dados/fórmulas)
3. Prompt 2 (Fila)
4. Prompt 3 (Fora da fila + Detalhe)
5. Prompt 4 (Ordens)
6. Prompt 5 (Efetividade)
7. Prompt 6 (Upload)
8. Prompt 7 (revisão final)

---

## PARTE 9 — Formato do relatório a cada entrega

1. **O que foi implementado** (telas/elementos).
2. **Mapeamento de variáveis** (tabela atualizada com a decisão final).
3. **Lacunas de dados** (o que não existe no banco e como foi tratado).
4. **Fórmulas usadas** (onde estão no código e o texto do tooltip).
5. **Auditoria de pertinência:** o que foi mantido, removido, e **Propostas para aprovação** (cada uma com: o quê, onde, de qual coluna vem, por que ajuda, custo).
6. **Riscos e pendências** (decisões do negócio necessárias).
7. **Como testar** (passos curtos).

---

## ANEXO — Exemplos ilustrativos do design (NÃO usar como dados)

Apenas para entender o formato visual: UC `7004128930`, Boa Viagem/Recife, B3, "7.600 kWh", "R$ 6.931,20", score 96; alimentador `ALM-0147`; ordem `OI-26110006`; backtest "66% vs ~50% (+16 p.p.), n = 164, corte 01/06/2026, N = 200"; 1.032 suspeitas / 318 fora da fila / 87 ordens. **Todos fictícios.**
