"""Guarda em disco o resultado do backtest, para ele sobreviver a reinícios da API e do `--reload`."""

import json
import logging
import os
from pathlib import Path

from app.features.loss_management.backtest_schemas import BacktestSeriesDTO

logger = logging.getLogger(__name__)


class BacktestSeriesStore:
    """Um único arquivo JSON com a série calculada e a chave dos dados e do código que a geraram.

    O resultado do backtest só depende do Gold, do código e das ordens que entram nos cortes. Enquanto a chave não
    muda, ele vale; trocada a chave, o arquivo é ignorado e sobrescrito no próximo cálculo.
    """

    def __init__(self, path: Path | None) -> None:
        """Cria o armazenamento.

        Args:
            path: Arquivo do resultado; None desliga a persistência (o resultado fica só em memória).
        """
        self.path = path

    def load(self, fingerprint: str) -> BacktestSeriesDTO | None:
        """Lê a série guardada, se ela foi gerada com a mesma chave.

        Args:
            fingerprint: Chave atual dos dados e do código.

        Returns:
            A série guardada; None se não há arquivo, se a chave mudou ou se o arquivo está ilegível (nesse caso o
            motivo vai para o log e a série é recalculada).
        """
        if self.path is None or not self.path.exists():
            return None
        try:
            saved = json.loads(self.path.read_text(encoding="utf-8"))
            if saved["fingerprint"] != fingerprint:
                return None
            return BacktestSeriesDTO.model_validate(saved["series"])
        except (OSError, ValueError, KeyError, TypeError) as e:
            logger.warning("Resultado do backtest em disco ilegível (%s); será recalculado: %s", self.path, e)
            return None

    def save(self, fingerprint: str, series: BacktestSeriesDTO) -> None:
        """Guarda a série, trocando o arquivo de uma vez para nunca deixar um arquivo pela metade.

        Falha de escrita não derruba a requisição: o resultado calculado segue em memória.

        Args:
            fingerprint: Chave atual dos dados e do código.
            series: Resultado calculado.
        """
        if self.path is None:
            return
        payload = json.dumps({"fingerprint": fingerprint, "series": series.model_dump(mode="json")}, ensure_ascii=False)
        temporary_path = self.path.with_name(f"{self.path.name}.{os.getpid()}.tmp")  # um por processo, sem colisão
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temporary_path.write_text(payload, encoding="utf-8")
            temporary_path.replace(self.path)
        except OSError as e:
            logger.warning("Não foi possível guardar o resultado do backtest em %s: %s", self.path, e)
