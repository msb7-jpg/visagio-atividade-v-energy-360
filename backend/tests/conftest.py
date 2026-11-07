"""Isola a suíte de testes do `.env` local do desenvolvedor.

O `Settings` lê `backend/.env`; sem isto, a competência fixada para demonstração da fila
(`LOSS_REFERENCE_COMPETENCIA`) mudaria as janelas de análise das fixtures. Variável de ambiente
vazia vale como ausente (`blank_means_none`) e tem precedência sobre o arquivo.

O resultado do backtest também só fica em memória nos testes (`LOSS_BACKTEST_CACHE_PATH` vazio), para a suíte
não escrever `.cache/` na pasta do backend nem herdar o resultado de outra execução.
"""

import os

os.environ["LOSS_REFERENCE_COMPETENCIA"] = ""
os.environ["LOSS_BACKTEST_CACHE_PATH"] = ""
