#!/usr/bin/env bash
# ==============================================================================
# V-Energy Grid 360 -- Execução Integrada Local (llama.cpp + Backend + Frontend)
# ==============================================================================

set -eo pipefail

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[36m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

LLAMA_SERVER="${HOME}/workspace/llama.cpp/build/bin/llama-server"
LLAMA_MODEL="${HOME}/workspace/llama.cpp/models/Qwen3.5-4B-Q4_K_M.gguf"
LLAMA_PORT="1234"
BACKEND_PORT="8000"
FRONTEND_PORT="5173"

echo -e "\n${C_BOLD}${C_CYAN}⚡ [V-Energy Grid 360] Inicializando Stack Completa com IA Local...${C_RESET}\n"

# Validação dos binários e pesos do llama.cpp
if [ ! -x "$LLAMA_SERVER" ]; then
    echo -e "${C_RED}❌ Erro: Binário do llama-server não encontrado em $LLAMA_SERVER${C_RESET}"
    exit 1
fi

if [ ! -f "$LLAMA_MODEL" ]; then
    echo -e "${C_RED}❌ Erro: Modelo GGUF não encontrado em $LLAMA_MODEL${C_RESET}"
    exit 1
fi

LLAMA_PID=""
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo -e "\n${C_YELLOW}Encerrando processos da stack...${C_RESET}"
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$LLAMA_PID" ] && kill -0 "$LLAMA_PID" 2>/dev/null; then
        kill "$LLAMA_PID" 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    echo -e "${C_GREEN}✓ Todos os processos foram finalizados com sucesso.${C_RESET}"
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Inicializar ou reutilizar servidor llama.cpp
if lsof -Pi :"$LLAMA_PORT" -sTCP:LISTEN -t >/dev/null 2>&1 || nc -z 127.0.0.1 "$LLAMA_PORT" 2>/dev/null; then
    echo -e "${C_GREEN}✓ Servidor llama-server já está em execução na porta ${LLAMA_PORT}.${C_RESET}"
else
    echo -e "${C_CYAN}==> [1/3] Iniciando llama-server local (Qwen3.5-4B, ctx: 64k, porta: ${LLAMA_PORT})...${C_RESET}"
    "$LLAMA_SERVER" \
        -m "$LLAMA_MODEL" \
        -ngl 999 \
        -c 64000 \
        -np 2 \
        -fa on \
        --host 0.0.0.0 \
        --port "$LLAMA_PORT" \
        --no-context-shift &
    LLAMA_PID=$!

    echo -n "Aguardando llama-server responder em http://127.0.0.1:${LLAMA_PORT}..."
    for i in {1..30}; do
        if curl -s "http://127.0.0.1:${LLAMA_PORT}/health" >/dev/null 2>&1 || curl -s "http://127.0.0.1:${LLAMA_PORT}/v1/models" >/dev/null 2>&1; then
            echo -e " ${C_GREEN}Pronto!${C_RESET}"
            break
        fi
        sleep 1
        echo -n "."
    done
fi

# 2. Inicializar Backend FastAPI apontando para o LLM local
echo -e "${C_CYAN}==> [2/3] Iniciando Backend FastAPI (:8000) integrado ao LLM local...${C_RESET}"
cd "$ROOT_DIR/backend"
AI_PROVIDER="local" \
AI_BASE_URL="http://127.0.0.1:${LLAMA_PORT}/v1" \
AI_MODEL_NAME="Qwen3.5-4B-Q4_K_M" \
uv run uvicorn app.main:app --reload --port "$BACKEND_PORT" &
BACKEND_PID=$!

# 3. Inicializar Frontend Vite/React 19
echo -e "${C_CYAN}==> [3/3] Iniciando Frontend React 19 (:5173)...${C_RESET}"
cd "$ROOT_DIR/frontend"
bun run dev &
FRONTEND_PID=$!

echo -e "\n${C_BOLD}${C_GREEN}🚀 Stack V-Energy Grid 360 em execução:${C_RESET}"
echo -e "  - ${C_BOLD}Frontend:${C_RESET} http://localhost:${FRONTEND_PORT}"
echo -e "  - ${C_BOLD}Backend API & Docs:${C_RESET} http://localhost:${BACKEND_PORT}/docs"
echo -e "  - ${C_BOLD}Local LLM Server:${C_RESET} http://localhost:${LLAMA_PORT}/v1"
echo -e "\nPressione ${C_BOLD}Ctrl+C${C_RESET} para encerrar todos os serviços.\n"

wait
