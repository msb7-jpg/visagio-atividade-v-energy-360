"""Partes estruturadas do insight: tom, manchete e números de destaque com valor copiado das métricas do servidor.

A IA escolhe quais métricas destacar e dá o rótulo; o valor nunca vem do texto da IA, e sim de `metricas`.
"""

import unicodedata
from typing import Any

from app.agent.utils.faithfulness_checker import check_numerical_faithfulness
from app.features.chat.schemas import InsightHighlight, InsightTone
from app.features.executive_dashboard.catalog import GROUPS

MAX_HIGHLIGHTS = 3
MAX_LABEL_LENGTH = 40
DEFAULT_TONE: InsightTone = "neutro"
VALID_TONES: tuple[InsightTone, ...] = ("positivo", "neutro", "atencao", "critico")

INDICATOR_UNITS = {spec.id: spec.unidade.value.lower() for group in GROUPS for spec in group.indicadores}
VARIATION_UNITS = {"var_pct": "pct", "var_pp": "pp"}
TOKEN_UNITS = (
    ("rs_kwh", "rs_kwh"),
    ("pct", "pct"),
    ("rs", "rs"),
    ("kwh", "kwh"),
    ("horas", "horas"),
)


def metric_unit(metric_key: str) -> str | None:
    """Unidade de exibição de uma métrica, pelo nome dela (`valor_em_aberto_rs` → `rs`).

    Args:
        metric_key: Nome da métrica calculada pelo servidor.

    Returns:
        `rs`, `rs_kwh`, `kwh`, `pct`, `pp`, `horas`, `vezes`, `ucs`, `nota` ou None quando é contagem ou texto.
    """
    for suffix, unit in VARIATION_UNITS.items():
        if metric_key.endswith(f"_{suffix}"):
            return unit
    indicator_id = metric_key.removesuffix("_atual").removesuffix("_base")
    if indicator_id in INDICATOR_UNITS:
        return INDICATOR_UNITS[indicator_id]
    padded_key = f"_{metric_key}_"
    for token, unit in TOKEN_UNITS:
        if f"_{token}_" in padded_key:
            return unit
    return None


def parse_tone(raw_tone: Any) -> InsightTone:
    """Normaliza o tom devolvido pela IA; valor desconhecido vira `neutro`."""
    decomposed = unicodedata.normalize("NFKD", str(raw_tone or "").strip().lower())
    tone_text = "".join(char for char in decomposed if not unicodedata.combining(char))
    for tone in VALID_TONES:
        if tone_text == tone:
            return tone
    return DEFAULT_TONE


def parse_highlights(raw_highlights: Any, metrics: dict[str, Any] | None) -> list[InsightHighlight]:
    """Monta os destaques: só métricas que existem no servidor, sem repetir, com o valor lido delas.

    Args:
        raw_highlights: Lista devolvida pela IA, cada item com `metrica` e `rotulo`.
        metrics: Métricas calculadas pelo servidor para a tela.

    Returns:
        Até três destaques válidos; itens com métrica inexistente ou sem rótulo são descartados.
    """
    if not isinstance(raw_highlights, list) or not metrics:
        return []
    highlights: list[InsightHighlight] = []
    seen_keys: set[str] = set()
    for entry in raw_highlights:
        if not isinstance(entry, dict):
            continue
        metric_key = str(entry.get("metrica", "")).strip()
        label = str(entry.get("rotulo", "")).strip()[:MAX_LABEL_LENGTH]
        if not label or metric_key not in metrics or metric_key in seen_keys:
            continue
        seen_keys.add(metric_key)
        highlights.append(
            InsightHighlight(
                rotulo=label, metrica=metric_key, valor=metrics[metric_key], unidade=metric_unit(metric_key)
            )
        )
        if len(highlights) == MAX_HIGHLIGHTS:
            break
    return highlights


def faithful_or_none(text: Any, metrics: dict[str, Any] | None) -> str | None:
    """Devolve o texto limpo se todo número citado nele existir nas métricas; senão, None."""
    clean_text = str(text or "").strip()
    if not clean_text:
        return None
    if not metrics:
        return clean_text
    is_faithful, _, ungrounded = check_numerical_faithfulness(clean_text, metrics)
    return clean_text if is_faithful or not ungrounded else None
