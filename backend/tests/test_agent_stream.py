import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_agent_chat_stream_and_insights():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        login_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "diretor@venergy.com", "senha": "venergy123"},
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        insights_resp = await ac.post(
            "/api/v1/ai/insights",
            headers=auth_headers,
            json={"context": "operacao", "metricas": {"dec": 8.4, "fec": 4.1}},
        )
        assert insights_resp.status_code in (200, 503)
        if insights_resp.status_code == 200:
            data = insights_resp.json()
            assert "insights" in data
            assert "resumo_executivo" in data
        else:
            error_data = insights_resp.json()
            assert "detail" in error_data
            assert error_data.get("error_type") == "ServiceUnavailableError"

        stream_resp = await ac.post(
            "/api/v1/chat/stream",
            headers=auth_headers,
            json={"pergunta": "Qual a média de consumo por classe?", "provider": "mock"},
        )
        assert stream_resp.status_code == 200
        assert "text/event-stream" in stream_resp.headers["content-type"]
        body = stream_resp.text
        assert "event: session" in body
        assert "event: step_end" in body
        assert "event: done" in body

        followup_resp = await ac.post(
            "/api/v1/chat/stream",
            headers=auth_headers,
            json={
                "pergunta": "E apenas para a classe comercial?",
                "thread_id": "thread-followup-test",
                "provider": "mock",
            },
        )
        assert followup_resp.status_code == 200
        assert "thread-followup-test" in followup_resp.text

        losses_insights_resp = await ac.post(
            "/api/v1/ai/insights",
            headers=auth_headers,
            json={"context": "losses"},
        )
        assert losses_insights_resp.status_code == 503
