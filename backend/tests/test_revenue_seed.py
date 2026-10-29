from app.db.session import get_db
from app.main import app
from tests.revenue_seed import seeded_client


async def test_seeded_client_overrides_database_and_cleans_up():
    async with seeded_client():
        assert get_db in app.dependency_overrides

    assert get_db not in app.dependency_overrides
