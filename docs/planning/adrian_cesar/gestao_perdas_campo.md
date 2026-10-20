# 🕵️ Fatia 05: Gestão de Perdas, Fila de Fiscalização & Campo (Fullstack)

> **Dono Único:** Adrian Cesar  
> **Status:** Em andamento 
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

### Fala do Executivo (`atividade.pdf`, pág. 6):
> **Rafael Coutinho · Gerente de Perdas:**  
> *"Minha equipe faz cerca de 200 inspeções por mês, mas nosso hit rate histórico gira em torno de 50%. Metade das vezes chegamos lá e o cliente está regular. Perco um dia de equipe, combustível, e deixo de inspecionar quem realmente está fraudando. Se o sistema me desse uma lista ordenada por probabilidade de irregularidade e energia estimada a recuperar, a gente dobrava a recuperação sem contratar ninguém."*

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
- [ ] Implementar endpoint de exportação de dados em CSV/XLSX.
- [ ] Implementar endpoint multipart de upload de planilha com validação e conciliação no banco.
- [x] Registrar rotas em `backend/app/api/v1/router.py`.
- [- Em andamento por Adrian Cesar - 2026-10-19] Criar testes unitários e de integração em `backend/tests/test_loss_management_service.py` e `test_loss_router.py`.
- [x] Garantir conformidade com `make lint-backend`.
- [ ] Criar pasta `frontend/src/features/loss_management/` com componentes $\le 150$ linhas.
- [ ] Implementar modal de upload drag-and-drop e botão de exportação.
- [ ] Adicionar rota `/losses` em `frontend/src/routes/AppRoutes.tsx`.
- [ ] Criar testes no frontend com Vitest em `LossManagementPage.test.tsx`.
- [ ] Garantir conformidade com `make lint-frontend`.

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
     - Filtro por Município e Classe tarifária.
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


