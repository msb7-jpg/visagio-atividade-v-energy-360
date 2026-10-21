import pytest
from httpx import AsyncClient
 
from tests.revenue_seed import seeded_client
 
URL = "/api/v1/revenue/decomposition"
WINDOWS = {"base_inicio": "2022-07", "base_fim": "2023-06", "atual_inicio": "2025-07", "atual_fim": "2026-06"}
DIRECTOR_EMAIL = "diretor@venergy.com"
 
 
async def login(http_client: AsyncClient, email: str) -> dict[str, str]:
    response = await http_client.post("/api/v1/auth/login", json={"email": email, "senha": "venergy123"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
 
 
@pytest.fixture
async def client():
    async with seeded_client() as http_client:
        yield http_client
 
 
@pytest.fixture
async def director_headers(client):
    return await login(client, DIRECTOR_EMAIL)
 
 
async def test_returns_401_without_token(client):
    response = await client.get(URL, params=WINDOWS)
 
    assert response.status_code == 401
 
 
@pytest.mark.parametrize("email", ["operacao@venergy.com", "atendimento@venergy.com", "perdas@venergy.com"])
async def test_returns_403_for_profiles_other_than_director(client, email):
    headers = await login(client, email)
 
    response = await client.get(URL, params=WINDOWS, headers=headers)
 
    assert response.status_code == 403
 
 
async def test_director_gets_total_decomposition_from_seed(client, director_headers):
    response = await client.get(URL, params=WINDOWS, headers=director_headers)
 
    assert response.status_code == 200
    body = response.json()
    assert body["receita_base_rs"] == pytest.approx(65040.0)
    assert body["receita_atual_rs"] == pytest.approx(62452.8)
    assert body["variacao_rs"] == pytest.approx(-2587.2)
    assert body["efeito_preco_rs"] == pytest.approx(1824.0)
    assert body["efeito_cruzado_rs"] == pytest.approx(-19.2)
    assert len(body["segmentos"]) == 4
    effect_names = ("efeito_preco_rs", "efeito_volume_rs", "efeito_mix_rs", "efeito_cruzado_rs")
    effects_total = sum(body[effect_name] for effect_name in effect_names)
    assert effects_total == pytest.approx(body["variacao_rs"], abs=0.05)
 
 
async def test_filter_by_neighborhood_returns_single_segment(client, director_headers):
    params = {**WINDOWS, "bairro": "VARADOURO"}
 
    response = await client.get(URL, params=params, headers=director_headers)
 
    assert response.status_code == 200
    body = response.json()
    assert [segment["bairro"] for segment in body["segmentos"]] == ["VARADOURO"]
    assert body["efeito_preco_rs"] == pytest.approx(384.0)
    assert body["efeito_volume_rs"] == pytest.approx(768.0)
    assert body["efeito_cruzado_rs"] == pytest.approx(76.8)
    assert body["efeito_mix_rs"] == pytest.approx(0.0)
 
 
async def test_returns_404_when_filters_match_no_billing(client, director_headers):
    params = {**WINDOWS, "bairro": "BAIRRO INEXISTENTE"}
 
    response = await client.get(URL, params=params, headers=director_headers)
 
    assert response.status_code == 404
 
 
async def test_returns_400_when_windows_overlap(client, director_headers):
    params = {**WINDOWS, "atual_inicio": "2023-01", "atual_fim": "2023-12"}
 
    response = await client.get(URL, params=params, headers=director_headers)
 
    assert response.status_code == 400
 
 
async def test_returns_400_when_window_starts_after_it_ends(client, director_headers):
    params = {**WINDOWS, "base_inicio": "2023-06", "base_fim": "2022-07"}
 
    response = await client.get(URL, params=params, headers=director_headers)
 
    assert response.status_code == 400
 
 
async def test_returns_422_when_competencia_has_wrong_format(client, director_headers):
    params = {**WINDOWS, "base_inicio": "2022-7"}
 
    response = await client.get(URL, params=params, headers=director_headers)
 
    assert response.status_code == 422