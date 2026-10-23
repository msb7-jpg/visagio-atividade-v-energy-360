"""Testes das regras puras e do serviço de qualidade da rede (sem banco e sem HTTP)."""

import pytest

from app.features.grid_quality.rules import (
    FeederQualityRow,
    classify_status,
    delta_dec,
    rank_feeders,
    summarize_indicators,
)
from app.features.grid_quality.schemas import QualityStatus
from app.features.grid_quality.service import GridQualityService
from app.shared.exceptions import NotFoundException

# Valores fictícios e redondos: não representam nenhum dado do case.
LIMITE_DEC = 100.0
LIMITE_FEC = 50.0
COMPETENCIA_TESTE = "2000-01"


def make_row(
    id_alimentador: str = "ALIM-TESTE-01",
    dec: float = 0.0,
    fec: float = 0.0,
    dec_limit: float | None = LIMITE_DEC,
    fec_limit: float | None = LIMITE_FEC,
    competencia: str = COMPETENCIA_TESTE,
) -> FeederQualityRow:
    """Monta uma apuração fictícia com limites padrão."""
    return FeederQualityRow(id_alimentador, competencia, dec, fec, dec_limit, fec_limit)


def ranking_ids(ranking) -> list[str]:
    """Extrai os ids na ordem do ranking."""
    return [entry.id_alimentador for entry in ranking]


class FakeQualityRepository:
    """Repositório em memória, injetado no serviço pela `__init__`."""

    def __init__(self, rows: list[FeederQualityRow]) -> None:
        self.rows = rows
        self.requested_competencias: list[str] = []

    async def fetch_latest_competencia(self) -> str | None:
        """Devolve a maior competência presente nas linhas."""
        return max((row.competencia for row in self.rows), default=None)

    async def fetch_rows(self, competencia: str) -> list[FeederQualityRow]:
        """Devolve as linhas da competência e registra o pedido."""
        self.requested_competencias.append(competencia)
        return [row for row in self.rows if row.competencia == competencia]

    async def fetch_history(self, id_alimentador: str, meses: int) -> list[FeederQualityRow]:
        """Devolve as últimas `meses` linhas do alimentador em ordem cronológica."""
        feeder_rows = [row for row in self.rows if row.id_alimentador == id_alimentador]
        return sorted(feeder_rows, key=lambda row: row.competencia)[-meses:]


@pytest.mark.parametrize(
    ("dec", "fec", "expected_status"),
    [
        (0.0, 0.0, QualityStatus.CONFORME),
        (84.9, 42.4, QualityStatus.CONFORME),
        (85.0, 0.0, QualityStatus.ALERTA),
        (0.0, 42.5, QualityStatus.ALERTA),
        (100.0, 50.0, QualityStatus.ALERTA),
        (100.1, 0.0, QualityStatus.VIOLACAO),
        (0.0, 50.1, QualityStatus.VIOLACAO),
    ],
    ids=["zero", "abaixo_de_85", "85_dec", "85_fec", "exatamente_no_limite", "dec_acima", "fec_acima"],
)
def test_classify_status_nas_fronteiras_de_85_e_100_por_cento(dec, fec, expected_status):
    assert classify_status(make_row(dec=dec, fec=fec)) is expected_status


@pytest.mark.parametrize("invalid_limit", [None, 0.0, -1.0])
def test_limite_nulo_ou_nao_positivo_nao_gera_violacao_nem_delta(invalid_limit):
    row = make_row(dec=1000.0, fec=1000.0, dec_limit=invalid_limit, fec_limit=invalid_limit)

    assert classify_status(row) is QualityStatus.CONFORME
    assert delta_dec(row) is None


def test_delta_dec_e_o_excesso_sobre_o_limite():
    assert delta_dec(make_row(dec=120.0)) == pytest.approx(20.0)
    assert delta_dec(make_row(dec=70.0)) == pytest.approx(-30.0)


def test_ranking_ordena_por_delta_decrescente_e_desempata_por_id():
    rows = [
        make_row("ALIM-TESTE-03", dec=110.0),
        make_row("ALIM-TESTE-01", dec=120.0),
        make_row("ALIM-TESTE-02", dec=110.0),
        make_row("ALIM-TESTE-04", dec=50.0),
    ]

    assert ranking_ids(rank_feeders(rows)) == ["ALIM-TESTE-01", "ALIM-TESTE-02", "ALIM-TESTE-03", "ALIM-TESTE-04"]


def test_ranking_coloca_alimentador_sem_limite_por_ultimo():
    rows = [make_row("ALIM-TESTE-01", dec=500.0, dec_limit=None), make_row("ALIM-TESTE-02", dec=1.0)]

    assert ranking_ids(rank_feeders(rows)) == ["ALIM-TESTE-02", "ALIM-TESTE-01"]


def test_resumo_com_base_vazia_devolve_indicadores_zerados():
    indicators = summarize_indicators(None, [])

    assert indicators.competencia is None
    assert indicators.total_alimentadores == 0
    assert indicators.dec_medio_horas == pytest.approx(0.0)
    assert indicators.percentual_violacao == pytest.approx(0.0)


def test_resumo_usa_media_simples_e_conta_so_violacao():
    rows = [
        make_row("ALIM-TESTE-01", dec=120.0, fec=10.0),
        make_row("ALIM-TESTE-02", dec=80.0, fec=30.0),
        make_row("ALIM-TESTE-03", dec=90.0, fec=20.0),
        make_row("ALIM-TESTE-04", dec=10.0, fec=40.0),
    ]

    indicators = summarize_indicators(COMPETENCIA_TESTE, rows)

    assert indicators.dec_medio_horas == pytest.approx(75.0)
    assert indicators.fec_medio_vezes == pytest.approx(25.0)
    assert indicators.total_alimentadores == 4
    assert indicators.alimentadores_em_violacao == 1
    assert indicators.percentual_violacao == pytest.approx(25.0)


async def test_indicadores_sem_competencia_usam_a_mais_recente():
    rows = [make_row(dec=1.0, competencia="2000-01"), make_row(dec=2.0, competencia="2000-02")]
    repository = FakeQualityRepository(rows)

    indicators = await GridQualityService(repository).get_indicators()

    assert indicators.competencia == "2000-02"
    assert repository.requested_competencias == ["2000-02"]


async def test_listagem_filtra_por_status():
    rows = [
        make_row("ALIM-TESTE-01", dec=120.0),
        make_row("ALIM-TESTE-02", dec=90.0),
        make_row("ALIM-TESTE-03", dec=10.0),
    ]
    service = GridQualityService(FakeQualityRepository(rows))

    violations = await service.list_feeders(status=QualityStatus.VIOLACAO)
    alerts = await service.list_feeders(status=QualityStatus.ALERTA)

    assert ranking_ids(violations) == ["ALIM-TESTE-01"]
    assert ranking_ids(alerts) == ["ALIM-TESTE-02"]


async def test_base_vazia_devolve_indicadores_zerados_e_lista_vazia():
    service = GridQualityService(FakeQualityRepository([]))

    indicators = await service.get_indicators()

    assert indicators.competencia is None
    assert indicators.total_alimentadores == 0
    assert await service.list_feeders() == []
    assert await service.list_feeders(competencia="2000-09") == []


async def test_historico_devolve_ate_n_meses_em_ordem_cronologica():
    rows = [make_row(dec=float(month), competencia=f"2000-{month:02d}") for month in range(1, 6)]
    service = GridQualityService(FakeQualityRepository(rows))

    history = await service.get_feeder_history("ALIM-TESTE-01", meses=3)

    assert [point.competencia for point in history.pontos] == ["2000-03", "2000-04", "2000-05"]


async def test_historico_de_alimentador_inexistente_levanta_not_found():
    service = GridQualityService(FakeQualityRepository([make_row()]))

    with pytest.raises(NotFoundException, match="ALIM-TESTE-99"):
        await service.get_feeder_history("ALIM-TESTE-99")
