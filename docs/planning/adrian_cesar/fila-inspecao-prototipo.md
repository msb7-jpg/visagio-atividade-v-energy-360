# Fila de Inspeção — especificação do protótipo de alta fidelidade

Fonte: artboard `Inspecao.dc.html` do canvas V-Energy Grid 360 (versão 43, 27/10/2026).
Capturas: pasta `assets/fila-inspecao/` (lista no fim deste arquivo).
Tokens e componentes: artboards "Tokens" e "Componentes" do mesmo canvas (padrão shadcn, modo escuro como padrão).

Este documento descreve o que o protótipo mostra e como ele se comporta. O protótipo usa dados fixos de exemplo; a seção 9 lista tudo o que nele é fixo ou simulado e precisa vir do backend.

---

## 1. Para quem e para quê

- Usuário principal: Gerente de Perdas (Rafael Coutinho), perfil `pe`.
- Pedido no case (PDF, seção 4 e user stories 5.2):
  - ver as UCs suspeitas ordenadas por prioridade, com o motivo da suspeita e a energia estimada a recuperar;
  - gerar ordens de inspeção a partir da fila, atualizar o status de cada uma, registrar o resultado de campo e cancelar as que não forem mais necessárias;
  - (diferencial) exportar a fila para a equipe de campo;
  - (diferencial) subir a planilha preenchida em campo para registrar os resultados sem digitação.
- Contexto de capacidade: "mais de 200 inspeções por mês", "pouco mais da metade encontra alguma irregularidade".

## 2. Estrutura da tela

```
AppShell (menu lateral + barra superior)
└─ Cabeçalho: título "Fila de Inspeção" + subtítulo
└─ 4 cards de resumo (capacidade, energia das selecionadas, retorno esperado, taxa de acerto)
└─ Abas: "Fila priorizada (1.248)" | "Ordens de inspeção (N)"
   ├─ Aba Fila priorizada
   │  ├─ FilterBar (motivo, município, classe, score mínimo, limpar)
   │  ├─ Ações (exportar fila, selecionar top 10, gerar N ordens)
   │  ├─ Linha de contexto ("Mostrando 20 de 1.248 UCs…")
   │  └─ DataTable da fila (seleção por checkbox)
   └─ Aba Ordens de inspeção
      ├─ Barra do fluxo + exportar planilha de campo + importar resultados
      ├─ Banner de importação concluída (após importar)
      └─ Quadro de 4 colunas (Pendente, Em campo, Concluída, Cancelada)
Sobreposições: Sheet de detalhe da UC · Dialog gerar ordens · Dialog registrar resultado ·
Dialog cancelar ordem · Dialog importar resultados · Toast · ChatDrawer (Assistente)
```

## 3. Elementos, um a um

### 3.1 AppShell
| Elemento | O que mostra | Comportamento |
|---|---|---|
| Menu lateral | Itens conforme o perfil. Perdas (`pe`): Fila de Inspeção, Unidade Consumidora 360, Assistente IA. Diretoria (`dir`) também vê a Fila. Rodapé: Sobre os dados, Recolher menu | Item ativo em `accent`. Recolher guarda a preferência |
| Busca global | "Buscar UC (UC100123 ou 100123) ou titular" | Sugestões a partir de 2 caracteres; abre a UC 360 |
| Chip de dados | "Dados até 06/2026 · atualizado em 15/07/2026" | Informativo (data do último processamento do pipeline) |
| Selo "Modo demonstração" | Só na apresentação | Permite trocar de usuário pelo avatar |
| Botão "Assistente IA" | Abre o ChatDrawer | — |
| Avatar + menu | Nome, perfil, tema claro/escuro, trocar usuário (demo) | — |
| Sem permissão | Card "Sem permissão para a Fila de Inspeção" + botão para a tela inicial do perfil | Quando o perfil não tem a Fila (Atendimento, Operação) |

### 3.2 Cabeçalho
- Título: "Fila de Inspeção".
- Subtítulo: "Quais UCs mandar a campo primeiro · score = chance de irregularidade × energia recuperável".

### 3.3 Cards de resumo (4)
| Card | Valor | Linha de apoio | Regra |
|---|---|---|---|
| Capacidade do mês | `capUsed` de 200 inspeções | "58 programadas + N selecionadas · ainda cabem X" (vermelho e "passa da capacidade em X" se > 200) | `capUsed = programadas + selecionadas`. Barra: cinza = programadas, `primary` = selecionadas |
| Energia recuperável das selecionadas | soma de kWh/mês das UCs selecionadas | "R$ X mil/ano a R$ 0,714/kWh" | R$/ano = kWh × 12 × 0,714 |
| Retorno esperado | kWh selecionados × 62,7% | "R$ X mil/ano · aplica a taxa histórica de 62,7%" | Taxa histórica global |
| Taxa de acerto histórica (KpiCard) | 62,7% | "871 de 1.389 inspeções com irregularidade confirmada · ago–dez/2025 · 40 inspetores"; "Taxa esperada por motivo: modelo em calibração"; link "Ver acerto por inspetor, por mês e kWh por tipo" (abre o Assistente); link "como calculamos" (Sobre os dados → `acr`) | A base não guarda o motivo da suspeita: não existe taxa por motivo |

### 3.4 Abas
- "Fila priorizada (1.248)" e "Ordens de inspeção (N)", com `role="tablist"`. N = total de ordens no quadro.

### 3.5 Aba Fila priorizada

**FilterBar**
| Filtro | Opções no protótipo |
|---|---|
| Motivo | Todos os motivos · Queda abrupta de consumo · Consumo zero com medidor ativo · Consumo abaixo dos vizinhos da mesma classe · Muitas leituras estimadas · Irregularidade confirmada antes |
| Município | Todos + 7 municípios (Recife, Olinda, Jaboatão dos Guararapes, Paulista, Camaragibe, São Lourenço da Mata, Cabo de Santo Agostinho) |
| Classe | Todas · Residencial · Comercial · Poder Público · Industrial · Rural |
| Score mínimo | Qualquer · 50 ou mais · 70 ou mais · 85 ou mais |
| Link | "como calculamos o score" (Sobre os dados → `sco`) |
| Limpar filtros | Aparece só quando algum filtro está ativo |

**Ações**
- "Exportar fila (Excel/CSV)": gera `fila_inspecao_AAAA-MM-DD.xlsx` e `.csv` com as colunas `id_ordem, uc, data, inspetor, resultado, tipo, kwh_recuperado` (as quatro últimas em branco para a equipe). No protótipo só mostra o toast.
- "Selecionar top 10": seleciona as 10 primeiras UCs livres (sem ordem aberta).
- "Gerar N ordens" (primário): desabilitado com 0 selecionadas; abre o Dialog de gerar ordens.

**Linha de contexto**: "Mostrando N de 1.248 UCs (top 20 por score) · clique no número da UC para ver por que ela está na fila".

**DataTable da fila** (largura mínima 1.080 px, rolagem horizontal abaixo disso)
| Coluna | Conteúdo | Observações |
|---|---|---|
| ☐ | Checkbox de seleção; no cabeçalho, "selecionar todas" (só as livres) | Desabilitado se a UC já tem ordem (Ordem gerada, Em campo). Linha selecionada em `accent` |
| # | Posição no ranking | — |
| UC | Código (ex.: UC131844) como botão | Abre o Sheet de detalhe |
| Bairro / município | Bairro e, embaixo, município em cinza | — |
| Classe | Nome + selo do subgrupo (B1, B2, B3, A4) | Comercial e Poder Público são B3, mas classes diferentes |
| Score | Barra 0–100 + número | Cor: ≥ 85 `destructive`, 70–84 `warning`, < 70 `muted-foreground` |
| Motivos | Um chip por motivo presente (1 ou 2 no protótipo) | — |
| kWh/mês | Energia recuperável estimada | — |
| R$/ano | kWh × 12 × 0,714, em "R$ X mil" | — |
| Situação | StatusBadge: Na fila (`muted`) · Ordem gerada (`warning`) · Em campo (`accent`) · Inspecionada (`success`) | — |

**Estado vazio**: "Nenhuma UC com esses filtros." + "Limpar filtros".

### 3.6 Sheet de detalhe da UC (painel lateral, ~460 px)
- Cabeçalho: "UC131844 · posição 1", "Casa Caiada, Olinda · Residencial B1", fechar.
- Score grande + "Score de prioridade (0 a 100) · como calculamos", "kWh/mês recuperáveis · R$/ano", "Taxa esperada (modelo): em calibração".
- "Por que está na fila": uma linha por motivo com pontos (+N pts), barra e frase de evidência; mais a linha "Energia recuperável" com o restante dos pontos. A soma dá o score.
  - Frases de evidência do protótipo: "Consumo caiu 50% de um mês para o outro, sem pedido de desligamento" · "Leitura zero há 4 meses com o medidor ATIVO" · "Consumo cerca de 48% abaixo da média de 40 UCs vizinhas da mesma classe" · "Mais da metade das leituras dos últimos 12 meses foram estimadas" · "Irregularidade confirmada em inspeção anterior nesta UC".
- Gráfico "Consumo em 12 meses (kWh) · 07/2025 a 06/2026": linha da UC (`destructive`) e média dos vizinhos da mesma classe (tracejada).
- "Inspeções anteriores": lista (data · inspetor · resultado · tipo · kWh) ou "Nenhuma inspeção anterior nesta UC."
- Ações: "Abrir na UC 360" e "Gerar ordem desta UC" (desabilitado se a UC já tem ordem).

### 3.7 Dialog "Gerar N ordens de inspeção"
- Quatro números: Ordens, Energia recuperável (kWh/mês), Retorno esperado (R$/ano), Capacidade depois (X de 200).
- "Executar até" (data, padrão 31/07/2026).
- "Distribuição": Automática por região (inspetores livres) · INSP-007 Recife Sul · INSP-014 Olinda · INSP-021 Jaboatão · INSP-033 Paulista.
- Texto: "As ordens entram como Pendente, na ordem do score. Dá para cancelar qualquer uma depois, informando o motivo."
- Botões: Voltar · "Confirmar e gerar N ordens".
- Ao confirmar: cria ordens `OI-AAAA-NNNN` como Pendente ("score X · sem inspetor"), marca as UCs como "Ordem gerada", limpa a seleção, soma às programadas e mostra o toast "N ordens geradas como Pendente (OI-… a OI-…)".

### 3.8 Aba Ordens de inspeção
- Barra: fluxo "Pendente → Em campo → Concluída · ou Cancelada (com motivo)" com StatusBadges; botões "Exportar planilha de campo" e "Importar resultados de campo" (primário).
- Banner (após importar, `success`): "4 resultados importados para o histórico de inspeções (ago–dez/2025), 1 deles com aviso de data. 2 linhas com erro ficaram de fora: baixe o relatório…".
- Quadro com 4 colunas; cada coluna tem selo da etapa + contagem; vazia: "Nenhuma ordem nesta etapa."

| Coluna | Selo (token) | Ações no cartão |
|---|---|---|
| Pendente | `warning` | "Enviar a campo" (primário) · "Cancelar" (fantasma) |
| Em campo | `accent` / `accent-foreground` | "Registrar resultado" (primário) · "Cancelar" |
| Concluída | `success` | — (mostra selo do resultado) |
| Cancelada | `muted` com borda | — (mostra "Cancelada: motivo") |

- Cartão (OrdemCard): id da ordem + data; "UC · bairro"; linha extra (inspetor ou "score X · sem inspetor"); selo do resultado quando houver ("Irregularidade confirmada · tipo · kWh" em `success`, "Sem irregularidade" em `muted`).
- Não há arrastar e soltar: as transições são só pelos botões.
- "Enviar a campo": muda para Em campo, atribui inspetor e data, toast "OI-… enviada a campo com INSP-014."

### 3.9 Dialog "Resultado de campo · OI-…"
- "UC · bairro".
- Data da inspeção (data) · Inspetor (INSP-007, -014, -021, -033, -040; vem preenchido com o inspetor da ordem).
- Resultado (rádio): Irregularidade confirmada · Sem irregularidade.
- Se confirmada: Tipo de irregularidade (Desvio direto, By-pass, Medidor adulterado, Ligação clandestina, Lacre violado) e kWh recuperado (aceita "1.240" ou "1240,5").
- Validação: confirmada exige kWh > 0 → erro "Informe o kWh recuperado (número maior que zero)." em `destructive`, ligado ao campo por `aria-describedby`.
- Observações (opcional).
- Botões: Voltar · Salvar resultado → ordem vai para Concluída com o selo do resultado; toast "Resultado registrado em OI-…".

### 3.10 Dialog "Cancelar ordem OI-…"
- "UC · bairro".
- Motivo do cancelamento (obrigatório): UC regularizada pelo cliente · Ordem duplicada · Endereço não localizado ou acesso negado · Repriorização da equipe · Outro. Sem motivo → erro "Escolha um motivo para cancelar."
- Observação (opcional).
- Texto: "A UC volta para a fila e o score é recalculado no próximo processamento."
- Botões: "Manter ordem" · "Cancelar ordem" (destrutivo) → coluna Cancelada com "Cancelada: motivo"; toast "OI-… cancelada."

### 3.11 Dialog "Importar resultados de campo" (largura até 1.120 px)
- Texto: usa a planilha gerada em "Exportar planilha de campo"; colunas `id_ordem · uc · data · inspetor · resultado · tipo · kwh_recuperado`; "Nada é gravado antes de você confirmar."
- Estado inicial: área de arrastar ("Arraste a planilha aqui ou clique para escolher", ".xlsx ou .csv · até 10 MB") + link "Usar a planilha de exemplo".
- Estado de prévia: chip do arquivo + contagem (3 prontas, 1 com aviso, 2 com erro) e tabela por linha: Linha, Ordem, UC, Data, Inspetor, Resultado, Tipo, kWh, "O que o sistema fez". Em cada célula: em cima o valor original (riscado se mudou), embaixo o valor tratado.
- Regras de tratamento mostradas na prévia:
  - datas em formatos diferentes (`2025-08-01`, `14.08.2025`, `09-01-2025`) → `DD/MM/AAAA`; data ambígua vira **Aviso** (lida pela data que cai dentro do período das inspeções);
  - código do inspetor com espaço ou minúsculas (`"INSP-007 "`, `insp-14`) → `INSP-007`, `INSP-014`;
  - resultado (`CONFIRMADA`, `Confirmada`, `irregularidade confirmada`, `NADA CONSTA`, `SEM IRREGULARIDADE`) → "Irregularidade confirmada" ou "Sem irregularidade";
  - tipo (`by-pass` → `By-pass`); `NULL`, `N/A`, `-` e vazio tratados como vazio;
  - kWh com vírgula decimal (`1120,5`) → `1.120,5`;
  - **Erro** (linha ignorada): UC fora do cadastro (UC100000 a UC144999); irregularidade confirmada sem tipo.
- Botões na prévia: Trocar planilha · Baixar relatório de erros · "Importar N linhas" (prontas + avisos).

### 3.12 Toast (Sonner)
Mensagens: ordens geradas; enviada a campo; resultado registrado; ordem cancelada; fila exportada; planilha de campo exportada; relatório de erros baixado; resultados importados.

### 3.13 ChatDrawer (Assistente)
- Contexto: "Fila de Inspeção", aba atual, município e motivo filtrados.
- Sugestões: "Qual a taxa de acerto das inspeções?", "Quantas inspeções foram feitas por mês?", "Quantas UCs com painel solar em Olinda tiveram queda de consumo acima de 30%?".
- Só consulta (SELECT); não altera ordens.

## 4. Estados (máquina de status)

**UC na fila** (coluna Situação): `na_fila` → `ordem_gerada` (ao gerar) → `em_campo` (ao enviar) → `inspecionada` (ao registrar resultado). Cancelar a ordem devolve a UC para `na_fila`.

**Ordem**: `pendente` → `em_campo` → `concluida`; `pendente | em_campo` → `cancelada` (motivo obrigatório). Nenhuma outra transição.

## 5. Regras de negócio que o protótipo assume

| Regra | Valor no protótipo |
|---|---|
| Capacidade mensal | 200 inspeções |
| Tarifa para R$/ano | R$ 0,714/kWh (tarifa média do período B, todas as classes) |
| Taxa de acerto para o retorno | 62,7% (871 ÷ 1.389, ago–dez/2025), igual para todas as UCs |
| Score | 0 a 100; pesos provisórios por motivo: consumo zero com medidor ativo 42 · queda abrupta 38 · irregularidade confirmada antes 30 · abaixo dos vizinhos 26 · muitas leituras estimadas 18; o restante vem da energia recuperável |
| UC com ordem aberta | Não pode ser selecionada de novo |
| Vizinhos | Média de 40 UCs da mesma classe |
| IDs | Ordem `OI-AAAA-NNNN`; inspetor `INSP-001` a `INSP-040`; UC `UC100000` a `UC144999` |

## 6. Tabelas gold que o protótipo cita
`gold.fato_consumo`, `gold.dim_uc`, `gold.fato_inspecoes` (score, motivos, acerto) e, para o detalhe, `gold.fato_faturamento` (tarifa). Ordens de inspeção são dados **de escrita** do portal (não vêm do pipeline).

## 7. Acessibilidade e layout
- Checkbox com rótulo oculto por linha; abas com `aria-selected`; dialogs com `aria-modal` e título ligado; erros com `role="alert"`.
- Alvos de toque ≥ 44 px nos rádios e botões principais; foco visível em `ring`.
- Cores sempre com texto (selos de situação e de etapa).
- Funciona de 1440 px até celular (cards e colunas do quadro empilham; tabela rola na horizontal).

## 8. Componentes do design system usados
AppShell · KpiCard · FilterBar · DataTable (fila e prévia da importação) · StatusBadge (situação e etapas) · EmptyState (filtro sem resultado e sem permissão) · ChatDrawer · SqlAuditPanel (dentro do Assistente) · LoadingSkeleton e ErrorState (estados de carregamento e falha, a implementar).
Primitivos shadcn sem componente próprio: Sheet (detalhe da UC), Dialog (gerar, resultado, cancelar, importar), Tabs, Toast (Sonner), Select, Checkbox, RadioGroup, Textarea, Input de arquivo.

## 9. O que no protótipo é fixo ou simulado (precisa vir do backend)

| Item | No protótipo | Como deve ser |
|---|---|---|
| Total da fila | "1.248" fixo | Contagem real das UCs elegíveis |
| Linhas da fila | 20 UCs fixas | Paginação/ordenação no servidor |
| Programadas | 58 fixo | Ordens abertas no mês (pendente + em campo) |
| Quadro de ordens | 9 ordens fixas | Ordens reais. Hoje 58 programadas não batem com 5 abertas no quadro |
| Enviar a campo | Sempre INSP-014 e 30/06/2026 | Escolha do inspetor e data reais |
| "Executar até" e "Distribuição" | Não são gravados | Gravar na ordem |
| Data e observações do resultado | Não são gravadas | Gravar no resultado |
| Lista de inspetores | 5 de 40 | Os 40 inspetores da base |
| Municípios no filtro | 7 de 14 | Os 14 |
| Score e motivos | Valores fixos | Calculados na gold com regras documentadas |
| Pontos por motivo e frases de evidência | Calculados a partir de fórmula simulada | Vindos do cálculo real do score |
| Gráfico de consumo do detalhe | Série sintética | `fato_consumo` da UC + média real dos vizinhos |
| Inspeções anteriores | Derivadas do motivo | `fato_inspecoes` da UC |
| Prévia da importação | Sempre as mesmas 6 linhas | Leitura real do arquivo + validação no servidor |
| Exportações | Só toast | Arquivos reais |
| Taxa de acerto e retorno | Constantes | Calculados (e por inspetor/mês, se usados) |
| Cancelar | Não devolve a UC à fila | Deve devolver |

## 10. Inconsistências do próprio protótipo (decidir antes de implementar)
1. **Fórmula do score**: o subtítulo diz "chance de irregularidade × energia recuperável", mas o dicionário e o detalhe somam pontos por motivo + energia. Escolher uma e usar nos três lugares.
2. **Nome do estado final**: a fila diz "Inspecionada"; o quadro diz "Concluída". Também "Ordem gerada" (fila) = "Pendente" (quadro). Unificar.
3. **Programadas × quadro**: 58 programadas no card e só 5 ordens abertas no quadro.
4. **Importação**: os `id_ordem` da planilha de exemplo são de 2025 (`OI-2025-…`) e não existem no quadro; definir se a importação só aceita ordens existentes ou também grava histórico.
5. **Quem pode escrever**: a Diretoria também vê a Fila; definir se só Perdas gera, envia, registra e cancela.
6. **Tarifa e taxa únicas**: R$/ano usa R$ 0,714 para todas as classes e o retorno usa 62,7% para todas as UCs; definir se usa a tarifa da classe e a taxa por perfil quando houver.

## Capturas (pasta `assets/fila-inspecao/`)
01-fila-priorizada · 02-detalhe-da-uc · 03-gerar-ordens · 04-ordens-geradas-aviso · 05-ordens-de-inspecao · 06-registrar-resultado-erro · 07-cancelar-ordem-erro · 08-importar-escolher-arquivo · 09-importar-previa · 10-importacao-concluida · 11-filtro-sem-resultado · 12-sem-permissao · 13-fila-modo-claro
