"""Isola a suíte de testes do `.env` local do desenvolvedor.

O `Settings` lê `backend/.env`; sem isto, a competência fixada para demonstração da fila
(`LOSS_REFERENCE_COMPETENCIA`) mudaria as janelas de análise das fixtures. Variável de ambiente
vazia vale como ausente (`blank_reference_means_none`) e tem precedência sobre o arquivo.
"""

import os

os.environ["LOSS_REFERENCE_COMPETENCIA"] = ""
