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
from app.agent.tools.query_runner import execute_sql_query
from app.agent.utils.faithfulness_checker import check_numerical_faithfulness
from app.agent.utils.result_comparator import compare_query_results

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def _execute_canonical_query(expected_sql: str | None) -> list[dict[str, Any]]:
    """Executa a query canônica esperada no SQLite para extrair o gabarito."""
    if not expected_sql:
        return []
    try:
        return execute_sql_query.invoke(expected_sql)
    except Exception as exc:
        logger.warning("Falha ao executar SQL esperado '%s': %s", expected_sql[:50], exc)
        return []


def _extract_last_ai_content(messages: list[Any]) -> str:
    """Extrai o texto da última resposta da IA gerada no estado."""
    for message in reversed(messages):
        if getattr(message, "type", "") == "ai" or message.__class__.__name__ == "AIMessage":
            return str(message.content)
    return ""


async def _run_single_case(
    graph: Any,
    test_case: dict[str, Any],
    provider: str,
    model: str | None,
    base_url: str | None,
) -> dict[str, Any]:
    """Executa um caso de teste no grafo FSM e afere validade, EX e fidelidade."""
    case_id = int(test_case.get("id", 0))
    question_text = str(test_case.get("pergunta", ""))
    case_type = str(test_case.get("tipo", "sql"))
    expected_sql = test_case.get("sql_esperado")

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
            "base_url": base_url,
            "thread_id": f"eval-case-{case_id}",
        }
    }

    start_time = time.perf_counter()
    try:
        result = await graph.ainvoke(inputs, config=run_config)
    except Exception as exc:  # pylint: disable=broad-exception-caught
        logger.error("Falha na execução do caso %d: %s", case_id, exc)
        result = {"error_count": 1, "last_error": str(exc), "messages": []}
    elapsed_ms = max(1, int((time.perf_counter() - start_time) * 1000))

    generated_sql = result.get("generated_sql") or ""
    actual_rows = result.get("query_result")
    ai_text = _extract_last_ai_content(result.get("messages", []))

    is_valid_sql = False
    if generated_sql:
        is_valid_sql, _, _ = validate_sql_query(generated_sql)

    exec_ok = bool(is_valid_sql and not result.get("last_error") and actual_rows is not None)
    result_matched = False
    refusal_ok = False

    if case_type == "sql":
        expected_rows = _execute_canonical_query(expected_sql)
        if exec_ok and expected_rows is not None:
            has_order = bool(expected_sql and "ORDER BY" in expected_sql.upper() and "LIMIT" in expected_sql.upper())
            result_matched, _ = compare_query_results(actual_rows, expected_rows, strict_order=has_order)
    else:
        # Em casos de recusa, o sucesso é não gerar SQL ou ser bloqueado por segurança/escopo
        has_blocked_error = bool(result.get("error_category") or result.get("last_error"))
        is_direct_route = bool(result.get("route") == "direct")
        has_no_query_result = bool(actual_rows is None)
        refusal_ok = bool(has_blocked_error or is_direct_route or (has_no_query_result and not generated_sql))

    faithful_ok, _, _ = check_numerical_faithfulness(ai_text, actual_rows or {})

    return {
        "id": case_id,
        "tipo": case_type,
        "pergunta": question_text,
        "elapsed_ms": elapsed_ms,
        "syntactic_valid": is_valid_sql,
        "exec_ok": exec_ok,
        "result_matched": result_matched,
        "refusal_ok": refusal_ok,
        "faithful_ok": faithful_ok,
        "generated_sql": generated_sql,
    }


def _calculate_metrics(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Calcula percentuais de acurácia sintática, EX, recusa, fidelidade e latência."""
    sql_cases = [res for res in results if res["tipo"] == "sql"]
    refusal_cases = [res for res in results if res["tipo"] == "recusa"]

    total_sql = len(sql_cases)
    total_refusal = len(refusal_cases)
    total_cases = len(results)

    valid_sql_count = sum(1 for res in sql_cases if res["syntactic_valid"])
    exec_ok_count = sum(1 for res in sql_cases if res["exec_ok"])
    matched_count = sum(1 for res in sql_cases if res["result_matched"])
    refusal_count = sum(1 for res in refusal_cases if res["refusal_ok"])
    faithful_count = sum(1 for res in results if res["faithful_ok"])

    latencies = [res["elapsed_ms"] for res in results]
    latencies.sort()
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
    p50_latency = latencies[len(latencies) // 2] if latencies else 0
    p95_latency = latencies[int(len(latencies) * 0.95)] if latencies else 0

    return {
        "total_cases": total_cases,
        "sql_cases": total_sql,
        "refusal_cases": total_refusal,
        "syntactic_validity_pct": round((valid_sql_count / total_sql) * 100.0, 2) if total_sql else 0.0,
        "execution_success_pct": round((exec_ok_count / total_sql) * 100.0, 2) if total_sql else 0.0,
        "execution_accuracy_pct": round((matched_count / total_sql) * 100.0, 2) if total_sql else 0.0,
        "refusal_accuracy_pct": round((refusal_count / total_refusal) * 100.0, 2) if total_refusal else 0.0,
        "faithfulness_pct": round((faithful_count / total_cases) * 100.0, 2) if total_cases else 0.0,
        "average_latency_ms": round(avg_latency, 2),
        "p50_latency_ms": p50_latency,
        "p95_latency_ms": p95_latency,
    }


def _export_reports(metrics: dict[str, Any], results: list[dict[str, Any]], provider: str, model: str | None) -> None:
    """Exporta relatórios auditáveis em JSON e Markdown na pasta do Miguel."""
    output_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "planning" / "miguel"
    output_dir.mkdir(parents=True, exist_ok=True)

    json_payload = {"metadata": {"provider": provider, "model": model}, "metrics": metrics, "cases": results}
    with (output_dir / "benchmark_resultado.json").open("w", encoding="utf-8") as json_file:
        json.dump(json_payload, json_file, indent=2, ensure_ascii=False)

    total_summary = f"{metrics['total_cases']} ({metrics['sql_cases']} SQL + {metrics['refusal_cases']} Recusa)"
    md_content = f"""# Relatório de Benchmark do Agente GenAI (Fatia 07)

- **Provedor:** `{provider}`
- **Modelo:** `{model or 'default'}`
- **Data da Avaliação:** {time.strftime('%Y-%m-%d %H:%M:%S')}

## Métricas Oficiais Consolidadas

| Métrica | Resultado |
|---|---|
| **Total de Casos Avaliados** | {total_summary} |
| **Validade Sintática SQL** | {metrics['syntactic_validity_pct']}% |
| **Execução sem Erro no SQLite** | {metrics['execution_success_pct']}% |
| **Execution Accuracy (EX - Acerto Real)** | **{metrics['execution_accuracy_pct']}%** |
| **Taxa de Recusa Correta ("Não Sei" / Segurança)** | **{metrics['refusal_accuracy_pct']}%** |
| **Fidelidade aos Dados (Groundedness Score)** | **{metrics['faithfulness_pct']}%** |
| **Latência Média** | {metrics['average_latency_ms']} ms |
| **Latência p50 / p95** | {metrics['p50_latency_ms']} ms / {metrics['p95_latency_ms']} ms |

## Detalhamento dos Casos de Teste

| ID | Tipo | Pergunta | EX / Recusa | Fiel? | Latência |
|---|---|---|---|---|---|
"""
    for res in results:
        status_str = "✅ Acertou" if (res["result_matched"] or res["refusal_ok"]) else "❌ Divergiu"
        faith_str = "✅ Fiel" if res["faithful_ok"] else "⚠️ Alucinou"
        short_q = f"{res['pergunta'][:40]}..."
        md_content += (
            f"| #{res['id']} | {res['tipo']} | {short_q} | {status_str} | {faith_str} | {res['elapsed_ms']} ms |\n"
        )

    with (output_dir / "benchmark_resultado.md").open("w", encoding="utf-8") as md_file:
        md_file.write(md_content)
    logger.info("Relatórios de benchmark exportados em docs/planning/miguel/ com sucesso.")


async def evaluate_golden_dataset_async(
    dataset_path: Path,
    provider: str = "local",
    model: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    """Itera assincronamente sobre as perguntas de benchmark em um único loop de eventos."""
    with dataset_path.open(encoding="utf-8") as file_handle:
        test_cases = json.load(file_handle)

    agent_graph = create_agent_graph()
    logger.info("Iniciando avaliação do agente contra %d casos (provedor=%s)...", len(test_cases), provider)

    results: list[dict[str, Any]] = []
    for test_case in test_cases:
        res = await _run_single_case(agent_graph, test_case, provider, model, base_url)
        results.append(res)

    metrics = _calculate_metrics(results)
    _export_reports(metrics, results, provider, model)
    logger.info("Resultado Consolidado da Avaliação: %s", metrics)
    return metrics


def evaluate_golden_dataset(
    dataset_path: Path,
    provider: str = "local",
    model: str | None = None,
    base_url: str | None = None,
) -> dict[str, Any]:
    """Ponto de entrada síncrono para execução do benchmark."""
    return asyncio.run(evaluate_golden_dataset_async(dataset_path, provider, model, base_url))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Avaliação automatizada do Agente Text-to-SQL")
    parser.add_argument(
        "--provider",
        default=os.getenv("AI_PROVIDER", "local"),
        help="Provedor de LLM para avaliação (local, mock, google, openrouter)",
    )
    parser.add_argument(
        "--model",
        default=os.getenv("AI_MODEL_NAME", "models/Qwen3.5-4B-Q4_K_M.gguf"),
        help="Nome do modelo",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("AI_BASE_URL", "http://127.0.0.1:8080/v1"),
        help="URL base para provedores compatíveis com OpenAI / llama.cpp",
    )
    args = parser.parse_args()

    golden_path = Path(__file__).resolve().parent.parent / "tests" / "golden_dataset.json"
    evaluate_golden_dataset(golden_path, provider=args.provider, model=args.model, base_url=args.base_url)
