# Regras de negócio: Qualidade da Rede e RBAC (Fatia 06)

Dono: João Henrique. Este arquivo é o **índice das regras** da fatia, no estado do código em 2026-11-04.
Cada regra aponta para a constante e o arquivo onde vive. O **porquê** está em
[`docs/DECISOES.md`](../../DECISOES.md), citado entre parênteses (ADR); o texto não é repetido aqui. Se uma regra
mudar, atualize aqui, na ADR e no `changelog.md`.

Caminhos são relativos a `backend/app/features/grid_quality/` (backend) e `frontend/src/` (frontend), salvo
quando começam por `backend/`, `frontend/` ou `data-engineering/`.

## 1. Quem acessa o quê por perfil

- Os papéis são os membros de `UserRole` (`backend/app/core/constants.py`); **não há perfil ADMIN**. (ADR-024)
- Os grupos vivem em `backend/app/shared/role_groups.py`: `DIRETORIA_ONLY`, `OPERACAO_ACCESS`,
  `ATENDIMENTO_ACCESS`, `PERDAS_ACCESS`, `PERDAS_WRITE` e `CUSTOMER360_ACCESS`. (ADR-024)
- `require_role` e os aliases `Require*` ficam em `backend/app/shared/dependencies.py`; as rotas de Qualidade da
  Rede usam `RequireOperacao` (diretor e gerente de operação) em `router.py`.
- A Visão 360 abre para cinco papéis, incluindo o gerente de operação, que chega nela pelo ranking de
  circuitos (`CUSTOMER360_ACCESS`). (ADR-022)
- No frontend, `NAV_ITEMS` (`frontend/src/components/layout/navItems.ts`) é a fonte única dos papéis por tela e
  **espelha** `role_groups.py`; `routes/AppRoutes.tsx` lê dele e `ProtectedRoute.tsx` mostra "Acesso Restrito".
  Ao mudar um lado, mude o outro. (ADR-024)

## 2. DEC/FEC e denominador `ucs_atendidas`

- **DEC** = horas de interrupção ÷ UCs atendidas; **FEC** = UCs interrompidas ÷ UCs atendidas. O denominador é
  **fixo por alimentador**, não soma as linhas mensais. (ADR-003, ADR-025)
- A Continuidade conta `ucs_atendidas` uma vez por alimentador do escopo: `feeder_ucs_query` em
  `continuity_queries.py`. O Painel usa a mesma consulta, para os dois mostrarem o mesmo número. (ADR-012)
- O DEC/FEC do case serve para comparar alimentadores e períodos entre si, não com limites regulatórios reais.
  (ADR-003)

## 3. Limite de referência, mediana dos conjuntos e alerta em 85%

- O limite é **anual** e vem da coluna do contrato (`dec_limite_aneel`, `fec_limite_aneel`), por conjunto
  (`criterio_limite = CONJUNTO`). (ADR-003)
- Recife, Paulista, Abreu e Lima e Araçoiaba não têm conjunto próprio e usam a **mediana dos 10 conjuntos
  mapeados** (`criterio_limite = MEDIANA_RMR`). A conta roda na Gold (`data-engineering/notebooks/fatia02_gold.ipynb`);
  a tela marca esses casos como aproximação em `features/grid_quality/components/FeederRankingTable.tsx`. (ADR-003)
- A classificação usa o **acumulado no ano**: `VIOLACAO` acima do limite, `ALERTA` a partir de 85%
  (`LIMIAR_ALERTA`), `CONFORME` nos demais. Está em `classify_status`, `rules.py`. Limite nulo ou zero não gera
  alerta. O backend recalcula e não lê `violou_meta`. (ADR-003)
- Na tela o limite é "limite de referência", sem falar em multa. Os nomes de campo do contrato não mudam.
  (ADR-003)

## 4. Períodos A e B de 12 meses

- Período A = primeiros 12 meses da série; B = últimos 12 (`MESES_POR_PERIODO`, `continuity_rules.py`). Saem dos
  dados, sem datas fixas; com série curta, A e B encolhem sem se sobrepor (`split_periods`). (ADR-025)
- Histórico do circuito: 1 a 48 meses, padrão 48 (`MESES_HISTORICO_*`, `service.py`). Clientes mais afetados:
  `meses` 1 a 48 (padrão 12) e `limite` 1 a 50 (padrão 10) (`MESES_CLIENTES_*` e `LIMITE_CLIENTES_*`,
  `continuity_service.py`). (ADR-025)

## 5. Evento fora do padrão (K=3)

- Um mês é evento extremo quando suas UC-horas na rede inteira passam de **3 vezes a mediana mensal** da série
  (`LIMIAR_EVENTO_EXTREMO`, `detect_event` em `continuity_rules.py`). É o mesmo mês para qualquer município.
  (ADR-025)
- `incluir_evento=false` tira o mês de A e de B. Sem mês acima do limiar, `event` é nulo. (ADR-025)
- Com filtro de causa, o cartão traz `extremeInScope`; o mês continua detectado na rede inteira. (ADR-025)

## 6. Causas atacáveis (suposição)

- `VEGETACAO`, `FALHA DE EQUIPAMENTO` e `SOBRECARGA` (`CAUSAS_ATACAVEIS`, `continuity_rules.py`). As demais, e
  "Sem causa registrada" (`CAUSA_NAO_INFORMADA` = `NAO INFORMADA`), não contam. (ADR-025)
- **Suposição de negócio, a validar com a Fatia 02.** Sem validação, o percentual atacável é indicativo. (ADR-025)

## 7. O que não é filtro (bairro) e por quê

- O filtro da Continuidade é **município** (`scope_query`, `continuity_queries.py`) e **causa** (`causa`).
  O bairro **não é filtro**. (ADR-025, itens 6 e 7)
- Motivo: um alimentador atende vários bairros, então filtrar exigiria filtrar a ocorrência por UC, e há nomes de
  bairro repetidos entre municípios. Os números estão na ADR-025.
- O bairro está fora de escopo da fatia; o escopo continua isolado em `scope_query`.

## 8. Amostra pequena e ranking dos 20 maiores

- Alimentador com **menos de 50 UCs atendidas** (`LIMITE_AMOSTRA_PEQUENA_UCS`) sai com `small_sample`; a tela
  mostra o selo "amostra pequena" (`components/FeederUcHoursTable.tsx`), porque o denominador pequeno deixa
  DEC/FEC instável. (ADR-025)
- A tabela de circuitos mostra só os **20 maiores em UC-horas** (`LIMITE_CIRCUITOS_RANKING`). O percentual da rede
  usa o total do escopo, não os 20. (ADR-025)
- Faixas de cor do mapa por DEC: `DEC_BANDS` em `features/grid_quality/utils/continuityBands.ts`.

## 9. Limites conhecidos

- As causas atacáveis são suposição, sem validação da Fatia 02. (ADR-025)
- Os limites de Recife, Paulista, Abreu e Lima e Araçoiaba são aproximações pela mediana. (ADR-003)
- As coordenadas dos municípios em `municipalities.py` são estáticas e aproximadas, não vêm do banco. (ADR-025)
- Não há filtro de bairro na Continuidade. (ADR-025)
- A lista de papéis do frontend (`NAV_ITEMS`) é mantida à mão e pode divergir de `role_groups.py`; os testes
  `RbacNavigation.test.tsx` e `routes/__tests__/RbacMatrix.test.tsx` cobrem a matriz. (ADR-024)
