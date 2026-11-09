# Plano de Ajustes: Nomes das Métricas no Resumo da IA & Gráfico Persistente em Receita por Bairro

**Identificação:** Agente atuando em conjunto nas fatias **`fatia-07-ia` (Miguel)** e **`fatia-04-receita` (Célio)**.

---

## Goal Description

Este plano endereça dois problemas visuais e de usabilidade identificados nas telas **Painel do Diretor** e **Inteligência Comercial**:

1. **Dar nome claro às métricas nos cards de destaque do Resumo da IA (`SmartInsightCard`)**:
   - **Problema atual:** O LLM frequentemente devolve em `destaques[].rotulo` textos vagos ou redundantes com o próprio número (ex.: `"Crescimento 8%"` acima de `"+8,0%"`, ou `"Energia -4%"` acima de `"-4,0%"`), sem identificar claramente qual é o indicador de negócio (ex.: *Faturamento*, *DEC — Horas sem energia*, *FEC — Interrupções*, *Energia faturada*, *Leituras estimadas*).
   - **Solução:** Resolver de ponta a ponta (Backend + Frontend):
     - No **Backend** ([`insight_highlights.py`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/backend/app/features/chat/insight_highlights.py) e [`insights_service.py`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/backend/app/features/chat/insights_service.py)): mapear cada chave de métrica (`faturamento_var_pct`, `dec_area_var_pct`, `fec_area_atual`, etc.) para seu **nome canônico do catálogo** (com sufixo contextual quando for variação vs valor absoluto, ou priorizando o título oficial do indicador) e ajustar o `SYSTEM_PROMPT` para proibir números/sinais no rótulo.
     - No **Frontend** ([`InsightHighlights.tsx`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/insights/components/InsightHighlights.tsx) e [`formatHighlight.ts`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/insights/utils/formatHighlight.ts)): adicionar um dicionário/fallback de rótulos legíveis por chave de `metrica` (caso a resposta venha com número no rótulo ou chave bruta) e exibir subtítulo contextual (ex.: `"Variação no período"` quando `metrica` terminar em `_var_pct` / `_var_pp`), garantindo que o usuário sempre saiba exatamente a qual métrica (DEC, FEC, Faturamento, Energia Faturada, etc.) o valor se refere.

2. **Remover coluna `12 meses` da tabela e tornar o gráfico de histórico persistente ao lado da tabela (`AreaRevenueCard`)**:
   - **Problema atual:** Na tabela **Receita por bairro** ([`AreaRevenueTable.tsx`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueTable.tsx)), a última coluna à direita (`12 meses`) exibe mini-barras (`MonthlySparkline`) e botão de expansão, enquanto a primeira coluna fica com muito espaço ocioso e o gráfico detalhado de barras (`MonthlyBarChart` com abas *Receita*, *Volume faturado* e *Tarifa média*) só aparece escondido dentro de uma gaveta modal (`NeighborhoodHistorySheet`) ao clicar no nome do bairro.
   - **Solução:**
     - Remover a coluna `12 meses` (sparkline + chevron de expansão inline) de [`AreaRevenueTable.tsx`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueTable.tsx) e [`AreaRevenueRow.tsx`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueRow.tsx), além de remover a busca em lote desnecessária `useNeighborhoodHistories` para as 10 linhas da página.
     - Transformar o layout de [`AreaRevenueCard.tsx`](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueCard.tsx) em um **layout dividido (split view `lg:grid-cols-12`)**:
       - **Esquerda (`lg:col-span-7`):** Tabela enxuta e bem distribuída (Bairro, Receita Atual, Variação, Volume Atual, Tarifa Média), onde clicar em qualquer linha seleciona o bairro (com destaque visual `data-state="selected"`). Por padrão, o **primeiro bairro da lista** já inicia selecionado automaticamente.
       - **Direita (`lg:col-span-5`):** Painel persistente (`NeighborhoodHistoryPanel`) exibindo sempre o gráfico de 24 meses (`MonthlyBarChart`) do bairro atualmente selecionado, com as abas **Receita**, **Volume faturado** e **Tarifa média** (`HISTORY_METRICS`).

---

## Open Questions

> [!IMPORTANT]
> Antes de executar o plano, confirme se concorda com estas duas decisões de design:
> 1. **Gaveta Lateral (`NeighborhoodHistorySheet`):** Com o gráfico agora fixo e persistente ao lado da tabela em `AreaRevenueCard`, devemos **substituir completamente** o `NeighborhoodHistorySheet` por esse painel persistente (e fazer com que o card inferior de Ranking também aponte para/utilize o mesmo padrão ou mantenha o Sheet apenas se necessário), ou você quer remover o Sheet da página toda?
> 2. **Aba "Municípios" no `AreaRevenueCard`:** A API `/revenue/history` hoje recebe `municipio` + `bairro`. Quando o usuário alternar a tabela para a aba **Municípios**, prefere que o painel lateral mostre o histórico do principal bairro daquele município, oculte o painel lateral deixando a tabela em largura total, ou que habilitemos no backend `/revenue/history` com `bairro` opcional para agregar os 24 meses do município inteiro?

---

## Proposed Changes

```mermaid
flowchart LR
  subgraph Insight["1. SmartInsightCard (Resumo da IA)"]
    M["metricas_observadas<br/>(ex: dec_area_var_pct)"] --> B["Backend: insight_highlights.py<br/>Resolve Nome Canônico do Indicador"]
    B --> F["Frontend: InsightHighlights.tsx<br/>Exibe Nome Oficial + Valor Formatado"]
  end

  subgraph Revenue["2. AreaRevenueCard (Inteligência Comercial)"]
    T["Tabela Receita por Bairro<br/>(Sem coluna 12 meses, linha clicável)"] -->|Seleciona Bairro<br/>(1º por padrão)| P["Painel Gráfico Persistente (Direita)<br/>Abas: Receita | Volume | Tarifa"]
  end
```

---

### Componente 1: Resumo da IA — Nomes Canônicos nas Métricas de Destaque

#### [MODIFY] [insight_highlights.py](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/backend/app/features/chat/insight_highlights.py)
- Criar um mapeamento canônico `METRIC_LABELS` derivado de `GROUPS` (catálogo do Painel do Diretor) + métricas das demais telas (`customer360`, `revenue`, `losses`, `quality`), diferenciando claramente o indicador e se é variação ou valor atual:
  - Ex.: `faturamento_var_pct` → `"Faturamento (variação)"` ou `"Faturamento"`
  - Ex.: `energia_faturada_var_pct` → `"Energia faturada"`
  - Ex.: `dec_area_var_pct` / `dec_area_atual` → `"DEC (Horas s/ energia)"`
  - Ex.: `fec_area_var_pct` / `fec_area_atual` → `"FEC (Interrupções)"`
  - Ex.: `leituras_estimadas_var_pp` → `"Leituras estimadas"`
  - Ex.: `inadimplencia_var_pp` → `"Inadimplência"`
  - Ex.: `satisfacao_var_pct` → `"Satisfação média (CSAT)"`
  - Ex.: `tempo_resolucao_var_pct` → `"Tempo de resolução"`
- Em `parse_highlights`: usar o rótulo canônico de `resolve_metric_label(metric_key, raw_label)` sempre que a chave for conhecida no catálogo ou quando o `raw_label` da IA contiver dígitos/`%`/`+`/`-` (evitando rótulos como `"Crescimento 8%"` ou `"Leituras -16%"`).

#### [MODIFY] [insights_service.py](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/backend/app/features/chat/insights_service.py)
- Reforçar a diretriz `4` do `SYSTEM_PROMPT`:
  ```python
  '4. "destaques": de 1 a 3 objetos {"metrica": <chave exata de metricas_observadas>, '
  '"rotulo": <nome claro do indicador, ex: "Faturamento", "DEC (Horas s/ energia)", "FEC (Interrupções)", "Energia faturada">}. '
  'PROIBIDO colocar números, porcentagens ou sinais (+, -, %) dentro de "rotulo".\n'
  ```

#### [MODIFY] [InsightHighlights.tsx](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/insights/components/InsightHighlights.tsx)
- Garantir no frontend a higienização/mapeamento do rótulo via helper `formatHighlightLabel(highlight)` para que, mesmo com cache antigo no `sessionStorage`, nunca apareça `"Crescimento 8%"` sem o nome da métrica, e exibir uma legenda sutil abaixo ou no cabeçalho do card identificando se é variação no período ou valor absoluto.

---

### Componente 2: Tabela de Receita por Bairro + Gráfico Persistente à Direita

#### [MODIFY] [AreaRevenueTable.tsx](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueTable.tsx)
- Remover a coluna `<TableHead className="text-right">12 meses</TableHead>`.
- Remover o estado `expanded` e as props `histories` / `monthsInWindow` ligadas ao sparkline/breakdown embutido.
- Receber `selectedKey: string | null` e `onSelect: (area: AreaRevenue) => void` para destacar a linha ativa e atualizar o gráfico persistente ao clicar em qualquer linha da tabela.

#### [MODIFY] [AreaRevenueRow.tsx](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueRow.tsx)
- Remover a célula final com `<MonthlySparkline>` e o botão `"Mês a mês"` (`<ChevronDown>`), bem como a linha extra `<MonthlyBreakdown>`.
- Remover a restrição estreita `max-w-56` / `max-w-60` da primeira coluna para aproveitar melhor o espaço e permitir clicar na linha inteira (`onClick={() => onSelect(area)}`, `cursor-pointer`) para selecionar o bairro no gráfico à direita.

#### [NEW] [NeighborhoodHistoryPanel.tsx](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/NeighborhoodHistoryPanel.tsx)
- Componente persistente (baseado na estrutura que antes ficava oculta em `NeighborhoodHistorySheet.tsx`, respeitando o limite $\le 150$ linhas do Fallow):
  - Exibe o cabeçalho com o nome do **Bairro** e **Município** selecionado (`"Últimos 24 meses até o fim do período"`).
  - Exibe as abas (`<Tabs>`) para alternar entre **Receita**, **Volume faturado** e **Tarifa média** (`HISTORY_METRICS`).
  - Renderiza `<MonthlyBarChart points={points} metric={metric} />` dentro de `<AsyncState>`.

#### [MODIFY] [AreaRevenueCard.tsx](file:///home/miguelsb/workspace/visagio-atividade-v-energy-360/frontend/src/features/revenue/components/AreaRevenueCard.tsx)
- Remover a chamada pesada `useNeighborhoodHistories` (que disparava 10 requisições simultâneas por página para montar as sparklines da coluna removida).
- Selecionar automaticamente o primeiro bairro disponível (`selectedNeighborhood ?? firstNeighborhood`) para que o gráfico à direita esteja **sempre visível e preenchido desde o carregamento inicial**.
- Organizar o `CardContent` em uma grade responsiva (`grid grid-cols-1 gap-6 xl:grid-cols-12`):
  - Coluna da esquerda (`xl:col-span-7`): `AreaRevenueTable` + `Pagination`.
  - Coluna da direita (`xl:col-span-5`): `NeighborhoodHistoryPanel` persistente.

---

## Verification Plan

### Automated Tests
1. **Backend Linters e Testes Unitários:**
   ```bash
   make lint-backend
   cd backend && uv run pytest tests/test_insight_highlights.py tests/test_chat_api.py
   ```
2. **Frontend Linters (ESLint + Fallow) e Testes Unitários (Vitest):**
   ```bash
   make lint-frontend
   cd frontend && bun run test src/features/insights/ src/features/revenue/
   ```
3. **Suite Completa (Regra Zero):**
   ```bash
   make lint-all && make test-all
   ```

### Manual Verification
1. Abrir o **Painel do Diretor** (`/`): verificar no card **Resumo da IA** que os 3 cards de destaque à direita exibem os nomes claros dos indicadores (ex.: *Faturamento*, *Energia faturada*, *Leituras estimadas*, *DEC (Horas s/ energia)*, *FEC (Interrupções)*) sem repetir números no título.
2. Abrir **Inteligência Comercial** (`/receita`):
   - Verificar que a tabela **Receita por bairro** não possui mais a coluna `12 meses` à direita.
   - Verificar que ao lado direito da tabela há um gráfico persistente já carregado com o 1º bairro da tabela (*Brasília Teimosa*).
   - Clicar em outros bairros da tabela (ex.: *Iputinga*, *Pixete*, *Curado*) e validar que o gráfico à direita atualiza imediatamente e permite alternar entre as abas **Receita**, **Volume faturado** e **Tarifa média**.
