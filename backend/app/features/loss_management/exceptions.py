"""Exceções de domínio da gestão de perdas."""

from http import HTTPStatus

from app.shared.exceptions import DomainException


class InspectionConflictError(DomainException):
    """Operação incompatível com o estado atual da ordem ou da UC."""

    def __init__(self, message: str):
        super().__init__(message=message, status_code=int(HTTPStatus.CONFLICT))
