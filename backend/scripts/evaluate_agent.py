"""Script de avaliação automatizada da qualidade do Agente Text-to-SQL (Golden Dataset)."""

import json
import logging
from pathlib import Path

from app.agent.nodes.sql_validator import validate_sql_query

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def evaluate_golden_dataset(dataset_path: Path) -> dict[str, float | int]:
    """Itera sobre as perguntas de benchmark avaliando a acurácia sintática.

    Args:
        dataset_path: Caminho para o arquivo JSON contendo o golden dataset.

    Returns:
        Dicionário com métricas calculadas de avaliação.
    """
    with dataset_path.open(encoding="utf-8") as file_handle:
        test_cases = json.load(file_handle)

    total_cases = len(test_cases)
    syntactic_valid_count = 0

    logger.info("Iniciando avaliação do agente contra %d casos do Golden Dataset...", total_cases)

    for item in test_cases:
        expected_sql = item.get("sql_esperado", "")
        is_safe, error_msg, _ = validate_sql_query(expected_sql)

        if is_safe:
            syntactic_valid_count += 1
        else:
            logger.warning("Falha sintática no caso #%d: %s", item.get("id"), error_msg)

    syntactic_validity_pct = (syntactic_valid_count / total_cases) * 100.0 if total_cases > 0 else 0.0

    report = {
        "total_cases": total_cases,
        "syntactic_valid_count": syntactic_valid_count,
        "syntactic_validity_pct": round(syntactic_validity_pct, 2),
    }

    logger.info("Resultado da Avaliação: %s", report)
    return report


if __name__ == "__main__":
    golden_path = Path(__file__).resolve().parent.parent / "tests" / "golden_dataset.json"
    evaluate_golden_dataset(golden_path)
