"""Serviço de geração de insights proativos baseados no contexto operacional e métricas.

Este módulo é 100% Python puro (Clean Architecture) e não depende de FastAPI ou Starlette.
"""

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import get_settings
from app.core.llm_factory import get_chat_model
from app.features.chat.schemas import ProactiveInsightsRequest, ProactiveInsightsResponse
from app.shared.exceptions import ServiceUnavailableError

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Você é um especialista sênior em regulação e economia do Setor Elétrico Brasileiro (V-Energy).\n"
    "Sua missão é analisar proativamente métricas operacionais e comerciais de um painel "
    "e gerar diagnósticos executivos relevantes de alto impacto acionável.\n\n"
    "Diretrizes:\n"
    '1. Responda estritamente em JSON puro com as chaves "resumo_executivo" e "insights".\n'
    '2. "resumo_executivo": Uma frase direta sintetizando o achado principal.\n'
    '3. "insights": Lista de 2 a 3 pontos acionáveis abordando elasticidade, GD solar, perdas ou DEC/FEC.\n'
    "4. Sem preâmbulos, sem blocos adicionais."
)


def _is_provider_configured() -> bool:
    """Verifica se há um provedor de LLM configurado e disponível."""
    settings = get_settings()
    configured_provider = settings.ai_provider
    if configured_provider == "mock":
        return True
    if configured_provider in ("google", None) and settings.gemini_api_key:
        return True
    return configured_provider in ("groq", "openrouter", "local")


async def generate_proactive_insights_service(
    request: ProactiveInsightsRequest,
) -> ProactiveInsightsResponse:
    """Gera insights analíticos acionáveis através do LLM configurado.

    Caso não haja provedor de IA online ou configurado, levanta ServiceUnavailableError
    para que o frontend oculte o card proativo de forma limpa.

    Args:
        request: Contexto de tela, filtros e métricas ativas.

    Returns:
        ProactiveInsightsResponse com o resumo executivo e insights pontuais.

    Raises:
        ServiceUnavailableError: Se o provedor não estiver configurado ou falhar.
    """
    if not _is_provider_configured():
        logger.info("Nenhum provedor de IA online configurado para insights proativos.")
        raise ServiceUnavailableError("Provedor de inteligência artificial indisponível.")

    screen_context = request.context or request.tela or "geral"
    payload_info = {
        "contexto_painel": screen_context,
        "filtros_ativos": request.filtros,
        "metricas_observadas": request.metricas,
    }

    serialized_payload = json.dumps(payload_info, ensure_ascii=False)
    user_prompt = f"Analise o estado operacional e produza o diagnóstico em JSON:\n{serialized_payload}"

    try:
        model = get_chat_model(temperature=0.2, timeout_seconds=15)
        response = await model.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_prompt),
        ])
        raw_content = str(response.content).strip()

        # Remove formatação markdown se o LLM devolver com ```json ... ```
        clean_json_str = raw_content
        if "```json" in clean_json_str:
            clean_json_str = clean_json_str.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in clean_json_str:
            clean_json_str = clean_json_str.split("```", 1)[1].split("```", 1)[0].strip()

        parsed_data: dict[str, Any] = json.loads(clean_json_str)
        insights_list = parsed_data.get("insights", [])
        executive_summary = parsed_data.get("resumo_executivo", "")

        if not insights_list or not executive_summary:
            raise ValueError("Resposta do LLM com campos incompletos.")

        return ProactiveInsightsResponse(
            insights=insights_list,
            resumo_executivo=executive_summary,
        )
    except Exception as exc:
        logger.warning("Falha ao consultar LLM para insights proativos: %s", exc)
        raise ServiceUnavailableError("Falha na geração de insights proativos pelo LLM.") from exc
