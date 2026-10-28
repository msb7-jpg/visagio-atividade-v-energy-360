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

## 🧱 Pipeline de Dados (Databricks)

O banco `backend/v_energy.db` usado pelo portal e pela IA é gerado por um pipeline **Bronze → Silver → Gold** no Databricks, orquestrado por um Workflow e exportado em CSV e SQLite.

| Peça | Onde está |
|---|---|
| Notebooks (`.ipynb`) | [`data-engineering/notebooks/`](data-engineering/notebooks/) |
| Workflow (Job) | [`data-engineering/job.yaml`](data-engineering/job.yaml), implantado pelo bundle [`data-engineering/databricks.yml`](data-engineering/databricks.yml) |
| Fonte externa (limites ANEEL de DEC/FEC) | [`data-engineering/reference/aneel_limites_continuidade.csv`](data-engineering/reference/aneel_limites_continuidade.csv) |
| Dicionário de dados da Gold | [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) |
| Decisões e suposições (ADRs) | [`docs/DECISOES.md`](docs/DECISOES.md) |

Tudo fica no catálogo `visagio_atividade_v_energy_360`, com um schema por camada (`bronze`, `silver`, `gold`). O Workflow roda as tarefas de cada fatia em paralelo quando possível, executa os **testes de qualidade** das duas fatias e só então exporta: se algum teste falhar, o job para e o portal continua com os últimos dados bons.

### Como executar

Pré-requisitos: [Databricks CLI](https://docs.databricks.com/dev-tools/cli/install.html) autenticado (`databricks auth login --host https://<seu-workspace>`) e as bases descompactadas (`make data-unzip`).

```bash
# 1. Criar catálogo, schema e Volume de landing (no Free Edition, rode no SQL Editor do Databricks):
#    CREATE CATALOG IF NOT EXISTS visagio_atividade_v_energy_360;
#    CREATE SCHEMA IF NOT EXISTS visagio_atividade_v_energy_360.bronze;
#    CREATE VOLUME IF NOT EXISTS visagio_atividade_v_energy_360.bronze.landing;

# 2. Enviar os arquivos brutos e a fonte externa da ANEEL para o Volume de landing
databricks fs cp -r data/landing/ dbfs:/Volumes/visagio_atividade_v_energy_360/bronze/landing/ --overwrite
databricks fs cp data-engineering/reference/aneel_limites_continuidade.csv \
  dbfs:/Volumes/visagio_atividade_v_energy_360/bronze/landing/ --overwrite

# 3. Importar os notebooks para uma pasta do workspace
databricks workspace import-dir data-engineering/notebooks /Workspace/V_Energy_Analytics --overwrite

# 4. Implantar e rodar o Workflow (prod mantém a agenda; sem -t prod, o job de teste fica pausado)
cd data-engineering
databricks bundle deploy -t prod --var="notebooks_dir=/Workspace/V_Energy_Analytics"
databricks bundle run -t prod Job_Energy --var="notebooks_dir=/Workspace/V_Energy_Analytics"

# 5. Baixar o banco gerado para o backend
cd ..
databricks fs cp dbfs:/Volumes/visagio_atividade_v_energy_360/gold/exports/v_energy.db backend/v_energy.db --overwrite
```

As tabelas Gold também ficam em CSV (um arquivo por tabela) em `/Volumes/visagio_atividade_v_energy_360/gold/exports/`.

### Estratégia de agendamento

O Workflow roda **todo dia 1º, às 04h (horário de Recife)**. Faturamento, leituras e indicadores DEC/FEC são fechados por **competência mensal**, então reprocessar uma vez por mês, logo após o fechamento, entrega o mês completo sem gastar computação com dados que não mudaram. A madrugada evita concorrência com o uso do portal, e uma execução por vez (`max_concurrent_runs: 1`) impede que duas cargas gravem o `v_energy.db` ao mesmo tempo.

### Execução bem-sucedida do Workflow

Execução de ponta a ponta do Workflow no Databricks, com todas as tarefas concluídas com sucesso:

![Execução bem-sucedida do Workflow no Databricks](docs/img/workflow_databricks.png)

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
- **Streaming em Tempo Real:** Renderização progressiva dos passos de raciocínio do agente, código SQL e respostas executivas estruturadas.

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