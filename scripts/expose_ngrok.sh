#!/usr/bin/env bash
# ==============================================================================
# V-Energy Grid 360 -- Exposição Pública Segura via Ngrok
# Suporta túneis simultâneos (Frontend 5173 + Backend 8000)
# Trata processos anteriores vivos e reinicializações limpas
# ==============================================================================

set -eo pipefail

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_CYAN="\033[36m"
C_YELLOW="\033[33m"
C_RED="\033[31m"

spinner=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

# Localiza o binário do ngrok
if command -v ngrok >/dev/null 2>&1; then
    NGROK_BIN="ngrok"
elif [ -x "$HOME/bin/ngrok" ]; then
    NGROK_BIN="$HOME/bin/ngrok"
else
    echo -e "${C_RED}❌ Executável do ngrok não encontrado no PATH nem em ~/bin/ngrok${C_RESET}"
    exit 1
fi

echo -e "\n${C_BOLD}${C_CYAN}⚡ [V-Energy Grid 360] Preparando tunelamento Ngrok...${C_RESET}"

# Mata instâncias prévias do binário ngrok (nome exato -x para não matar este script)
pkill -9 -x ngrok 2>/dev/null || true
fuser -k 4040/tcp 2>/dev/null || true

# Garante que a porta 4040 esteja 100% livre
WAIT_RELEASE=0
while lsof -i :4040 >/dev/null 2>&1; do
    sleep 0.1
    WAIT_RELEASE=$((WAIT_RELEASE + 1))
    if [ $WAIT_RELEASE -ge 30 ]; then
        fuser -k -9 4040/tcp 2>/dev/null || true
        break
    fi
done

# Alerta se os serviços locais não estiverem rodando
if ! lsof -i :8000 >/dev/null 2>&1; then
    echo -e "${C_YELLOW}⚠️  Aviso: Backend (:8000) não detectado ativo. Inicie com 'make run-backend' ou 'make run-all'.${C_RESET}"
fi
if ! lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${C_YELLOW}⚠️  Aviso: Frontend (:5173) não detectado ativo. Inicie com 'make run-frontend' ou 'make run-all'.${C_RESET}"
fi

# Configuração temporária de túneis unificados
CONFIG_DIR="/tmp/ngrok_venergy_$$"
mkdir -p "$CONFIG_DIR"
TUNNEL_CONFIG="$CONFIG_DIR/tunnels.yml"
NGROK_LOG="$CONFIG_DIR/ngrok.log"

cat << 'EOF' > "$TUNNEL_CONFIG"
version: "2"
tunnels:
  frontend:
    proto: http
    addr: 5173
  backend:
    proto: http
    addr: 8000
EOF

USER_CONFIG_ARGS=()
if [ -f "$HOME/.config/ngrok/ngrok.yml" ]; then
    USER_CONFIG_ARGS+=(--config "$HOME/.config/ngrok/ngrok.yml")
elif [ -f "$HOME/.ngrok2/ngrok.yml" ]; then
    USER_CONFIG_ARGS+=(--config "$HOME/.ngrok2/ngrok.yml")
fi

NGROK_PID=""
cleanup() {
    if [ -n "$NGROK_PID" ] && kill -0 "$NGROK_PID" 2>/dev/null; then
        kill "$NGROK_PID" 2>/dev/null || true
    fi
    pkill -9 -x ngrok 2>/dev/null || true
    rm -rf "$CONFIG_DIR"
}
trap cleanup SIGINT SIGTERM EXIT

# Inicia sessão única do ngrok agregando todos os túneis
"$NGROK_BIN" start "${USER_CONFIG_ARGS[@]}" --config "$TUNNEL_CONFIG" --all --log=stdout > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

START_TIME=$(date +%s)
TIMEOUT=25
SPINNER_IDX=0

while true; do
    if ! kill -0 "$NGROK_PID" 2>/dev/null; then
        echo -e "\r${C_RED}❌ Falha ao iniciar ngrok. Processo encerrou prematuramente.${C_RESET}"
        if [ -f "$NGROK_LOG" ]; then
            echo -e "${C_YELLOW}Log do Ngrok:${C_RESET}"
            cat "$NGROK_LOG"
        fi
        exit 1
    fi

    TUNNELS_JSON=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null || true)
    if [ -n "$TUNNELS_JSON" ]; then
        STATUS_CHECK=$(echo "$TUNNELS_JSON" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tunnels = data.get('tunnels', [])
    ports = [str(t.get('config', {}).get('addr', '')).split(':')[-1] for t in tunnels]
    has_front = '5173' in ports
    has_back = '8000' in ports
    print('OK' if (has_front and has_back) else 'PENDING')
except Exception:
    print('PENDING')
" 2>/dev/null || echo "PENDING")

        if [ "$STATUS_CHECK" = "OK" ]; then
            break
        fi
    fi

    ELAPSED=$(( $(date +%s) - START_TIME ))
    if [ $ELAPSED -ge $TIMEOUT ]; then
        echo -e "\r${C_RED}❌ Tempo limite esgotado ($TIMEOUT s) aguardando URLs do Ngrok.${C_RESET}"
        if [ -f "$NGROK_LOG" ]; then
            echo -e "${C_YELLOW}Log recente do Ngrok:${C_RESET}"
            tail -n 25 "$NGROK_LOG"
        fi
        exit 1
    fi

    printf "\r${C_CYAN}${spinner[$SPINNER_IDX]} Estabelecendo túneis Ngrok... (%ds)${C_RESET}" "$ELAPSED"
    SPINNER_IDX=$(( (SPINNER_IDX + 1) % 10 ))
    sleep 0.25
done

echo -e "\r${C_GREEN}✅ Túneis Ngrok estabelecidos com sucesso!${C_RESET}\n"

# Extrai e formata as URLs públicas
python3 -c "
import urllib.request, json

data = json.loads(urllib.request.urlopen('http://127.0.0.1:4040/api/tunnels').read().decode())
frontend_url = 'N/A'
backend_url = 'N/A'

for t in data.get('tunnels', []):
    port = str(t.get('config', {}).get('addr', '')).split(':')[-1]
    if port == '5173':
        frontend_url = t.get('public_url')
    elif port == '8000':
        backend_url = t.get('public_url')

border = '═' * 66
print(f'\033[1m\033[36m╔{border}╗')
print(f'║  🌍 V-ENERGY GRID 360 -- ACESSO EXTERNO NGROK                     ║')
print(f'╠{border}╣')
print(f'║  💻 Frontend Web:  \033[32m{frontend_url:<46}\033[36m║')
print(f'║  ⚙️  Backend API:   \033[32m{backend_url:<46}\033[36m║')
print(f'║  📚 Swagger Docs:  \033[32m{backend_url + \"/docs\":<46}\033[36m║')
print(f'╠{border}╣')
print(f'║  \033[2mPressione Ctrl+C para encerrar os túneis com segurança.         \033[0m\033[36m║')
print(f'╚{border}╝\033[0m')
"

wait "$NGROK_PID"
