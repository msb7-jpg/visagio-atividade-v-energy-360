# 🕵️ Fatia 05: Gestão de Perdas, Fila de Fiscalização & Campo (Fullstack)

> **Dono Único:** Adrian Cesar  
> **Status:** Não Iniciado  
> **Skills de Referência:** [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) & [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md)  
> **Log Individual:** [`changelog.md`](changelog.md)

---

## 1. Citações Oficiais e Requisitos (`atividade.pdf`)

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

- [ ] Criar pasta `backend/app/features/loss_management/` com schemas, repositório, serviço e rotas CRUD.
- [ ] Implementar endpoint de exportação de dados em CSV/XLSX.
- [ ] Implementar endpoint multipart de upload de planilha com validação e conciliação no banco.
- [ ] Registrar rotas em `backend/app/api/v1/router.py`.
- [ ] Criar testes unitários e de integração em `backend/tests/test_loss_management_service.py` e `test_loss_router.py`.
- [ ] Garantir conformidade com `make lint-backend`.
- [ ] Criar pasta `frontend/src/features/loss_management/` com componentes $\le 150$ linhas.
- [ ] Implementar modal de upload drag-and-drop e botão de exportação.
- [ ] Adicionar rota `/losses` em `frontend/src/routes/AppRoutes.tsx`.
- [ ] Criar testes no frontend com Vitest em `LossManagementPage.test.tsx`.
- [ ] Garantir conformidade com `make lint-frontend`.

---

## 4. Instruções de Auto-Atualização

1. Antes de iniciar, marque o item como `[- Em andamento por Adrian Cesar - YYYY-MM-DD]`.
2. Após implementar, rodar linters e testes (`make lint-all` e `make test-all`), marque `[x]`.
3. Registre detalhadamente a entrega em [`changelog.md`](changelog.md).
