"""Tradutor de atualizações do LangGraph em eventos Server-Sent Events (SSE)."""

import json
import logging
from typing import Any

import sqlparse

from app.core.constants import NODE_LABELS, SSEEventType, StepStatus
from app.features.chat.schemas import StreamErrorPayload

logger = logging.getLogger(__name__)


def _resolve_step_duration(node_update: dict[str, Any], fallback: int) -> int:
    """Extrai a duração individual em milissegundos da etapa concluída caso disponível."""
    if node_update.get("steps"):
        first_step = node_update["steps"][0]
        if isinstance(first_step, dict) and first_step.get("duration_ms") is not None:
            return first_step["duration_ms"]
    return fallback


def _build_thought_event(node_update: dict[str, Any], label: str) -> dict[str, str] | None:
    """Gera o evento SSE de pensamento do agente devidamente rotulado se presente."""
    raw_thought = node_update.get("thought")
    if not raw_thought:
        return None

    thought_text = str(raw_thought).replace("__RESET__", "").strip()
    if not thought_text:
        return None

    if not thought_text.startswith(f"[{label}]"):
        thought_text = f"[{label}]\n{thought_text}"

    return {
        "event": SSEEventType.THOUGHT.value,
        "data": json.dumps({"thought": thought_text}, ensure_ascii=False),
    }


class SSEEventDispatcher:
    """Traduz as atualizações emitidas pelos nós do LangGraph em eventos SSE formatados."""

    @classmethod
    def emit_session(cls, thread_id: str, provider: str | None, model: str | None) -> dict[str, str]:
        return {
            "event": SSEEventType.SESSION.value,
            "data": json.dumps(
                {
                    "thread_id": thread_id,
                    "provider": provider,
                    "model": model,
                },
                ensure_ascii=False,
            ),
        }

    @classmethod
    def emit_done(cls, thread_id: str) -> dict[str, str]:
        return {
            "event": SSEEventType.DONE.value,
            "data": json.dumps({"status": "completed", "thread_id": thread_id}, ensure_ascii=False),
        }

    @classmethod
    def emit_error(cls, error_data: StreamErrorPayload | dict[str, Any]) -> dict[str, str]:
        data = error_data.model_dump() if isinstance(error_data, StreamErrorPayload) else error_data
        return {
            "event": SSEEventType.ERROR.value,
            "data": json.dumps(data, ensure_ascii=False),
        }

    @classmethod
    def dispatch_node_updates(
        cls,
        node_name: str,
        node_update: dict[str, Any],
        duration_ms: int = 0,
    ) -> list[dict[str, str]]:
        events: list[dict[str, str]] = []
        label = NODE_LABELS.get(node_name, node_name)
        step_duration = _resolve_step_duration(node_update, duration_ms)

        # 1. Evento de conclusão de etapa (step_end)
        events.append({
            "event": SSEEventType.STEP_END.value,
            "data": json.dumps(
                {
                    "step": node_name,
                    "label": label,
                    "status": StepStatus.DONE.value,
                    "duration_ms": step_duration,
                },
                ensure_ascii=False,
            ),
        })

        # 2. Emissão de raciocínio intermediário (thought)
        thought_event = _build_thought_event(node_update, label)
        if thought_event:
            events.append(thought_event)

        # 3. Emissão de código SQL formatado
        if node_update.get("generated_sql"):
            raw_sql = str(node_update["generated_sql"])
            formatted_sql = sqlparse.format(raw_sql, reindent=True, keyword_case="upper")
            events.append({
                "event": SSEEventType.SQL.value,
                "data": json.dumps({"sql": formatted_sql, "raw": raw_sql}, ensure_ascii=False),
            })

        # 4. Emissão de especificação de gráfico
        if node_update.get("chart_spec"):
            events.append({
                "event": SSEEventType.CHART.value,
                "data": json.dumps({"chart": node_update["chart_spec"]}, ensure_ascii=False),
            })

        # 5. Emissão de dados analíticos retornados
        if node_update.get("query_result") is not None:
            results = node_update["query_result"]
            events.append({
                "event": SSEEventType.DATA.value,
                "data": json.dumps({"results": results[:50], "total": len(results)}, ensure_ascii=False),
            })

        # 6. Emissão de mensagem sintetizada
        if node_update.get("messages"):
            for msg in node_update["messages"]:
                content = getattr(msg, "content", "")
                if content:
                    events.append({
                        "event": SSEEventType.ANSWER.value,
                        "data": json.dumps({"content": content}, ensure_ascii=False),
                    })

        return events
