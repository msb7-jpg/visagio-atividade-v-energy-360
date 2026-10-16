"""Manipuladores HTTP de exceções para integração com FastAPI."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.shared.exceptions import DomainException


def register_exception_handlers(app: FastAPI) -> None:
    """Registra handlers no app FastAPI para manter serviços desacoplados do HTTP."""

    @app.exception_handler(DomainException)
    def domain_exception_handler(request: Request, exc: DomainException) -> JSONResponse:
        del request
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message, "error_type": exc.__class__.__name__},
        )
