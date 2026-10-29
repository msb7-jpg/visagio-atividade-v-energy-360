# 🕵️ Fatia 05: Gestão de Perdas, Fila de Fiscalização & Campo (Fullstack)

> **Dono Único:** Adrian Cesar  
> **Status:** Em andamento 
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Fala do Executivo (`atividade.pdf`, pág. 6):
> **Rafael Coutinho · Gerente de Perdas:**  
> *"Minha equipe consegue fazer mais de 200 inspeções por mês, e pouco mais da metade encontra alguma irregularidade. Quero abrir o sistema e ver uma fila das unidades suspeitas, da mais promissora para a menos promissora, com o motivo da suspeita e quanta energia dá para recuperar em cada uma. Dali eu escolho quem vai para campo e gero a ordem de inspeção. Quando a equipe volta, quero registrar ali mesmo o que foi encontrado. Uma lista com mil nomes sem ordem não me serve: cada inspeção que não encontra nada é um dia de equipe perdido."*

### User Stories do Case (`atividade.pdf`, pág. 8):
> - *"• Como gerente de perdas, quero ver as unidades suspeitas ordenadas por prioridade, com o motivo da suspeita e a energia estimada a recuperar."*
> - *"• Como gerente de perdas, quero gerar ordens de inspeção a partir da fila, atualizar o status de cada uma, registrar o resultado encontrado em campo e cancelar as que não forem mais necessárias."*
> - *"• Como gerente de perdas, quero exportar a fila de inspeção para enviar à equipe de campo. (Diferencial)"*
> - *"• Como gerente de perdas, quero subir pelo portal a planilha que a equipe preenche em campo, para que os resultados sejam registrados sem digitação manual. (Diferencial)"*

---

## 2. Escopo Técnico da Fatia (Backend + Frontend + Testes)

### Backend (`backend/app/features/loss_management/`):
- `schemas.py`: Schemas Pydantic (`SuspiciousUnitDTO`, `InspectionOrderCreateDTO`, `InspectionOrderUpdateDTO`, `UploadResultDTO`).
- `repository.py`: Consultas SQL ordenadas por score de risco e kWh a recuperar, CRUD de ordens de fiscalização.
- `service.py`: Lógica Pure Python do fluxo de status (`gerada`, `pendente`, `concluida`, `cancelada`), streaming de exportação CSV/XLSX e parser de planilha multipart com atualização transacional no SQLite.
- `router.py`: Rotas REST:
  - `GET /api/v1/losses/suspicious-units`
  - `GET /api/v1/losses/inspections`
  - `POST /api/v1/losses/inspections`
  - `PATCH /api/v1/losses/inspections/{id_inspecao}`
  - `GET /api/v1/losses/inspections/export` (Diferencial)
  - `POST /api/v1/losses/inspections/upload` (Diferencial)

### Frontend (`frontend/src/features/loss_management/`):
- `LossManagementPage.tsx`: Container com abas para Fila de Suspeitas e Ordens em Campo ($\le 150$ linhas).
- `hooks/useLossManagementController.ts`: Hook headless controlando queries e mutações com travamento de botão (`isPending`).
- `components/SuspiciousUnitsTable.tsx`: Tabela com ranking de UCs suspeitas e botão de gerar OS.
- `components/InspectionOrderModal.tsx`: Modal para abertura de ordem de fiscalização.
- `components/InspectionStatusBadge.tsx`: Badges semânticos de status.
- `components/InspectionUploadModal.tsx`: Componente de drag & drop para subir planilha de campo preenchida com resumo de conciliação (Diferencial).
- `components/ExportInspectionButton.tsx`: Botão de download da lista de campo em CSV/XLSX (Diferencial).

#### 🧩 Componentes do Design System Recomendados (`@/components/ui/` & `@/components/feedback/`):
- **Alternância de Visões:** `<Tabs>` e `<TabsList>` / `<TabsTrigger>` para navegar entre a *Fila de Suspeitas de Perdas* e as *Ordens de Fiscalização Ativas*.
- **Tabela de Auditoria:** `<Table>` com `<TableHeader>`, `<TableRow>` e `<TableCell>` para listar UCs sob suspeita de fraude/defeito de medição com ordenação por kWh estimado.
- **Badges Semânticos:** `<Badge variant="destructive">` para risco crítico/anomalia grave, `<Badge variant="outline">` para inspeção pendente e `<Badge variant="secondary">` para ordem concluída.
- **Modais de Ação:** `<Dialog>` para formulário de abertura de ordem de fiscalização (`InspectionOrderModal`) e para drag & drop de planilha Excel de retorno de campo (`InspectionUploadModal`).
- **Confirmação Crítica:** `<AlertDialog>` para confirmação de cancelamento irreversível de ordens de inspeção em andamento.
- **Campos de Observação:** `<Textarea>` para parecer técnico e anotações do laudo da equipe de campo.
- **Tooltips Explicativos:** `<Tooltip>` de `@/components/ui/tooltip-card` detalhando o motivo do score de fraude (ex: queda súbita > 50% sem aviso prévio).
- **Feedback & Estados Vazios:** `<LoadingSkeleton count={5} />` durante carregamento e `<EmptyState title="Nenhuma ordem pendente">` quando a fila estiver limpa.

---

## 3. Checklist Operacional de Execução

- [x] Criar pasta `backend/app/features/loss_management/` com schemas, repositório, serviço e rotas CRUD.
- [x] Implementar endpoint de exportação de dados em CSV/XLSX. (somente CSV, Fase 5; o `atividade.pdf` não define o formato e o XLSX não foi implementado)
- [x] Implementar endpoint multipart de upload de planilha com validação e conciliação no banco.
- [x] Registrar rotas em `backend/app/api/v1/router.py`.
- [x] Criar testes unitários e de integração em `backend/tests/test_loss_management_service.py` e `test_loss_router.py`.
- [x] Garantir conformidade com `make lint-backend`.
- [x] Criar pasta `frontend/src/features/loss_management/` com componentes $\le 150$ linhas.
- [x] Implementar modal de upload drag-and-drop e botão de exportação.
- [x] Adicionar rota `/losses` em `frontend/src/routes/AppRoutes.tsx`.
- [x] Criar testes no frontend com Vitest em `components/__tests__/LossManagementPage.test.tsx` (7 cenários).
- [x] Garantir conformidade com `make lint-frontend`.

---

## 3.1 Ordem de Desenvolvimento (definida em 2026-10-20)

> [!IMPORTANT]
> Siga as fases **em ordem**. Ao fechar cada fase: `make lint-all` + `make test-all` verdes → commit → registro no [`changelog.md`](changelog.md).
> Prioridade: **obrigatórios do PDF primeiro, diferenciais depois** ("qualidade acima de quantidade", `atividade.pdf` §7).

### Fase 0 — Alinhamentos com outras fatias (sem código)
- [x] Confirmar com **Renan** que `fato_medicao.competencia` sai como `'YYYY-MM'` (o checklist dele também cita `MM/YYYY` na `dim_calendario`; o backend de perdas assume `YYYY-MM`). (Conferido no `v_energy.db` real em 2026-10-28: 2.152.336 de 2.152.336 linhas em `YYYY-MM`, de 2022-07 a 2026-06. Verificado na base, não por resposta do Renan; a `dim_calendario` não foi conferida.)
- [x] Confirmar com **Ryei** as colunas de `fato_inspecoes_perdas` (`id_inspecao`, `id_uc`, `data_inspecao`, `irregularidade_constatada`, `tipo_irregularidade`, `kwh_recuperado`). (Conferido no `v_energy.db` real em 2026-10-28: as seis colunas existem, mais `id_inspetor`. Verificado na base, não por resposta do Ryei.)

### Fase 1 — ⚠️ Script PROVISÓRIO de dados de desenvolvimento
> [!WARNING]
> **PROVISÓRIO — NÃO é a camada Gold e NÃO faz parte da entrega de dados.** Existe apenas para desenvolver e demonstrar a fatia 05 enquanto as Fatias 01 (Renan) e 02 (Ryei) não exportam a Gold para o `v_energy.db`. Deve ser **removido** na Fase 7.
>
> **Somente local:** o script de seed fica apenas na máquina do Adrian (ignorado via `.git/info/exclude`) e **não é versionado** neste repositório nem enviado no PR.
- [x] Criar (localmente) um script de seed, lendo `data/landing/` e gerando no `v_energy.db` **somente** as tabelas consumidas pela fatia, com **as colunas exatas dos contratos** dos colegas:
  - `dim_unidade_consumidora` e `fato_medicao` (contrato Renan) e `fato_inspecoes_perdas` (contrato Ryei).
- [x] Regras de segurança: **nunca sobrescrever** tabela já existente (se a Gold real já estiver lá, o script aborta); limpeza mínima (tipos, datas, resultado normalizado); cabeçalho e logs com o aviso "PROVISÓRIO".
- [x] Não incluir no `make test-all` (testes continuam com fixtures sintéticas).
### Fase 2 — Ajustes de backend exigidos pela fala do Gerente de Perdas
- [x] Excluir da fila UCs com ordem **concluída** recentemente (hoje só as ativas são excluídas; a UC volta à fila após a inspeção → "dia de equipe perdido"). Regra: ordem concluída dentro da janela de análise (15 meses) exclui; cancelada devolve a UC à fila.
- [x] Excluir da fila UCs já inspecionadas no histórico (`fato_inspecoes_perdas`). Mesma janela: inspeção a partir do início da janela de análise exclui a UC.
- [x] `limit` padrão = **200** (capacidade mensal citada: "mais de 200 inspeções por mês").
- [x] Filtro por **bairro** além de município e classe.
- [x] Testes cobrindo cada regra.

### Fase 2.1 — Correções da revisão de 2026-10-21
- [x] `POST /inspections` valida a UC no cadastro (404 se não existir) e calcula `kwh_estimado` no servidor com a mesma regra da fila; UC sem suspeita, com GD ou sem leitura recente gera ordem manual com 0 kWh.
- [x] Fila funciona sem `fato_inspecoes_perdas` (sem excluir o histórico de campo), avisando que o histórico não foi aplicado. (resposta passou a ser o envelope `{itens, avisos}`; banner na aba da fila)
- [x] Remover a dupla contagem da queda na prioridade (`score × kWh` ≈ queda² × base). (fila ordena por kWh a recuperar; score só desempata)
- [x] Ordens fora do `v_energy.db` (ou garantia do pipeline de que a exportação não recria o arquivo). (Decisão: `ordem_inspecao` fica no `v_energy.db`; o padrão de exportação da skill `medallion-lakehouse-pipeline` §5 grava cada tabela Gold com `if_exists="replace"` e não recria o arquivo. Confirmar a premissa com Renan e Ryei na Fase 0.)
- [x] Prioridade pela taxa histórica de acerto: a fila ordena por kWh esperado (kWh a recuperar × taxa de acerto do sinal) e o score só desempata. (taxas 0,93 para queda súbita e 0,627 geral para leitura zerada isolada; a de leitura zerada ainda não foi medida)
- [x] Consumo negativo ignorado na fila: leituras com `consumo_kwh < 0` (troca de medidor ou sinal invertido na origem) não entram nas médias. Na base bruta, 81 de 81 UCs da fila vinham dessas leituras.
- [x] Competência de referência configurável para a demonstração (`LOSS_REFERENCE_COMPETENCIA`, formato `YYYY-MM`; ausente = competência mais recente): a fila e o kWh das novas ordens usam os dados até essa competência, só as inspeções feitas até o fim dela excluem a UC, e a tela mostra o aviso "Competência de referência fixada". Com `2025-08` nos dados do case, a fila tem 200 UCs e o top 200 acertou 94,9% (198 conciliadas, 188 irregulares).
- [x] Tarifa real de `fato_faturamento` no valor a recuperar. (Passo 12, Fase 14.4: tarifa média ponderada dos últimos 12 meses, sem depender da resposta da Fatia 02.)

### Fase 3 — Conformidade com `backend-coding-standards`
- [x] Docstrings Google-style nos métodos públicos (repositório, serviço, rotas, fábrica de DI). Também em `queries.py` e `scoring.py`.
- [x] Mover a montagem de `SuspicionFilters` (limiar de 50%) do repositório para o serviço. (antecipado na Fase 2: serviço recebe `SuspiciousUnitsFilterDTO` e monta os filtros)
- [x] Serviço sem manipular o ORM diretamente (`repository.update_order(id, changes)`). Repositório devolve só DTOs (`to_order_dto`); serviço não importa nem toca o modelo ORM.
- [x] Decompor expressões aninhadas (`scoring.py`, `queries.py`, `service.py`).

### Fase 4 — Frontend obrigatório (as 2 user stories)
- [x] `LossManagementPage` com abas "Fila de Suspeitas" e "Ordens em Campo" + rota `/losses`.
- [x] Fila: ranking, motivo (badges), kWh/R$ a recuperar, filtros (município, bairro, classe), botão "Gerar ordem".
- [x] Ordens: lista com status, avançar status, registrar resultado de campo, cancelar com justificativa (`AlertDialog`).
- [x] Estado vazio explicativo na fila (com os dados atuais a fila pode vir vazia — ver Fase 8).
- [x] Testes Vitest + `make lint-frontend`.

### Fase 5 — Diferencial: exportar a fila para a equipe de campo
- [x] `GET /api/v1/losses/inspections/export` (CSV) com as ordens `gerada`/`pendente` — o que de fato vai a campo — incluindo `id_inspecao` e colunas em branco para o resultado.
- [x] Botão "Exportar para campo" no frontend. (na aba "Ordens em Campo", onde as ordens exportadas são listadas)

### Fase 6 — Diferencial: upload da planilha preenchida em campo
- [x] `POST /api/v1/losses/inspections/upload` (multipart `.xlsx`/`.csv`), conciliando pelo `id_inspecao` do arquivo exportado na Fase 5.
- [x] Normalizar a bagunça real de campo (ref. `inspecoes.xlsx`): variações de `resultado` ("CONFIRMADA", "irregularidade confirmada", "NADA CONSTA"), datas (`2025-08-01`, `14.08.2025`, `09-01-2025`), decimais com vírgula, múltiplas abas.
- [x] Retornar `UploadResultDTO` (conciliadas, rejeitadas com motivo, kWh total) sem abortar o lote por uma linha inválida.
- [x] Modal drag-and-drop no frontend.
- [x] Correção: datas com hífen (`NN-NN-AAAA`) são mês-dia-ano, como no `inspecoes.xlsx` real (46 datas lidas corretamente; antes 33 eram rejeitadas e 12 viravam a data errada).
- [x] Upload aceita o formato real do campo (`inspecoes.xlsx`): apelidos `data`, `resultado` e `inspetor`; quando o `id_inspecao` não é um id do portal (ex.: `IN0000007`), a linha casa pela ordem ativa da `id_uc`. Com ordens ativas, as 1.389 linhas reais são conciliadas.

### Fase 7 — Troca do provisório pela Gold real
> A equipe de dados enviou o `backend/v_energy.db` real (Gold). Conferência feita em 2026-10-27; detalhes no `changelog.md`.
- [x] Seed local da Fase 1 sem resíduos: o `v_energy.db` real só tem as tabelas da Gold e a `ordem_inspecao` (nenhuma tabela marcada `_seed_provisorio_fatia05`); o `v_energy_dev.db` é só da Visão 360.
- [x] Fila rodada contra os dados reais e números conferidos: 45.000 UCs, 2.152.336 medições (2022-07 a 2026-06), 1.389 inspeções (871 irregulares, 62,7%). Fila em tempo real (2026-06): **0 UCs** (as 559 quedas ≥ 50% são todas de UCs com GD, que a regra exclui); com a competência fixada em 2025-07: **827 UCs**, top 200 com **94,6%** de acerto nas inspeções dos 3 meses seguintes.
- [x] Taxa geral 0,627 confirmada (871/1.389). Taxa da queda súbita (0,93): o backtest na Gold real dá 91 a 95% por competência, então a constante segue defensável.
- [x] Tarifa: definida na P4 como `valor_total_rs / consumo_faturado_kwh` dos últimos 12 meses (R$ 0,7876/kWh); as medidas de 0,774 e 0,561 foram descartadas. Ver `DECISOES_PERDAS.md` D8.
- [ ] Remedir na Gold real os números que ainda vêm do seed: limiar de 50% (92,6%, D2), exclusão de GD (3,2%, D3) e a taxa da leitura zerada isolada (usa a geral).

### Fase 11 — Fila classificada (2026-10-27)
> Pedido do dono da fatia: em vez de cortar a fila no limiar de 50%, classificar as UCs e deixar a chance de acerto por faixa mostrar o quanto cada uma vale a inspeção. Detalhes no `changelog.md`.
- [x] `queda_moderada` (queda de 20% a 50%) entra na fila com chance de acerto por faixa: 0,42 (30% a 50%) e 0,07 (20% a 30%); a queda súbita (50% ou mais, 0,93) continua no topo.
- [x] Testes escritos antes (TDD), front com o novo motivo e filtro, `tests/conftest.py` isolando o `.env`.
- [x] No `v_energy.db` real, a fila em tempo real (2026-06) passa de 0 para 165 UCs; backtest de 2025-07 mantém 94,9% de acerto no top 200.
- [x] Conferir a tela no navegador com a fila classificada. (Adrian César, 2026-10-29; achados corrigidos no mesmo dia, ver `changelog.md`: selo da coluna Situação em uma linha e score igual com ou sem filtro territorial.)
- [x] Meses de queda generalizada: queda normalizada pela mediana da carteira. (Fase 15.4: calibra a chance de acerto; a entrada na fila segue pela queda bruta.)
- [x] Paginação (`offset`) além das 500 UCs da API. (Fase 15.5)

### Fase 8 — Documentação e suposições (README / changelog)
> Tudo abaixo está documentado em [`docs/DECISOES_PERDAS.md`](../../DECISOES_PERDAS.md) (decisão, impacto e conformidade).

- [x] Taxa real de acerto das inspeções nos dados: **62,7%** (a fala cita "pouco mais da metade"). (§1 do documento)
- [x] Limiar de queda ≥ 50%: **92,6%** de acerto nas inspeções históricas com esse sinal (770 casos); a faixa de 40 a 50% já acerta 64,9%, então o limiar é conservador. (D2)
- [x] Exclusão de UCs com GD: **3,2%** de acerto nas 31 inspeções em UCs com painel solar. (D3)
- [x] Fila quase vazia na competência mais recente (2026-06) é esperada: a onda de quedas de meados de 2025 já foi inspecionada. (D9)
- [x] Fórmula da energia estimada a recuperar (déficit mensal × 3 meses) como suposição. Medido: o recuperado foi 1,87× o estimado (mediana), com correlação de 0,87. (D7)

### Fase 9 — Nova tela "Fila de Inspeção" (desenho de 2026-10-24)
> Referência visual: [`assets/fila-inspecao-escuro.png`](assets/fila-inspecao-escuro.png) e [`assets/fila-inspecao-claro.png`](assets/fila-inspecao-claro.png) (mesmo layout, temas escuro e claro). Branch: `feat/fatia-05-fila-inspecao-nova-tela`.
- [x] **Fase 9.0:** mover as imagens para `assets/` e abrir esta seção.
- [x] **Fase 9.1 — Backend (TDD):** contrato da fila (`score` 0 a 100, `kwh_mes_recuperavel`, `valor_ano_rs`, `situacao`), UCs com ordem ativa na fila como `ordem_gerada`/`em_campo`, filtros `motivo` e `score_minimo`, `GET /losses/queue-summary` (capacidade, energia das selecionadas, retorno esperado, taxa histórica) e `GET /losses/queue-filters`.
- [x] **Fase 9.2 — Frontend, dados:** tipos, `lossApi`, query options, `useQueueSelection` e geração de ordens em lote.
- [x] **Fase 9.3 — Frontend, UI:** cards de resumo, filtros em select, barra de ações, tabela priorizada (barra de score, chips de motivo, situação) e abas com contadores.
- [x] **Fase 9.4 — Testes Vitest** da nova tela.
- [x] **Fase 9.5 — Validação:** `make lint-all`, `make test-all`, conferência visual contra as imagens e registro no changelog.
- [x] **Fase 9.6 — Quadro de ordens (2026-10-26, Adrian César):** quadro de 4 colunas sobre a API real; pendências (Playwright, capturas, token `success`, alvo de 44 px) registradas no `changelog.md`.
- Fora desta entrega (decisão em aberto): motivos novos do desenho (abaixo dos vizinhos, leituras estimadas, irregularidade confirmada antes), "Ver acerto por inspetor" (Fatia 07) e distribuição por inspetor.

### Fase 10 — Alinhamento ao novo design (tokens e componentes, 2026-10-27)
- [x] **10.1 — Tokens:** `index.css` com os valores hex de `tokens-claro.png`/`tokens-escuro.png` (`:root` claro, `.dark` escuro), escala de tipo 12–30 px, raio base de 8 px e `shadow-sm`; `design.md` atualizado. (Adrian César, 2026-10-27)
- [x] **10.2 — Componentes existentes alinhados** a `componentes-*.png`: `EmptyState`, `LoadingSkeleton`, `Badge` (tint de 15% e variantes `accent`/`muted`), `SidebarNav`, `AppLayout`. (Adrian César, 2026-10-27)
- [x] **10.3 — `StatusBadge`** (`fatura`, `ordem`, `leitura`) ligado à Fila de Inspeção. Código morto `InspectionStatusBadge` e `STATUS_LABELS` removidos. (Adrian César, 2026-10-27)
- [x] **10.4 — `ErrorState`** em `AsyncState` e `ErrorBoundary`. (Adrian César, 2026-10-27)
- [x] **10.5a — Conferência visual nos dois temas** da Fila de Inspeção, painel de detalhe, quadro de ordens e diálogos de importar e gerar ordens: contraste AA medido em todos os textos visíveis; 1 falha (selo "Pendente" no claro, 4,44:1), ver `changelog.md`. (Adrian César, 2026-10-29)
- [x] **10.5b — Pendências com outros donos registradas em `docs/CORRECOES.md`** (Adrian César, 2026-10-29): `onRetry` na Visão 360 (seção 5), na Inteligência Comercial (7) e na Qualidade da Rede (8, seção nova); `PAYMENT_STATUS` da Visão 360 para o `StatusBadge` (5); `KpiCard`, `DeltaBadge`, `DataTable` e `FilterBar` sem dono (9). A correção é de cada responsável.
- [ ] **10.5c — Selo "Pendente" no tema claro** abaixo do AA (4,44:1; `--warning` `#8A5A00` sobre o tint de 15% em fundo cinza). Decidir com o design se escurece o token.

### Fase 12 — Fila em duas faixas (2026-10-27)
- [x] **12.1 — Abas Prioritárias, Baixa chance e Todas** na Fila de Inspeção (`QueueBandTabs`, `queueBands.ts`), acima da tabela e com contagem, corte de 30% de chance de acerto e "Selecionar top 10 prioritárias" só entre as prioritárias. Decisão D11 em `docs/DECISOES_PERDAS.md`. (Adrian César, 2026-10-27)
- [ ] **12.2 — Pendências com a equipe:** prazo de reincidência para UC com irregularidade constatada e autorização de um piloto de inspeção fora da fila.

### Fase 13 — Filtros da fila enxutos (2026-10-27)
- [x] **13.1 — Remover o filtro "Score mínimo"** da Fila de Inspeção: as abas por chance de acerto já cortam a fila. A explicação do score passa para o cabeçalho da coluna. Backend (`score_minimo`) fica por compatibilidade. (Adrian César, 2026-10-27)

### Fase 14 — Painel de detalhe da UC (2026-10-28)
- [x] **14.1 — Passo 8: `Sheet` de detalhe da UC** na Fila de Inspeção (`UnitDetailSheet`, `UnitDetailBody`, `UnitScoreCalculation`, `UnitConsumptionChart`, `PriorInspectionsList`, `useUnitDetailQuery`). Abre por clique ou Enter na linha; mostra motivo, conta do score, consumo de 12 meses (mês sem leitura = lacuna) e inspeções anteriores; carregando, erro com "Tentar novamente" e vazio; "Gerar ordem desta UC" reaproveita o diálogo de lote e não aparece para o `diretor`. (Adrian César, 2026-10-28)
- [x] **14.2 — Captura em modo escuro** (`assets/fila-inspecao/14-detalhe-da-uc-modo-escuro.jpg`) e **retorno de foco à linha** ao fechar (Esc e botão X) conferidos no navegador. (Adrian César, 2026-10-29)
- [ ] **14.2b — Pendência:** passo 10 em diante não iniciado.
- [x] **14.3 — Passo 9: diálogos de campo com lista** (`InspectorField`, `RegisterResultDialog`, `CancelOrderDialog`, `DispatchOrderDialog`, `apiFieldErrors`, `cancellationReasons`). Inspetor (lista da API, busca acima de 15), data dd/mm/aaaa sem data futura e motivo de cancelamento em lista; erros 422 ao lado do campo sem fechar o diálogo; cartão do quadro mostra inspetor, data e motivo. (Adrian César, 2026-10-28)
- [x] **14.4 — Passo 12: tarifa média calculada da base (P4).** `valor_total_rs / consumo_faturado_kwh` de `fato_faturamento` nos últimos 12 meses (R$ 0,7876/kWh em 2025-07 a 2026-06), com cache por dia; `tarifa_rs_kwh` e o período no resumo; texto de apoio no cartão; sem tarifa de reserva. Registrado em `changelog.md`. [Concluído por Adrian Cesar - 2026-10-28]

### Fase 15 — Conferência com a fala do gerente de perdas (2026-10-28)
> Correção de 2026-10-29: conferência dos dados por UC achou o histórico curto (D14); ver 15.6.
> Plano de melhora a partir da conferência da fala de Rafael Coutinho (`atividade.pdf`, pág. 6) com o sistema.
- [x] **15.1 — Consistência:** painel do diretor passa a usar o mesmo limiar da fila (20%), com teste; `DECISOES_PERDAS.md` D8 e D9 atualizados (tarifa calculada, funil de 45.000 para 165 UCs) e pendências de tarifa fechadas. (Adrian César, 2026-10-28)
- [x] **15.2 — Honestidade na tela:** aviso "N UCs prioritárias para uma capacidade de 200 inspeções por mês" (`QueueCapacityNotice`), expectativa da seleção "cerca de X de N inspeções devem achar irregularidade" e aviso de baixa chance, na barra de ações e no diálogo de geração (`SelectionOutlookNote`, `queueOutlook.ts`). Só frontend; nada bloqueia a decisão do gerente. (Adrian César, 2026-10-28)
- [x] **15.3 — Motivo e valor mais úteis:** a frase do motivo no painel de detalhe traz a faixa de queda e a taxa de acerto da faixa ("Na faixa de queda de 30% a 50%, 42% das inspeções históricas acharam irregularidade"), calculada no backend (`drop_band_label`); o cartão da energia recuperável avisa que a estimativa de 3 meses ficou abaixo do recuperado (1,87×, D7). Sem coluna Motivo na tabela: as 165 UCs têm o mesmo motivo e o teste "não repete o motivo em cada linha" é uma decisão anterior. (Adrian César, 2026-10-28)
- [x] **15.4 — Mais sinais, com evidência:** medição feita em 2026-10-28 e registrada em `DECISOES_PERDAS.md` D12.
  - [x] GD remedido na Gold real: 1 de 31 (3,2%), a exclusão continua. Queda de 50% ou mais remedida: 92,6%.
  - [x] Leitura zerada: não mensurável, a Gold real não tem leituras com consumo zero. Reincidência: não mensurável, nenhuma UC foi inspecionada duas vezes.
  - [x] Queda normalizada pela mediana da carteira (decisão do dono da fatia em 2026-10-28): chance da `queda_moderada` de 91,5% (queda além da carteira de 20% ou mais) e 7,6% (abaixo), medida na população da fila. A entrada na fila não mudou; na fila de 2026-06 são 31 UCs fortes e 134 fracas. Backend: `normalized_drop_ratio`, `hit_rate.py`, `portfolio_repository.py`. Pendência 15.4: prazo de reincidência (sem dado).
- [x] **15.5 — Escala e validação (2026-10-28):**
  - [x] Paginação no servidor: `offset` em `GET /losses/suspicious-units` (a lista passa de 200 UCs e do teto de 500 por página) e botão "Carregar mais UCs" na Fila de Inspeção; a ordem, as abas e a seleção valem sobre tudo o que foi carregado. O `total` continua sendo o da fila inteira.
  - [x] Protocolo do piloto fora da fila escrito em `DECISOES_PERDAS.md` D13 (estratos medidos, amostra de cerca de 150, critério de decisão). **A execução depende de autorização do gerente de perdas e da equipe de campo e fica fora da entrega de 04/11.**
- [x] **15.6 — Histórico mínimo (2026-10-29):** a conferência dos números de cada UC (caso UC106967) mostrou que 25 das 31 UCs fortes eram ligações recentes (menos de 11 meses de base), fora da população em que a taxa de 91,5% foi medida. `MESES_BASE_MINIMO` = 11: abaixo disso a chance não passa de 7,6%, a linha mostra "Ligação recente: base de N meses", o cabeçalho "Queda" explica que são médias e a frase do detalhe avisa. Fila forte real: 7 UCs. `DECISOES_PERDAS.md` D14. (Adrian César)

---

## 4. Telas Concretas, Comportamentos & Contratos de Integração (Fatia 05)

> [!NOTE]
> A fundamentação completa de negócio e a Matriz 5W2H canônica deste domínio estão centralizadas em [`docs/planning/DOMINIO_NEGOCIO_5W2H.md`](../DOMINIO_NEGOCIO_5W2H.md).

### 4.1 Especificação Concreta de Tela, Layout e Comportamentos (Zero Abstração)
1. **Abas de Controle Superior (`<Tabs defaultValue="suspects">`):**
   - Aba 1: **"Fila de Suspeitas de Perdas"** (foco analítico e geração de OS).
   - Aba 2: **"Ordens de Inspeção em Campo"** (foco operacional, baixa de resultados e cancelamento).
2. **Aba 1: Fila de Suspeitas (`SuspiciousUnitsTable.tsx`):**
   - **Barra de Ações do Topo:**
     - Botão primário: *"Exportar Fila para Campo (CSV/XLSX)"* (baixa o arquivo pronto para despacho das equipes).
     - Filtro por Município, Bairro e Classe tarifária.
   - **Tabela com Ordenação Decrescente por Valor Esperado:**
     - Coluna 1: ID da UC (ex: `UC-04912`).
     - Coluna 2: Município e Bairro.
     - Coluna 3: Classe (B1, B3, A4).
     - Coluna 4: Motivo da Suspeita (Badges semânticos: `<Badge variant="destructive">Queda Súbita > 50%</Badge>`, `<Badge variant="outline">Leitura Zerada sem Desligamento</Badge>`, `<Badge variant="secondary">Anomalia Territorial</Badge>`).
     - Coluna 5: Energia Estimada a Recuperar (kWh e R$).
     - Coluna 6: Ação: Botão `<Button size="sm">Gerar Ordem de Serviço</Button>`.
     - Comportamento: Ao clicar, abre `<Dialog>` confirmando a abertura da OS e alterando a UC de "Suspeita" para "Em Fiscalização", movendo-a para a Aba 2.
3. **Aba 2: Ordens em Andamento e Retorno de Campo:**
   - **Barra de Ações:**
     - Botão secundário: *"Upload de Planilha de Retorno de Campo"* (abre `InspectionUploadModal.tsx`).
   - **Tabela de Ordens Ativas:**
     - Colunas: Número da OS, ID da UC, Data de Abertura, Fiscal Responsável, Status (`<Badge>`: Gerada, Em Campo, Concluída, Cancelada).
     - Ação 1 (Registrar Retorno Manual): Botão abre modal para registrar:
       - Irregularidade constatada? (Select: Sim / Não).
       - Tipo de fraude: (Gato na rede aérea, by-pass no medidor, shunt, medidor quebrado).
       - Energia recuperada apurada (kWh numérico) e número do TOI lavrado.
     - Ação 2 (Cancelar OS): Botão abre `<AlertDialog>` com alerta crítico: *"Deseja realmente cancelar esta inspeção? Justifique o cancelamento"*, exigindo preenchimento de `<Textarea>` antes de confirmar.
4. **Modal de Upload de Planilha (`InspectionUploadModal.tsx`):**
   - Componente de Drag & Drop para arquivos `.xlsx` e `.csv`.
   - Comportamento no backend: Processamento multipart em bloco transacional. Se uma linha tiver dados corrompidos, a transação não quebra: retorna um sumário estruturado (`UploadResultDTO`):
     - *"42 ordens conciliadas com sucesso"*.
     - *"3 ordens com erro de validação (IDs não encontrados)"*.
     - *"Total de kWh recuperado registrado: 68.450 kWh (+R$ 58.182,50)"*.

### 4.2 Contratos de Integração da Fatia ("Quem Cria vs Quem Pluga")
- **O que Adrian Cesar ENTREGA para os outros colegas:**
  - Rota de frontend `/losses` no `AppRoutes.tsx`.
  - Componente de página `LossManagementPage.tsx`.
  - Endpoints REST `/api/v1/losses/suspicious-units`, `/inspections`, `/inspections/{id}`, `/export`, `/upload`.
  - Dados consolidados de estimativa de perdas não técnicas para o relatório `docs/DIAGNOSTICO_RECEITA.md` de Célio.
- **O que Adrian Cesar RECEBE dos outros colegas:**
  - **De Renan (Fatia 01):** Consulta `dim_unidade_consumidora` e `fato_medicao` (para identificar quedas abruptas de kWh sem GD solar) no SQLite `v_energy.db`.
  - **De Ryei Estevan (Fatia 02):** Consulta o histórico passado de vistorias em `fato_inspecoes_perdas` no SQLite `v_energy.db`.
  - **De João Henrique (Fatia 06):**
    - Aplica a proteção de acesso no router FastAPI:  
      `dependencies=[Depends(require_role([UserRole.PERDAS, UserRole.DIRETORIA, UserRole.ADMIN]))]`
    - Renderiza a página dentro do `<AppLayout>`.

---

## 5. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Adrian Cesar - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).


