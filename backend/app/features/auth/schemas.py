"""Schemas Pydantic para o fluxo de autenticação e perfis."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class UserDTO(BaseModel):
    id: str
    email: str
    nome: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"  # ruff: ignore[hardcoded-password-string]
    expires_in: int
    user: UserDTO
