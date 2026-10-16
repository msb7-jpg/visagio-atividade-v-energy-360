import pytest
from langchain_core.messages import HumanMessage

from app.agent.graph import create_agent_graph
from app.agent.state import append_steps, append_thought
from app.agent.utils.command_parser import parse_slash_command
from app.agent.utils.toon_serializer import serialize_to_toon_tabular
from app.core.constants import AgentNode


def test_command_parser():
    cmd, _ = parse_slash_command("/chart bar Evolução mensal de consumo")
    assert cmd is not None
    assert cmd["name"] == "chart"
    assert cmd["args"] == "bar Evolução mensal de consumo"

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
    # Teste de reinicialização ao passar router
    initial_steps = [{"node": "synthesizer", "status": "done", "duration_ms": 100, "label": "Formatando"}]
    new_router_step = [{"node": "router", "status": "done", "duration_ms": 50, "label": "Classificando"}]
    updated = append_steps(initial_steps, new_router_step)
    assert len(updated) == 1
    assert updated[0]["node"] == "router"

    # Teste de thought com reset
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
        "chart_spec": None,
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
async def test_agent_graph_execution_sql_and_chart_route():
    graph = create_agent_graph()

    inputs = {
        "messages": [HumanMessage(content="Mostre o consumo por classe com gráfico de barras")],
        "route": None,
        "thought": None,
        "generated_sql": None,
        "query_result": None,
        "error_count": 0,
        "last_error": None,
        "error_category": None,
        "chart_spec": None,
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
    assert any(s["node"] == AgentNode.CHART_GENERATOR.value for s in result["steps"])
    assert any(s["node"] == AgentNode.SYNTHESIZER.value for s in result["steps"])
