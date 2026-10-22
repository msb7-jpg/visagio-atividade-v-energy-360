"""Mapeamento central de grupos de papéis (RBAC): único ponto a alterar quando o conjunto final mudar."""

from app.core.constants import UserRole

DIRETORIA_ONLY: tuple[UserRole, ...] = (UserRole.DIRETOR,)
OPERACAO_ACCESS: tuple[UserRole, ...] = (UserRole.DIRETOR, UserRole.GERENTE_OPERACAO)
ATENDIMENTO_ACCESS: tuple[UserRole, ...] = (
    UserRole.DIRETOR,
    UserRole.GERENTE_ATENDIMENTO,
    UserRole.ATENDENTE,
)
PERDAS_ACCESS: tuple[UserRole, ...] = (UserRole.DIRETOR, UserRole.GERENTE_PERDAS)
