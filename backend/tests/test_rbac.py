"""Testes de RBAC: 401 (sem/token inválido), 403 (papel não autorizado) e 200 (papel autorizado)."""

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.constants import UserRole
from app.features.auth.schemas import LoginRequest
from app.features.auth.service import AuthService
from app.shared.dependencies import (
    RequireAtendimento,
    RequireDiretoria,
    RequireOperacao,
    RequirePerdas,
)
from app.shared.error_handlers import register_exception_handlers

SEED_PASSWORD = "venergy123"  # ruff: ignore[hardcoded-password-string]
SEED_EMAIL_BY_ROLE = {
    UserRole.DIRETOR: "diretor@venergy.com",
    UserRole.GERENTE_OPERACAO: "operacao@venergy.com",
    UserRole.ATENDENTE: "atendimento@venergy.com",
    UserRole.GERENTE_PERDAS: "perdas@venergy.com",
}
ROUTE_BY_GROUP = {
    "/diretoria": {UserRole.DIRETOR},
    "/operacao": {UserRole.DIRETOR, UserRole.GERENTE_OPERACAO},
    "/atendimento": {UserRole.DIRETOR, UserRole.GERENTE_ATENDIMENTO, UserRole.ATENDENTE},
    "/perdas": {UserRole.DIRETOR, UserRole.GERENTE_PERDAS},
}


def build_app() -> FastAPI:
    rbac_app = FastAPI()
    register_exception_handlers(rbac_app)

    @rbac_app.get("/diretoria")
    async def diretoria(user: RequireDiretoria) -> dict[str, str]:
        return {"role": user.role}

    @rbac_app.get("/operacao")
    async def operacao(user: RequireOperacao) -> dict[str, str]:
        return {"role": user.role}

    @rbac_app.get("/atendimento")
    async def atendimento(user: RequireAtendimento) -> dict[str, str]:
        return {"role": user.role}

    @rbac_app.get("/perdas")
    async def perdas(user: RequirePerdas) -> dict[str, str]:
        return {"role": user.role}

    return rbac_app


def token_for_role(role: UserRole) -> str:
    """Gera JWT direto, sem login, para papéis sem usuário seed (ex.: GERENTE_ATENDIMENTO)."""
    claims = {"sub": f"user-{role.value}", "email": f"{role.value}@venergy.com", "nome": role.value, "role": role.value}
    token, _ = AuthService.create_access_token(claims)
    return token


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=build_app()), base_url="http://test") as http_client:
        yield http_client


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
@pytest.mark.parametrize("route", list(ROUTE_BY_GROUP))
async def test_sem_token_retorna_401(client, route):
    assert (await client.get(route)).status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize("route", list(ROUTE_BY_GROUP))
async def test_token_invalido_retorna_401(client, route):
    assert (await client.get(route, headers=bearer("token.invalido"))).status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize("route", list(ROUTE_BY_GROUP))
@pytest.mark.parametrize("role", list(UserRole))
async def test_matriz_papel_por_rota_retorna_200_ou_403(client, route, role):
    response = await client.get(route, headers=bearer(token_for_role(role)))

    expected_status = 200 if role in ROUTE_BY_GROUP[route] else 403
    assert response.status_code == expected_status
    if expected_status == 200:
        assert response.json() == {"role": role.value}


@pytest.mark.asyncio
async def test_403_informa_perfil_negado_e_autorizados(client):
    response = await client.get("/perdas", headers=bearer(token_for_role(UserRole.ATENDENTE)))

    assert response.status_code == 403
    assert "atendente" in response.text
    assert "gerente_perdas" in response.text


@pytest.mark.asyncio
@pytest.mark.parametrize("role", list(SEED_EMAIL_BY_ROLE))
async def test_login_real_dos_usuarios_seed_acessa_rota_do_seu_grupo(client, role):
    login_request = LoginRequest(email=SEED_EMAIL_BY_ROLE[role], senha=SEED_PASSWORD)
    token = AuthService.authenticate(login_request).access_token
    allowed_routes = [route for route, roles in ROUTE_BY_GROUP.items() if role in roles]

    for route in allowed_routes:
        assert (await client.get(route, headers=bearer(token))).status_code == 200
