"""Dependências de injeção FastAPI compartilhadas (Banco de dados e Segurança RBAC)."""

from collections.abc import Callable, Sequence
from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import UserRole
from app.db.session import get_db
from app.features.auth.schemas import UserDTO
from app.features.auth.service import AuthService
from app.shared.exceptions import ForbiddenException, UnauthorizedException
from app.shared.role_groups import (
    ATENDIMENTO_ACCESS,
    DIRETORIA_ONLY,
    OPERACAO_ACCESS,
    PERDAS_ACCESS,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

DbSession = Annotated[AsyncSession, Depends(get_db)]


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserDTO:
    user = AuthService.decode_token(token)
    if not user:
        raise UnauthorizedException("Sessão inválida ou expirada. Faça login novamente.")
    return user


def require_role(allowed_roles: Sequence[UserRole | str]) -> Callable[..., UserDTO]:
    """Cria dependência que exige token válido (401) e papel dentro de ``allowed_roles`` (403).

    Aceita membros de ``UserRole`` ou suas strings; string fora do enum levanta ``ValueError``.
    """
    allowed_values = {UserRole(role).value for role in allowed_roles}

    def role_checker(user: Annotated[UserDTO, Depends(get_current_user)]) -> UserDTO:
        if user.role not in allowed_values:
            raise ForbiddenException(
                f"Acesso negado para o perfil '{user.role}'. "
                f"Perfis autorizados: {', '.join(sorted(allowed_values))}"
            )
        return user

    return role_checker


CurrentUser = Annotated[UserDTO, Depends(get_current_user)]
RequireDiretoria = Annotated[UserDTO, Depends(require_role(DIRETORIA_ONLY))]
RequireOperacao = Annotated[UserDTO, Depends(require_role(OPERACAO_ACCESS))]
RequireAtendimento = Annotated[UserDTO, Depends(require_role(ATENDIMENTO_ACCESS))]
RequirePerdas = Annotated[UserDTO, Depends(require_role(PERDAS_ACCESS))]
