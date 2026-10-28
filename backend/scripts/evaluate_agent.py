"""Script de avaliação automatizada da qualidade do Agente Text-to-SQL (Golden Dataset)."""

import argparse
import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import Any

from langchain_core.messages import HumanMessage

from app.agent.graph import create_agent_graph
from app.agent.nodes.sql_validator import validate_sql_query

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


async def _run_single_case(
    graph: Any,
    question_text: str,
    case_id: int,
    provider: str,
    model: str | None,
) -> tuple[bool, int]:
    """Executa uma pergunta no grafo FSM e afere a validade da execução e a latência em ms."""
    inputs = {
        "messages": [HumanMessage(content=question_text)],
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
    run_config = {
        "configurable": {
            "provider": provider,
            "model": model,
            "thread_id": f"eval-case-{case_id}",
        }
    }
    start_time = time.perf_counter()
    result = await graph.ainvoke(inputs, config=run_config)
    elapsed_ms = max(1, int((time.perf_counter() - start_time) * 1000))

    generated_sql = result.get("generated_sql") or ""
    is_valid_sql, _, _ = validate_sql_query(generated_sql) if generated_sql else (False, "", None)
    execution_succeeded = bool(is_valid_sql and not result.get("last_error") and result.get("query_result") is not None)
    return execution_succeeded, elapsed_ms


async def evaluate_golden_dataset_async(
    dataset_path: Path,
    provider: str = "mock",
    model: str | None = None,
) -> dict[str, float | int]:
    """Itera assincronamente sobre as perguntas de benchmark em um único loop de eventos."""
    with dataset_path.open(encoding="utf-8") as file_handle:
        test_cases = json.load(file_handle)

    total_cases = len(test_cases)
    syntactic_valid_count = 0
    execution_success_count = 0
    total_latency_ms = 0

    agent_graph = create_agent_graph()
    logger.info(
        "Iniciando avaliação do agente contra %d casos do Golden Dataset (provedor=%s)...",
        total_cases,
        provider,
    )

    for test_case in test_cases:
        case_id = int(test_case.get("id", 0))
        expected_sql = str(test_case.get("sql_esperado", ""))
        question_text = str(test_case.get("pergunta", ""))

        is_safe, error_msg, _ = validate_sql_query(expected_sql)
        if is_safe:
            syntactic_valid_count += 1
        else:
            logger.warning("Falha sintática no caso #%d: %s", case_id, error_msg)

        exec_ok, latency_ms = await _run_single_case(agent_graph, question_text, case_id, provider, model)
        total_latency_ms += latency_ms
        if exec_ok:
            execution_success_count += 1

    syntactic_validity_pct = (syntactic_valid_count / total_cases) * 100.0 if total_cases > 0 else 0.0
    execution_accuracy_pct = (execution_success_count / total_cases) * 100.0 if total_cases > 0 else 0.0
    average_latency_ms = total_latency_ms / total_cases if total_cases > 0 else 0.0

    report: dict[str, float | int] = {
        "total_cases": total_cases,
        "syntactic_valid_count": syntactic_valid_count,
        "syntactic_validity_pct": round(syntactic_validity_pct, 2),
        "execution_success_count": execution_success_count,
        "execution_accuracy_pct": round(execution_accuracy_pct, 2),
        "average_latency_ms": round(average_latency_ms, 2),
    }

    logger.info("Resultado da Avaliação: %s", report)
    return report


def evaluate_golden_dataset(
    dataset_path: Path,
    provider: str = "mock",
    model: str | None = None,
) -> dict[str, float | int]:
    """Ponto de entrada síncrono para execução do benchmark."""
    return asyncio.run(evaluate_golden_dataset_async(dataset_path, provider=provider, model=model))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Avaliação automatizada do Agente Text-to-SQL")
    parser.add_argument(
        "--provider",
        default=os.getenv("EVAL_PROVIDER", "mock"),
        help="Provedor de LLM para avaliação (mock, google, openrouter, local)",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("EVAL_MODEL"),
        help="Nome do modelo (opcional, fallback para o default do provedor)",
    )
    args = parser.parse_args()

    golden_path = Path(__file__).resolve().parent.parent / "tests" / "golden_dataset.json"
    evaluate_golden_dataset(golden_path, provider=args.provider, model=args.model)
