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

- [ ] Criar pasta `backend/app/features/revenue/` com `schemas.py`, `repository.py`, `service.py` e `router.py`.
- [ ] Registrar rotas em `backend/app/api/v1/router.py`.
- [ ] Criar testes unitários em `backend/tests/test_revenue_service.py` validando os cálculos de decomposição com números reais.
- [ ] Garantir conformidade com `make lint-backend`.
- [ ] Criar pasta `frontend/src/features/revenue/` com componentes atômicos $\le 150$ linhas.
- [ ] Adicionar rota `/revenue` em `frontend/src/routes/AppRoutes.tsx`.
- [ ] Criar testes unitários no frontend com Vitest em `RevenueDashboardPage.test.tsx`.
- [ ] Redigir relatório e conclusões em `docs/DIAGNOSTICO_RECEITA.md`.
- [ ] Garantir conformidade com `make lint-frontend`.

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Celio - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
