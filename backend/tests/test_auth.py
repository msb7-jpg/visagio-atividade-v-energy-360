import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import get_settings
from app.main import app


@pytest.mark.asyncio
async def test_auth_login_and_me():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        login_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "diretor@venergy.com", "senha": "venergy123"},
        )
        assert login_resp.status_code == 200
        payload = login_resp.json()
        assert "access_token" in payload
        assert payload["user"]["role"] == "diretor"
        token = payload["access_token"]

        me_resp = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_resp.status_code == 200
        user = me_resp.json()
        assert user["email"] == "diretor@venergy.com"
        assert user["role"] == "diretor"

        invalid_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "diretor@venergy.com", "senha": "senha-errada"},
        )
        assert invalid_resp.status_code == 401

        unknown_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "ninguem@venergy.com", "senha": "venergy123"},
        )
        assert unknown_resp.status_code == 401


def test_demo_passwords_are_stored_only_as_hashes():
    users = get_settings().default_users

    assert all(user["senha_hash"].startswith("$argon2id$") for user in users.values())
    assert "venergy123" not in str(users)
