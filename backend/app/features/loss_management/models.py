"""Modelo ORM da tabela operacional de ordens de inspeção (escrita pela Fatia 05)."""

from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(UTC)


class InspectionOrder(Base):
    __tablename__ = "ordem_inspecao"

    id_inspecao: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_uc: Mapped[str] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(20), index=True)
    motivo: Mapped[str | None] = mapped_column(String(200))
    kwh_estimado: Mapped[float] = mapped_column(Float, default=0.0)
    fiscal_responsavel: Mapped[str | None] = mapped_column(String(120))
    irregularidade_constatada: Mapped[bool | None] = mapped_column(Boolean)
    tipo_irregularidade: Mapped[str | None] = mapped_column(String(80))
    kwh_recuperado: Mapped[float | None] = mapped_column(Float)
    numero_toi: Mapped[str | None] = mapped_column(String(40))
    justificativa_cancelamento: Mapped[str | None] = mapped_column(String(500))
    criado_por: Mapped[str] = mapped_column(String(120))
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=_utc_now)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime, default=_utc_now, onupdate=_utc_now)
