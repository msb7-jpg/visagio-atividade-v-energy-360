"""Dependências de injeção FastAPI compartilhadas (Banco de dados e Segurança RBAC)."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.features.auth.schemas import UserDTO
from app.features.auth.service import AuthService
from app.shared.exceptions import ForbiddenException, UnauthorizedException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

DbSession = Annotated[AsyncSession, Depends(get_db)]


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserDTO:
    user = AuthService.decode_token(token)
    if not user:
        raise UnauthorizedException("Sessão inválida ou expirada. Faça login novamente.")
    return user


def require_role(allowed_roles: list[str]):
    def role_checker(user: Annotated[UserDTO, Depends(get_current_user)]) -> UserDTO:
        if user.role not in allowed_roles:
            raise ForbiddenException(
                f"Acesso negado para o perfil '{user.role}'. "
                f"Perfis autorizados: {', '.join(allowed_roles)}"
            )
        return user

    return role_checker


CurrentUser = Annotated[UserDTO, Depends(get_current_user)]
RequireDiretoria = Annotated[UserDTO, Depends(require_role(["diretor"]))]
RequireOperacao = Annotated[UserDTO, Depends(require_role(["diretor", "gerente_operacao"]))]
RequireAtendimento = Annotated[
    UserDTO, Depends(require_role(["diretor", "gerente_atendimento", "atendente"]))
]
RequirePerdas = Annotated[UserDTO, Depends(require_role(["diretor", "gerente_perdas"]))]
