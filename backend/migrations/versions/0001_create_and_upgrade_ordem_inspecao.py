"""Cria ou atualiza a tabela operacional ordem_inspecao de forma idempotente.

Revision ID: 0001_ordem_inspecao
Revises: None
Create Date: 2026-10-30 10:15:00
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

from app.features.loss_management.schema_upgrade import add_missing_columns

revision: str = "0001_ordem_inspecao"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Garante a existência da tabela ordem_inspecao e de todas as colunas atuais."""
    add_missing_columns(op.get_bind())


def downgrade() -> None:
    """Remove a tabela operacional ordem_inspecao em caso de rollback completo."""
    op.drop_table("ordem_inspecao")
