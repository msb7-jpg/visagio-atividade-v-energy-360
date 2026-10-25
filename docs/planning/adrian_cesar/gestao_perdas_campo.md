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
- [ ] Confirmar com **Renan** que `fato_medicao.competencia` sai como `'YYYY-MM'` (o checklist dele também cita `MM/YYYY` na `dim_calendario`; o backend de perdas assume `YYYY-MM`).
- [ ] Confirmar com **Ryei** as colunas de `fato_inspecoes_perdas` (`id_inspecao`, `id_uc`, `data_inspecao`, `irregularidade_constatada`, `tipo_irregularidade`, `kwh_recuperado`).

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
- [ ] Tarifa real de `fato_faturamento` no valor a recuperar (aguarda Ryei).

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
- [ ] Quando Renan/Ryei exportarem a Gold: **apagar** o seed local da Fase 1 e as tabelas geradas por ele, rodar a fila contra os dados reais e conferir os números.

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
- Fora desta entrega (decisão em aberto): motivos novos do desenho (abaixo dos vizinhos, leituras estimadas, irregularidade confirmada antes), "Ver acerto por inspetor" (Fatia 07) e distribuição por inspetor.

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


