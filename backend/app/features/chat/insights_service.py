"""Serviço de geração de insights proativos baseados no contexto operacional e métricas.

Este módulo é 100% Python puro (Clean Architecture) e não depende de FastAPI ou Starlette.
"""

import json
import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agent.utils.faithfulness_checker import check_numerical_faithfulness
from app.core.config import get_settings
from app.core.llm_factory import get_chat_model
from app.features.chat.schemas import ProactiveInsightsRequest, ProactiveInsightsResponse
from app.shared.exceptions import ServiceUnavailableError

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "Você é um especialista sênior em regulação e economia do Setor Elétrico Brasileiro (V-Energy).\n"
    "Sua missão é analisar proativamente métricas operacionais e comerciais de um painel "
    "e gerar diagnósticos executivos relevantes de alto impacto acionável.\n\n"
    "DIRETRIZES MANDATÓRIAS:\n"
    '1. Responda estritamente em JSON puro com as chaves "resumo_executivo" e "insights".\n'
    '2. "resumo_executivo": Uma frase direta sintetizando o achado principal.\n'
    '3. "insights": Lista de 2 a 3 pontos acionáveis abordando elasticidade, GD solar, perdas ou DEC/FEC.\n'
    "4. FIDELIDADE ABSOLUTA AOS DADOS (ZERO ALUCINAÇÃO): É terminantemente proibido inventar números. "
    "Todo valor percentual ou monetário citado deve existir exatamente em 'metricas_observadas'.\n"
    "5. Sem preâmbulos, sem blocos adicionais."
)


def _filter_faithful_insights(
    summary: str,
    raw_insights: list[str],
    metrics_context: dict[str, Any] | None,
) -> tuple[str, list[str]]:
    """Valida a fidelidade factual dos números e descarta alegações desfundamentadas."""
    if not metrics_context:
        return summary, raw_insights

    summary_ok, _, ungrounded_summary = check_numerical_faithfulness(summary, metrics_context)
    if not summary_ok and ungrounded_summary:
        logger.warning("Resumo executivo do insight contém números não fundamentados: %s", ungrounded_summary)

    faithful_bullets: list[str] = []
    for bullet in raw_insights:
        bullet_ok, _, ungrounded_bullet = check_numerical_faithfulness(bullet, metrics_context)
        if bullet_ok or not ungrounded_bullet:
            faithful_bullets.append(bullet)
        else:
            logger.warning("Descartando insight infiel aos dados: '%s' (números: %s)", bullet, ungrounded_bullet)

    return summary, faithful_bullets


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
        raw_insights = parsed_data.get("insights")
        executive_summary = parsed_data.get("resumo_executivo")

        if not isinstance(raw_insights, list) or not isinstance(executive_summary, str):
            logger.error("LLM retornou JSON com tipagem incompatível: %s", clean_json_str)
            raise ValueError(
                "Resposta do LLM com estrutura inválida (insights deve ser lista e resumo_executivo texto)."
            )

        insights_list = [
            str(insight_entry).strip()
            for insight_entry in raw_insights
            if str(insight_entry).strip()
        ]
        if not insights_list or not executive_summary.strip():
            logger.warning("LLM retornou campos vazios para insights.")
            raise ValueError("Resposta do LLM com campos incompletos.")

        validated_summary, validated_bullets = _filter_faithful_insights(
            executive_summary.strip(),
            insights_list,
            request.metricas,
        )
        if not validated_bullets:
            logger.warning("Todos os insights foram descartados por ausência de lastro nos dados.")
            raise ServiceUnavailableError("Insights gerados reprovados na verificação de fidelidade aos dados.")

        return ProactiveInsightsResponse(
            insights=validated_bullets,
            resumo_executivo=validated_summary,
        )
    except json.JSONDecodeError as decode_err:
        logger.error("JSON malformado retornado pelo LLM para insights: %s", decode_err)
        raise ServiceUnavailableError(
            "Falha na formatação da resposta pelo modelo de inteligência artificial."
        ) from decode_err
    except ServiceUnavailableError:
        raise
    except Exception as exc:
        logger.warning("Falha operacional ao consultar LLM para insights proativos: %s", exc)
        raise ServiceUnavailableError("Falha na geração de insights proativos pelo LLM.") from exc
