from app.agent.prompts.catalog_prompt import CATALOG_PROMPT_TEMPLATE
from app.agent.prompts.chart_prompt import (
    CHART_DECISION_SYSTEM_PROMPT,
    CHART_PRESENT_PROMPT,
    TABLE_PRESENT_PROMPT,
)
from app.agent.prompts.corrector_prompt import CORRECTOR_PROMPT
from app.agent.prompts.router_prompt import ROUTER_PROMPT
from app.agent.prompts.synthesizer_prompt import SYNTHESIZER_PROMPT

__all__ = [
    "CATALOG_PROMPT_TEMPLATE",
    "CHART_DECISION_SYSTEM_PROMPT",
    "CHART_PRESENT_PROMPT",
    "CORRECTOR_PROMPT",
    "ROUTER_PROMPT",
    "SYNTHESIZER_PROMPT",
    "TABLE_PRESENT_PROMPT",
]
