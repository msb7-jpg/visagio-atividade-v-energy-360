#!/usr/bin/env bash
# ==============================================================================
# V-Energy Grid 360 -- Data Sync & Extraction Utility (data_sync.sh)
# Extrai as bases compactadas base_dados_1.zip e base_dados_2.zip para data/landing/
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LANDING_DIR="$ROOT_DIR/data/landing"

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[36m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"

echo -e "\n${C_BOLD}${C_CYAN}⚡ [V-Energy Grid 360] Sincronização e Extração de Dados...${C_RESET}\n"

mkdir -p "$LANDING_DIR"

ZIP1="$ROOT_DIR/base_dados_1.zip"
ZIP2="$ROOT_DIR/base_dados_2.zip"

if [ ! -f "$ZIP1" ] || [ ! -f "$ZIP2" ]; then
    echo -e "${C_RED}❌ Erro: Arquivos base_dados_1.zip e/ou base_dados_2.zip não encontrados na raiz.${C_RESET}"
    exit 1
fi

echo -e "${C_CYAN}[1/2] Extraindo base_dados_1.zip em data/landing/...${C_RESET}"
unzip -q -o "$ZIP1" -d "$LANDING_DIR"

echo -e "${C_CYAN}[2/2] Extraindo base_dados_2.zip em data/landing/...${C_RESET}"
unzip -q -o "$ZIP2" -d "$LANDING_DIR"

echo -e "\n${C_GREEN}✓ Extração concluída com sucesso! Conteúdo de data/landing/:${C_RESET}"
ls -lh "$LANDING_DIR"
