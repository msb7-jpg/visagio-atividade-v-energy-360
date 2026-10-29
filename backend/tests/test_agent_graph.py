import pytest
from langchain_core.messages import HumanMessage

from app.agent.graph import create_agent_graph
from app.agent.state import append_steps, append_thought
from app.agent.utils.command_parser import parse_slash_command
from app.agent.utils.toon_serializer import serialize_to_toon_tabular
from app.core.config import get_settings
from app.core.constants import AgentNode
from app.core.llm_factory.factory import get_chat_model


def test_command_parser():
    cmd_explain, _ = parse_slash_command("/explain Metodologia de cálculo do DEC")
    assert cmd_explain is not None
    assert cmd_explain["name"] == "explain"
    assert cmd_explain["args"] == "Metodologia de cálculo do DEC"

    cmd_sql, _ = parse_slash_command("/sql SELECT 1")
    assert cmd_sql is not None
    assert cmd_sql["name"] == "sql"

    cmd_none, text_none = parse_slash_command("Qual o alimentador mais crítico?")
    assert cmd_none is None
    assert "alimentador" in text_none


def test_toon_serializer():
    data = [
        {"classe": "Residencial", "consumo_kwh": 12500.5, "status": "ATIVO"},
        {"classe": "Comercial", "consumo_kwh": 8400.0, "status": "ATIVO"},
    ]
    serialized = serialize_to_toon_tabular("consumo", data)
    assert "consumo[2]{classe,consumo_kwh,status}:" in serialized
    assert "Residencial,12500.5,ATIVO" in serialized


def test_append_steps_and_thought():
    initial_steps = [{"node": "synthesizer", "status": "done", "duration_ms": 100, "label": "Formatando"}]
    new_router_step = [{"node": "router", "status": "done", "duration_ms": 50, "label": "Classificando"}]
    updated = append_steps(initial_steps, new_router_step)
    assert len(updated) == 1
    assert updated[0]["node"] == "router"

    t1 = append_thought(None, "__RESET__[Classificando]\nAnalisando")
    assert t1 == "[Classificando]\nAnalisando"

    t2 = append_thought(t1, "[Escrevendo SQL]\nGerando query")
    assert "[Classificando]\nAnalisando" in t2
    assert "[Escrevendo SQL]\nGerando query" in t2


@pytest.mark.asyncio
async def test_agent_graph_execution_direct_route():
    graph = create_agent_graph()

    inputs = {
        "messages": [HumanMessage(content="Olá, quem é você?")],
        "route": None,
        "thought": None,
        "generated_sql": None,
        "query_result": None,
        "error_count": 0,
        "last_error": None,
        "error_category": None,
        "steps": [],
        "command": None,
    }

    config = {
        "configurable": {
            "provider": "mock",
            "model": "mock",
        }
    }

    result = await graph.ainvoke(inputs, config=config)

    assert result["route"] == "direct"
    assert len(result["messages"]) >= 2
    assert len(result["steps"]) >= 2
    assert any(s["node"] == AgentNode.ROUTER.value for s in result["steps"])
    assert any(s["node"] == AgentNode.SYNTHESIZER.value for s in result["steps"])


@pytest.mark.asyncio
async def test_agent_graph_execution_sql_route():
    graph = create_agent_graph()

    inputs = {
        "messages": [HumanMessage(content="Mostre o consumo por classe")],
        "route": None,
        "thought": None,
        "generated_sql": None,
        "query_result": None,
        "error_count": 0,
        "last_error": None,
        "error_category": None,
        "steps": [],
        "command": None,
    }

    config = {
        "configurable": {
            "provider": "mock",
            "model": "mock",
        }
    }

    result = await graph.ainvoke(inputs, config=config)

    assert result["route"] == "sql"
    assert result["generated_sql"] is not None
    assert result["query_result"] is not None
    assert len(result["steps"]) >= 4
    assert any(s["node"] == AgentNode.SQL_GENERATOR.value for s in result["steps"])
    assert any(s["node"] == AgentNode.SQL_EXECUTOR.value for s in result["steps"])
    assert any(s["node"] == AgentNode.SYNTHESIZER.value for s in result["steps"])


def test_llm_factory_model_precedence(monkeypatch):
    """Garante que AI_MODEL_NAME seja respeitado com precedência para provedores como local."""
    monkeypatch.setattr(get_settings(), "ai_model_name", "Qwen3.5-4B-Q4_K_M")
    model_instance = get_chat_model(provider="local", base_url="http://localhost:11434/v1")
    assert getattr(model_instance, "model_name", None) == "Qwen3.5-4B-Q4_K_M"

    model_override = get_chat_model(
        provider="local", model="custom-override-model", base_url="http://localhost:11434/v1"
    )
    assert getattr(model_override, "model_name", None) == "custom-override-model"

