import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_agent_chat_stream_and_insights():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Login para obter token Bearer
        login_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "diretor@venergy.com", "senha": "venergy123"},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # 2. Teste do endpoint de insights proativos
        insights_resp = await ac.post(
            "/api/v1/agent/insights",
            headers=auth_headers,
            json={"tela": "operacao", "metricas": {"dec": 8.4, "fec": 4.1}},
        )
        assert insights_resp.status_code == 200
        data = insights_resp.json()
        assert "insights" in data
        assert len(data["insights"]) >= 2
        assert "resumo_executivo" in data

        # 3. Teste do endpoint SSE de chat stream com mock provider
        stream_resp = await ac.post(
            "/api/v1/agent/chat/stream",
            headers=auth_headers,
            json={"pergunta": "Qual a média de consumo por classe?", "provider": "mock"},
        )
        assert stream_resp.status_code == 200
        assert "text/event-stream" in stream_resp.headers["content-type"]
        body = stream_resp.text
        assert "event: session" in body
        assert "event: step_end" in body
        assert "event: done" in body
