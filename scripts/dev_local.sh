#!/usr/bin/env bash
# ==============================================================================
# V-Energy Grid 360 -- Execução Integrada Local (Backend + Frontend)
# ==============================================================================

set -eo pipefail

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_CYAN="\033[36m"
C_YELLOW="\033[33m"

# Função para matar processos por porta
kill_port() {
    local port=$1
    local pid=$(lsof -t -i:"$port" || true)
    if [ -n "$pid" ]; then
        echo -e "${C_YELLOW}Liberando porta $port (PID: $pid)...${C_RESET}"
        kill -9 $pid 2>/dev/null || true
    fi
}

echo -e "\n${C_BOLD}${C_CYAN}⚡ [V-Energy Grid 360] Limpando portas e iniciando...${C_RESET}\n"

# Mata processos residuais de rodadas anteriores
kill_port 8000
kill_port 5173
kill_port 5174
kill_port 5175

# Trap simples para limpar filhos ao sair
cleanup() {
    echo -e "\n🛑 Encerrando todos os processos..."
    pkill -P $$ 
    exit 0
}
trap cleanup SIGINT SIGTERM

# Inicia backend
echo -e "${C_CYAN}==> Iniciando Backend FastAPI (:8000)...${C_RESET}"
cd "$(dirname "$0")/../backend"
AI_PROVIDER="local" \
AI_BASE_URL="http://127.0.0.1:1234/v1" \
AI_MODEL_NAME="Qwen3.5-4B-Q4_K_M" \
uv run uvicorn app.main:app --port 8000 &

# Inicia frontend
echo -e "${C_CYAN}==> Iniciando Frontend React 19 (:5173)...${C_RESET}"
cd "$(dirname "$0")/../frontend"
bun run dev --host 0.0.0.0 &

echo -e "\n${C_BOLD}${C_GREEN}🚀 Stack V-Energy Grid 360 em execução:${C_RESET}"
echo -e "  - Frontend: http://localhost:5173"
echo -e "  - Backend API & Docs: http://localhost:8000/docs\n"

wait
