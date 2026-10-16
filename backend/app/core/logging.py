"""Configuração centralizada de logging para a aplicação."""

import logging

from app.core.config import get_settings


def configure_logging() -> None:
    """Configura o formato e o nível de logs uma única vez no startup."""
    settings = get_settings()

    log_format = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"

    logging.basicConfig(
        level=settings.log_level.upper(),
        format=log_format,
        datefmt=date_format,
        force=True,
    )

    # Silenciar logs verbosos de bibliotecas HTTP e clientes de IA
    for noisy in ("httpx", "httpcore", "urllib3", "google", "grpc"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
