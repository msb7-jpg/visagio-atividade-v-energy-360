#!/usr/bin/env bash
# ==============================================================================
# V-Energy Grid 360 -- Execução Integrada Local (Backend + Frontend + Ngrok)
# ==============================================================================

set -eo pipefail

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_CYAN="\033[36m"
C_YELLOW="\033[33m"

USE_NGROK=0
for arg in "$@"; do
    case "$arg" in
        --ngrok|-n)
            USE_NGROK=1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

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
if [ "$USE_NGROK" -eq 1 ]; then
    kill_port 4040
    pkill -9 -x ngrok 2>/dev/null || true
fi

# Trap simples para limpar filhos ao sair
cleanup() {
    echo -e "\n🛑 Encerrando todos os processos..."
    kill_port 8000
    kill_port 5173
    if [ "$USE_NGROK" -eq 1 ]; then
        kill_port 4040
        pkill -9 -x ngrok 2>/dev/null || true
    fi
    pkill -P $$ 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Garante que o modelo local na GPU esteja ativo se o provedor for 'local'
AI_PROV=$(grep -E "^AI_PROVIDER=" "${ROOT_DIR}/backend/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'" || echo "")
if [ "$AI_PROV" = "local" ] || [ -z "$AI_PROV" ]; then
    if ! curl -s -m 1 http://127.0.0.1:1234/health >/dev/null 2>&1 && ! curl -s -m 1 http://127.0.0.1:1234/v1/models >/dev/null 2>&1; then
        if command -v lcpp >/dev/null 2>&1; then
            echo -e "${C_CYAN}==> Iniciando LLM Local na GPU (:1234)...${C_RESET}"
            lcpp up spark-x2.6-4b -p 1234 >/dev/null 2>&1 || true
            sleep 2
        fi
    else
        echo -e "${C_GREEN}✓ LLM Local ativo em :1234 (GPU NVIDIA RTX 5060)${C_RESET}"
    fi
fi

# Inicia backend
echo -e "${C_CYAN}==> Iniciando Backend FastAPI (:8000)...${C_RESET}"
(
    cd "${ROOT_DIR}/backend"
    uv run uvicorn app.main:app --port 8000
) &

# Inicia frontend
echo -e "${C_CYAN}==> Iniciando Frontend React 19 (:5173)...${C_RESET}"
(
    cd "${ROOT_DIR}/frontend"
    bun run dev --host 0.0.0.0
) &

# Aguarda ambos os serviços responderem antes de prosseguir
for i in {1..40}; do
    if curl -s http://127.0.0.1:8000/docs >/dev/null 2>&1 && curl -s http://127.0.0.1:5173 >/dev/null 2>&1; then
        break
    fi
    sleep 0.5
done

if [ "$USE_NGROK" -eq 1 ]; then
    echo -e "${C_CYAN}==> Iniciando exposição pública via Ngrok...${C_RESET}"
    bash "${ROOT_DIR}/scripts/expose_ngrok.sh" &
    wait
else
    echo -e "\n${C_BOLD}${C_GREEN}🚀 Stack V-Energy Grid 360 em execução:${C_RESET}"
    echo -e "  - Frontend: http://localhost:5173"
    echo -e "  - Backend API & Docs: http://localhost:8000/docs\n"
    wait
fi
