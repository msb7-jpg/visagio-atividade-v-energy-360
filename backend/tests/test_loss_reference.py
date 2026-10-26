"""Competência de referência da fila: ver a fila como ela estava num mês passado (modo demonstração)."""

import pytest
from pydantic import ValidationError
from sqlalchemy import text

from app.core.config import Settings, get_settings
from app.features.loss_management.schemas import QueueWarningCode
from app.main import app
from tests.test_loss_router import BASE_URL, auth_headers, open_client

REFERENCE_WARNING = QueueWarningCode.COMPETENCIA_REFERENCIA_FIXADA.value
# Consumo mensal de 2025: 300 até maio, 100 de junho a setembro, de volta a 300 de outubro a dezembro.
WAVE_BY_MONTH = {month: 300.0 if month <= 5 or month >= 10 else 100.0 for month in range(1, 13)}
WAVE_UNITS = ("UC_ONDA", "UC_INSPECIONADA_ANTES", "UC_INSPECIONADA_DEPOIS")
WAVE_INSPECTIONS = [
    ("IN1", "UC_INSPECIONADA_ANTES", "2025-08-15", 1),  # dentro do mês de referência: a UC já foi vista
    ("IN2", "UC_INSPECIONADA_DEPOIS", "2025-11-10", 1),  # depois da referência: ainda não tinha acontecido
]


async def seed_wave_scenario(engine) -> None:
    async with engine.begin() as connection:
        await connection.execute(text(
            "CREATE TABLE dim_unidade_consumidora (id_uc TEXT PRIMARY KEY, classe_consumo TEXT, "
            "municipio TEXT, bairro TEXT, possui_gd BOOLEAN)"
        ))
        await connection.execute(text("CREATE TABLE fato_medicao (id_uc TEXT, competencia TEXT, consumo_kwh REAL)"))
        await connection.execute(text(
            "CREATE TABLE fato_inspecoes_perdas (id_inspecao TEXT, id_uc TEXT, data_inspecao TEXT, "
            "irregularidade_constatada BOOLEAN)"
        ))
        await connection.execute(
            text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, 'Residencial', 'Recife', 'Centro', 0)"),
            [{"id_uc": id_uc} for id_uc in WAVE_UNITS],
        )
        await connection.execute(
            text("INSERT INTO fato_medicao VALUES (:id_uc, :competencia, :consumo_kwh)"),
            [
                {"id_uc": id_uc, "competencia": f"2025-{month:02d}", "consumo_kwh": consumo_kwh}
                for id_uc in WAVE_UNITS
                for month, consumo_kwh in WAVE_BY_MONTH.items()
            ],
        )
        await connection.execute(
            text("INSERT INTO fato_inspecoes_perdas VALUES (:id_inspecao, :id_uc, :data_inspecao, :irregular)"),
            [
                {"id_inspecao": ident, "id_uc": id_uc, "data_inspecao": data, "irregular": irregular}
                for ident, id_uc, data, irregular in WAVE_INSPECTIONS
            ],
        )


async def open_wave_client(reference_competencia: str | None):
    engine, http_client = await open_client(with_gold_tables=False)
    await seed_wave_scenario(engine)
    app.dependency_overrides[get_settings] = lambda: Settings(loss_reference_competencia=reference_competencia)
    return engine, http_client


@pytest.fixture
async def live_client():
    engine, http_client = await open_wave_client(None)
    async with http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


@pytest.fixture
async def past_client():
    engine, http_client = await open_wave_client("2025-08")
    async with http_client:
        yield http_client
    app.dependency_overrides.clear()
    await engine.dispose()


async def list_queue(http_client) -> dict:
    headers = await auth_headers(http_client, "perdas@venergy.com")
    return (await http_client.get(f"{BASE_URL}/suspicious-units", headers=headers)).json()


async def test_without_reference_the_queue_uses_the_latest_competencia(live_client):
    queue = await list_queue(live_client)

    assert queue["itens"] == []
    assert queue["avisos"] == []


async def test_fixed_reference_shows_the_queue_as_it_was_that_month(past_client):
    queue = await list_queue(past_client)

    assert sorted(unit["id_uc"] for unit in queue["itens"]) == ["UC_INSPECIONADA_DEPOIS", "UC_ONDA"]
    assert queue["itens"][0]["kwh_estimado_recuperar"] == pytest.approx(600.0)


async def test_fixed_reference_warns_which_competencia_the_queue_uses(past_client):
    queue = await list_queue(past_client)

    warning = next(warning for warning in queue["avisos"] if warning["codigo"] == REFERENCE_WARNING)
    assert "2025-08" in warning["mensagem"]


async def test_order_estimate_uses_the_same_reference_as_the_queue(past_client):
    headers = await auth_headers(past_client, "perdas@venergy.com")

    created = await past_client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_ONDA"})

    assert created.status_code == 201
    assert created.json()["kwh_estimado"] == pytest.approx(600.0)


async def test_order_estimate_without_reference_follows_the_latest_competencia(live_client):
    headers = await auth_headers(live_client, "perdas@venergy.com")

    created = await live_client.post(f"{BASE_URL}/inspections", headers=headers, json={"id_uc": "UC_ONDA"})

    assert created.json()["kwh_estimado"] == pytest.approx(0.0)


@pytest.mark.parametrize("competencia", ["2025-13", "2025-8", "agosto", "2025-08-01"])
def test_reference_must_be_a_valid_year_month(competencia):
    with pytest.raises(ValidationError):
        Settings(loss_reference_competencia=competencia)


@pytest.mark.parametrize("blank", ["", "   "])
def test_blank_reference_means_no_reference(blank):
    assert Settings(loss_reference_competencia=blank).loss_reference_competencia is None


def test_blank_environment_variable_does_not_break_the_settings(monkeypatch):
    monkeypatch.setenv("LOSS_REFERENCE_COMPETENCIA", "")

    assert Settings().loss_reference_competencia is None


def test_environment_variable_sets_the_reference(monkeypatch):
    monkeypatch.setenv("LOSS_REFERENCE_COMPETENCIA", "2025-08")

    assert Settings().loss_reference_competencia == "2025-08"


def test_reference_is_optional():
    assert Settings(loss_reference_competencia=None).loss_reference_competencia is None
