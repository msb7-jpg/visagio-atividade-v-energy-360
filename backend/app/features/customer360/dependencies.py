"""Fábrica de injeção do serviço da Visão 360 da UC."""

from typing import Annotated

from fastapi import Depends

from app.features.customer360.repository import Customer360Repository
from app.features.customer360.service import Customer360Service
from app.shared.dependencies import DbSession


def get_customer360_service(db: DbSession) -> Customer360Service:
    return Customer360Service(repository=Customer360Repository(db))


Customer360Svc = Annotated[Customer360Service, Depends(get_customer360_service)]
