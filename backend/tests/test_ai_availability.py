"""Sem provedor de IA configurado, o sistema avisa em vez de inventar uma resposta (case: "se não souber, diz")."""

from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.llm_factory import availability
from app.core.llm_factory.availability import AIProviderNotConfiguredError, resolve_configured_provider
from app.core.llm_factory.factory import get_chat_model
from app.features.chat import router as chat_router
from app.main import app

CHAT_URL = "/api/v1/chat/stream"


def use_settings(monkeypatch, *, ai_provider=None, gemini_api_key=None) -> None:
    settings = SimpleNamespace(ai_provider=ai_provider, gemini_api_key=gemini_api_key)
    monkeypatch.setattr(availability, "get_settings", lambda: settings)


@pytest.mark.parametrize(
    ("ai_provider", "gemini_api_key", "requested", "expected"),
    [
        (None, None, None, None),
        ("", None, None, None),
        ("provedor_inexistente", None, None, None),
        (None, "chave", None, "google"),
        ("google", None, None, None),
        ("mock", None, None, "mock"),
        ("local", None, None, "local"),
        (None, None, "mock", "mock"),
    ],
    ids=["nada", "vazio", "desconhecido", "so_chave", "google_sem_chave", "mock", "local", "pedido_mock"],
)
def test_only_an_explicit_choice_or_a_key_enables_the_ai(monkeypatch, ai_provider, gemini_api_key, requested, expected):
    use_settings(monkeypatch, ai_provider=ai_provider, gemini_api_key=gemini_api_key)

    assert resolve_configured_provider(requested) == expected


def test_model_factory_refuses_to_fall_back_to_the_simulated_mode(monkeypatch):
    use_settings(monkeypatch)

    with pytest.raises(AIProviderNotConfiguredError, match="GEMINI_API_KEY"):
        get_chat_model()


async def ask(pergunta: str, provider: str | None = None) -> str:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http_client:
        login = await http_client.post(
            "/api/v1/auth/login", json={"email": "diretor@venergy.com", "senha": "venergy123"}
        )
        headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        payload = {"pergunta": pergunta, **({"provider": provider} if provider else {})}
        response = await http_client.post(CHAT_URL, json=payload, headers=headers)
    return response.text


async def test_chat_without_ai_warns_and_does_not_invent_an_answer(monkeypatch):
    monkeypatch.setattr(chat_router, "resolve_configured_provider", lambda requested=None: None)

    body = await ask("Qual o faturamento total de 2025?")

    assert "event: error" in body
    assert "AI_UNAVAILABLE" in body
    assert "Assistente de IA indisponível" in body
    for invented in ("event: sql", "event: data", "event: answer", "25000"):
        assert invented not in body


async def test_chosen_simulated_mode_says_it_is_a_demonstration():
    body = await ask("Qual o faturamento total de 2025?", provider="mock")

    assert "Modo demonstração" in body
    assert "conformidade" not in body
