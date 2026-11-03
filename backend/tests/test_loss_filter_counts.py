"""Contagem de UCs da fila por opção de filtro: município, classe e motivo."""

from app.features.loss_management.queue_filter_options import count_queue_options
from app.features.loss_management.schemas import QueueFiltersDTO, SuspicionReason, SuspiciousUnitDTO

OPTIONS = QueueFiltersDTO(
    municipios=["IGARASSU", "OLINDA", "RECIFE"],
    classes=["COMERCIAL", "RESIDENCIAL", "RURAL"],
)


def make_unit(id_uc: str, municipio: str, classe: str, reasons: list[SuspicionReason]) -> SuspiciousUnitDTO:
    return SuspiciousUnitDTO(
        id_uc=id_uc,
        municipio=municipio,
        bairro="CENTRO",
        classe_consumo=classe,
        motivos=reasons,
        score_risco=50,
        probabilidade_acerto=0.5,
        consumo_base_kwh=200,
        consumo_recente_kwh=100,
        kwh_estimado_recuperar=300,
        valor_estimado_recuperar_rs=240,
        kwh_mes_recuperavel=100,
        valor_ano_rs=900,
    )


def test_counts_each_option_and_keeps_options_with_no_unit_at_zero():
    units = [
        make_unit("UC1", "RECIFE", "RESIDENCIAL", [SuspicionReason.QUEDA_MODERADA]),
        make_unit("UC2", "RECIFE", "RESIDENCIAL", [SuspicionReason.QUEDA_MODERADA]),
        make_unit("UC3", "OLINDA", "COMERCIAL", [SuspicionReason.QUEDA_SUBITA, SuspicionReason.LEITURA_ZERADA]),
    ]

    counts = count_queue_options(units, OPTIONS)

    assert counts.municipios == {"IGARASSU": 0, "OLINDA": 1, "RECIFE": 2}
    assert counts.classes == {"COMERCIAL": 1, "RESIDENCIAL": 2, "RURAL": 0}
    assert counts.motivos == {"queda_subita": 1, "queda_moderada": 2, "leitura_zerada": 1}


def test_a_unit_with_two_reasons_counts_once_in_each_reason_but_once_in_its_place():
    units = [make_unit("UC1", "OLINDA", "COMERCIAL", [SuspicionReason.QUEDA_SUBITA, SuspicionReason.LEITURA_ZERADA])]

    counts = count_queue_options(units, OPTIONS)

    assert sum(counts.municipios.values()) == 1
    assert (counts.motivos["queda_subita"], counts.motivos["leitura_zerada"]) == (1, 1)


def test_an_empty_queue_lists_every_option_with_zero():
    counts = count_queue_options([], OPTIONS)

    assert counts.municipios == {"IGARASSU": 0, "OLINDA": 0, "RECIFE": 0}
    assert counts.classes == {"COMERCIAL": 0, "RESIDENCIAL": 0, "RURAL": 0}
    assert counts.motivos == {"queda_subita": 0, "queda_moderada": 0, "leitura_zerada": 0}
