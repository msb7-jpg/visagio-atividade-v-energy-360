# Diretrizes e Contrato de Engenharia para Agentes e Desenvolvedores (AGENTS.md)

Este documento estabelece o **contrato de governança, qualidade, padrões de commit e roteamento de conhecimento** para todos os Agentes de Inteligência Artificial e Desenvolvedores que atuam no repositório **V-Energy Grid 360**.

---

## 🎯 Processo Atual de Entrega: Fatias Verticais Ponta a Ponta & Identificação Obrigatória

> [!IMPORTANT]
> **Contexto do Projeto (Prazo: 04/11/2026):**
> O desenvolvimento do **V-Energy Grid 360** está organizado em **Fatias Verticais Ponta a Ponta (*End-to-End Vertical Slices*)**, onde cada um dos 7 membros da equipe é o dono exclusivo e não-bloqueante de uma fatia completa (do banco ao frontend e testes).
> O plano diretor reside em [`docs/planning/ROADMAP.md`](docs/planning/ROADMAP.md) e o trabalho está distribuído em pastas individuais:
> - `docs/planning/renan/` (Cadastro, Medição & GD)
> - `docs/planning/ryei_estevan/` (Faturamento, Rede DEC/FEC & Atendimento)
> - `docs/planning/bernardo/` (Visão 360 da UC Fullstack)
> - `docs/planning/celio/` (Inteligência Comercial, Receita & Decomposição Fullstack)
> - `docs/planning/adrian_cesar/` (Gestão de Perdas, Fila de Fiscalização & Campo Fullstack)
> - `docs/planning/joao_henrique/` (Qualidade da Rede DEC/FEC & Plataforma com RBAC Fullstack)
> - `docs/planning/miguel/` (Agente Text-to-SQL, IA Embutida & Avaliação Fullstack IA)

### 👤 Identificação Obrigatória do Desenvolvedor / Agente
Ao interagir com o repositório ou iniciar qualquer tarefa, **o desenvolvedor ou agente DEVE obrigatoriamente indicar**:
1. **Quem ele é** (qual dos 7 membros da equipe ele é ou representa).
2. **No que está trabalhando** (qual fatia vertical e qual tarefa específica do checklist em `docs/planning/<membro>/`).

**Fluxo de Trabalho Obrigatório:**
- **Início:** Marcar `[- Em andamento por <Nome> - YYYY-MM-DD]` no checklist da sua pasta.
- **Desenvolvimento:** Respeitar os limites de tamanho ($\le 300$ linhas backend, $\le 150$ linhas frontend) e isolamento de camadas.
- **Validação:** Rodar `make lint-all` e `make test-all`.
- **Conclusão:** Marcar `[x]` no checklist e registrar a entrega no seu diário exclusivo `docs/planning/<membro>/changelog.md`.
- **Isolamento:** Nunca edite arquivos de planejamento de outro membro para evitar conflitos de merge.

---

## ⚡ Regra Zero: Validação Mandatória Pré-Conclusão

> [!IMPORTANT]
> **Nenhuma tarefa deve ser entregue ou commitada sem que os linters e testes passem com 100% de sucesso.**
> Antes de concluir qualquer atividade, abrir um PR ou realizar um commit, execute:
> ```bash
> make lint-all   # Backend (Ruff + Pylint + import-linter) e Frontend (ESLint + Fallow)
> make test-all   # Backend (pytest) e Frontend (vitest)
> ```
> Para validações parciais por módulo:
> - **Backend:** `make lint-backend` e `cd backend && uv run pytest`
> - **Frontend:** `make lint-frontend` e `cd frontend && bun run test`

---

## 🧭 Mapa de Skills e Documentos Mestres do Repositório

Para manter este documento conciso, detalhes arquiteturais aprofundados e padrões de implementação estão encapsulados em **Skills especializadas** e no **Design System**:

| Referência / Skill | Localização | Quando Utilizar |
|---|---|---|
| **`design.md`** | [`design.md`](design.md) | **Especificação canônica da interface visual** (SaaS Enterprise Analytics): paleta Corporate Blue, tokens semânticos, escala de 12px, contratos de componentes (`<Button fullWidth>`, `<Card variant="...">`), tipografia e receitas prontas de UI. |
| **`backend-coding-standards`** | [`.agents/skills/backend-coding-standards/SKILL.md`](.agents/skills/backend-coding-standards/SKILL.md) | Criar ou refatorar rotas FastAPI, serviços Pure Python, repositórios, injeção de dependências (`Annotated[T, Depends()]`), schemas Pydantic, handlers de exceção e testes com fixtures assíncronas. |
| **`frontend-coding-standards`** | [`.agents/skills/frontend-coding-standards/SKILL.md`](.agents/skills/frontend-coding-standards/SKILL.md) | Arquitetar componentes React 19 em fatias verticais, aplicar o padrão Headless Controller, decompor componentes $>150$ LOC, estruturar fluxos JSX planos e animações via `motion/react`. |
| **`shadcn`** | [`.agents/skills/shadcn/SKILL.md`](.agents/skills/shadcn/SKILL.md) | Descobrir, compor, instalar e debugar componentes de UI (botões, diálogos, tabelas, cards). Consultar boas práticas contra o anti-padrão `shadcn/no-restyle` e acessibilidade Radix UI. |
| **`tanstack-query`** | [`.agents/skills/tanstack-query/SKILL.md`](.agents/skills/tanstack-query/SKILL.md) | Implementar chamadas à API, query options reutilizáveis, gerenciamento de cache, mutações com travamento de botão (`isPending`) e cancelamento automático via `AbortSignal`. |
| **`medallion-lakehouse-pipeline`** | [`.agents/skills/medallion-lakehouse-pipeline/SKILL.md`](.agents/skills/medallion-lakehouse-pipeline/SKILL.md) | Projetar ou ajustar notebooks Databricks PySpark (camadas Bronze, Silver, Gold), calcular indicadores regulatórios (DEC/FEC), configurar jobs declarativos (`job.yaml`) e exportar Delta para SQLite (`v_energy.db`). |

---

## 1. Diretrizes Inegociáveis do Backend (Python 3.12+, FastAPI, uv)

### 1.1 Limites Físicos e Anti-God Files (Pylint)
- **Teto por Arquivo:** Máximo de **300 linhas por módulo** (`max-module-lines = 300`). Passou disso, extraia sub-módulos ou colaboradores especializados.
- **Tamanho de Funções/Métodos:** Máximo de **45 instruções (`statements`)** ou aprox. **50 linhas**.
- **Aninhamento:** Máximo de 3 a 4 níveis de blocos (`max-nested-blocks = 4`).

### 1.2 Nomenclatura Estrita de Variáveis
- **Banidas:** Variáveis genéricas ou monossílabas (`k`, `v`, `n`, `m`, `i`, `j`, `foo`, `bar`, `baz`, `temp`, `tmp`, `val`, `item`).
- **Permitidas apenas:** `_` (descarte), `id` (identificador único), `db` (sessão ORM), `app` (FastAPI), `fn` (callable), `e` (exceção).
- **Regra:** Utilize sempre nomes autoexplicativos que revelam o domínio de negócio (ex: `for metric_key, metric_value in metrics_map.items():`).

### 1.3 Contratos Arquiteturais Matemáticos (Import-Linter)
Verificados formalmente via `uv run lint-imports`:
1. **Serviços são Pure Python:** `app.features.*.service` é impedido de importar `fastapi`, `starlette` ou `sse_starlette`.
2. **Isolamento do Agente de IA:** O núcleo autônomo `app.agent` não pode importar `fastapi`, `starlette`, `app.api` ou `app.features`.
3. **Isolamento do Banco de Dados:** `app.db` não pode importar regras de negócio (`app.features`), agentes (`app.agent`), rotas (`app.api`) ou `fastapi`.
4. **Exceções Centrais sem Framework:** `app.shared.exceptions` utiliza `http.HTTPStatus` nativo do Python (zero dependência de FastAPI).

---

## 2. Diretrizes Inegociáveis do Frontend (React 19, TypeScript, Bun)

### 2.1 Limiares de Saúde e Complexidade (Fallow)
Definidos em [`frontend/.fallowrc.jsonc`](frontend/.fallowrc.jsonc) e validados via `bun run lint:fallow`:
- **Tamanho de Componente:** Máximo de **150 linhas** (`maxUnitSize`).
- **Complexidade Ciclomática e Cognitiva:** Máximo de **15** (`maxCyclomatic` e `maxCognitive`).
- **Duplicação de Código (Clones):** Tolerância máxima de **5.0%** (`threshold`).

### 2.2 Governança do Design System e Conformidade Visual
1. **Conformidade Obrigatória com [`design.md`](design.md):** Todas as telas e componentes visuais devem seguir os tokens semânticos, a escala de arredondamento de 12px, o uso da prop `fullWidth` no `Button` e variantes de `Card` (`variant="glass"`, `variant="interactive"`).
2. **Tags HTML Nativas Proibidas:** Nunca use `<button>`, `<input>`, `<select>` ou `<textarea>` fora de `src/components/ui/`.
3. **Respeito aos Estilos Base (`shadcn/no-restyle`):** Não tente sobrescrever cores, larguras ou espaçamentos de botões via `className` (`deny: ["w-*", "h-*", "p-*", "bg-*"]`). Use a prop `fullWidth` no Button e variantes no Card.
4. **Sem Cores Brutas ou Valores Arbitrários:** Nunca use cores Tailwind arbitrárias (`bg-slate-900`) ou colchetes (`text-[11px]`, `min-h-[100dvh]`). Use tokens semânticos (`bg-background`, `text-foreground`, `min-h-dvh`).
5. **Anti-Leaked-Render Obrigatório:** Nunca use `{condition && <Component />}` quando a condição puder ser avaliada como número ou string. Use sempre ternários explícitos: `{condition ? <Component /> : null}`.
6. **Animações exclusivamente via `motion/react`:** O pacote `framer-motion` é estritamente proibido.
7. **Sem Arquivos Barrel (`index.ts`):** Importe componentes diretamente do seu arquivo de definição.

---

## 3. Padrão de Commit Semântico (Conventional Commits)

Todos os desenvolvedores e agentes devem estruturar suas mensagens de commit seguindo o formato:

```text
<tipo>(<escopo>): <descrição clara e concisa no modo imperativo>
```

### 3.1 Tipos Permitidos (`<tipo>`)
- **`feat`:** Adição de nova funcionalidade de negócio, endpoint, componente ou nó da FSM.
- **`fix`:** Correção de bug ou regressão em backend, frontend ou pipeline.
- **`refactor`:** Modificação interna de código sem alteração de comportamento externo.
- **`style`:** Ajustes visuais, alinhamento ao `design.md`, CSS, espaçamentos ou formatação.
- **`test`:** Criação ou atualização de testes unitários (pytest, vitest) ou golden dataset.
- **`docs`:** Atualizações de documentação, roadmaps, changelogs ou especificações.
- **`perf`:** Otimização de consultas SQL, performance de renderização ou redução de bundle.
- **`chore`:** Atualizações de build, dependências, makefile ou configurações de linters.

### 3.2 Escopos Padronizados (`<escopo>`)
- **Fatias Verticais do Projeto:**
  - `fatia-01-cadastro`: Cadastro, Medição e GD (Renan).
  - `fatia-02-faturamento`: Faturamento e DEC/FEC (Ryei Estevan).
  - `fatia-03-visao360`: Visão 360 da Unidade Consumidora (Bernardo).
  - `fatia-04-receita`: Inteligência Comercial e Decomposição de Receita (Célio).
  - `fatia-05-perdas`: Gestão de Perdas e Fila de Fiscalização (Adrian César).
  - `fatia-06-qualidade`: Qualidade da Rede e Plataforma RBAC (João Henrique).
  - `fatia-07-ia`: Agente Text-to-SQL, IA Embutida e Avaliação (Miguel).
- **Módulos Transversais:**
  - `design-system`: Tokens, CSS global, componentes de UI base.
  - `auth`: Autenticação JWT, contexto de sessão e rotas protegidas.
  - `pipeline`: Camadas Bronze, Silver, Gold do Databricks e export SQLite.
  - `deps`: Atualizações de pacotes e ferramentas de desenvolvimento.

### 3.3 Exemplos Válidos de Commits
- `feat(fatia-07-ia): implementa streaming SSE com passos de raciocínio da FSM`
- `style(design-system): adapta cores corporativas e tokens de 12px ao design.md`
- `fix(auth): substitui atribuição de href por window.location.assign`
- `test(fatia-07-ia): adiciona 25 perguntas ao golden dataset de avaliação`
- `docs(fatia-07-ia): registra entrega no diário de bordo changelog.md`

> [!CAUTION]
> **Bloqueio Mandatório:** É expressamente proibido realizar commits sem que `make lint-all` e `make test-all` estejam 100% aprovados.

---

## 4. Resumo de Comandos Rápidos (`Makefile`)

```bash
make help           # Lista interativa de todos os comandos disponíveis
make setup-all      # Instala dependências do backend (uv) e frontend (bun)
make data-unzip     # Descompacta bases históricas para data/landing/
make run-backend    # Inicia API FastAPI (:8000 com docs em /docs)
make run-frontend   # Inicia Portal React 19 (:5173)
make lint-backend   # Executa Ruff + Pylint + import-linter
make lint-frontend  # Executa Fallow + ESLint
make lint-all       # Executa todos os linters do monorepo
make test-all       # Executa testes unitários (pytest + vitest)
```
