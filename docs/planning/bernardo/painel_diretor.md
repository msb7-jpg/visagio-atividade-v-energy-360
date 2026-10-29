# 👤 Painel do Diretor: indicadores do negócio comparados entre períodos (Fullstack)

> **Responsável:** Bernardo H (backend, frontend e integração) · **Revisão do frontend:** Adrian Cesar  
> **Status:** Backend, frontend, menu e ADRs entregues em 2026-10-27; faltam o banco real (etapa 4) e o quadro de IA (etapa 7) · Prazo: 2026-10-30  
> **Branch:** `feat/painel-diretor`  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](../../../.agents/skills/backend-coding-standards/SKILL.md), [`.agents/skills/frontend-coding-standards/SKILL.md`](../../../.agents/skills/frontend-coding-standards/SKILL.md), [`.agents/skills/tanstack-query/SKILL.md`](../../../.agents/skills/tanstack-query/SKILL.md), [`.agents/skills/shadcn/SKILL.md`](../../../.agents/skills/shadcn/SKILL.md) e [`design.md`](../../../design.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. O que o case pede

### User story (`atividade.pdf`, seção 5.2, obrigatória)
> *"Como diretor, quero ver os principais indicadores do negócio e compará-los entre períodos, para saber rapidamente se estamos indo bem ou mal."*

### Requisitos relacionados
- **Seção 5.2:** *"Como usuário do portal, quero filtrar e recortar as informações conforme a minha necessidade"* → o diretor escolhe os períodos comparados.
- **Seção 5.3 (IA embutida):** *"quero receber, nas telas que uso no dia a dia, insights gerados por IA que me ajudem a interpretar os dados"* → o quadro de IA do Miguel entra no Painel com os números reais (etapa 7).
- **Seção 1 (pergunta do diretor):** *"comparando os últimos 12 meses com o primeiro ano da nossa base, o volume de energia faturada caiu quase 4% e a receita subiu só 8%"* → os períodos padrão são exatamente esses.
- **Glossário (DEC e FEC):** os valores *"servem para comparar alimentadores e períodos entre si, não para comparar com os limites regulatórios reais"* → o Painel compara períodos e não mostra limite ANEEL.
- **Seção 7:** *"Qualidade acima de quantidade"* → só entram indicadores que os dados sustentam nos dois períodos.

### Como o Painel se encaixa
A tela de receita (Célio) detalha **onde** a receita mudou, e o diagnóstico (Renan e Célio) explica **por quê**. O Painel é a **porta de entrada**: em uma tela, o diretor vê se a empresa vai bem ou mal em todas as áreas (comercial, cobrança, rede, atendimento, perdas). Os números do Painel precisam ser **iguais** aos da tela de receita e aos do diagnóstico.

---

## 2. Decisões tomadas (2026-10-27)

| # | Decisão | Motivo |
|---|---|---|
| D1 | **Só o perfil diretor** acessa o Painel. Gerente de operação passa a abrir em Qualidade da Rede, e gerente de perdas, na Fila de Perdas. | A user story é do diretor, e a API de receita já é restrita à diretoria (`RequireDiretoria`). |
| D2 | **Períodos padrão do case com escolha livre:** primeiro ano da base (2022-07 a 2023-06) contra os últimos 12 meses (2025-07 a 2026-06). O diretor pode trocar. | São os períodos da pergunta do diretor, da tela de receita (`DEFAULT_REVENUE_QUERY`) e do diagnóstico. |
| D3 | **Perdas como retrato atual, sem comparação.** | As inspeções só existem de ago a dez/2025: não há primeiro ano para comparar. A tela avisa "sem histórico para comparar". |
| D4 | **Inadimplência = % do valor faturado vencido e não pago** (`status_pagamento = VENCIDA`). | Mostra o dinheiro que não entrou e é simples de explicar. |
| D5 | **Quadro de IA no Painel com números reais**, depois do merge do #35. O Painel não espera por ele. | Cumpre a IA embutida da seção 5.3 sem números inventados no código. |
| D6 | **Todos os grupos de indicadores da seção 3.** | "Principais indicadores do negócio" cobre as áreas que o case integra: cadastro, medição, faturamento, rede e atendimento, mais perdas. Cada grupo responde a uma liderança do case. |

---

## 3. Indicadores

Valores aproximados medidos nos arquivos brutos em `data/landing/`, só para conferência. Os valores oficiais saem da Gold.

| Grupo | Indicador | Cálculo (tabela Gold) | Melhor quando | Bruto: base → atual |
|---|---|---|---|---|
| Comercial | Faturamento (R$) | Σ `valor_total_rs` (`fato_faturamento`) | maior | receita +8% (case) |
| Comercial | Energia faturada (kWh) | Σ `consumo_faturado_kwh` | maior | −3,8% (case) |
| Comercial | Tarifa média (R$/kWh) | faturamento ÷ energia faturada | neutro | — |
| Comercial | UCs ativas | UCs distintas faturadas na janela | maior | — |
| Cobrança | Inadimplência (%) | Σ valor `VENCIDA` ÷ Σ valor faturado | menor | ~8,0% → ~8,0% |
| Rede | Horas sem energia por cliente (DEC da área) | Σ `duracao_horas` (`fato_ocorrencias_rede`) ÷ UCs ativas | menor | horas totais ×2,3 |
| Rede | Interrupções por cliente (FEC da área) | nº de ocorrências ÷ UCs ativas | menor | +46% |
| Atendimento | Satisfação média (1 a 5) | média de `nota_csat` (`fato_atendimentos`), nulos ignorados | maior | 4,1 → 3,9 |
| Atendimento | Tempo médio de resolução (h) | média de `tempo_resolucao_horas` | menor | — |
| Medição | Leituras estimadas (%) | `tipo_leitura = ESTIMADA` ÷ leituras (`fato_medicao`) | menor | 19,0% → 15,8% |
| Medição | Clientes com painel solar | UCs com `data_conexao_gd` ≤ fim da janela (`dim_unidade_consumidora`) | neutro | 0 → 3.510 |
| Perdas (retrato) | UCs na fila, energia recuperável (kWh/mês e R$/ano) e taxa de acerto das inspeções | mesmo cálculo da Fila de Perdas (`loss_management`) | — | sem comparação (D3) |

**Regras gerais:**
- **Variação** = (atual − base) ÷ base. Fica vazia quando a base é zero (ex.: painel solar no primeiro ano), e a tela mostra só os dois valores.
- **Avaliação** feita pelo backend: `MELHOROU`, `PIOROU`, `ESTAVEL` (variação abaixo de 1% em módulo) ou `SEM_COMPARACAO`, usando a coluna "melhor quando". Indicadores neutros são sempre "informativo".
- **Falta de luz:** quando o período atual contém jul/2025, a tela avisa que o temporal daquele mês concentra boa parte das horas (cerca de 5 vezes mais interrupções que a média, quase todas por causa climática).
- **Painel solar** é neutro: não é bom nem ruim para a empresa, mas explica parte da queda de volume.

---

## 4. Backend (Bernardo)

### Estrutura (`backend/app/features/executive_dashboard/`)
| Arquivo | Responsabilidade |
|---|---|
| `schemas.py` | DTOs Pydantic do contrato (seção 6). |
| `queries.py` | SQL das agregações por janela (inadimplência, rede, atendimento, medição, GD). |
| `repository.py` | Executa as consultas; erro de tabela ausente vira `DatabaseReadError`. |
| `indicators.py` | Cálculo puro: variação, avaliação e montagem dos grupos. |
| `service.py` | Pure Python: valida as janelas, junta receita, demais áreas e perdas. |
| `dependencies.py` | `Annotated[T, Depends()]` do serviço e das janelas. |
| `router.py` | Rotas finas com `RequireDiretoria`. |

### Reaproveitamento (números iguais aos das outras telas)
- **Receita:** usar o `RevenueRepository.fetch_period_totals` e o `kpis.py` da Fatia 04, e não um SQL novo. É o que garante que o faturamento do Painel seja o da tela do Célio.
- **Janelas:** reaproveitar `PeriodWindow`, `build_window` e `RevenueService.check_windows`, que rejeitam janelas sobrepostas ou invertidas.
- **Perdas:** reaproveitar `rank_suspicious_units` e `hit_rate_dto` da Fatia 05 para o retrato da fila.

### Rotas
- `GET /api/v1/dashboard/indicators?base_inicio&base_fim&atual_inicio&atual_fim`: grupos de indicadores comparados. Sem parâmetros, usa os períodos padrão (D2).
- `GET /api/v1/dashboard/losses`: retrato atual da fila de perdas. É separado porque o cálculo da fila é o mais pesado e não deve atrasar os demais cards.

### Regras do repositório a cumprir
- `import-linter`: `service.py` e `indicators.py` entram no contrato "Pure Python Services" do `pyproject.toml`.
- Pylint: até 300 linhas por módulo e funções curtas; nomes de variáveis descritivos (AGENTS.md 1.2).
- Sem `dict[str, Any]` em contratos públicos; docstrings Google em funções públicas.
- Router registrado em `app/api/v1/router.py`.

---

## 5. Frontend (Bernardo; revisão do Adrian)

### Estrutura (`frontend/src/features/executive_dashboard/`)
- `api/executiveDashboardApi.ts`, `queries/executiveDashboardQueries.ts` (`queryOptions` com `signal`, `staleTime`) e `types/executiveDashboardTypes.ts`.
- `hooks/useExecutiveDashboardController.ts`: controller headless (períodos na URL, como na Visão 360).
- `components/`: `ExecutiveDashboardPage`, `PeriodSelector`, `IndicatorGroup`, `IndicatorCard`, `EvaluationBadge` e `LossesSnapshotCard`.
- `utils/`: `dashboardPeriods.ts` (janelas na URL, validação e meses) e `indicatorFormatters.ts` (formato por unidade).

### Layout
1. Título "Painel do Diretor" e uma linha explicando os dois períodos comparados.
2. Seletor dos dois períodos (padrão D2) e um botão para voltar ao padrão do case.
3. Um bloco por grupo (Comercial, Cobrança, Rede, Atendimento, Medição), cada um com cards no formato da **Receita 1 do `design.md`**: valor atual, valor base, variação e selo "melhorou", "piorou", "estável" ou "informativo".
4. Card de perdas com o selo "retrato atual, sem histórico para comparar".
5. Quadro de IA entra abaixo dos grupos na etapa 7 (hoje não há nada no lugar, para não mostrar números inventados).

### Regras a cumprir
- `design.md`: tokens semânticos (sem `text-emerald-600` nem cores soltas; registrar o token no CSS se precisar), `Card variant="interactive"`, componentes de até 150 linhas, `AsyncState` para carregando, erro e vazio, e ternários explícitos.
- Nada de `<button>` ou `<select>` fora de `components/ui/`; usar o `Select` do projeto no seletor de períodos.
- Reaproveitar `components/ui/tooltip-card.tsx` para explicar cada cálculo ao passar o mouse.
- Testes Vitest da página com a API simulada.

### Rotas e menu (arquivos do João, pedir revisão dele)
- `AppRoutes.tsx`: `/dashboard` passa a renderizar `ExecutiveDashboardPage` e fica restrita a `diretor`.
- `navItems.ts`: o item "Painel" passa a ser só de `diretor`. A tela inicial é o primeiro item do menu, então o menu foi reordenado (Painel, Gestão de Perdas, Qualidade da Rede, Visão 360): o gerente de perdas abre em `/losses`, e o de operação, em `/quality` (D1).
- O antigo `features/auth/components/DashboardPage.tsx` foi removido. Avisar o Miguel, porque o #35 altera esse arquivo (pendência).

---

## 6. Contrato de integração (backend ↔ frontend)

Implementado exatamente neste formato (`schemas.py` e `executiveDashboardTypes.ts`). A confirmação com o Adrian ficou para a revisão do PR.

`GET /api/v1/dashboard/indicators`
```json
{
  "base": { "competencia_inicio": "2022-07", "competencia_fim": "2023-06" },
  "atual": { "competencia_inicio": "2025-07", "competencia_fim": "2026-06" },
  "periodo_disponivel": { "competencia_inicio": "2022-07", "competencia_fim": "2026-06" },
  "grupos": [
    {
      "id": "comercial",
      "titulo": "Comercial",
      "indicadores": [
        {
          "id": "faturamento",
          "titulo": "Faturamento",
          "unidade": "RS",
          "base": 85200000.0,
          "atual": 92016000.0,
          "variacao_pct": 8.0,
          "variacao_pp": null,
          "detalhe": null,
          "sentido": "MAIOR_MELHOR",
          "avaliacao": "MELHOROU",
          "explicacao": "Soma do valor total das faturas emitidas no período.",
          "aviso": null
        }
      ]
    }
  ]
}
```
- `unidade`: `RS`, `KWH`, `RS_KWH`, `UCS`, `PCT`, `NOTA`, `HORAS`, `VEZES`. A formatação fica no frontend.
- `sentido`: `MAIOR_MELHOR`, `MENOR_MELHOR` ou `NEUTRO`.
- `avaliacao`: `MELHOROU`, `PIOROU`, `ESTAVEL`, `SEM_COMPARACAO` ou `INFORMATIVO`.
- `variacao_pp`: diferença em pontos percentuais, só nos indicadores em % (`PCT`); a avaliação deles usa este campo (adicionado em 28/10).
- `detalhe`: valor de apoio opcional nas duas janelas (`titulo`, `unidade`, `base`, `atual`); hoje só na inadimplência, com o valor vencido em R$ (adicionado em 28/10).
- `aviso`: texto opcional, ex.: o temporal de jul/2025 no grupo Rede.
- Erros: 400 (janelas inválidas ou sobrepostas), 401, 403 (perfil diferente de diretor), 404 (sem dados nas janelas), 422 (formato da competência) e 500 (`DatabaseReadError`).

`GET /api/v1/dashboard/losses`
```json
{
  "competencia_referencia": "2026-06",
  "competencia_fixada": false,
  "ucs_na_fila": 1240,
  "energia_recuperavel_kwh_mes": 182000.0,
  "valor_recuperavel_rs_ano": 1950000.0,
  "taxa_acerto_pct": 52.0,
  "inspecoes_avaliadas": 1389
}
```
Os números dos exemplos são ilustrativos.

---

## 7. Etapas e cronograma

| Etapa | Quem | Até | Entrega |
|---|---|---|---|
| 1. Planejamento e contrato | Bernardo | 27/10 | Este documento; DTOs e exemplo JSON enviados ao Adrian. |
| 2. Backend: consultas, cálculo, rotas e testes | Bernardo | 28/10 | ✓ 27/10: rotas com a seed de testes; lint e testes verdes. |
| 3. Frontend com dados de exemplo | Bernardo (revisão do Adrian) | 28/10 | ✓ 27/10: página, cards e seletor de períodos com a API simulada; testes Vitest. |
| 4. Banco real | Bernardo | 29/10 | ✓ 28/10: conferido com o `v_energy.db` real e com `/revenue/kpis`; tempo de resposta dentro da meta (seção 13). |
| 5. Integração front ↔ back, rotas e menu | Bernardo | 29/10 | ✓ 27/10: Painel ligado à API; só o diretor acessa; telas iniciais dos gerentes ajustadas. Falta conferir no navegador com o banco real. |
| 6. Revisão, documentação e PR | Bernardo | 30/10 | ✓ ADR-010 a ADR-015, checklist e changelog em 27/10. Falta o PR revisado por Adrian e João (menu). |
| 7. Quadro de IA com números reais | Bernardo + Miguel | após o merge do #35 | `SmartInsightCard` alimentado pelos indicadores do Painel. |

---

## 8. Checklist operacional

### Backend
- [x] Criar `executive_dashboard/schemas.py` com o contrato da seção 6. (27/10)
- [x] Consultas por janela: inadimplência, DEC/FEC da área, satisfação, tempo de resolução, leituras estimadas e painéis solares. (27/10)
- [x] Reaproveitar os totais de receita da Fatia 04 (`fetch_period_totals` + `kpis.py`). (27/10)
- [x] Cálculo puro de variação e avaliação em `indicators.py`. (27/10)
- [x] Retrato de perdas reaproveitando o ranking da Fatia 05. (27/10)
- [x] `GET /dashboard/indicators` e `GET /dashboard/losses` com `RequireDiretoria`. (27/10)
- [x] Incluir `service.py`, `indicators.py` e `catalog.py` no contrato Pure Python do import-linter. (27/10)
- [x] Seed de testes com cenários conhecidos (variação positiva, negativa, base zero, tabela ausente). (27/10)
- [x] Testes: cálculo puro, serviço com repositório falso e router (200, 400, 401, 403, 404, 422, 500). (27/10)

### Frontend (Adrian)
- [x] Tipos, API e `queryOptions` do contrato. (27/10)
- [x] Controller headless com os períodos na URL. (27/10)
- [x] Seletor de períodos com o padrão do case. (27/10)
- [x] Cards por grupo no padrão da Receita 1 do `design.md`, com selo de avaliação e explicação ao passar o mouse. (27/10)
- [x] Card de perdas com o aviso de retrato atual. (27/10)
- [x] Estados de carregando, erro e vazio com `AsyncState`. (27/10)
- [x] Testes Vitest: renderização, troca de período, selos, erro e vazio. (27/10)

### Integração
- [x] `/dashboard` só para o diretor (`AppRoutes.tsx` e `navItems.ts`). (27/10; falta a revisão do João)
- [x] Telas iniciais: gerente de perdas → `/losses`, gerente de operação → `/quality`. (27/10)
- [x] Remover o `DashboardPage` antigo. (27/10)
- [ ] Avisar o Miguel por causa do #35 (pendência da seção 11).
- [x] Conferir os números com o banco real e com a tela de receita. (28/10)
- [x] Desempenho: leitura sequencial, cache e pré-cálculo na subida da API (ADR-016). (28/10)
- [x] Taxas avaliadas em pontos percentuais (ADR-011 revisada). (28/10)
- [ ] **Célio:** avisar que `period_totals_query` (`revenue/queries.py`) perdeu o filtro de competência no `WHERE` para ficar mais rápida (mesmos números, ADR-016).
- [ ] Quadro de IA com números reais (após o #35).

### Documentação
- [x] ADRs do Painel no `docs/DECISOES.md`: escolha dos indicadores, períodos, avaliação, DEC/FEC da área, inadimplência e perdas sem comparação. (27/10)
- [x] Linha do Painel na matriz de integração do `ROADMAP.md`, com aprovação do time. (27/10)
- [x] Registro no `changelog.md` a cada entrega. (27/10)
- [ ] Suposições do Painel separadas para a seção de suposições do README (fechamento).

---

## 9. Definição de pronto
- O diretor entra e, sem trocar de tela, vê os indicadores das cinco áreas, cada um com o valor dos dois períodos, a variação e se melhorou ou piorou.
- Os valores de receita, energia, tarifa e UCs são **idênticos** aos de `/revenue/kpis` nas mesmas janelas.
- Outro perfil recebe 403 na API e não vê o item "Painel" no menu.
- `make lint-all` e `make test-all` passam (Ruff, Pylint, import-linter, pytest, ESLint, Fallow, Vitest e build).
- Decisões registradas em ADR, checklist marcado e changelog atualizado.

---

## 10. Riscos e impedimentos

| Risco | Impacto | O que fazer |
|---|---|---|
| Banco real não chega até 29/10 | Não dá para validar os números | Validar com a seed e com os valores brutos da seção 3; cobrar o Ryei no dia 28. |
| Consultas lentas sobre 2,1 milhões de faturas e leituras | Painel demora a abrir | Medir na etapa 4; usar os índices por competência que a exportação já cria; `staleTime` longo no frontend. |
| Conflito com o #35 no `DashboardPage.tsx` | Merge travado | Combinar com o Miguel que o quadro de IA vai para a página nova. |
| Mudança de menu e rotas (arquivos do João) | Quebrar a navegação de outros perfis | Testes de rota por perfil e revisão do João. |
| Contrato muda no meio do caminho | Retrabalho do Adrian | Contrato fixado na etapa 1; mudanças só combinadas por mensagem e registradas aqui. |
| Números divergentes do diagnóstico | Perda de credibilidade com a banca | Mesmas janelas e mesma fonte de receita; conferir com o Renan antes da apresentação. |

---

## 11. Pendências para confirmar
- [ ] **Adrian (para depois):** revisar o frontend no PR e confirmar o contrato da seção 6, que já foi implementado nesse formato.
- [x] **Banco real:** dump `.db` obtido no Drive em 27/10; será colocado em `backend/v_energy.db` (fora do repositório) na etapa 4.
- [ ] **Miguel (para depois):** o `DashboardPage` antigo foi removido nesta branch. No #35, tirar o `SmartInsightCard` dele; o quadro volta no Painel novo, ligado aos indicadores reais (etapa 7).
- [x] **ADRs:** a `main` tem ADR-006 a ADR-009 (Fatia 01), o Painel usa ADR-010 a ADR-016, e as da Visão 360 foram renumeradas para ADR-017 a ADR-023 (28/10). Não há mais colisão, qualquer que seja a ordem dos merges.
- [ ] **João:** revisão das mudanças em `AppRoutes.tsx` e `navItems.ts`.
- [x] **Time:** autorização para incluir a linha do Painel no `ROADMAP.md` (confirmada em 27/10).

---

## 12. Instruções de Auto-Atualização
1. Antes de iniciar um item, marque `[- Em andamento por <Nome> - YYYY-MM-DD]`.
2. Após implementar, rode `make lint-all` e `make test-all` e marque `[x]`.
3. Registre a entrega em [`changelog.md`](changelog.md). O Adrian registra a parte dele no changelog da pasta dele.

---

## 13. Revalidação com o banco real (2026-10-28)

`v_energy.db` exportado pelas Fatias 01 e 02, em `backend/v_energy.db` (fora do repositório). A Fila de Perdas foi calculada com `LOSS_REFERENCE_COMPETENCIA=2025-08`, como a Fatia 05 documenta para a demonstração.

| Conferência | Resultado |
|---|---|
| Faturamento, energia, tarifa e UCs iguais a `/revenue/kpis` | ✓ idênticos: receita +8,0%, energia −5,1%, tarifa +13,8%, UCs +0,6% |
| Satisfação e leituras estimadas contra os brutos da seção 3 | ✓ 4,1 → 3,9 e 19,0% → 15,9% (−3,1 p.p.) |
| Inadimplência | ✓ 3,55% → 3,60% aparece como "+0,05 ponto percentual · Estável", com o valor vencido em reais logo abaixo (ADR-011) |
| Aviso do temporal de jul/2025 | ✓ 5,2 vezes a média de interrupções, 97% por causa climática; o mês tem 56% das horas sem energia do período atual. Sem ele, as horas ficam próximas às do primeiro ano. |
| Retrato de perdas igual à Fila | ✓ 773 UCs, 244 mil kWh/mês e R$ 2,1 mi/ano recuperáveis; acerto de 62,7% em 1.389 inspeções |
| Acesso | ✓ operação e perdas recebem 403 |
| Tempo de resposta (meta: menos de 2 s) | ✓ períodos padrão em 0,01 s (pré-calculados); outro período em 2,6 s na primeira vez e instantâneo depois (ADR-016). Antes: cerca de 11 s. |

**Achados para o time:**
- **Volume (Renan e Célio, diagnóstico):** a energia faturada cai 5,1% na Gold, e não "quase 4%" como no texto do case. Sem as 3.510 UCs com painel solar, o volume fica estável (−0,2%): a queda inteira vem da geração solar. O Painel usa a mesma consulta da Receita, então os dois mostram −5,1%.
- **Fila de Perdas em tempo real (Adrian):** na competência mais recente (jun/2026), todas as 559 UCs com queda acima de 50% têm painel solar, e a Fila as exclui de propósito. Por isso a demonstração usa `LOSS_REFERENCE_COMPETENCIA=2025-08`. O card de perdas avisa quando a competência está fixada e quando a fila está vazia.
