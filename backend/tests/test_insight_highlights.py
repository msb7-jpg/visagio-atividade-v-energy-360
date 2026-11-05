"""Partes estruturadas do insight: destaques com valor do servidor, unidade, tom e textos fiéis aos dados."""

import pytest

from app.features.chat import insights_service
from app.features.chat.insight_highlights import faithful_or_none, metric_unit, parse_highlights, parse_tone
from app.features.chat.insights_service import generate_proactive_insights_service
from app.features.chat.schemas import ProactiveInsightsRequest

METRICS = {"faturamento_atual": 172232176.56, "faturamento_var_pct": 7.98, "valor_em_aberto_rs": 691.64}


@pytest.mark.parametrize(
    ("metric_key", "expected_unit"),
    [
        ("faturamento_atual", "rs"),
        ("dec_area_base", "horas"),
        ("faturamento_var_pct", "pct"),
        ("inadimplencia_var_pp", "pp"),
        ("valor_em_aberto_rs", "rs"),
        ("tarifa_media_rs_kwh_atual", "rs_kwh"),
        ("consumo_12_meses_kwh", "kwh"),
        ("horas_sem_energia_da_uc", "horas"),
        ("faturas_em_aberto", None),
    ],
)
def test_metric_unit_comes_from_the_metric_name(metric_key, expected_unit):
    assert metric_unit(metric_key) == expected_unit


def test_highlights_take_the_value_from_the_server_metrics_and_drop_unknown_keys():
    raw = [
        {"metrica": "faturamento_atual", "rotulo": "Faturamento"},
        {"metrica": "inventada", "rotulo": "Nada"},
        {"metrica": "faturamento_atual", "rotulo": "Repetido"},
        {"metrica": "faturamento_var_pct", "rotulo": ""},
        {"metrica": "valor_em_aberto_rs", "rotulo": "Em aberto", "valor": 1},
    ]

    highlights = parse_highlights(raw, METRICS)

    assert [(item.metrica, item.valor, item.unidade) for item in highlights] == [
        ("faturamento_atual", 172232176.56, "rs"),
        ("valor_em_aberto_rs", 691.64, "rs"),
    ]


def test_highlights_stop_at_three():
    metrics = {f"metrica_{index}": index for index in range(6)}
    raw = [{"metrica": key, "rotulo": key} for key in metrics]

    assert len(parse_highlights(raw, metrics)) == 3


@pytest.mark.parametrize(("raw_tone", "expected"), [("Crítico", "critico"), ("atenção", "atencao"), ("?", "neutro")])
def test_unknown_tone_falls_back_to_neutral(raw_tone, expected):
    assert parse_tone(raw_tone) == expected


def test_texts_with_invented_numbers_are_dropped():
    assert faithful_or_none("Faturamento subiu 7,98%", METRICS) == "Faturamento subiu 7,98%"
    assert faithful_or_none("Faturamento subiu 45,7%", METRICS) is None
    assert faithful_or_none("   ", METRICS) is None


class FakeChatModel:
    """Modelo falso que devolve sempre o mesmo JSON de insights."""

    def __init__(self, answer: str):
        self.answer = answer

    async def ainvoke(self, _messages):
        return type("Answer", (), {"content": self.answer})()


async def test_service_returns_the_structured_insight(monkeypatch):
    answer = (
        '{"manchete": "Faturamento subiu 7,98% no período", "tom": "positivo",'
        ' "destaques": [{"metrica": "faturamento_var_pct", "rotulo": "Variação"}],'
        ' "resumo_executivo": "A receita cresceu.", "insights": ["Preço puxou a alta."],'
        ' "acao_recomendada": "Acompanhar o efeito volume nos próximos 45,7 dias."}'
    )
    monkeypatch.setattr(insights_service, "_is_provider_configured", lambda: True)
    monkeypatch.setattr(insights_service, "get_chat_model", lambda **kwargs: FakeChatModel(answer))

    request = ProactiveInsightsRequest(context="executive", metricas=METRICS)
    response = await generate_proactive_insights_service(request)

    assert response.manchete == "Faturamento subiu 7,98% no período"
    assert response.tom == "positivo"
    assert [item.valor for item in response.destaques] == [7.98]
    assert response.acao_recomendada is None
