"""Serviço de autenticação e emissão de tokens JWT com Argon2 e PyJWT."""

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import get_settings
from app.features.auth.schemas import LoginRequest, TokenResponse, UserDTO
from app.shared.exceptions import UnauthorizedException

settings = get_settings()
password_hash = PasswordHash.recommended()


class AuthService:
    """Regras de negócio de autenticação e emissão de credenciais."""

    @classmethod
    def verify_password(cls, plain_password: str, hashed_password: str) -> bool:
        return password_hash.verify(plain_password, hashed_password)

    @classmethod
    def get_password_hash(cls, password: str) -> str:
        return password_hash.hash(password)

    @classmethod
    def create_access_token(
        cls, data: dict[str, Any], expires_delta: timedelta | None = None
    ) -> tuple[str, int]:
        to_encode = data.copy()
        expire_minutes = (
            expires_delta.total_seconds() / 60
            if expires_delta
            else settings.jwt_access_token_expire_minutes
        )
        expire_seconds = int(expire_minutes * 60)
        expire = datetime.now(UTC) + timedelta(seconds=expire_seconds)

        to_encode.update({"exp": expire, "iat": datetime.now(UTC)})
        encoded_jwt = jwt.encode(
            to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
        )
        return encoded_jwt, expire_seconds

    @classmethod
    def authenticate(cls, request: LoginRequest) -> TokenResponse:
        email = request.email.lower()
        user_info = settings.default_users.get(email)

        if not user_info or user_info["senha"] != request.senha:
            raise UnauthorizedException("Email ou senha incorretos")

        user_dto = UserDTO(
            id=f"user-{email.split('@')[0]}",
            email=email,
            nome=user_info["nome"],
            role=user_info["role"],
        )

        claims = {
            "sub": user_dto.id,
            "email": user_dto.email,
            "nome": user_dto.nome,
            "role": user_dto.role,
        }

        token, expires_in = cls.create_access_token(claims)
        return TokenResponse(
            access_token=token,
            token_type="bearer",  # ruff: ignore[hardcoded-password-func-arg]
            expires_in=expires_in,
            user=user_dto,
        )

    @classmethod
    def decode_token(cls, token: str) -> UserDTO | None:
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            user_id: str | None = payload.get("sub")
            email: str | None = payload.get("email")
            nome: str | None = payload.get("nome")
            role: str | None = payload.get("role")

            if not user_id or not email or not role:
                return None

            return UserDTO(
                id=user_id,
                email=email,
                nome=nome or "Usuário V-Energy",
                role=role,
            )
        except jwt.PyJWTError:
            return None
