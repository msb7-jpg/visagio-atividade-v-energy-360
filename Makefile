# ==============================================================================
# V-Energy Grid 360 -- Monorepo Management Makefile
# ==============================================================================

.PHONY: help setup-all data-unzip db-upgrade run-backend run-frontend run-llm run-all test-all lint-all lint-backend lint-frontend

help:
	@echo "======================================================================"
	@echo " V-Energy Grid 360 -- Comandos Disponíveis"
	@echo "======================================================================"
	@echo "  make setup-all      - Configura ambientes (uv no backend, bun no frontend)"
	@echo "  make data-unzip     - Extrai as bases de dados para data/landing/"
	@echo "  make db-upgrade     - Adiciona ao banco existente as colunas novas de ordem_inspecao (idempotente)"
	@echo "  make run-backend    - Inicia API FastAPI com Agente de IA integrado (:8000)"
	@echo "  make run-frontend   - Inicia Portal Web React 19 com Vite (:5173)"
	@echo "  make run-llm        - Inicia servidor llama-server local com modelo Qwen3.5-4B (:1234)"
	@echo "  make run-all        - Inicia a stack completa: llama-server + backend + frontend"
	@echo "  make test-all       - Executa testes no backend (pytest) e frontend (vitest)"
	@echo "  make lint-backend   - Executa Ruff, Pylint e import-linter (fronteiras arquiteturais)"
	@echo "  make lint-frontend  - Executa ESLint e Fallow (arquitetura/thresholds/complexidade)"
	@echo "  make lint-all       - Executa todos os linters do monorepo (backend + frontend)"
	@echo "======================================================================"

setup-all:
	@echo "==> Configurando Backend com uv..."
	@cd backend && uv sync --all-extras
	@echo "==> Configurando Frontend com bun..."
	@cd frontend && bun install
	@echo "✓ Todos os módulos foram inicializados!"

data-unzip:
	@bash scripts/data_sync.sh

db-upgrade:
	@cd backend && uv run python -m app.features.loss_management.schema_upgrade

run-backend:
	@cd backend && uv run uvicorn app.main:app --reload --port 8000

run-frontend:
	@cd frontend && bun run dev

run-llm:
	@~/workspace/llama.cpp/build/bin/llama-server \
		-m ~/workspace/llama.cpp/models/Qwen3.5-4B-Q4_K_M.gguf \
		-ngl 999 -c 64000 -np 2 \
		-fa on \
		--host 0.0.0.0 \
		--port 1234 \
		--no-context-shift

run-all:
	@bash scripts/dev_local.sh

test-all:
	@echo "==> Executando testes do backend..."
	@cd backend && uv run pytest
	@echo "==> Executando testes do frontend..."
	@cd frontend && bun run test
	@echo "✓ Todos os testes passaram!"

# ------------------------------------------------------------------------------
# Linting do Backend (Ruff + Pylint + import-linter)
# - Ruff: validação instantânea de estilo PEP 8, imports, complexidade mccabe e boas práticas.
# - Pylint: validação aprofundada de design, teto de linhas por módulo (300), tamanho de funções (40 statements),
#   aninhamentos máximos e proibição estrita de variáveis monossílabas (ex: for k, n in ...).
# - import-linter: garante contratos arquiteturais (serviços Pure Python, isolamento do agente e do banco).
# ------------------------------------------------------------------------------
lint-backend:
	@echo "==> [Backend] Linting Python com Ruff (estilo e boas práticas)..."
	@cd backend && uv run ruff check .
	@echo "==> [Backend] Análise de Design com Pylint (tamanhos de arquivos, métodos e nomes)..."
	@cd backend && uv run pylint app
	@echo "==> [Backend] Verificação de Fronteiras Arquiteturais com import-linter..."
	@cd backend && uv run lint-imports
	@echo "✓ Backend linting concluído com sucesso!"

# ------------------------------------------------------------------------------
# Linting do Frontend (ESLint + Fallow)
# - ESLint: padrões do React 19, regras de design system shadcn e formatação.
# - Fallow: análise estática de arquitetura, clones/duplicação (<=5%), tamanho de componentes (<=150 LOC)
#   e complexidade ciclomática/cognitiva (<=15).
# ------------------------------------------------------------------------------
lint-frontend:
	@echo "==> [Frontend] Linting TypeScript/React com ESLint..."
	@cd frontend && bun run lint
	@echo "==> [Frontend] Análise de Arquitetura e Thresholds com Fallow..."
	@cd frontend && bun run lint:fallow
	@echo "✓ Frontend linting concluído com sucesso!"

# ------------------------------------------------------------------------------
# Pipeline Unificado de Linting para todo o Monorepo
# ------------------------------------------------------------------------------
lint-all: lint-backend lint-frontend
	@echo "✓ Todos os linters do monorepo foram executados com sucesso!"

