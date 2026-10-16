"""Rotas de autenticação e identificação de perfil."""

from fastapi import APIRouter

from app.features.auth.schemas import LoginRequest, TokenResponse, UserDTO
from app.features.auth.service import AuthService
from app.shared.dependencies import CurrentUser

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse, summary="Autenticar usuário e emitir token JWT")
async def login(credentials: LoginRequest) -> TokenResponse:
    """Valida credenciais e emite JWT assinado com o perfil (role) da V-Energy."""
    return AuthService.authenticate(credentials)


@router.get("/me", response_model=UserDTO, summary="Obter dados do usuário autenticado")
async def get_me(user: CurrentUser) -> UserDTO:
    """Retorna os dados e privilégios associados ao token do usuário atual."""
    return user
