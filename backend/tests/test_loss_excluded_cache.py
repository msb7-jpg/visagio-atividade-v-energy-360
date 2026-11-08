"""A fila e a aba "Fora da fila" reaproveitam o cálculo pesado enquanto nenhuma ordem encerrada muda."""

from types import SimpleNamespace

import pytest
from sqlalchemy import event
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import get_settings
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.warmup import warm_up_loss_queue
from app.main import app
from tests.test_loss_router import BASE_URL, auth_headers, open_client

PERDAS_EMAIL = "perdas@venergy.com"
CANCEL_AS_REGULARIZED = {"status": "cancelada", "motivo_cancelamento": "cliente_regularizou"}


class ScanCounter:
    """Conta as consultas agregadas (AVG) sobre a medição: são as que varrem a carteira inteira."""

    def __init__(self, engine) -> None:
        self.count = 0
        event.listen(engine.sync_engine, "before_cursor_execute", self._on_execute)

    def _on_execute(self, _connection, _cursor, statement, _parameters, _context, _executemany) -> None:
        if "avg(" in statement.lower():
            self.count += 1

    def reset(self) -> None:
        self.count = 0


@pytest.fixture
async def world():
    engine, http_client = await open_client(with_gold_tables=True)
    async with http_client:
        headers = await auth_headers(http_client, PERDAS_EMAIL)
        yield SimpleNamespace(client=http_client, headers=headers, engine=engine, scans=ScanCounter(engine))
    app.dependency_overrides.clear()
    await engine.dispose()


async def _get(world, path: str, **params):
    response = await world.client.get(f"{BASE_URL}/{path}", headers=world.headers, params=params)
    assert response.status_code == 200
    return response.json()


async def test_excluded_units_are_not_recomputed_on_the_next_call(world):
    await _get(world, "excluded-units")
    world.scans.reset()

    await _get(world, "excluded-units")

    assert world.scans.count == 0


async def test_changing_the_filter_or_the_page_of_excluded_units_does_not_recompute(world):
    await _get(world, "excluded-units")
    world.scans.reset()

    await _get(world, "excluded-units", motivo="possui_gd", offset=0, limit=1)

    assert world.scans.count == 0


async def test_closing_an_order_recomputes_the_excluded_units_and_shows_the_new_exclusion(world):
    await _get(world, "excluded-units")
    created = await world.client.post(f"{BASE_URL}/inspections", headers=world.headers, json={"id_uc": "UC_FRAUDE"})
    await world.client.patch(
        f"{BASE_URL}/inspections/{created.json()['id_inspecao']}", headers=world.headers, json=CANCEL_AS_REGULARIZED
    )
    world.scans.reset()

    body = await _get(world, "excluded-units", motivo="cancelamento_bloqueante")

    assert [unit["id_uc"] for unit in body["itens"]] == ["UC_FRAUDE"]
    assert world.scans.count > 0


async def test_generating_an_order_recomputes_nothing_and_the_queue_still_shows_its_situation(world):
    await _get(world, "suspicious-units")
    await _get(world, "excluded-units")
    await world.client.post(f"{BASE_URL}/inspections", headers=world.headers, json={"id_uc": "UC_FRAUDE"})
    world.scans.reset()

    queue = await _get(world, "suspicious-units")
    await _get(world, "excluded-units")

    units = {unit["id_uc"]: unit for unit in queue["itens"]}
    assert units["UC_FRAUDE"]["situacao"] == "ordem_gerada"
    assert world.scans.count == 0


async def test_the_cached_excluded_units_follow_the_units_that_were_in_the_queue_when_they_were_computed(world):
    # Se uma ordem fecha entre o cálculo da fila e o das exclusões, a fila pode ter uma UC que a versão atual já
    # exclui. Reaproveitar a lista de outra fila deixaria a UC fora das duas telas.
    async with async_sessionmaker(world.engine, expire_on_commit=False)() as session:
        repository = LossRepository(session)
        listed_when_in_queue = await repository.fetch_excluded_units({"UC_SOLAR"})
        listed_when_not_in_queue = await repository.fetch_excluded_units(set())

    assert "UC_SOLAR" not in {unit.id_uc for unit in listed_when_in_queue}
    assert "UC_SOLAR" in {unit.id_uc for unit in listed_when_not_in_queue}


async def test_the_warm_up_leaves_the_queue_and_the_excluded_units_ready(world):
    await warm_up_loss_queue(async_sessionmaker(world.engine, expire_on_commit=False), get_settings())
    world.scans.reset()

    await _get(world, "suspicious-units")
    await _get(world, "excluded-units")

    assert world.scans.count == 0
