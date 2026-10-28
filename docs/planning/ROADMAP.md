# 🗺️ V-Energy Grid 360 — Plano Diretor de Engenharia (Master Roadmap)

> **Documento Oficial de Governança, Fatias Verticais Ponta a Ponta e Alocação de Trabalho**  
> **Data Limite do Projeto:** 04/11/2026 | **Apresentação Prévia:** 05/11/2026 | **Banca Final:** 10/11/2026

---

## 1. Visão Geral do Projeto & Dores de Negócio

O **V-Energy Grid 360** é uma plataforma analítica integrada desenvolvida para a distribuidora de energia elétrica fictícia **V-Energy** (Recife e Região Metropolitana). O projeto aborda a fragmentação histórica de dados entre sistemas legados (cadastro comercial, medição, faturamento, rede e call center), unificando-os em uma fonte única da verdade para responder à inquietação central da diretoria:

> *Henrique Duarte · Diretor Comercial (`atividade.pdf`, pág. 2):*  
> *"A base de clientes cresceu, e a tarifa residencial acumulou reajuste homologado de 10,5% desde meados de 2022. Mesmo assim, comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%. Ninguém nesta mesa sabe explicar por quê. Preciso de uma resposta baseada em dados, não em opinião."*

---

## 2. Princípios Inegociáveis de Arquitetura e Trabalho em Equipe

1. **Fatias Verticais Ponta a Ponta (*End-to-End Vertical Slices*):**
   - Não há divisão horizontal ("apenas backend" ou "apenas frontend").
   - Cada desenvolvedor é o **dono único e soberano** de uma fatia completa não-bloqueante (da persistência ao frontend e testes), eliminando gargalos de dependência.
2. **Engenharia de Dados Fatiada por Domínio de Tabelas:**
   - Em vez de dividir por camadas (Bronze/Silver/Gold), cada engenheiro de dados conduz seu domínio de tabelas por **todas as camadas** (Bronze $\to$ Silver $\to$ Gold $\to$ SQLite $\to$ Testes de Qualidade).
3. **Pastas Dedicadas por Membro (Zero Conflito de Merge no Git):**
   - Cada desenvolvedor possui sua própria pasta em `docs/planning/<membro>/` contendo seu checklist operacional (`<slice_name>.md`) e seu diário de bordo (`changelog.md`).
4. **Governança contra God Files ([`AGENTS.md`](../../AGENTS.md)):**
   - **Backend:** Máximo de **300 linhas por módulo** e **30 linhas por método/função**. Serviços são Pure Python (zero import de FastAPI/Starlette).
   - **Frontend:** Máximo de **150 linhas por componente React** (`maxUnitSize`), complexidade $\le 15$, padrão Headless Controller, proibição de tags HTML nativas soltas fora de `components/ui/` e animações exclusivamente com `motion/react`.
5. **Testes Automatizados Obrigatórios em Todas as Etapas:**
   - Nenhuma fatia pode ser considerada concluída sem testes automatizados passando (PySpark assertions em Dados, pytest no Backend, Vitest no Frontend e benchmark com Golden Dataset na IA).

---

## 3. Matriz de Alocação e Titularidade das 7 Fatias Verticais

| Fatia | Título da Fatia Vertical | Dono Único | Escopo Técnico Ponta a Ponta | Pasta & Documentos da Fatia |
|---|---|---|---|---|
| **01** | **Cadastro, Medição & GD** | **Renan** | `unidades`, `leituras/`, `medidores`, `geracao_distribuida` $\to$ Bronze, Silver, Gold, SQLite WAL e testes PySpark | [Checklist](renan/cadastro_medicao_gd.md)<br/>[Changelog](renan/changelog.md) |
| **02** | **Faturamento, Rede & Atendimento** | **Ryei Estevan** | `faturas`, `ocorrencias` (DEC/FEC ANEEL), `atendimentos`, `inspecoes` $\to$ Bronze, Silver, Gold, Databricks Workflow `job.yaml`, SQLite e testes | [Checklist](ryei_estevan/faturamento_rede_atendimento.md)<br/>[Changelog](ryei_estevan/changelog.md) |
| **03** | **Visão 360 da UC** | **Bernardo H** | Back: `/customers/{id}` (summary, 12m YoY, events)<br/>Front: `Customer360Page` (atendimento 1-click, cards, gráfico YoY, histórico) + Vitest | [Checklist](bernardo/visao_360_uc.md)<br/>[Changelog](bernardo/changelog.md) |
| **04** | **Inteligência Comercial & Receita** | **Celio** | Back: `/revenue` (KPIs, decomposição Preço vs Volume, filtros)<br/>Front: `RevenueDashboardPage` (waterfall chart, tabela por bairro) + Diagnóstico da Receita + Testes | [Checklist](celio/inteligencia_comercial_receita.md)<br/>[Changelog](celio/changelog.md) |
| **05** | **Gestão de Perdas & Campo** | **Adrian Cesar** | Back: `/losses` (suspeitas, ordens de fiscalização, export CSV/XLSX, upload multipart)<br/>Front: `LossManagementPage` (badges, modal de OS, drag-and-drop de planilha de campo) + Testes | [Checklist](adrian_cesar/gestao_perdas_campo.md)<br/>[Changelog](adrian_cesar/changelog.md) |
| **06** | **Qualidade da Rede & Plataforma RBAC** | **Joao Henrique** | Back: `/quality` (DEC/FEC por alimentador) e `/auth` (RBAC dinâmico por perfil)<br/>Front: `GridQualityPage` (série 24m, ranking), Shell `AppLayout` adaptativo e redirecionamento por cargo + Testes | [Checklist](joao_henrique/qualidade_rede_rbac.md)<br/>[Changelog](joao_henrique/changelog.md) |
| **07** | **Agente Text-to-SQL & IA Integrada** | **Miguel** | Back: LangGraph FSM (prompts, AST validator, auto-correção, Chart.js specs), streaming SSE `/chat/stream`<br/>Front: `ChatDrawer`, auditoria de SQL, IA Embutida (`SmartInsightCard`) + Benchmark de acurácia | [Checklist](miguel/agente_text_to_sql_ia.md)<br/>[Changelog](miguel/changelog.md) |

---

## 4. Catálogo de Componentes de UI do Design System por Fatia Vertical

Em conformidade com [`design.md`](../../design.md) e [`.agents/skills/frontend-coding-standards/SKILL.md`](../../.agents/skills/frontend-coding-standards/SKILL.md), o design system corporativo (Corporate Blue, 12px de raio, tokens semânticos OKLCH) disponibiliza primitivas atômicas prontas para uso em `frontend/src/components/ui/` e `frontend/src/components/feedback/`:

| Fatia / Tela | Estrutura & Navegação | Dados & Visualização | Modais, Gavetas & Formulários | Feedback & Estados |
|---|---|---|---|---|
| **Fatia 03: Visão 360 da UC** (Bernardo) | `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` | `<Card variant="glass">`, `<Card variant="interactive">`, `<Table>` | `<Input>`, `<Label>`, `<Sheet side="right">` (espelho de fatura), `<Tooltip>` | `<LoadingSkeleton>`, `<EmptyState>` |
| **Fatia 04: Receita & Decomposição** (Célio) | `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<Separator>` | `<Card variant="glass">`, `<Card variant="interactive">`, `<Table>` | `<Select>`, `<Label>`, `<Dialog>`, `<Tooltip>` (metodologia de decomposição) | `<LoadingSkeleton>`, `<EmptyState>` |
| **Fatia 05: Gestão de Perdas** (Adrian) | `<Tabs>`, `<TabsList>`, `<TabsTrigger>` | `<Table>`, `<Badge variant="destructive">`, `<Badge variant="outline">` | `<Dialog>` (criação de OS / upload Excel), `<AlertDialog>` (cancelamento), `<Textarea>` | `<LoadingSkeleton>`, `<EmptyState>` |
| **Fatia 06: Qualidade DEC/FEC** (João H.) | `<AppLayout>`, `<SidebarNav>`, `<Tabs>`, `<Separator>` | `<Card variant="glass">`, `<Card variant="interactive">`, `<Table>`, `<Badge>` | `<Select>`, `<Label>`, `<Sheet side="right">` (detalhes do alimentador), `<Tooltip>` | `<LoadingSkeleton>`, `<EmptyState>` |
| **Fatia 07: Agente Text-to-SQL & IA** (Miguel) | `<Tabs>`, `<TabsList>`, `<TabsTrigger>` | `<Card variant="glass">` (smart insights), `<Badge variant="outline">` | `<Sheet side="right">` (`ChatDrawer`), `<Textarea>`, `<Spinner>` (streaming SSE), `<Tooltip>` | `<EmptyState title="Como posso ajudar?">` |

---

## 5. Instruções de Auto-Atualização para Agentes e Desenvolvedores

> [!IMPORTANT]
> **Fluxo Obrigatório a Cada Alteração:**
>
> 1. **Ao Iniciar a Tarefa:**
>    - Acesse sua pasta em `docs/planning/<membro>/`.
>    - Abra seu arquivo de checklist (`<slice_name>.md`) e marque o item como `[- Em andamento por <Nome> - YYYY-MM-DD]`.
>
> 2. **Ao Desenvolver:**
>    - Respeite rigorosamente as regras de arquitetura:
>      - Backend: Arquivos $\le 300$ linhas, funções $\le 30$ linhas, zero imports de FastAPI em serviços, variáveis descritivas de negócio.
>      - Frontend: Componentes $\le 150$ linhas, complexidade $\le 15$, zero tags HTML nativas fora de `components/ui/`, animações somente com `motion/react`.
>
> 3. **Antes de Marcar Concluído:**
>    - Execute `make lint-all` e `make test-all`.
>    - Nenhuma fatia pode ser entregue com advertências graves ou testes quebrados.
>
> 4. **Ao Concluir a Tarefa:**
>    - Marque o item com `[x]` no checklist da sua fatia.
>    - Adicione uma nova entrada no seu arquivo de log individual `docs/planning/<membro>/changelog.md` detalhando:
>      - Data da entrega
>      - Arquivos criados ou modificados
>      - Dificuldades enfrentadas e bugs solucionados
>      - Status dos linters e comandos de teste executados

---

## 6. Cronograma Consolidado e Marcos (Milestones)

```
[16/10 - 20/10] Fase 1: Fundação & Contratos de Dados (Bronze/Silver/Gold das fatias, SQLite, Wireframes)
       │
[21/10 - 26/10] Fase 2: Implementação das Fatias Verticais Core & FSM Text-to-SQL
       │
[27/10 - 29/10] Fase 3: Status Report Intermediário & Diagnóstico Preliminar da Receita
       │
[30/10 - 02/11] Fase 4: Integração de Diferenciais (Chat UI SSE, Smart Insights, RBAC, Planilhas de Campo)
       │
[03/11 - 04/11] Fase 5: Hardening, Linters 100%, Ensaios e Congelamento da Entrega Final (04/11)
       │
    05/11      Apresentação Prévia (Organizadores e Padrinhos)
       │
    10/11      Banca Final Avaliadora da Visagio
```

---

## 7. Governança de Negócio (5W2H) & Matriz de Convergência e Integração

> [!IMPORTANT]
> **Manual Obrigatório de Negócio e Metodologia 5W2H:**  
> Todos os desenvolvedores devem ler e dominar as regras do setor elétrico, a mecânica tarifária e a modelagem 5W2H em:  
> 🔗 [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](DOMINIO_NEGOCIO_5W2H.md)

### 7.1 Matriz de Convergência e Integração ("Quem Cria vs Quem Consome/Pluga")

Para eliminar qualquer ambiguidade sobre dependências entre desenvolvedores, a matriz abaixo define com precisão os pontos de conexão:

| Recurso / Componente | Dono Produtor (Quem Cria) | Arquivo de Origem | Consumidores (Quem Pluga) | Ponto Exato de Inserção / Como Usar |
|---|---|---|---|---|
| **Tabelas Gold de Cadastro & Medição** (`dim_unidade_consumidora`, `fato_medicao`) | **Renan** (Fatia 01) | `backend/v_energy.db` | **Bernardo** (Fatia 03)<br/>**Celio** (Fatia 04)<br/>**Adrian** (Fatia 05)<br/>**Miguel** (Fatia 07) | • Bernardo consulta na rota `/customers/{id}`<br/>• Célio consulta no agregador de volume/bairros<br/>• Adrian filtra UCs com queda abrupta de consumo<br/>• Miguel mapeia no catálogo Text-to-SQL |
| **Tabelas Gold de Faturamento, Rede & Atendimento** (`fato_faturamento`, `fato_qualidade_alimentador`, `fato_atendimentos`, `fato_inspecoes_perdas`) | **Ryei Estevan** (Fatia 02) | `backend/v_energy.db` | **Bernardo** (Fatia 03)<br/>**Celio** (Fatia 04)<br/>**Adrian** (Fatia 05)<br/>**Joao Henrique** (Fatia 06)<br/>**Miguel** (Fatia 07) | • Bernardo consome faturas e chamados na tela 360<br/>• Célio consome receita bruta e tarifas<br/>• Adrian consulta histórico de vistorias passadas<br/>• João Henrique consome DEC/FEC por alimentador<br/>• Miguel mapeia no catálogo Text-to-SQL |
| **Dependência de Segurança RBAC** (`require_role`) | **Joao Henrique** (Fatia 06) | `backend/app/shared/dependencies.py` | **Bernardo** (Fatia 03)<br/>**Celio** (Fatia 04)<br/>**Adrian** (Fatia 05) | Cada desenvolvedor adiciona a dependência no seu roteador:<br/>• Bernardo: `require_role([UserRole.ATENDIMENTO, UserRole.DIRETORIA, UserRole.ADMIN])`<br/>• Célio: `require_role([UserRole.DIRETORIA, UserRole.ADMIN])`<br/>• Adrian: `require_role([UserRole.PERDAS, UserRole.DIRETORIA, UserRole.ADMIN])` |
| **Shell Base da Aplicação** (`AppLayout.tsx` & `SidebarNav.tsx`) | **Joao Henrique** (Fatia 06) | `frontend/src/components/layout/` | **Todos os Desenvolvedores de Frontend** | Suas páginas são filhas do `<AppLayout>`, renderizadas no `<Outlet />`. O `SidebarNav` lê as permissões do usuário logado e exibe as rotas autorizadas. |
| **Registro de Rotas no Frontend** | **Compartilhado** | `frontend/src/routes/AppRoutes.tsx` | **Bernardo, Celio, Adrian, Joao Henrique** | Cada desenvolvedor declara sua rota protegida:<br/>• `/customers` (Bernardo)<br/>• `/revenue` (Célio)<br/>• `/losses` (Adrian)<br/>• `/quality` (João Henrique) |
| **IA Embutida** (`<SmartInsightCard />`) | **Miguel** (Fatia 07) | `frontend/src/features/insights/SmartInsightCard.tsx` | **Bernardo** (Fatia 03)<br/>**Celio** (Fatia 04) | • Bernardo importa e coloca no topo de `Customer360Page.tsx`<br/>• Célio importa e coloca no topo de `RevenueDashboardPage.tsx` |
| **Assistente Text-to-SQL Global** (`<ChatDrawer />`) | **Miguel** (Fatia 07) | `frontend/src/features/chat/ChatDrawer.tsx` | **Joao Henrique** (Fatia 06) | João Henrique importa o `<ChatDrawer />` e insere o botão disparador no cabeçalho (*Header*) do `AppLayout.tsx`. |
| **Relatório Diagnóstico da Receita** (`docs/DIAGNOSTICO_RECEITA.md`) | **Celio** (Fatia 04) | `docs/DIAGNOSTICO_RECEITA.md` | **Renan, Ryei Estevan, Adrian Cesar** | • Renan fornece o impacto da GD Solar no volume<br/>• Ryei fornece o impacto das bandeiras tarifárias<br/>• Adrian fornece a estimativa de perdas não técnicas |
| **Painel do Diretor** (`/dashboard`, `GET /api/v1/dashboard/*`) | **Bernardo** (backend e contrato) + **Adrian Cesar** (frontend) | `backend/app/features/executive_dashboard/`<br/>`frontend/src/features/executive_dashboard/` | **Diretor**<br/>**Miguel** (Fatia 07) | • Reaproveita os totais de receita da Fatia 04 e o ranking da fila da Fatia 05, para os números baterem com as outras telas<br/>• Miguel liga o `<SmartInsightCard />` aos indicadores reais do Painel<br/>• Planejamento: [`bernardo/painel_diretor.md`](bernardo/painel_diretor.md) |


