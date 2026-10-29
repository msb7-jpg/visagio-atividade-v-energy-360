# Fila de Inspeção — raio-x (protótipo × código real)

Análise somente leitura, feita em 28/10/2026 na branch `feat/fatia-05-fila-inspecao-nova-tela`.
Nenhum código, banco ou configuração foi alterado. O banco foi aberto em modo `mode=ro`.

**O que foi executado:** `pytest` dos 10 arquivos `test_loss_*` (241 passaram); `vitest` de `features/loss_management` (162 passaram); consultas `SELECT` em `backend/v_energy.db`; e o `LossService` real, em modo somente leitura, contra o mesmo banco.
**O que não foi feito:** não subi backend nem frontend, então **não há capturas** em `assets/fila-inspecao-atual/`. Subir o backend gravaria no `v_energy.db` (`create_all` em `main.py:27`). Em vez disso, descrevo a tela pelo código.
**Não encontrado:** `assets/fila-inspecao-escuro-ordeninspecao.png` (procurado em `docs/planning/adrian_cesar/assets/`). Só existe a pasta `fila-inspecao/` com 13 imagens. As antigas `fila-inspecao-claro.png` e `-escuro.png` aparecem como excluídas no `git status`.

Convenção: `caminho:linha`. Backend em `backend/app/features/loss_management/` (abrevio `bk/`). Frontend em `frontend/src/features/loss_management/` (abrevio `fe/`).

---

## 1. Resumo em 10 linhas

1. A tela existe em `/losses`, com duas abas: "Fila priorizada" e "Ordens de inspeção" (`fe/components/LossManagementPage.tsx:31`).
2. A fila é calculada na hora por SQL sobre `fato_medicao` e `dim_unidade_consumidora`. Hoje tem **165 UCs**, todas "queda moderada" (19 com chance de 42% e 146 com 7%).
3. O score é `kWh esperado ÷ kWh esperado do topo × 100`. Não há pesos por motivo (`bk/scoring.py:239-252`).
4. Ordens são gravadas em `ordem_inspecao` (7 linhas hoje, todas `gerada`). O banco impede duas ordens ativas na mesma UC.
5. Estados da ordem no backend: `gerada → pendente → concluida` ou `→ cancelada`. A tela só **rotula** `gerada` como "Pendente" e `pendente` como "Em campo".
6. **Diferença 1:** não existe o painel de detalhe da UC. O número da UC leva à Visão 360 (`PrioritizedQueueRow.tsx:42`). Faltam também motivos com pontos, gráfico de 12 meses, vizinhos e inspeções anteriores.
7. **Diferença 2:** os motivos e o score mudaram. O protótipo tem 5 motivos e pontos; o código tem 3 (`queda_subita`, `queda_moderada`, `leitura_zerada`), e só `queda_moderada` ocorre na base.
8. **Diferença 3:** a importação grava direto, sem prévia. O protótipo mostra uma prévia e só grava depois de confirmar.
9. **Diferença 4:** não há inspetor (lista de 40), data de execução, observações nem motivo de cancelamento em lista. Há texto livre em `fiscal_responsavel` e `justificativa_cancelamento`.
10. **Diferença 5:** a fila vem inteira (até 500) e é paginada no navegador. Faltam busca global, ChatDrawer, "Sobre os dados" e o selo "Modo demonstração". Também falta permissão por perfil dentro do portal: `diretor` pode escrever.

---

## 2. A tela como está hoje

Ordem de cima para baixo. "Endpoint" = `/api/v1/losses/...`.

| # | Elemento | O que mostra | Origem do dado | Ao interagir | Componente |
|---|---|---|---|---|---|
| 1 | Menu lateral | "Gestão de Perdas" (rota `/losses`), "Visão 360 da UC", "Painel", "Qualidade da Rede", conforme o perfil | `components/layout/navItems.ts:11-20` | Navega | `SidebarNav` |
| 2 | Cabeçalho do portal | Nome do usuário, papel e "Sair". Há um comentário "ponto de encaixe do ChatDrawer" | `AppLayout.tsx:44` | — | `AppLayout` |
| 3 | Título e subtítulo | "Fila de Inspeção" e o subtítulo do protótipo ("score = chance de irregularidade × energia recuperável") | Texto fixo, `LossManagementPage.tsx:25-28` | — | `LossManagementPage` |
| 4 | Abas principais | "Fila priorizada (total)" e "Ordens de inspeção (N)" | `queue.total` e `orders.length` | Troca de aba. O estado da fila fica na página | `Tabs` |
| 5 | Card Capacidade | `programadas + selecionadas` de 200, barra, "ainda cabem X" ou "passa da capacidade" | `GET /queue-summary` → `count(ordem_inspecao)` com status `gerada`/`pendente` | Muda ao marcar UCs | `CapacityCard.tsx` |
| 6 | Card Energia das selecionadas | Soma de `kwh_mes_recuperavel` e R$/ano a R$ 0,714 | `GET /queue-summary?ucs=...` | Idem | `SummaryCard` |
| 7 | Card Retorno esperado | kWh × taxa de acerto e R$/ano | Idem. O R$ é calculado no front: `valor_ano × taxa` (`QueueSummaryCards.tsx:34`) | Idem | `SummaryCard` |
| 8 | Card Taxa de acerto | 62,7%, "871 de 1.389 … ago–dez/2025", tooltip "como calculamos" | `fato_inspecoes_perdas` (contagem) | Tooltip. **Não** mostra os 40 inspetores nem o link para o Assistente | `HitRateCard.tsx` |
| 9 | Avisos | Alertas de "competência fixada" e "histórico de campo não aplicado" | `avisos[]` da fila | — | `QueueWarnings.tsx` |
| 10 | Filtros | Motivo (3 opções), Município (14), Classe (5). **Sem** score mínimo e **sem** "Limpar filtros" | `GET /queue-filters` | Refaz `GET /suspicious-units` | `QueueFilters.tsx` |
| 11 | Ações | "Exportar fila (CSV)", "Selecionar top 10 prioritárias", "Gerar N ordens" | — | Ver seção 3.4 | `QueueActionsBar.tsx` |
| 12 | Abas de faixa | "Prioritárias · n" (chance ≥ 30%), "Baixa chance · n", "Todas · n" | `probabilidade_acerto` | Troca de faixa. A aba vazia fica desligada | `QueueBandTabs.tsx` |
| 13 | Tabela da fila | Colunas: ☐, #, UC, Bairro/município, Classe, Score, Queda, Chance de acerto, kWh/mês, R$/ano, Situação. Paginada de 25 em 25 no navegador | `GET /suspicious-units` (`limit` padrão 200) | Marcar linha; UC leva a `/customers?uc=` | `PrioritizedQueueTable.tsx`, `PrioritizedQueueRow.tsx` |
| 14 | Dialog Gerar ordens | kWh, retorno, "capacidade depois". Sem data, sem distribuição | Resumo já carregado | Confirma e faz 1 `POST /inspections` por UC, em blocos de 5 | `GenerateOrdersDialog.tsx` |
| 15 | Barra do fluxo | Selos Pendente → Em campo → Concluída · ou Cancelada; "Exportar planilha de campo"; "Importar resultados de campo" | — | Exporta CSV ou abre o upload | `OrderFlowBar.tsx` |
| 16 | Quadro de 4 colunas | Cartões: `OI-AAAA-NNNN`, data de criação, UC, "sem inspetor" ou fiscal, selo do resultado, "Cancelada: motivo" | `GET /inspections` (todas, sem paginação) | Botões por etapa | `OrderBoard.tsx`, `OrderCard.tsx` |
| 17 | Dialog Enviar a campo | Campo de texto "Fiscal responsável" (opcional) | — | `PATCH` com `status=pendente` | `DispatchOrderDialog.tsx` |
| 18 | Dialog Resultado | Irregularidade (Sim/Não), Tipo, kWh, Inspetor (texto), nº do TOI | — | `PATCH` com `status=concluida` | `RegisterResultDialog.tsx` |
| 19 | Dialog Cancelar | Justificativa em texto livre, obrigatória | — | `PATCH` com `status=cancelada` | `CancelOrderDialog.tsx` |
| 20 | Dialog Importar | Zona de arrastar, aceita `.csv`/`.xlsx`, botão "Enviar planilha"; depois um resumo de conciliadas, ignoradas e rejeitadas | `POST /inspections/upload` | **Grava na hora** | `InspectionUploadModal.tsx` |
| 21 | Toast (Sonner) | Enviada a campo, resultado registrado, cancelada | — | — | `sonner` |

Estados de carregamento, vazio, erro e sem permissão estão na seção 5.

---

## 3. Como funciona por dentro

### 3.1 Mapa do código

**Frontend** (`fe/`)
- Rota: `routes/AppRoutes.tsx:43-45` (`LOSS_ROLES = diretor, gerente_perdas`).
- Página: `components/LossManagementPage.tsx`. Controlador da fila: `hooks/useSuspiciousQueueController.ts`. Seleção: `hooks/useQueueSelection.ts`.
- API: `api/lossApi.ts`. Query options: `queries/lossQueries.ts` (`staleTime` de 30 s). Mutações: `hooks/useLossMutations.ts`.
- Regras visuais: `utils/orderBoard.ts` (colunas e ações), `utils/queueBands.ts` (corte de 30%), `utils/resultFormValidation.ts`, `utils/lossFormatters.ts`.
- Tipos copiados à mão: `types/lossTypes.ts`.

**Backend** (`bk/`)
- `router.py` (rotas) → `service.py` (regras) → `repository.py`, `queue_repository.py`, `upload_repository.py` (SQL).
- Consultas Core sobre as tabelas Gold: `queries.py`, `queue_query.py`. Modelo ORM: `models.py`. Schemas: `schemas.py`.
- Regras puras: `scoring.py` (score, chance, kWh), `queue_summary.py` (cartões), `update_rules.py` (campos por status), `export.py` (CSV).
- Upload: `upload_parser.py`, `upload_values.py`, `upload_reconcile.py`.
- RBAC: `shared/role_groups.py:12` (`PERDAS_ACCESS = diretor, gerente_perdas`).
- Migração: **não encontrada** (procurei `alembic` e `migrations`). A tabela nasce de `Base.metadata.create_all` na subida do app (`main.py:27`).

### 3.2 Banco de dados real (`backend/v_energy.db`)

**Tabelas Gold que a Fila lê** (declaradas com `table()`/`column()` em `bk/queries.py:33-54`):

| Tabela | Colunas usadas | Linhas |
|---|---|---|
| `dim_unidade_consumidora` (PK `id_uc`) | `id_uc, municipio, bairro, classe_consumo, possui_gd` | 45.000 |
| `fato_medicao` (PK `id_medicao`, índice `idx_fato_med_uc`) | `id_uc, competencia, consumo_kwh` | 2.152.336 |
| `fato_inspecoes_perdas` (PK `id_inspecao` texto, índice por `id_uc`) | `id_uc, data_inspecao, irregularidade_constatada` | 1.389 |

A tabela `fato_inspecoes_perdas` também tem `id_inspetor`, `tipo_irregularidade` e `kwh_recuperado`, que a Fila **não** usa hoje.
`fato_faturamento` (2.152.336 linhas) **não** é lida. A tarifa é a constante `0,714` (`bk/scoring.py:11`).

**Tabela de escrita do portal:** `ordem_inspecao` (7 linhas), colunas de `bk/models.py:21-34`:

| Coluna | Tipo | Observação |
|---|---|---|
| `id_inspecao` | INTEGER, PK autoincremento | Exibido como `OI-AAAA-NNNN` só no front |
| `id_uc` | VARCHAR(20), indexado | **Sem FK** para `dim_unidade_consumidora` |
| `status` | VARCHAR(20), indexado | `gerada`, `pendente`, `concluida`, `cancelada` |
| `motivo` | VARCHAR(200) | Texto livre. O front manda os motivos concatenados |
| `kwh_estimado` | FLOAT | Calculado no servidor |
| `fiscal_responsavel` | VARCHAR(120) | Texto livre |
| `irregularidade_constatada` | BOOLEAN | |
| `tipo_irregularidade` | VARCHAR(80) | Texto livre |
| `kwh_recuperado`, `numero_toi` | FLOAT, VARCHAR(40) | |
| `justificativa_cancelamento` | VARCHAR(500) | Texto livre |
| `criado_por`, `criado_em`, `atualizado_em` | VARCHAR(120), DATETIME ×2 | Sem "executar até", sem data da inspeção, sem observações |

Índice único parcial `uq_ordem_inspecao_uc_ativa` em `id_uc` onde `status IN ('gerada', 'pendente')` (`bk/models.py:37-45`). Confirmado no banco.

**Números-base conferidos** (consultas executadas):

```sql
-- inspeções, confirmadas, taxa, inspetores, período, faixa de UC
SELECT count(*), sum(irregularidade_constatada=1),
       round(avg(irregularidade_constatada=1)*100,2),
       count(distinct id_inspetor), min(data_inspecao), max(data_inspecao),
       min(id_uc), max(id_uc)
FROM fato_inspecoes_perdas;
-- 1389 | 871 | 62,71 | 40 | 2025-08-01 | 2025-12-31 | UC100046 | UC144968
SELECT min(id_uc), max(id_uc), count(*) FROM dim_unidade_consumidora;
-- UC100000 | UC144999 | 45000
```

| Número do protótipo | Valor na base | Confere? |
|---|---|---|
| 1.389 inspeções | 1.389 | Sim |
| 871 confirmadas | 871 | Sim |
| 62,7% | 62,71% | Sim |
| 40 inspetores | 40 (`INSP-001` a `INSP-040`) | Sim |
| ago–dez/2025 | 01/08/2025 a 31/12/2025 | Sim |
| UC100000 a UC144999 | 45.000 UCs nessa faixa. As inspeções usam UC100046 a UC144968 | Sim |
| Fila de 1.248 UCs | **165 UCs** no `v_energy.db` (competência 2026-06) | **Não**. O 1.248 era valor fixo do protótipo |
| 14 municípios | 14 | Sim (o protótipo mostrava 7) |
| Programadas = 58 | **7** (`count` de `gerada`/`pendente`) | Não, era fixo |
| Tarifa R$ 0,714 | `fato_faturamento` tem média de `tarifa_aplicada_rs_kwh` = **0,7738** | Não é a tarifa da base (ver P4) |

Fila real, obtida pelo `LossService` (consulta somente leitura): `total=165`; situação `na_fila`=158 e `ordem_gerada`=7; `queda_subita`=0, `queda_moderada`=165, `leitura_zerada`=0; sem avisos.
Dados de medição: `2022-07` a `2026-06` (48 competências); **zero leituras com consumo = 0** e zero negativas; 6.329 nulas; 390.624 `ESTIMADA` e 1.761.712 `REAL`.

**Como o score é calculado hoje**
- `score_risco = min(100, queda × 80 + 20 se houver leitura zerada)`, com 1 casa (`bk/scoring.py:100-113`). Só desempata.
- `kWh esperado = kwh_estimado_recuperar × probabilidade_acerto` (`scoring.py:221-236`). **É a chave de ordenação.**
- `score` (0–100) = `kWh esperado ÷ maior kWh esperado da fila × 100`, arredondado (`scoring.py:239-252`).
- `kwh_estimado_recuperar = (média base − média recente) × 3` (`JANELA_RECUPERACAO_MESES`). `kwh_mes_recuperavel` é o déficit mensal. `valor_ano_rs = déficit × 12 × 0,714`.
- Janelas: recente = 3 últimas competências; base = 12 anteriores (`bk/queries.py:94-108`). Consumo negativo é descartado (`queries.py:169`).
- `probabilidade_acerto` (`scoring.py:17-27, 116-143`): queda súbita 0,93; queda moderada 0,42 (queda ≥ 30%) ou 0,07 (20–30%); leitura zerada 0,627.

**Motivos** (`bk/scoring.py:78-97`): `queda_subita` (queda ≥ 50%), `queda_moderada` (20% a 50%), `leitura_zerada` (algum mês zerado na janela recente). Não existem os motivos "abaixo dos vizinhos", "muitas leituras estimadas" e "irregularidade confirmada antes".

**Elegibilidade** (`bk/queue_query.py:87-103`): sem GD (`possui_gd` não verdadeiro), base > 0, com leitura recente, queda ≥ 20% ou leitura zerada, e `id_uc` fora das UCs excluídas. Excluídas: ordem `concluida` com `atualizado_em` dentro da janela, ou inspeção em `fato_inspecoes_perdas` dentro da janela (`queue_query.py:31-75`). Ordem ativa **não** tira a UC da fila; ela aparece com situação `ordem_gerada`/`em_campo`. Cancelada devolve a UC.

**Como saem os demais números**

| Dado do protótipo | Como o código obtém hoje |
|---|---|
| kWh/mês e R$/ano | Déficit mensal; × 12 × 0,714 (constante) |
| Taxa de acerto (card) | `confirmadas ÷ total` de `fato_inspecoes_perdas` (`bk/queue_repository.py:50-76`); sem a tabela, cai em 0,627 |
| Taxa por motivo | Constantes por faixa (`scoring.py:17-27`), exibida como "Chance de acerto" por UC |
| Capacidade e programadas | 200 fixo (`schemas.py:34`); programadas = ordens ativas |
| Inspeções anteriores da UC | **Não encontrado** (procurei `fato_inspecoes_perdas` em `bk/` e `fe/`; só entra para excluir a UC e para a taxa) |
| Série de 12 meses e média dos vizinhos | **Não encontrado** em nenhum endpoint |

### 3.3 Fluxos de ponta a ponta

**a) Carregar a fila**
`useSuspiciousQueueController` → `useSuspiciousUnitsQuery(filters)` → `lossApi.listSuspiciousUnits` → `GET /losses/suspicious-units` (`router.py:47`) → `LossService.list_suspicious_units` (`service.py:113`) → `LossRepository.fetch_consumption_profiles` (`repository.py:95`) → `suspicious_profiles_query` (SQL sobre `fato_medicao` + `dim_unidade_consumidora`, com `NOT IN` das excluídas) → `rank_suspicious_units` (Python) → `apply_situation` (junta com ordens ativas). Em paralelo: `GET /queue-summary` (a cada mudança de seleção) e `GET /queue-filters`.
Os filtros de município, bairro e classe vão para o SQL. O filtro de **motivo** é aplicado em memória, depois (`scoring.py:279`).

**b) Abrir o detalhe de uma UC**
**Não existe.** O número da UC é um `<Link>` para `/customers?uc=` (`PrioritizedQueueRow.tsx:42`), e a Visão 360 lê o parâmetro (`customer360/hooks/useCustomer360Controller.ts:18`). Não há `Sheet` na Fila (o componente `ui/sheet.tsx` existe e é usado em `grid_quality`).

**c) Gerar ordens**
Marcar UCs → "Gerar N ordens" → `GenerateOrdersDialog` → para cada UC, `POST /losses/inspections` `{id_uc, motivo}` (`lossApi.ts:56`), em blocos de 5 em paralelo (`useLossMutations.ts:14`) → `LossService.create_inspection` (`service.py:192`): busca a UC no cadastro (404), checa ordem ativa (409), calcula `kwh_estimado` no servidor → `create_order` grava com `status=gerada`. O índice parcial é a barreira final contra concorrência (`repository.py:250-254`). Depois, invalida `['losses']`.
Não há endpoint em lote: se uma UC falha, as outras seguem, e o diálogo lista as falhas.

**d) Enviar a campo**
`DispatchOrderDialog` → `PATCH /losses/inspections/{id}` `{status:'pendente', fiscal_responsavel?}`.

**e) Registrar resultado**
`RegisterResultDialog` → validação no front (`resultFormValidation.ts`) → `PATCH` `{status:'concluida', irregularidade_constatada, fiscal_responsavel?, tipo_irregularidade?, kwh_recuperado?, numero_toi?}`.

**f) Cancelar**
`CancelOrderDialog` → `PATCH` `{status:'cancelada', justificativa_cancelamento}`. A UC "volta" à fila porque a ordem deixa de ser ativa; não há escrita na UC.

**g) Exportar a fila**
O botão "Exportar fila (CSV)" na aba Fila chama o **mesmo** `GET /losses/inspections/export` do botão da aba Ordens (`QueueActionsBar.tsx:24` e `ExportOrdersButton.tsx`). Ele exporta as **ordens ativas** (`gerada`+`pendente`), não a fila de UCs. Fica desligado com 0 ordens ativas. O arquivo se chama `ordens_inspecao_campo.csv`.

**h) Exportar a planilha de campo**
Mesmo endpoint e arquivo da letra (g). CSV com `;`, UTF-8 com BOM, neutraliza fórmulas (`bk/export.py`). Colunas: `id_inspecao, id_uc, status, motivo, kwh_estimado, fiscal_responsavel, criado_em` + em branco `data_inspecao, irregularidade_constatada, tipo_irregularidade, kwh_recuperado, numero_toi`. **Não gera `.xlsx`** e as colunas **não** são as do protótipo (`id_ordem, uc, data, inspetor, resultado, tipo, kwh_recuperado`).

**i) Importar resultados**
`InspectionUploadModal` → `POST /losses/inspections/upload` (multipart, `file`) → `LossService.upload_field_results` (`service.py:241`): lê `.csv`/`.xlsx` (todas as abas, 5 MB, 10.000 linhas) → concilia cada linha com a ordem do portal (`id_inspecao` numérico) ou, se o id não for do portal, com a **ordem ativa da UC** → valida e aplica num único commit só nas ordens ainda ativas → devolve `conciliadas`, `ignoradas`, `rejeitadas[]`, `kwh_recuperado_total`. A data é validada e **descartada** (`upload_reconcile.py:145`).

### 3.4 Endpoints

Todos sob `/api/v1/losses`, com `Depends(require_role(PERDAS_ACCESS))` no router (`router.py:40-44`): **401** sem token, **403** para perfis fora de `diretor` e `gerente_perdas`. Não há distinção entre leitura e escrita por perfil.

| Método e rota | Tipo | Parâmetros / corpo | Validações e erros |
|---|---|---|---|
| `GET /suspicious-units` | Leitura | Query: `municipio`, `bairro`, `classe`, `motivo` (enum), `limit` (1–500, padrão 200) | 422 se `motivo` ou `limit` inválidos; 500 se a Gold falhar (`DatabaseReadError`) |
| `GET /queue-summary` | Leitura | Query repetível `ucs` (até 400 itens, cada um de 1 a 20 caracteres) | 422 acima de 400 UCs; 500 se a Gold falhar |
| `GET /queue-filters` | Leitura | — | 500 se o cadastro falhar |
| `GET /inspections` | Leitura | Query `status` (opcional) | 422 se status inválido. **Sem paginação** |
| `GET /inspections/export` | Leitura | — | CSV; sem ordens ativas devolve só o cabeçalho |
| `POST /inspections` | **Escrita** | `{id_uc, motivo?, fiscal_responsavel?}`; `extra=forbid` | 404 UC fora do cadastro; 409 ordem ativa; 422 corpo inválido (inclui `kwh_estimado`) |
| `PATCH /inspections/{id}` | **Escrita** | `{status, fiscal_responsavel?, irregularidade_constatada?, tipo_irregularidade?, kwh_recuperado?, numero_toi?, justificativa_cancelamento?}` | 404 ordem; 409 transição inválida; 400 campos obrigatórios ou incompatíveis |
| `POST /inspections/upload` | **Escrita** | multipart `file` | 400 formato ou coluna `id_inspecao` ausente; 413 acima de 5 MB; 422 sem arquivo |

Exemplos reais (execução do serviço contra o banco):

```json
GET /suspicious-units  →  itens[0]
{"id_uc":"UC106967","municipio":"RECIFE","bairro":"IPUTINGA","classe_consumo":"RESIDENCIAL",
 "motivos":["queda_moderada"],"score_risco":25.2,"score":100,"situacao":"na_fila",
 "probabilidade_acerto":0.42,"consumo_base_kwh":309.0,"consumo_recente_kwh":211.7,
 "kwh_estimado_recuperar":292.0,"valor_estimado_recuperar_rs":208.49,
 "kwh_mes_recuperavel":97.3,"valor_ano_rs":833.95}
```
```json
GET /queue-summary?ucs=UC106967&ucs=UC111048
{"capacidade_total":200,"capacidade_programada":7,"selecionadas":2,"kwh_mes_selecionadas":188.0,
 "valor_ano_selecionadas_rs":1610.78,"tarifa_rs_kwh":0.714,"retorno_esperado_kwh_mes":117.9,
 "taxa_acerto":{"inspecoes_total":1389,"irregularidades_confirmadas":871,"taxa":0.6271,
 "periodo_inicio":"2025-08","periodo_fim":"2025-12"}}
```
```json
GET /inspections  →  [0]
{"id_inspecao":7,"id_uc":"UC106923","status":"gerada","motivo":"Queda moderada de consumo",
 "kwh_estimado":104.0,"fiscal_responsavel":null,"irregularidade_constatada":null,
 "tipo_irregularidade":null,"kwh_recuperado":null,"numero_toi":null,
 "justificativa_cancelamento":null,"criado_por":"perdas@venergy.com",
 "criado_em":"2026-10-28T02:48:10.840186","atualizado_em":"2026-10-28T02:48:10.840186"}
```

**Não existem** endpoints para: detalhe da UC, série de consumo, vizinhos, inspeções anteriores da UC, lista de inspetores, exportação da fila de UCs, prévia da importação, relatório de erros.

### 3.5 Máquina de status

**Ordem** (`bk/service.py:35-40`): `gerada → pendente | cancelada`; `pendente → concluida | cancelada`; `concluida` e `cancelada` são finais. Validada **só no backend** (`validate_transition`, `service.py:69`). O front espelha as ações em `ACTIONS_BY_STATUS` (`orderBoard.ts:27`), mas isso é apenas conforto de interface. O banco só garante "uma ordem ativa por UC"; não há `CHECK` do valor de `status`.
**Campos por status** (`bk/update_rules.py`): `pendente` aceita `fiscal_responsavel`; `concluida` exige `irregularidade_constatada` e, se `false`, recusa tipo, kWh e TOI; `cancelada` exige justificativa não vazia.
**UC** (`bk/queue_summary.py:15-45`): a situação **não é gravada**; é derivada da ordem ativa. `gerada → ordem_gerada`; `pendente → em_campo`; sem ordem ativa → `na_fila`. **Não existe o estado `inspecionada`**: ao concluir, a ordem sai do status ativo e, se estiver dentro da janela, a UC **some da fila** (D4).

| Especificação | Código | Diferença |
|---|---|---|
| Ordem `pendente → em_campo → concluida` | `gerada → pendente → concluida` | Mesmo fluxo, **nomes internos diferentes**. O front traduz (`orderBoard.ts:17-22`). Isso confunde quem lê a API |
| `pendente\|em_campo → cancelada`, com motivo | `gerada\|pendente → cancelada`, com justificativa livre | Equivalente. O motivo não é uma lista |
| UC `na_fila → ordem_gerada → em_campo → inspecionada` | Derivada: `na_fila`, `ordem_gerada`, `em_campo`. Concluída sai da fila | Falta `inspecionada` |
| Cancelar devolve a UC à `na_fila` | Sim, por derivação | Igual |
| "Nenhuma outra transição" | Verdadeiro, validado no servidor | Igual |

---

## 4. Como deve funcionar (elemento a elemento)

Legenda: **Igual** · **Diferente** · **Falta**.

| Elemento (spec) | Protótipo | Código atual | O que fazer |
|---|---|---|---|
| 3.1 Menu lateral | Fila, UC 360, Assistente IA; rodapé Sobre os dados e Recolher | **Diferente.** Item "Gestão de Perdas"; sem rodapé nem recolher | Renomear o item para "Fila de Inspeção" (só texto em `navItems.ts:19`). Resto: P12 |
| 3.1 Busca global | Campo com sugestões | **Falta** (nada em `AppLayout.tsx`) | Fora da Fatia 05; combinar com a Fatia 03 |
| 3.1 Chip "Dados até" | Texto fixo | **Falta** | Expor a competência de `fato_medicao` (já calculada, `repository.py:132`) |
| 3.1 Selo demo, avatar com troca | Demo | **Diferente.** Há nome, papel e "Sair" | Não implementar a troca de usuário em produção |
| 3.1 Botão Assistente IA / ChatDrawer | Abre o drawer | **Falta** (há só o comentário em `AppLayout.tsx:44`) | Fatia 07 |
| 3.1 Sem permissão | Card + botão "tela inicial" | **Não verificado.** `ProtectedRoute` existe, mas não abri o arquivo | Abrir `routes/ProtectedRoute.tsx` antes de decidir |
| 3.2 Cabeçalho | Título e subtítulo | **Igual** | Ajustar só se P1 mudar |
| 3.3 Capacidade | `programadas + selecionadas` de 200 | **Igual.** Programadas reais (7), não 58 | — |
| 3.3 Energia das selecionadas | kWh/mês e R$/ano | **Igual** | Revisar a tarifa (P4) |
| 3.3 Retorno esperado | kWh × 62,7% | **Igual** (a taxa vem da base) | — |
| 3.3 Taxa de acerto | 62,7%, "40 inspetores", "modelo em calibração", links | **Diferente.** Sem "40 inspetores", sem "em calibração", sem os dois links | Só texto/links; os 40 inspetores exigem um novo campo em `HitRateDTO` |
| 3.4 Abas | tablist com contagem | **Igual** | — |
| 3.5 Filtro Motivo | 5 motivos | **Diferente.** 3 motivos | Depende de P2 |
| 3.5 Filtro Município | 7 | **Igual** (14, vindos do banco) | — |
| 3.5 Filtro Classe | 5 | **Igual** (5, em maiúsculas como no banco) | Formatar "Poder Público" com acento é só exibição |
| 3.5 Score mínimo | 4 opções | **Falta.** Removido no commit `981066c` | Manter removido (P8) |
| 3.5 "Limpar filtros" | Aparece com filtro ativo | **Falta** | Só frontend |
| 3.5 Link "como calculamos o score" | Abre "Sobre os dados" | **Diferente.** Tooltip na coluna Score | Manter o tooltip |
| 3.5 Exportar fila | `.xlsx` e `.csv`, 7 colunas | **Diferente.** Exporta as **ordens ativas**, CSV com 12 colunas | P5 |
| 3.5 Selecionar top 10 | 10 primeiras livres | **Diferente.** 10 primeiras livres **prioritárias** | Manter (D11) |
| 3.5 Gerar N ordens | Desabilitado com 0 | **Igual** | — |
| 3.5 Linha de contexto | "Mostrando N de total" | **Igual**, com paginação no navegador | — |
| 3.5 Tabela | ☐ # UC Bairro Classe Score Motivos kWh R$ Situação | **Diferente.** Sem coluna "Motivos" (há "Queda" e "Chance de acerto"); sem selo B1/B2/B3/A4 | Ver P2. Subgrupo existe no banco (`subgrupo_tarifario`) |
| 3.5 Cor do score | ≥85 vermelho, 70–84 âmbar | **Não verificado** (não abri `ScoreBar.tsx`) | Conferir o limiar antes de mexer |
| 3.5 Estado vazio da fila | "Nenhuma UC com esses filtros." + Limpar | **Diferente.** Texto genérico ("Nenhuma UC suspeita na fila") | Texto e botão (só front) |
| 3.6 Sheet de detalhe | Painel lateral completo | **Falta tudo** | Passos 6 a 8 do plano |
| 3.7 Gerar ordens: 4 números | Ordens, energia, retorno, capacidade depois | **Diferente.** 3 números (sem "Ordens") | Só front |
| 3.7 "Executar até" e "Distribuição" | Gravados na ordem | **Falta**; a tabela não tem as colunas | P3 |
| 3.7 Toast "N ordens geradas (OI-… a OI-…)" | Sim | **Diferente.** O diálogo fecha sem toast | Só front |
| 3.8 Barra do fluxo | Selos e dois botões | **Igual** | — |
| 3.8 Banner de importação | "4 importados, 2 erros" | **Diferente.** Resumo dentro do diálogo, não banner | Só front |
| 3.8 Quadro de 4 colunas | Sim | **Igual** | Sem limite de cartões (ver riscos) |
| 3.8 Cartão | id+data, UC·bairro, inspetor/score, selo | **Diferente.** Sem bairro; sem "score X"; data é a de criação | Bairro exige buscar a UC no cadastro (passo 5) |
| 3.8 "Enviar a campo" escolhe inspetor e data | Sim | **Diferente.** Inspetor em texto livre; sem data | P3 |
| 3.9 Resultado | Data, Inspetor (lista), rádio, tipo, kWh (aceita `1.240`), observações | **Diferente.** Sem data e sem observações; inspetor é texto; resultado é `Select` Sim/Não; kWh é `type=number` (não aceita "1.240") | P3 e passo 2 |
| 3.9 Mensagem do kWh | "Informe o kWh recuperado (número maior que zero)." | **Diferente.** "Informe um kWh recuperado maior que zero." | Só texto |
| 3.10 Cancelar | Motivo em lista + observação | **Diferente.** Só texto livre | P3 |
| 3.10 Texto da UC | "volta para a fila e o score é recalculado" | **Diferente.** "volta para a fila" | Só texto |
| 3.11 Importar: arquivo + exemplo | Arrastar, "usar planilha de exemplo" | **Diferente.** Sem exemplo; limite de 5 MB (spec: 10 MB) | P6 |
| 3.11 Importar: prévia por linha | Valor original e tratado, Pronta/Aviso/Erro | **Falta.** Grava direto | P6 |
| 3.11 Regras de tratamento | Datas, inspetor, resultado, tipo, vírgula | **Diferente.** Datas, resultado e vírgula existem (`upload_values.py`); **a data é descartada** | P6 |
| 3.11 "Baixar relatório de erros" | Sim | **Falta** (as rejeições só aparecem em lista) | Só front |
| 3.12 Toast | 8 mensagens | **Diferente.** 3 (enviada, resultado, cancelada); faltam as demais | Só front |
| 3.13 ChatDrawer | Sim | **Falta** | Fatia 07 |
| Estado: carregando | Skeleton | **Igual** (cartões, fila e quadro) | — |
| Estado: erro | `ErrorState` | **Diferente.** Fila: `AsyncState` com texto; quadro: `EmptyState` com "Tentar novamente"; cartões: texto simples | Padronizar com `ErrorState` |
| Estado: vazio | Mensagens | **Diferente** (fila) e **Igual** (colunas do quadro) | — |
| Estado: sem permissão | Card na tela | **Não verificado** | Ver 3.1 |

---

## 5. Estados e acessibilidade

- **Carregando:** `LoadingSkeleton` nos cartões (`QueueSummaryCards.tsx:30`), `AsyncState` na fila, `OrderBoardSkeleton` no quadro.
- **Erro:** a fila mostra erro e orienta a "verificar a conexão e as tabelas Gold"; o quadro tem "Tentar novamente". Não conferi se a fila tem botão de nova tentativa (depende de `components/feedback/AsyncState.tsx`, que não abri).
- **Vazio:** a fila mostra "Nenhuma UC suspeita na fila"; cada coluna mostra "Nenhuma ordem nesta etapa."
- **Sem permissão (API):** 403 com mensagem em pt-BR. **Na tela:** não verificado (ver 3.1).
- **Acessibilidade:** há `aria-label` em tabelas, checkboxes e abas, `role="alert"` nos erros e `aria-busy`. O botão de exportar tem `aria-busy`. O cartão de capacidade usa `role="progressbar"`. Não medi foco, tamanho do alvo (≥ 44 px) nem contraste.

---

## 6. Itens simulados (seção 9) e inconsistências (seção 10)

### 6.1 Seção 9 — o que o código já resolveu

| Item | Resolvido? | Como |
|---|---|---|
| Total da fila | **Sim** | `total=len(ranked_units)` (`service.py:134`) = 165 |
| Linhas da fila | **Parcial** | Vem do servidor, mas é **um único `limit`** (padrão 200, máx. 500). A paginação é feita no navegador (25/página). Sem ordenação escolhida pelo usuário |
| Programadas | **Sim** | `count` de ordens `gerada`+`pendente` (`queue_repository.py:41`). Não filtra por mês |
| Quadro de ordens | **Sim** | `GET /inspections` |
| Enviar a campo: inspetor e data | **Parcial** | Inspetor em texto livre; **data não existe** |
| "Executar até" e "Distribuição" | **Não** | Sem colunas |
| Data e observações do resultado | **Não** | A data é validada no upload e descartada (`upload_reconcile.py:145`) |
| Lista de inspetores (40) | **Não** | Existem em `fato_inspecoes_perdas.id_inspetor` (`INSP-001`..`INSP-040`), sem endpoint |
| Municípios (14) | **Sim** | `GET /queue-filters` |
| Score e motivos | **Sim, com outra regra** | Calculados em Python no pedido, não na Gold (`scoring.py`) |
| Pontos por motivo e evidência | **Não** | Não há decomposição do score nem texto de evidência |
| Gráfico de consumo | **Não** | Sem endpoint |
| Inspeções anteriores | **Não** | Sem endpoint |
| Prévia da importação | **Não** | Sem prévia |
| Exportações | **Parcial** | CSV real das ordens ativas; sem `.xlsx` e sem exportar a fila |
| Taxa de acerto e retorno | **Sim** | Calculados (`queue_summary.py`). Sem corte por inspetor ou mês |
| Cancelar devolve a UC | **Sim** | Por derivação da ordem ativa |

### 6.2 Seção 10 — o que o código faz e o que recomendo

| # | Inconsistência | O que o código faz hoje | Recomendação |
|---|---|---|---|
| 1 | Fórmula do score | Ordena por **kWh × chance de acerto**; o `score` mostrado é isso normalizado pelo topo. O subtítulo (`LossManagementPage.tsx:27`) já diz "chance × energia" | **Manter** a fórmula do código e **abandonar os pesos por motivo** do protótipo. Está documentada em `docs/DECISOES_PERDAS.md` (D1) e evita contar a queda duas vezes. Atualizar a especificação, o detalhe da UC e o tooltip |
| 2 | Nome do estado final | Ordem: "Concluída". UC: sai da fila (não tem "Inspecionada") | Usar "Concluída" na ordem. Para a UC concluída, **não** listar na fila; mostrar o estado só no detalhe/histórico |
| 3 | Programadas × quadro | Os dois usam a mesma fonte (ordens ativas). Hoje: 7 e 7 | **Já consistente.** Ver P9 |
| 4 | Importação | Aceita o `id_inspecao` do portal **ou** casa pela ordem ativa da UC. Não grava histórico de inspeção sem ordem | Manter "só ordens existentes". Gravar histórico fora de ordem misturaria `fato_inspecoes_perdas` (Gold) com dados de escrita do portal |
| 5 | Quem escreve | `diretor` e `gerente_perdas` escrevem igualmente (`PERDAS_ACCESS`) | **Só `gerente_perdas` escreve**; `diretor` só lê. Exige separar o grupo no router (passo 3) |
| 6 | Tarifa e taxa únicas | Tarifa fixa 0,714; taxa por UC por faixa (0,42/0,07/…), taxa global só nos cartões | Manter a taxa por faixa; revisar a tarifa em P4 |

---

## 7. O que pode ser alterado

**7.1 Pode mudar sem risco (só frontend ou texto)**
- Renomear "Gestão de Perdas" para "Fila de Inspeção" (`navItems.ts:19`).
- Botão "Limpar filtros" e texto do estado vazio com "Nenhuma UC com esses filtros."
- Toast ao gerar ordens ("N ordens geradas") e mensagens de erro do kWh.
- Banner de importação concluída; botão "Baixar relatório de erros" (gerado no navegador a partir de `rejeitadas[]`).
- Padronizar erros com `ErrorState`; botão "Tentar novamente" na fila.
- Texto do cancelamento ("o score é recalculado no próximo processamento").
- Aceitar "1.240" e "1240,5" no campo de kWh (trocar `type=number` por texto com `inputMode="decimal"`, reaproveitando `parseKwh`).
- Mostrar o número de ordens no diálogo de gerar.

**7.2 Muda backend ou consulta (precisa de teste)**
- Endpoint de detalhe da UC: série de 12 meses, média das UCs da mesma classe, inspeções anteriores. Fontes: `fato_medicao`, `dim_unidade_consumidora`, `fato_inspecoes_perdas`. Pytest de consulta e de rota.
- Endpoint de inspetores (`SELECT DISTINCT id_inspetor`).
- Incluir `bairro` e `municipio` em `InspectionOrderDTO`.
- Exportar a fila de UCs (CSV e `.xlsx`) com o cabeçalho do protótipo.
- Paginação e ordenação no servidor (`limit`/`offset`), mantendo o `total`.
- Selo de subgrupo (B1/B2/B3/A4) na linha.
- Tarifa a partir de `fato_faturamento` (P4).
- Importação em duas etapas (prévia e confirmar).
- Separar leitura e escrita por perfil.
- Corrigir o `SAWarning` de `distinct()` em `queue_repository.py:96` (aparece nos testes e na execução).

**7.3 Muda modelo de dados ou regra de negócio (precisa da sua decisão)**
- Novas colunas em `ordem_inspecao` (inspetor como código, `executar_ate`, `data_inspecao`, `observacoes`, `motivo_cancelamento` em lista). Não há migração; hoje só `create_all` roda, então **colunas novas não aparecem em banco existente** sem um passo manual.
- Renomear os status internos `gerada`/`pendente` para `pendente`/`em_campo`.
- Novos motivos de suspeita (vizinhos, leituras estimadas, reincidência).
- Estado `inspecionada` para a UC.
- Capacidade mensal real (hoje 200 fixo).
- Reincidência: depois de quanto tempo uma UC volta à fila (já em aberto em `DECISOES_PERDAS.md`, D11).

**7.4 Não deve mudar**
- Pedido do case: fila priorizada com motivo e energia estimada; gerar, atualizar status, registrar resultado e cancelar ordens; exportar fila e importar resultados como diferenciais.
- Uma ordem ativa por UC (índice único parcial) e validação de transição no servidor.
- O servidor calcula o `kwh_estimado`; o corpo não aceita esse campo (`extra=forbid`).
- Exclusão de UCs com GD e de UCs já inspecionadas (D3 e D4), e descarte de consumo negativo (D5).
- Componentes e tokens do `design.md`: sem tags nativas, sem cores brutas, ≤ 150 linhas por componente.
- Taxa 62,7% como número calculado da base, não constante.

---

## 8. Decisões pendentes

1. **P1 — Fórmula do score e subtítulo.**
   a) Manter `kWh × chance` (código). b) Voltar aos pesos por motivo do protótipo.
   **Recomendo (a).** Já está implementada, testada (`test_loss_management_service.py`) e documentada na D1. Atualizar só o protótipo e o texto do detalhe.

2. **P2 — Motivos exibidos.** Hoje só existe `queda_moderada` na base real. O protótipo tem 5 motivos.
   a) Manter 3 motivos. b) Acrescentar "abaixo dos vizinhos" e "muitas leituras estimadas". c) Acrescentar também "irregularidade confirmada antes".
   **Recomendo (a)** por ora. A D11 registra que vizinhos e leituras estimadas **não separaram** as irregulares nos testes; adicioná-los sem evidência traria pontos sem valor. "Irregularidade confirmada antes" contradiz D4 (UC já inspecionada sai da fila).

3. **P3 — Novas colunas em `ordem_inspecao`.**
   a) Só `executar_ate`, `data_inspecao`, `observacoes`, `motivo_cancelamento` (lista) e `inspetor` como código. b) Nenhuma coluna nova; manter texto livre.
   **Recomendo (a)**, com uma migração (Alembic) já neste passo, porque `create_all` não altera tabelas existentes. A data da inspeção é o dado que o upload já valida e perde.

4. **P4 — Tarifa do R$/ano.** 0,714 (código, "do desenho da tela"); 0,7738 (média de `tarifa_aplicada_rs_kwh`); 0,561 (valor da energia ÷ consumo faturado, citado em `DECISOES_PERDAS.md` D8).
   a) Manter 0,714. b) Usar a média da base por classe. c) Usar a média global da base.
   **Recomendo (c)**, calculada uma vez e exposta em `tarifa_rs_kwh`. Alinhar com a Fatia 02 antes (a D8 deixa isso pendente) e nunca cravar "R$ 0,714" no texto da tela.

5. **P5 — "Exportar fila".**
   a) Manter como está (exporta ordens ativas) e renomear o botão. b) Criar uma exportação da fila de UCs (`.xlsx` e `.csv`).
   **Recomendo (b)**, mantendo a exportação de ordens na aba Ordens. Hoje o botão da aba Fila promete "fila" e entrega ordens, e fica desligado quando não há ordem.

6. **P6 — Importação com prévia.**
   a) Manter o envio direto. b) Prévia por linha (valor original, tratado, Pronta/Aviso/Erro) e confirmar.
   **Recomendo (b).** O protótipo diz "nada é gravado antes de você confirmar", e hoje o upload grava na hora. Fazer com um parâmetro `dry_run=true` no mesmo endpoint, que reaproveita `reconcile_rows` sem o commit.

7. **P7 — Rótulos de status na API.** Trocar `gerada→pendente` e `pendente→em_campo` no backend?
   a) Manter os nomes internos e traduzir no front. b) Renomear.
   **Recomendo (a)** agora; é risco de confusão, não de erro. Se o passo 4 (migração) for feito, avaliar (b) no mesmo passo, com um `UPDATE` de dados.

8. **P8 — Score mínimo.** Foi removido (`981066c`) quando a fila foi dividida em abas por chance de acerto.
   **Recomendo manter removido** e atualizar o protótipo.

9. **P9 — "Programadas" no mês.** Contar todas as ordens ativas ou só as do mês corrente.
   **Recomendo contar as ativas**, que é o que o código faz, e deixar o texto como "ordens abertas".

10. **P10 — Quem escreve.** Só `gerente_perdas` ou também `diretor`.
    **Recomendo só `gerente_perdas`** para `POST`/`PATCH`/upload. O `diretor` continua lendo. No front, esconder os botões de ação para `diretor`.

11. **P11 — Inspeção sem ordem no upload.** Ver 6.2, item 4. **Recomendo manter** a rejeição e mostrar o motivo.

12. **P12 — Itens de shell (busca global, ChatDrawer, "Sobre os dados", recolher menu).** Pertencem a outras fatias ou ao shell. **Recomendo registrar como dependência** e não implementar na Fatia 05.

---

## 9. Riscos

**Segurança**
- `diretor` e `gerente_perdas` têm o mesmo poder de escrita (`router.py:40-44`). `criado_por` registra só quem **criou**; `PATCH` e upload **não** guardam quem alterou (`atualizado_em` existe, o autor não).
- Chave JWT padrão e senhas de demonstração no código (`core/config.py:38, 47-73`). Aceitável para o case, **inaceitável** fora dele.
- `fiscal_responsavel`, `tipo_irregularidade` e `motivo` são texto livre (com limite de tamanho, sem lista). O tipo pode divergir dos 5 valores históricos.
- Upload: limite de 5 MB e 10.000 linhas; o `.xlsx` é lido em memória (`asyncio.to_thread`). O CSV exportado neutraliza fórmulas.

**Integridade**
- Uma ordem ativa por UC é garantida pelo banco. **Ordem órfã:** `id_uc` sem FK; o `POST` confere o cadastro, mas nada impede a UC sumir depois.
- Importação duplicada: a mesma linha duas vezes **no mesmo arquivo** é barrada (`ensure_not_duplicated`). O **mesmo arquivo enviado duas vezes** não regrava, porque a ordem já está `concluida` e a linha é rejeitada com motivo; não há controle por arquivo.
- Casar a linha pela UC conclui a ordem ativa mesmo se a planilha trouxer uma inspeção antiga (risco aceito na D10).
- **Gerar em lote não é atômico:** cada UC é uma requisição. Uma falha no meio deixa o lote parcial; o diálogo lista as falhas.
- `create_all` não migra colunas novas em bancos existentes.
- A competência de referência pode ser fixada por `LOSS_REFERENCE_COMPETENCIA`; hoje está comentada no `.env`, e um aviso aparece quando ativa.

**Desempenho**
- Cada `GET /suspicious-units` e **cada mudança de seleção** em `GET /queue-summary` refaz a agregação sobre 2,1 milhões de linhas de `fato_medicao`. **Não medi o tempo de resposta**; medir antes de decidir sobre cache.
- Em competências de queda generalizada a fila passa de dezenas de milhares de UCs (aviso no `.env`). O corte vem só do `limit` (máx. 500) e o front pagina no navegador.
- `GET /inspections` devolve todas as ordens, sem paginação; o quadro renderiza todos os cartões.

**Acessibilidade e pt-BR**
- Município, classe e tipo de irregularidade vêm do banco em maiúsculas e sem acento ("JABOATAO DOS GUARARAPES", "PODER PUBLICO", "LIGACAO CLANDESTINA"). Formatar na exibição.
- O campo de kWh do resultado usa `type="number"`, que depende do idioma do navegador para a vírgula.

---

## 10. Plano de implementação

Passos pequenos, na ordem. Cada um deve terminar com `make lint-all` e `make test-all` (regra zero do `AGENTS.md`).

| # | Passo | Arquivos | Teste que comprova |
|---|---|---|---|
| 1 | Textos e estados só de front: renomear menu, "Limpar filtros", estado vazio, toast de geração, mensagem do kWh, texto do cancelamento, `ErrorState` | `components/layout/navItems.ts`; `fe/components/QueueFilters.tsx`, `SuspiciousQueueTab.tsx`, `GenerateOrdersDialog.tsx`, `CancelOrderDialog.tsx`; `fe/utils/resultFormValidation.ts` | **Vitest:** `SuspiciousQueueTab.test.tsx` (vazio e limpar), `resultFormValidation.test.ts` (nova mensagem), `RbacNavigation.test.tsx` (novo rótulo) |
| 2 | Campo de kWh aceita "1.240" e "1240,5" | `fe/components/RegisterResultDialog.tsx`, `fe/utils/resultFormValidation.ts` | **Vitest:** novos casos em `resultFormValidation.test.ts` |
| 3 | Separar leitura e escrita por perfil (P10) | `shared/role_groups.py` (novo `PERDAS_WRITE`); `bk/router.py` (dependência nos `POST`/`PATCH`); `navItems` e botões de ação | **Pytest:** `test_loss_router.py` (`diretor` 200 no `GET`, 403 em `POST`/`PATCH`/upload). **Vitest:** botões escondidos para `diretor` |
| 4 | P3: migração e novas colunas (`executar_ate`, `data_inspecao`, `observacoes`, `inspetor`, `motivo_cancelamento`) | `bk/models.py`, `bk/schemas.py`, `bk/update_rules.py`, nova migração, `bk/export.py` | **Pytest:** `test_loss_repository.py` (grava e lê as colunas), `test_loss_upload_router.py` (data do upload é gravada) |
| 5 | Endpoint de inspetores e `bairro`/`municipio` nas ordens | `bk/router.py`, `bk/repository.py`, `bk/schemas.py`; `fe/api/lossApi.ts`, `fe/types/lossTypes.ts` | **Pytest:** rota (40 inspetores, `INSP-001`..`INSP-040`). **Vitest:** `lossApi.test.ts` |
| 6 | Endpoint de detalhe da UC (série de 12 meses, média da classe, inspeções anteriores) | `bk/queries.py`, `bk/repository.py`, `bk/service.py`, `bk/router.py`, `bk/schemas.py`, `bk/router_metadata.py` | **Pytest:** novo `test_loss_unit_detail.py` com UC com e sem inspeção, UC inexistente (404), UC sem medição |
| 7 | Decomposição do score no detalhe (P1): `kWh × chance`, sem pontos por motivo | `bk/scoring.py`, `bk/schemas.py` | **Pytest:** `test_loss_management_service.py` (a decomposição reproduz o `score`) |
| 8 | `Sheet` de detalhe da UC: cabeçalho, score, "por que está na fila", gráfico (`recharts` + `ui/chart.tsx`), inspeções anteriores, "Abrir na UC 360", "Gerar ordem desta UC" | novos `UnitDetailSheet.tsx`, `UnitConsumptionChart.tsx`, hook `useUnitDetailQuery`; `PrioritizedQueueRow.tsx`, `fe/queries/lossQueries.ts` | **Vitest:** abre, carregando, erro e vazio; UC com ordem tem "Gerar" desligado |
| 9 | Diálogos de campo com lista: inspetor (40), data, observações, motivo de cancelamento em lista | `DispatchOrderDialog.tsx`, `RegisterResultDialog.tsx`, `CancelOrderDialog.tsx` | **Vitest:** campos obrigatórios e payload |
| 10 | Exportar a fila de UCs (P5) com as 7 colunas do protótipo | `bk/export.py`, `bk/router.py` (`GET /suspicious-units/export`), `QueueActionsBar.tsx` | **Pytest:** `test_loss_export.py` (colunas, BOM, neutralização). **Vitest:** `ExportOrdersButton.test.tsx` |
| 11 | Importação em duas etapas (P6): `dry_run`, prévia por linha, relatório de erros, banner | `bk/service.py`, `bk/router.py`, `bk/upload_reconcile.py`; `InspectionUploadModal.tsx`, novo `UploadPreviewTable.tsx` | **Pytest:** `dry_run` não grava (contagem e `status` de `ordem_inspecao` iguais antes e depois). **Vitest:** prévia e confirmar |
| 12 | Tarifa da base (P4) | `bk/queries.py`, `bk/queue_repository.py`, `bk/queue_summary.py`, `bk/scoring.py` | **Pytest:** `test_loss_queue_design.py` (tarifa vem da base; sem a tabela, cai na constante) |
| 13 | Paginação e ordenação no servidor; `GET /inspections` paginado | `bk/schemas.py`, `bk/service.py`, `bk/router.py`; `QueueBandTabs.tsx`, `PrioritizedQueueTable.tsx` | **Pytest:** `limit`/`offset` mantêm o `total`. **Vitest:** troca de página |
| 14 | E2E do fluxo Fila → gerar → enviar → registrar (e cancelar) | Novo `frontend/e2e/fila-inspecao.spec.ts`, `playwright.config.ts`, script no `package.json`; banco de teste isolado | **Playwright:** login `perdas@venergy.com`; marcar 2 UCs; gerar; ver 2 cartões em "Pendente"; enviar a campo; registrar resultado; ver em "Concluída"; cancelar outra com motivo e ver a UC de volta na fila. **Não há Playwright no projeto** (procurei `e2e/` e `playwright*` em `frontend/`; `ci.yml` não foi aberto). Rodar contra uma **cópia** do banco, nunca o `v_energy.db` |

Ordem: 1 e 2 entregam valor sem risco; 3 e 4 destravam o resto; 5 a 8 entregam o detalhe da UC (maior diferença); 9 a 12 fecham o fluxo de campo; 13 e 14 endurecem.

---

## 11. Em 3 linhas

1. A fila e as ordens já usam a base real e o fluxo principal funciona, mas com **outra regra de score** (kWh × chance de acerto) e **só 1 dos 5 motivos** do protótipo; hoje são 165 UCs, todas "queda moderada".
2. Faltam o **painel de detalhe da UC**, a **prévia da importação**, inspetor/data/observações/motivo em lista, e a separação de permissão (o `diretor` escreve).
3. Não há Playwright nem migração de banco; ambos precisam entrar antes de mexer no modelo de dados.
