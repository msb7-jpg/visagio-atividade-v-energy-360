# ⚡ V-Energy Grid 360

Plataforma inteligente de análise de dados e indicadores regulatórios do setor elétrico brasileiro (DEC, FEC, consumo, tarifas e mercado). A solução integra um **Portal Web moderno em React 19** com um **Agente Analítico de Inteligência Artificial Text-to-SQL (FastAPI + LangGraph)** capaz de responder dúvidas de negócio e gerar gráficos automaticamente em tempo real.

---

## 🚀 Como Rodar o Projeto (Guia Rápido)

O projeto é gerenciado via [`Makefile`](Makefile) (Linux/macOS) ou via [`scripts/dev.ps1`](scripts/dev.ps1) (Windows, sem precisar do `make`).

### Pré-requisitos
- [uv](https://docs.astral.sh/uv/) (gerenciador rápido para Python 3.12+); no Windows, `pip install --user uv` também funciona
- [bun](https://bun.sh/) (runtime e gerenciador de pacotes para JavaScript/TypeScript); no Windows, `npm install -g bun` também funciona
- `make` (apenas Linux/macOS)
- Os arquivos `base_dados_1.zip` e `base_dados_2.zip` na raiz do projeto (fora do git)

### Passo a Passo (Linux/macOS)

```bash
# 1. Configurar dependências e ambientes virtuais (backend + frontend)
make setup-all

# 2. Descompactar as bases de dados históricas para data/landing/
make data-unzip

# 3. Iniciar o Backend FastAPI (:8000) com Swagger em http://localhost:8000/docs
make run-backend

# 4. Iniciar o Frontend React 19 (:5173) em http://localhost:5173
make run-frontend
```

### Passo a Passo (Windows / PowerShell)

```powershell
# 1. Instalar dependências do backend e do frontend
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 setup

# 2. Descompactar as bases para data\landing
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 data

# 3. Subir backend (:8000, em outra janela) e frontend (:5173) juntos
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 dev

# Para usar outro banco SQLite (ex: o de testes gerado com o comando "seed"):
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 seed
powershell -ExecutionPolicy Bypass -File scripts\dev.ps1 dev -Database backend\v_energy_dev.db
```

Demais comandos: `backend`, `frontend`, `lint`, `test` e `check` (lint, testes, TypeScript e build). `scripts\dev.ps1 help` lista todos.

---

## 🧪 Testes e Qualidade

O repositório possui uma suíte completa de testes automatizados e análise estática:

```bash
# Executa todos os linters do monorepo (Ruff + Pylint + import-linter + ESLint + Fallow)
make lint-all

# Executa todos os testes unitários e de integração (pytest no backend, vitest no frontend)
make test-all
```

Se preferir validar apenas um dos módulos:
- **Backend:** `make lint-backend` e `cd backend && uv run pytest`
- **Frontend:** `make lint-frontend` e `cd frontend && bun run test`
- **Windows:** `scripts\dev.ps1 lint`, `scripts\dev.ps1 test` ou `scripts\dev.ps1 check` (tudo, igual ao CI)

### Integração Contínua (GitHub Actions)

Todo pull request e todo push na `main` rodam o workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), em dois jobs paralelos:
- **Backend:** Ruff, Pylint, import-linter e pytest, com as dependências instaladas pelo `uv.lock` congelado.
- **Frontend:** ESLint, Fallow, TypeScript, Vitest e build de produção, com o `bun.lock` congelado.

Um PR com qualquer etapa vermelha não deve ser mergeado.

---

## 🏗️ Arquitetura e Lógica da Codebase

### 1. Backend (Python 3.12, FastAPI, LangGraph, uv)
O backend é estruturado em **Fatias Verticais (*Vertical Slices*)** e adota os princípios de **Clean Architecture**:

### 2. Frontend (React 19, TypeScript, Vite, Bun)
- **Design System Shadcn & Radix UI:** Componentes modulares padronizados em `src/components/ui/`.
- **Governança de Estado Assíncrono com TanStack Query v5:** Consultas otimizadas com cancelamento automático de requisições obsoletas (`signal`).
- **Streaming em Tempo Real:** Renderização progressiva dos passos de raciocínio do agente e montagem interativa de gráficos Chart.js.

---

## 🛡️ Principais Regras e Guardrails de Engenharia

Para manter a codebase limpa, sustentável e livre de "God Files", regras estritas são validadas em tempo de build:

| Ferramenta | O que Valida | Regra Não-Negociável |
|---|---|---|
| **Pylint** | Tamanho de arquivos e métodos | Máximo de **300 linhas por módulo** (`max-module-lines = 300`) e **45 statements por função**. |
| **Pylint** | Nomes de variáveis expressivos | **Proibidas variáveis monossílabas** (`k`, `v`, `n`, `m`, `i`, `val`, `temp`, `data`). Exija nomes que revelam o domínio (ex: `metric_key`, `outage_event`). |
| **Import-Linter** | Fronteiras de arquitetura limpa | **Serviços, Agentes e Banco de Dados** não podem importar `fastapi` ou acoplar camadas indevidas. |
| **Ruff** | Sintaxe e estilo PEP 8 | Linhas até 120 caracteres, remoção de imports não utilizados e regras modernas do Python 3.12. |
| **Fallow** | Saúde e complexidade do frontend | Componentes com **$\le 150$ linhas**, complexidade ciclomática e cognitiva **$\le 15$**, duplicação **$\le 5.0\%$**. |
| **Design System** | Consistência visual | **Proibido usar tags HTML nativas** (`<button>`, `<input>`) fora de `components/ui/` e proibido sobrescrever estilos base. |

> Consulte o arquivo [`AGENTS.md`](AGENTS.md) para as diretrizes detalhadas de desenvolvimento.

> Design system: https://designmd.app/library/saas-enterprise-analytics