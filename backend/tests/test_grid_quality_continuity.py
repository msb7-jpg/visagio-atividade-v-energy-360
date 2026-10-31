"""Testes da Continuidade com SQLite em memória (sem o v_energy.db) e valores calculados à mão.

Seed: 24 meses (2000-01 a 2001-12), logo A = 2000 e B = 2001. Todo mês, F1 (RECIFE, 100 UCs) tem 1 ocorrência
de 1 h (CLIMATICA, FALTA DE ENERGIA) e F2 (OLINDA, 40 UCs) tem 1 de 2 h (NAO INFORMADA, OSCILACAO): 3 UC-horas
por mês na rede. Com evento, 2001-06 ganha 10 ocorrências de 1 h de F1 (VEGETACAO): 13 UC-horas > 3 x 3.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.grid_quality.continuity_repository import ContinuityRepository
from app.features.grid_quality.continuity_service import ContinuityService
from app.features.grid_quality.municipalities import MUNICIPALITY_REFERENCES, normalize_municipality
from app.shared.exceptions import BadRequestException, DatabaseReadError

EVENT_MONTH = "2001-06"
MONTHS = [f"{year}-{month:02d}" for year in (2000, 2001) for month in range(1, 13)]
UCS_TOTAL = 140
CREATE_STATEMENTS = (
    "CREATE TABLE fato_qualidade_alimentador (id_alimentador TEXT, competencia TEXT, ucs_atendidas INTEGER)",
    "CREATE TABLE dim_unidade_consumidora (alimentador TEXT, municipio TEXT, bairro TEXT)",
    (
        "CREATE TABLE fato_ocorrencias_rede (id_alimentador TEXT, tipo_ocorrencia TEXT, causa TEXT, "
        "duracao_horas REAL, competencia TEXT)"
    ),
)
INSERT_OCCURRENCE = "INSERT INTO fato_ocorrencias_rede VALUES (:feeder, :tipo, :causa, :horas, :competencia)"


def occurrence(feeder, tipo, causa, horas, competencia):
    """Monta uma linha de ocorrência fictícia."""
    return {"feeder": feeder, "tipo": tipo, "causa": causa, "horas": horas, "competencia": competencia}


def base_occurrences():
    """Uma ocorrência por alimentador por mês."""
    rows = []
    for competencia in MONTHS:
        rows.extend(
            [
                occurrence("F1", "FALTA DE ENERGIA", "CLIMATICA", 1.0, competencia),
                occurrence("F2", "OSCILACAO", "NAO INFORMADA", 2.0, competencia),
            ]
        )
    return rows


def event_occurrences():
    """Dez ocorrências extras de 1 h em F1 no mês do evento."""
    return [occurrence("F1", "FALTA DE ENERGIA", "VEGETACAO", 1.0, EVENT_MONTH) for _ in range(10)]


@pytest.fixture
async def engine():
    """Engine SQLite assíncrona em memória, com conexão única."""
    test_engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with test_engine.begin() as connection:
        for statement in CREATE_STATEMENTS:
            await connection.execute(text(statement))
        # Duas linhas mensais por alimentador: o denominador deve contar as UCs uma vez só por alimentador.
        quality_rows = [
            {"feeder": feeder, "competencia": competencia, "ucs": ucs}
            for feeder, ucs in (("F1", 100), ("F2", 40))
            for competencia in MONTHS
        ]
        await connection.execute(
            text("INSERT INTO fato_qualidade_alimentador VALUES (:feeder, :competencia, :ucs)"), quality_rows
        )
        await connection.execute(
            text("INSERT INTO dim_unidade_consumidora VALUES (:feeder, :municipio, 'CENTRO')"),
            [{"feeder": "F1", "municipio": "RECIFE"}, {"feeder": "F2", "municipio": "OLINDA"}],
        )
    yield test_engine
    await test_engine.dispose()


async def service_with(engine, occurrences):
    """Serviço sobre o banco em memória com as ocorrências informadas."""
    async with engine.begin() as connection:
        await connection.execute(text(INSERT_OCCURRENCE), occurrences)
    session = AsyncSession(engine, expire_on_commit=False)
    return ContinuityService(ContinuityRepository(session))


@pytest.fixture
async def service(engine):
    """Serviço com o seed completo, incluindo o mês de evento."""
    return await service_with(engine, base_occurrences() + event_occurrences())


async def test_kpis_comparam_b_contra_a_com_ucs_contadas_uma_vez(service):
    snapshot = await service.get_snapshot()

    kpis = snapshot.kpis
    assert kpis.dec.current == pytest.approx(46 / UCS_TOTAL)
    assert kpis.dec.previous == pytest.approx(36 / UCS_TOTAL)
    assert kpis.dec.change_percent == pytest.approx((46 - 36) / 36 * 100)
    assert kpis.fec.current == pytest.approx(34 / UCS_TOTAL)
    assert kpis.interruptions.current == 34
    assert kpis.interruptions.previous == 24
    assert kpis.average_duration_hours.current == pytest.approx(46 / 34)
    assert kpis.average_duration_hours.previous == pytest.approx(1.5)


async def test_evento_detectado_na_rede_inteira(service):
    event = (await service.get_snapshot()).event

    assert event.competencia == EVENT_MONTH
    assert event.event_interruptions == 12
    assert event.other_months_median == pytest.approx(2.0)
    assert event.dec_without_event == pytest.approx(33 / UCS_TOTAL)
    assert event.fec_without_event == pytest.approx(22 / UCS_TOTAL)


async def test_excluir_evento_remove_o_mes_dos_agregados(service):
    snapshot = await service.get_snapshot(incluir_evento=False)

    assert snapshot.kpis.dec.current == pytest.approx(33 / UCS_TOTAL)
    assert snapshot.kpis.dec.previous == pytest.approx(36 / UCS_TOTAL)
    assert snapshot.kpis.interruptions.current == 22
    assert snapshot.event.competencia == EVENT_MONTH
    assert sum(cause.share_percent for cause in snapshot.causes) == pytest.approx(100.0)
    assert "VEGETACAO" not in {cause.cause for cause in snapshot.causes}


async def test_sem_mes_acima_do_limiar_o_evento_vem_nulo(engine):
    service_without_event = await service_with(engine, base_occurrences())

    snapshot = await service_without_event.get_snapshot()

    assert snapshot.event is None
    assert snapshot.kpis.dec.current == pytest.approx(36 / UCS_TOTAL)


async def test_causas_em_percentual_de_uc_horas_com_causa_nao_informada_renomeada(service):
    causes = (await service.get_snapshot()).causes

    assert [cause.cause for cause in causes] == ["Sem causa registrada", "CLIMATICA", "VEGETACAO"]
    assert [cause.share_percent for cause in causes] == pytest.approx([24 / 46 * 100, 12 / 46 * 100, 10 / 46 * 100])
    assert [cause.actionable for cause in causes] == [False, False, True]


async def test_tipos_em_percentual_de_ocorrencias(service):
    types = (await service.get_snapshot()).types

    assert [(entry.type, entry.share_percent) for entry in types] == [
        ("FALTA DE ENERGIA", pytest.approx(22 / 34 * 100)),
        ("OSCILACAO", pytest.approx(12 / 34 * 100)),
    ]


async def test_circuitos_ordenados_por_uc_horas_com_amostra_pequena(service):
    feeders = (await service.get_snapshot()).feeders

    assert [feeder.id_alimentador for feeder in feeders] == ["F2", "F1"]
    small_feeder, large_feeder = feeders
    assert small_feeder.uc_hours == pytest.approx(24.0)
    assert small_feeder.dec_hours == pytest.approx(24 / 40)
    assert small_feeder.dec_previous_hours == pytest.approx(24 / 40)
    assert small_feeder.network_share_percent == pytest.approx(24 / 46 * 100)
    assert (small_feeder.municipality, small_feeder.small_sample) == ("Olinda", True)
    assert large_feeder.interruptions == 22
    assert large_feeder.dec_previous_hours == pytest.approx(12 / 100)
    assert large_feeder.small_sample is False


async def test_municipios_com_dec_e_coordenadas_de_referencia(service):
    municipalities = (await service.get_snapshot()).municipalities

    assert [municipality.name for municipality in municipalities] == ["Olinda", "Recife"]
    assert municipalities[0].dec_hours == pytest.approx(24 / 40)
    assert municipalities[1].dec_hours == pytest.approx(22 / 100)
    assert (municipalities[1].latitude, municipalities[1].longitude) == (-8.05, -34.9)


async def test_filtro_de_municipio_restringe_o_escopo_mas_nao_o_evento(service):
    snapshot = await service.get_snapshot(municipio="Olinda")

    assert snapshot.kpis.dec.current == pytest.approx(24 / 40)
    assert [feeder.id_alimentador for feeder in snapshot.feeders] == ["F2"]
    assert len(snapshot.municipalities) == 1
    assert snapshot.event.competencia == EVENT_MONTH
    assert snapshot.event.event_interruptions == 1
    assert snapshot.event.other_months_median == pytest.approx(1.0)
    assert [cause.cause for cause in snapshot.causes] == ["Sem causa registrada"]


async def test_municipio_aceita_nome_com_acento_e_rejeita_desconhecido(service):
    assert normalize_municipality("São Lourenço da Mata") == "SAO LOURENCO DA MATA"
    assert "SAO LOURENCO DA MATA" in MUNICIPALITY_REFERENCES
    with pytest.raises(BadRequestException):
        await service.get_snapshot(municipio="Atlantida")


async def test_tabela_ausente_levanta_erro_de_leitura():
    bare_engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with AsyncSession(bare_engine) as session:
        with pytest.raises(DatabaseReadError):
            await ContinuityService(ContinuityRepository(session)).get_snapshot()
    await bare_engine.dispose()


async def test_causa_filtra_kpis_evento_municipios_circuitos_e_tipos_sem_mudar_o_denominador(service):
    snapshot = await service.get_snapshot(causa="VEGETACAO")

    # VEGETACAO só existe em F1 (RECIFE, 100 UCs), 10 ocorrências de 1 h em 2001-06.
    assert snapshot.kpis.dec.current == pytest.approx(10 / UCS_TOTAL)
    assert snapshot.kpis.dec.previous == 0
    assert snapshot.kpis.interruptions.current == 10
    assert snapshot.event.event_interruptions == 10
    assert snapshot.event.other_months_median == 0
    assert snapshot.event.extreme_in_scope is True
    assert snapshot.event.dec_without_event == 0
    assert {municipality.name: municipality.dec_hours for municipality in snapshot.municipalities} == {
        "Olinda": 0,
        "Recife": pytest.approx(10 / 100),
    }
    assert [(feeder.id_alimentador, feeder.uc_hours) for feeder in snapshot.feeders[:1]] == [("F1", 10.0)]
    assert [(entry.type, entry.share_percent) for entry in snapshot.types] == [("FALTA DE ENERGIA", 100.0)]


async def test_bloco_de_causas_continua_com_todas_as_causas_filtrado_so_por_municipio(service):
    causes = (await service.get_snapshot(municipio="Recife", causa="VEGETACAO")).causes

    assert [cause.cause for cause in causes] == ["CLIMATICA", "VEGETACAO"]
    assert [cause.share_percent for cause in causes] == pytest.approx([12 / 22 * 100, 10 / 22 * 100])


async def test_sem_causa_registrada_equivale_a_nao_informada(service):
    snapshot = await service.get_snapshot(causa="Sem causa registrada")

    # NAO INFORMADA: F2 (OLINDA, 40 UCs), 1 ocorrência de 2 h por mês; B = 12 meses.
    assert snapshot.kpis.dec.current == pytest.approx(24 / UCS_TOTAL)
    assert snapshot.kpis.dec.previous == pytest.approx(24 / UCS_TOTAL)
    assert snapshot.event.extreme_in_scope is False


async def test_dec_das_causas_somado_reproduz_o_dec_total(service):
    total = (await service.get_snapshot()).kpis.dec.current
    by_cause = [
        (await service.get_snapshot(causa=cause)).kpis.dec.current
        for cause in ("CLIMATICA", "NAO INFORMADA", "VEGETACAO")
    ]

    assert sum(by_cause) == pytest.approx(total)


async def test_causa_inexistente_levanta_bad_request(service):
    with pytest.raises(BadRequestException):
        await service.get_snapshot(causa="vegetacao digitada")
