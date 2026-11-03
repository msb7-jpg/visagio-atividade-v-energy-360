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
- [x] Remedir na Gold real os números que ainda vêm do seed: limiar de 50% (92,6%, D2), exclusão de GD (3,2%, D3) e a taxa da leitura zerada isolada (usa a geral). Feito na Fase 15.4 (D12, 2026-10-28): 50% e GD confirmados; a leitura zerada não é mensurável (0 leituras zeradas na Gold real) e segue como suposição.

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
- [x] **README da Fatia 05** (seção "Suposições e Demonstração por Fatia"): como a fila é montada, passo a passo da demonstração com `LOSS_REFERENCE_COMPETENCIA="2025-09"`, tabela de suposições e limites. (Adrian César, 2026-10-29)
- [x] **Causa da fila de 39 mil UCs** (`2025-09`) no README, em uma frase no passo a passo da demonstração (a carteira inteira perdeu consumo em 2025; o que vale é o topo), com a medição no D9. O roteiro de perguntas e respostas para a banca foi escrito e depois removido do README, por ser fala de apresentação e não documentação. Sem mudança na tela. (Adrian César, 2026-10-29)
- [x] **Decisões de 2026-10-29 registradas** em `DECISOES_PERDAS.md`: competência da demonstração (D9), score sem efeito dos filtros territoriais (D15), D4 e seção 5 corrigidos; contraste do `--warning` em `design.md`. (Adrian César, 2026-10-29)

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
- [x] **10.5c — Selo de aviso no tema claro abaixo do AA** (4,44:1 no "Pendente"; 4,09:1 sobre `--accent`): `--warning` claro de `#8A5A00` para `#7F5200` (mínimo 4,61:1 em todas as superfícies), com teste de contraste dos dois temas. O `--chart-4` segue `#8A5A00`. (Adrian César, 2026-10-29)

### Fase 12 — Fila em duas faixas (2026-10-27)
- [x] **12.1 — Abas Prioritárias, Baixa chance e Todas** na Fila de Inspeção (`QueueBandTabs`, `queueBands.ts`), acima da tabela e com contagem, corte de 30% de chance de acerto e "Selecionar top 10 prioritárias" só entre as prioritárias. Decisão D11 em `docs/DECISOES_PERDAS.md`. (Adrian César, 2026-10-27)
- [ ] **12.2 — Pendências com a equipe:** autorização de um piloto de inspeção fora da fila (D13). O prazo de reincidência foi fechado abaixo.
  - [x] **Prazo de reincidência: decisão adotada pelo dono da fatia (Adrian César, 2026-11-02), sem validação do gerente de perdas:** prazo de **12 meses** após a conclusão da ordem com irregularidade confirmada, com a UC fora da fila nesse período. Exceção: nova queda súbita (50% ou mais) depois da regularização antecipa o retorno. UC inspecionada sem irregularidade segue a janela atual de 15 meses. Justificativa: 12 meses cobrem um ciclo sazonal completo, ficam abaixo dos 15 da janela atual e combinam com `MESES_BASE_MINIMO` = 11. **Sem evidência na base** (nenhuma UC foi inspecionada duas vezes, D12), então é uma suposição declarada, não uma medição. Medida na Gold real, a regra não muda a fila de hoje (163 UCs) e, em 2025-12, devolve 9 UCs coladas no limiar de 50%. Detalhe em `DECISOES_PERDAS.md` D11.

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

### Fase 16 — Regras da fila após a revisão de 2026-10-31
- [x] **16.1 — Cancelamento por motivo (2026-10-31):** ordem cancelada por `cliente_regularizou` ou `endereco_nao_localizado` mantém a UC fora da fila por 90 dias; `ordem_duplicada`, `repriorizacao_equipe` e `outro` devolvem a UC na hora. Backend: `queue_query.py` (`_blocking_cancellations_query`, `CANCELLATION_BLOCK_DAYS`). Frontend: o diálogo de cancelar avisa o efeito conforme o motivo (`describeQueueEffect`). `DECISOES_PERDAS.md` D4 e `fila-inspecao-decisoes.md` P14 atualizados; a ficha da UC bloqueada responde 404 (teste em `test_loss_unit_detail.py`). (Adrian César, 2026-10-31)
- [x] **16.1b — Conferência (2026-10-31):** aviso do diálogo conferido no navegador para os 5 motivos; efeito na fila e na ficha conferido pela API numa cópia do banco (163 → 162 ao cancelar por `cliente_regularizou`; 162 e ficha 200 por `repriorizacao_equipe`). O efeito na fila não foi visto na tela. Coluna do quadro de ordens com altura máxima e rolagem interna (`OrderBoardColumn.tsx`). (Adrian César, 2026-10-31)
- [ ] **16.2 — Pendências levantadas na revisão, não iniciadas:** contagem por motivo no filtro (a base só tem `queda_moderada`), cache do ranking (medir o tempo de `GET /suspicious-units` antes), endpoint de geração de ordens em lote atômico, seleção por território, autor da alteração em `PATCH`/upload e prévia da importação (`dry_run`).

### Fase 17 — Nova Fila de Inspeção (mockups A e B, 2026-11-02)
Fonte: `A-visao-gerente-de-perdas-fila.png` e `B-gerar-ordem-no-detalhe.png`. **Escopo (decisão de 2026-11-02): só o visual.** Dados, números e textos dos mockups são ilustrativos e ficam de fora; a tela segue com os dados e textos reais já existentes (conferidos contra `v_energy.db`: o mockup traz UCs, chances de 42,3% e situações que não existem na base).
- [x] **17.1 — Backend do detalhe (2026-11-02): descartado.** Foram feitos e testados `posicao`, `kwh_esperado_mes`, `maior_kwh_esperado_mes_fila` e `filtros_aplicados`, mas eram dados e texto do mockup; com o escopo só visual nada na tela os usa, e a alteração foi desfeita no mesmo dia. O backend está como no último commit. Achado que vale guardar: a janela de recuperação é 3× o déficit mensal, então a ordem e o score não dependem de mostrar o kWh esperado por mês ou por janela.
- [x] **17.2 — Faixa de seleção (2026-11-02):** `SelectionStrip` (N selecionadas, kWh/mês e R$/ano, retorno esperado, selo de baixa chance, "Limpar seleção") alimentada só pelo `queue-summary` real; sem resumo mostra só a contagem. Substitui `SelectionSummary` (removido). **`QueueSummaryCards` fica até o 17.3**, quando as pílulas de taxa e tarifa o substituem; até lá a energia aparece nos dois. Testes: `SelectionStrip.test.tsx` (7) e um de integração em `SuspiciousQueueTab.test.tsx`; fatia com 296 testes, `tsc`, ESLint e Fallow limpos.
- [x] **17.3 — Cabeçalho e barra de ações (só visual, 2026-11-02):** `QueueReferencePills` (tarifa de 12 meses em pílula, com o "como calculamos" de antes) no lugar dos cartões `QueueSummaryCards` e `SummaryCard`, removidos. Filtros, ações, faixa de seleção, avisos e tabela agora ficam no mesmo `Card` (`SuspiciousQueueTab`; o card saiu de `QueueBandTabs`), com a barra de filtros e ações acima das abas de faixa. Mantidos os textos atuais (subtítulo, "Top 10", tarifa com duas casas); sem pílula de taxa de acerto (a fila a tirou de propósito).
- [x] **17.4 — Tabela, só visual (2026-11-02):** faixas e tabela dentro de `Card` (`QueueBandTabs`); colunas na nova ordem, com Score e Situação no fim (`PrioritizedQueueRow`, `PrioritizedQueueTable`); seta ↓ no cabeçalho do Score (a fila vem ordenada por kWh esperado, e o score cresce com ele); chance de acerto como `ChanceBadge` (verde a partir de 30%, neutro abaixo, texto "91,5%" do `formatPercent` como antes). Mantidos os textos, os dados e o rótulo "Ordem gerada". Testes novos em `ChanceBadge.test.tsx` e `PrioritizedQueueTable.test.tsx`; fatia com 300 testes, `tsc`, ESLint e Fallow limpos. Falta a conferência no navegador (17.8).
- [ ] **17.5 — Ranking visual: descartado por decisão do dono da fatia (2026-11-02).** Não será feito o gráfico das 10 UCs mais suspeitas.
- [x] **17.6 — Detalhe da UC, só visual (2026-11-02):** a conta do score numa caixa destacada, com o resultado ("Score N de 100") em tamanho maior (`UnitScoreCalculation`); botão "Abrir na UC 360" no rodapé, com o mesmo destino do link da tabela (`/customers?uc=`), visível também para quem só consulta (`UnitDetailSheet`). O gráfico de consumo ficou como estava nesta etapa; foi alterado depois, no 17.12. Fora do escopo, por serem dados e textos do mockup: "posição N", parágrafo de filtros (o do mockup dizia "sem ordem ativa", o que é falso), conta em kWh/mês e linha de nível base. Conferido contra `v_energy.db`: o gráfico atual e a frase "Por que está na fila" usam dados reais nas 163 UCs. Testes: 2 novos em `UnitDetailSheet.test.tsx`; fatia com 302 testes, `tsc`, ESLint e Fallow limpos.
- [ ] **17.7 — Subgrupo (B1/B3) na coluna Classe:** dado novo; **fora do escopo** (só visual). Só retomar se a fatia decidir mostrar o subgrupo.
- [x] **17.9 — Contagem ao lado de cada opção dos filtros (2026-11-02, pedido do dono da fatia):** `GET /losses/queue-filters` devolve `contagens` (município, classe, motivo) sobre a fila inteira, e o menu mostra "Recife (71)", "Industrial (0)" etc. Backend em `queue_filter_options.py`; frontend em `QueueFilters.tsx`. Resolve em parte o item 16.2 ("contagem por motivo no filtro"). Opções com 0 continuam aparecendo, porque o pedido foi mostrar a contagem e não esconder opções. Exige reiniciar o backend.
- [x] **17.10 — Aviso de capacidade removido (2026-11-02, pedido do dono da fatia):** o alerta da aba da fila ("N UCs prioritárias para uma capacidade de 200 inspeções por mês…", `QueueCapacityNotice`) saiu da tela, com `describeCapacityGap` e os testes dele. Isso substitui a parte do item 15.2 que o descrevia; a expectativa da seleção e o aviso de baixa chance do diálogo (`SelectionOutlookNote`) continuam.
- [x] **17.11 — Reincidência de 12 meses na fila (2026-11-02):** UC com ordem concluída ou inspeção de campo com irregularidade fica fora da fila por 12 competências, com retorno antecipado se houver nova queda súbita (50% ou mais) depois da inspeção. Prazo adotado pelo dono da fatia, sem validação do gerente de perdas (D11/D12 em `DECISOES_PERDAS.md`). Em 2026-11-03 a queda de 50% passou a ser medida além da queda geral da carteira (mediana recente/base, teto de 1,0), por decisão do dono da fatia; no banco real não muda a fila (2026-06 e 2025-12), e os 9 casos de 2025-12 seguem voltando. Testes em `test_loss_reincidence.py`.
- [x] **17.12 — Gráfico de consumo com histórico completo e janelas do score (2026-11-03, pedido do dono da fatia):** abas "12 meses" / "Tudo" no detalhe da UC, com `historico_completo` na API (`router.py`, `unit_detail.py`) e as faixas das janelas do score no gráfico (`scoreWindows.ts`, espelho de `queries.py`). Reverte a decisão do 17.6 de não mexer no gráfico. O painel volta aos 12 meses ao fechar e também ao trocar de UC. Conferido no navegador em 2026-11-03 (UC109003, só leitura): a aba "Tudo" desenha de dez/2022 a jun/2026 com a legenda das faixas.
- [x] **17.13 — Filtro de situação e Top 10 "na fila" (2026-11-03, pedido do dono da fatia):** filtro de situação (na fila, ordem gerada, em campo) com contagem por opção; o Top 10, com a fila filtrada em outra situação, passa o filtro para "na fila" e marca o topo. A busca da fila livre usa o mesmo cache da lista (`queryClient.infiniteQuery`), então a chamada é uma só e o erro aparece na lista. Conferido no navegador em 2026-11-03: o seletor mostra "Na fila (158)", "Ordem gerada (6)", "Em campo (0)"; com "Ordem gerada" a fila tem 6 UCs e o Top 10 troca o filtro para "na fila" (requisição `situacao=na_fila` com 200). Limite visto: como as 6 prioritárias já têm ordem, o Top 10 não marca nenhuma e a tela cai na faixa "Baixa chance".
- [x] **17.14 — CSV de campo (2026-11-02/03):** o CSV exporta o que já está salvo na ordem e a coluna `inspetor_selecionado` (preenchida só com a ordem em campo); `create_order` grava `criado_por` em `fiscal_responsavel` quando nenhum fiscal é informado. Limite: ordens antigas só com fiscal saem com `inspetor_selecionado` vazio.
- [x] **17.15 — Regras de negócio consolidadas (2026-11-03):** [`regras-de-negocio.md`](regras-de-negocio.md) reúne todas as regras da fatia (acesso, fila, saída e retorno, score, chance de acerto, ordens, CSV, detalhe) com o arquivo e a constante de cada uma, e remete ao porquê em `DECISOES_PERDAS.md`.
- [x] **17.8 — Fechamento (2026-11-02):** `make lint-all` e `make test-all` 100%; conferência no navegador em modo só leitura (a 8000 já era de outro servidor, nada foi gravado); revisões `ecc:code-reviewer` e `ecc:react-reviewer` sem CRITICAL nem HIGH; entrada no `changelog.md`. Fechamento da etapa visual; o trabalho posterior está nos itens 17.11 a 17.14.

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


