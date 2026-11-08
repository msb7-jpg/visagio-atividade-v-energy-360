"""Fábrica do repositório de perdas: a configuração decide a competência de referência e o uso dos pares."""

from unittest.mock import MagicMock

from app.core.config import Settings
from app.features.loss_management.repository_factory import build_loss_repository


def test_the_peers_model_is_on_unless_the_setting_turns_it_off():
    assert Settings.model_fields["loss_use_peers"].default is True  # a suíte define LOSS_USE_PEERS=false no conftest


def test_the_repository_takes_the_peers_flag_and_the_reference_from_the_settings():
    settings = Settings(loss_use_peers=True, loss_reference_competencia="2026-03")

    repository = build_loss_repository(MagicMock(), settings)

    assert repository.use_peers is True
    assert repository.reference_competencia == "2026-03"


def test_the_setting_can_bring_back_the_current_model():
    repository = build_loss_repository(MagicMock(), Settings(loss_use_peers=False))

    assert repository.use_peers is False
