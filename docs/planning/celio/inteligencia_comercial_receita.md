# 📈 Fatia 04: Inteligência Comercial, Receita & Decomposição (Fullstack)

> **Dono Único:** Celio  
> **Status:** Não Iniciado  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Citações da Liderança (`atividade.pdf`, pág. 2 e 6):
> *Henrique Duarte · Diretor Comercial:*  
> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião."*  
> *"Preciso entender o que aconteceu com a receita. Não me basta o total. Quero ver por bairro e por classe, e quero saber quanto da variação foi preço e quanto foi quantidade de energia. Se foi volume, quero saber onde e por quê."*

### User Stories do Case (`atividade.pdf`, pág. 8):
> - *"• Como diretor, quero ver os principais indicadores do negócio e compará-los entre períodos, para saber rapidamente se estamos indo bem ou mal."*
> - *"• Como diretor comercial, quero entender a variação de receita entre períodos, separando efeito-preço e efeito-volume, e investigá-la por município, bairro e classe até encontrar onde está a queda."*

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/features/revenue/`):
- `schemas.py`: Schemas Pydantic (`RevenueKpisDTO`, `PriceVolumeDecompositionDTO`, `RevenueBreakdownDTO`).
- `repository.py`: Consultas SQL agrupadas por competência, município, bairro e classe de consumo (B1, B2, B3, A4).
- `service.py`: Lógica Pure Python da fórmula de decomposição formal:
  $$\text{Efeito-Volume} = \Delta \text{Volume} \times \text{Tarifa}_{\text{base}}$$
  $$\text{Efeito-Preço} = \Delta \text{Tarifa} \times \text{Volume}_{\text{base}}$$
- `router.py`: Rotas REST:
  - `GET /api/v1/revenue/kpis`
  - `GET /api/v1/revenue/decomposition`
  - `GET /api/v1/revenue/breakdown`

### Frontend (`frontend/src/features/revenue/`):
- `RevenueDashboardPage.tsx`: Dashboard executivo com layout em grid ($\le 150$ linhas).
- `hooks/useRevenueDashboardController.ts`: Hook headless controlando filtros e estados assíncronos.
- `components/RevenueKpiCards.tsx`: Cards de faturamento, volume faturado, tarifa média e variação YoY.
- `components/PriceVolumeWaterfallChart.tsx`: Gráfico de decomposição visualizando ganho de preço vs perda de volume.
- `components/NeighborhoodRevenueTable.tsx`: Tabela com ordenação dos bairros e municípios mais impactados.

#### 🧩 Componentes do Design System Recomendados (`@/components/ui/` & `@/components/feedback/`):
- **KPIs Executivos:** `<Card variant="glass">` e `<Card variant="interactive">` para cards de faturamento, volume faturado, tarifa média e delta YoY com elevação ao hover.
- **Seletores de Filtro:** `<Select>` combinado com `<Label>` para filtrar por Município, Bairro, Classe tarifária (B1, B2, B3, A4) e período comparativo.
- **Divisão de Visões:** `<Tabs>` e `<TabsList>` / `<TabsTrigger>` para alternar entre visão agregada de *Decomposição Efeito Preço x Volume* e *Ranking Territorial de Bairros*.
- **Tabela Estruturada:** `<Table>` com `<TableHeader>`, `<TableRow>` e `<TableCell>` para ordenação de receita e perdas financeiras por localidade.
- **Detalhamento de Bairro:** `<Dialog>` ou `<Sheet side="right">` disparado ao selecionar um bairro da lista para inspecionar curva de carga e histórico tarifário.
- **Explicações Metodológicas:** `<Tooltip>` de `@/components/ui/tooltip-card` sobre os termos técnicos de decomposição (Efeito Preço vs Efeito Volume).
- **Separadores & Feedback:** `<Separator />` para divisão limpa de blocos, `<LoadingSkeleton count={4} />` e `<EmptyState title="Nenhum dado financeiro encontrado">`.

### Diagnóstico da Receita:
- Co-autoria de `docs/DIAGNOSTICO_RECEITA.md` com fundamentação matemática das causas e recomendações acionáveis.

---

## 3. Checklist Operacional de Execução

- [x] Criar pasta `backend/app/features/revenue/` com `schemas.py`, `repository.py`, `service.py` e `router.py`.
- [x] Registrar rotas em `backend/app/api/v1/router.py`.
- [x] Criar testes unitários em `backend/tests/test_revenue_service.py` validando os cálculos de decomposição com números reais.
- [ ] Garantir conformidade com `make lint-backend`.
- [ ] Criar pasta `frontend/src/features/revenue/` com componentes atômicos $\le 150$ linhas.
- [ ] Adicionar rota `/revenue` em `frontend/src/routes/AppRoutes.tsx`.
- [ ] Criar testes unitários no frontend com Vitest em `RevenueDashboardPage.test.tsx`.
- [ ] Redigir relatório e conclusões em `docs/DIAGNOSTICO_RECEITA.md`.
- [ ] Garantir conformidade com `make lint-frontend`.

---

## 4. Telas Concretas, Decomposição & Contratos de Integração (Fatia 04)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Tela, Layout e Comportamentos (Zero Abstração)
1. **Filtros Globais no Topo (`RevenueFiltersBar`):**
   - `<Select>` Período Base (ex: "Ano 1: 2022") vs Período de Comparação (ex: "Últimos 12M: 2025").
   - `<Select>` Município (Opções: "Todos os 14 Municípios" ou seleção individual: Recife, Olinda, Jaboatão, etc.).
   - `<Select>` Classe de Consumo (Opções: "Todas as Classes", "B1 Residencial", "B2 Rural", "B3 Comercial/Poder Público", "A4 Industrial").
2. **Card de IA Embutida (`SmartInsightCard.tsx`):**
   - Localizado no topo com `<Card variant="glass">`.
   - Exibe resumo analítico dos filtros selecionados (ex: *"No recorte atual, o reajuste tarifário gerou +R$ 14,2M em Efeito-Preço, mas a retração de volume destruiu -R$ 6,8M, sendo 68% dessa perda concentrada em Boa Viagem e Parnamirim devido à expansão de GD solar"*).
3. **Grid de 4 Cards de KPIs Executivos (`RevenueKpiCards.tsx`):**
   - Card 1: Faturamento Bruto Atual (R$) com badge percentual YoY ($\Delta\%$).
   - Card 2: Volume Total Faturado (MWh) com badge percentual negativo ($\Delta\%$).
   - Card 3: Tarifa Média Ponderada Homologada (R$/kWh).
   - Card 4: Ticket Médio por UC Ativa (R$/mês).
4. **Gráfico de Decomposição Waterfall (`PriceVolumeWaterfallChart.tsx`):**
   - Gráfico de barras flutuantes em cascata com 5 colunas:
     - Coluna 1: **Receita Base (Ano 1)** (barra neutra azul escura).
     - Coluna 2: **Efeito-Preço** (barra verde ascendente: $+\Delta P \times Q_{\text{base}}$).
     - Coluna 3: **Efeito-Volume** (barra vermelha descendente: $-\Delta Q \times P_{\text{base}}$).
     - Coluna 4: **Efeito Misto / Cruzado** (barra intermediária: $\Delta P \times \Delta Q$).
     - Coluna 5: **Receita Atual (Últimos 12M)** (barra neutra final somando os efeitos).
   - Tooltip explicativo com a fórmula matemática e valores exatos em R$.
5. **Tabela Territorial de Bairros (`NeighborhoodRevenueTable.tsx`):**
   - Tabela ordenada por padrão pelo **Efeito-Volume mais negativo (maior destruição de receita em R$)**.
   - Colunas:
     - Município e Bairro.
     - Volume Faturado Atual (kWh) e Variação de Volume ($\Delta\%$).
     - Receita Atual (R$) e Efeito-Volume Financeiro (R$).
     - Penetração de Geração Distribuída (kWp instalados).
   - Interação: Clicar na linha abre `<Dialog>` exibindo a curva de carga histórica de 24 meses do bairro selecionado.

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que Celio ENTREGA para os outros colegas:**
  - Rota de frontend `/revenue` no `AppRoutes.tsx`.
  - Componente de página `RevenueDashboardPage.tsx`.
  - Endpoints REST `/api/v1/revenue/kpis`, `/decomposition`, `/breakdown`.
  - Relatório diagnóstico oficial em `docs/DIAGNOSTICO_RECEITA.md`.
- **O que Celio RECEBE dos outros colegas:**
  - **De Renan (Fatia 01):** Consome `dim_unidade_consumidora` (bairros, municípios, GD solar) e `fato_medicao` (volume medido) no SQLite `v_energy.db`.
  - **De Ryei Estevan (Fatia 02):** Consome `fato_faturamento` (receita bruta, tarifas e bandeiras) no SQLite `v_energy.db`.
  - **De João Henrique (Fatia 06):**
    - Aplica a proteção de acesso no router FastAPI:  
      `dependencies=[Depends(require_role([UserRole.DIRETORIA, UserRole.ADMIN]))]`
    - Renderiza a página dentro do `<AppLayout>`.
  - **De Miguel (Fatia 07):**
    - Importa e renderiza o card de IA contextual:  
      `<SmartInsightCard context="revenue" payload={{ period, filters }} />`.
  - **Colaboração em `docs/DIAGNOSTICO_RECEITA.md`:**
    - Renan fornece dados consolidados de expansão da capacidade de GD solar em MWp.
    - Ryei fornece dados de faturamento por classe e oscilação de bandeiras.
    - Adrian fornece a estimativa de volume e receita perdidos em fraudes/gatos.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Celio - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


