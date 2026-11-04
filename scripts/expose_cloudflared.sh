#!/usr/bin/env bash

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_GREEN="\033[32m"
C_CYAN="\033[36m"
spinner=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

show_spinner() {
    local start_time=$(date +%s)
    local i=0
    
    # Aguarda ambos os logs terem o conteúdo da URL
    while true; do
        if [ -s /tmp/cf_app.log ] && [ -s /tmp/cf_api.log ] && \
           grep -q "https://.*trycloudflare.com" /tmp/cf_app.log && \
           grep -q "https://.*trycloudflare.com" /tmp/cf_api.log; then
            break
        fi
        local elapsed=$(( $(date +%s) - start_time ))
        printf "\r${C_CYAN}${spinner[$i]} Iniciando túneis (Frontend + Backend)... (%ds)${C_RESET}" "$elapsed"
        i=$(( (i + 1) % 10 ))
        sleep 0.2
    done
}

echo -e "${C_BOLD}⚡ Iniciando tunelamento Cloudflare...${C_RESET}"

rm -f /tmp/cf_app.log /tmp/cf_api.log

~/bin/cloudflared tunnel --url http://localhost:5173 > /tmp/cf_app.log 2>&1 &
~/bin/cloudflared tunnel --url http://localhost:8000 > /tmp/cf_api.log 2>&1 &

show_spinner

echo -e "\r${C_GREEN}✅ Ambos os túneis estão estabelecidos!${C_RESET}\n"

echo -e "${C_BOLD}🌍 URLs de acesso:${C_RESET}"
echo -e "Frontend: $(grep -o 'https://[-a-z0-9.]*\.trycloudflare\.com' /tmp/cf_app.log | head -n1)"
echo -e "Backend:  $(grep -o 'https://[-a-z0-9.]*\.trycloudflare\.com' /tmp/cf_api.log | head -n1)"
