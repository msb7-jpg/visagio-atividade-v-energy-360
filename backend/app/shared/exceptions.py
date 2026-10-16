"""Exceções centrais de domínio do backend.

Este módulo é 100% Python puro (Clean Architecture) e não depende do FastAPI ou Starlette.
Os manipuladores HTTP correspondentes residem em `app.shared.error_handlers`.
"""

from http import HTTPStatus


class DomainException(Exception):  # ruff: ignore[error-suffix-on-exception-name]
    """Exceção base de regras de negócio."""

    def __init__(self, message: str, status_code: int = int(HTTPStatus.BAD_REQUEST)):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class NotFoundException(DomainException):
    """Recurso solicitado não foi encontrado."""

    def __init__(self, message: str = "Recurso não encontrado"):
        super().__init__(message=message, status_code=int(HTTPStatus.NOT_FOUND))


class BadRequestException(DomainException):
    """Requisição inválida ou parâmetros inconsistentes."""

    def __init__(self, message: str = "Requisição inválida"):
        super().__init__(message=message, status_code=int(HTTPStatus.BAD_REQUEST))


class UnauthorizedException(DomainException):
    """Credenciais inválidas, ausentes ou expiradas."""

    def __init__(self, message: str = "Credenciais inválidas ou ausentes"):
        super().__init__(message=message, status_code=int(HTTPStatus.UNAUTHORIZED))


class ForbiddenException(DomainException):
    """Acesso negado para o perfil do usuário autenticado."""

    def __init__(self, message: str = "Acesso negado para este perfil"):
        super().__init__(message=message, status_code=int(HTTPStatus.FORBIDDEN))


class DatabaseReadError(DomainException):
    """Falha durante leitura analítica no banco de dados."""

    def __init__(self, message: str = "Falha ao ler dados analíticos no SQLite"):
        super().__init__(message=message, status_code=int(HTTPStatus.INTERNAL_SERVER_ERROR))


class DatabaseConnectionError(DomainException):
    """Não foi possível estabelecer conexão com o banco de dados."""

    def __init__(self, message: str = "Não foi possível conectar ao banco SQLite"):
        super().__init__(message=message, status_code=int(HTTPStatus.SERVICE_UNAVAILABLE))

