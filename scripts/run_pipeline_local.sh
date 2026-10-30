#!/usr/bin/env bash
# ==============================================================================
# V-Energy Grid 360 -- Executor Local do Pipeline Lakehouse + Alembic
# Executa os 10 notebooks (.ipynb) localmente via Jupyter Kernel (PySpark + Delta)
# na ordem do DAG (data-engineering/job.yaml), gera backend/v_energy.db e aplica
# as migrações operacionais via Alembic.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LANDING_DIR="$ROOT_DIR/data/landing"
REF_DIR="$ROOT_DIR/data-engineering/reference"
NOTEBOOKS_DIR="$ROOT_DIR/data-engineering/notebooks"
BACKEND_DIR="$ROOT_DIR/backend"
DB_PATH="$BACKEND_DIR/v_energy.db"

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[36m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"

echo -e "\n${C_BOLD}${C_CYAN}======================================================================${C_RESET}"
echo -e "${C_BOLD}${C_CYAN} ⚡ V-Energy Grid 360 -- Pipeline Lakehouse Local (Jupyter + Alembic)${C_RESET}"
echo -e "${C_BOLD}${C_CYAN}======================================================================${C_RESET}\n"

# 1. Garante dados brutos em data/landing/
if [ ! -f "$LANDING_DIR/unidades_consumidoras.csv" ] || [ ! -f "$LANDING_DIR/faturas.csv" ]; then
    echo -e "${C_YELLOW}==> [Passo 1/4] Dados brutos ausentes em data/landing/. Executando data_sync.sh...${C_RESET}"
    bash "$SCRIPT_DIR/data_sync.sh"
else
    echo -e "${C_GREEN}✓ [Passo 1/4] Arquivos brutos verificados em data/landing/.${C_RESET}"
fi

# Sincroniza arquivos de referência (limites ANEEL) para data/landing/
if [ -d "$REF_DIR" ]; then
    cp -f "$REF_DIR"/*.csv "$LANDING_DIR/" 2>/dev/null || true
fi

# 2. Executa os 10 notebooks na ordem do DAG (data-engineering/job.yaml) via Jupyter Kernel
echo -e "\n${C_CYAN}==> [Passo 2/4] Executando os 10 notebooks do Lakehouse em Jupyter Kernel local...${C_RESET}"

cd "$BACKEND_DIR"
uv run python - "$NOTEBOOKS_DIR" << 'PYEOF'
import sys
import time
from pathlib import Path
import nbformat
from nbclient import NotebookClient

notebooks_dir = Path(sys.argv[1]).resolve()

# Ordem canônica do DAG definida em data-engineering/job.yaml
DAG_NOTEBOOKS = [
    "fatia01_bronze.ipynb",
    "fatia02_bronze.ipynb",
    "fatia01_silver.ipynb",
    "fatia02_silver.ipynb",
    "fatia01_gold.ipynb",
    "fatia02_gold.ipynb",
    "fatia01_export_sqlite.ipynb",
    "fatia01_testes_qualidade.ipynb",
    "fatia02_testes_qualidade.ipynb",
    "fatia02_export_sqlite.ipynb",
]

total_start = time.perf_counter()

for idx, nb_name in enumerate(DAG_NOTEBOOKS, start=1):
    nb_path = notebooks_dir / nb_name
    if not nb_path.exists():
        raise FileNotFoundError(f"Notebook não encontrado: {nb_path}")

    print(f"\n\033[1m\033[36m[{idx}/{len(DAG_NOTEBOOKS)}] Executando {nb_name}...\033[0m", flush=True)
    step_start = time.perf_counter()

    with open(nb_path, encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    def _print_cell_output(cell, cell_index, execute_reply):
        for out in cell.get("outputs", []):
            text = out.get("text") or out.get("data", {}).get("text/plain")
            if text:
                for line in str(text).rstrip().splitlines():
                    print(f"    {line}", flush=True)

    client = NotebookClient(
        nb,
        timeout=1800,
        kernel_name="python3",
        resources={"metadata": {"path": str(notebooks_dir)}},
        on_cell_executed=_print_cell_output,
    )
    client.execute()

    elapsed = time.perf_counter() - step_start
    print(f"\033[32m  ✓ {nb_name} concluído em {elapsed:.1f}s\033[0m", flush=True)

total_elapsed = time.perf_counter() - total_start
print(f"\n\033[1m\033[32m✓ Todos os 10 notebooks executados com sucesso em {total_elapsed:.1f}s!\033[0m")
PYEOF

# 3. Aplica migrações operacionais via Alembic sobre o v_energy.db gerado
echo -e "\n${C_CYAN}==> [Passo 3/4] Aplicando migrações operacionais com Alembic (ordem_inspecao)...${C_RESET}"
cd "$BACKEND_DIR"
uv run alembic upgrade head

# 4. Resumo de verificação do banco final
echo -e "\n${C_CYAN}==> [Passo 4/4] Verificando integridade e contagens de backend/v_energy.db...${C_RESET}"
uv run python - "$DB_PATH" << 'PYEOF'
import sqlite3
import sys
from pathlib import Path

db_path = Path(sys.argv[1])
size_mb = db_path.stat().st_size / (1024 * 1024)
print(f"  Arquivo: {db_path} ({size_mb:.1f} MB)")

with sqlite3.connect(db_path) as conn:
    tables = [
        row[0]
        for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
    ]
    for tbl in tables:
        count = conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
        print(f"  - {tbl:<30} {count:>10,} linhas")
PYEOF

echo -e "\n${C_BOLD}${C_GREEN}✅ Pipeline local + Alembic finalizado! O banco backend/v_energy.db está 100% atualizado.${C_RESET}\n"
