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
# A suíte semeia bancos pequenos, em que a mediana da classe cai na da carteira; os testes da fila legados medem a
# queda bruta. O caminho com pares tem testes próprios (test_loss_peers, test_loss_hit_curve, ...).
os.environ["LOSS_USE_PEERS"] = "false"
