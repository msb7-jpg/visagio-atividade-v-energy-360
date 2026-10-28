"""Testes do ranking de clientes mais afetados por alimentador, com SQLite em memória e valores à mão.

Série de 4 meses (2000-01 a 2000-04). No alimentador F1: U1 tem 10 h em 2000-01, 2 h em 2000-03 e 3 h em 2000-04;
U2 tem 4 h em 2000-03 e 4 h em 2000-04; U3 tem 1 h em 2000-04. U4 (alimentador F2) tem 100 h e não pode aparecer.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import StaticPool

from app.features.grid_quality.continuity_repository import ContinuityRepository
from app.features.grid_quality.continuity_service import ContinuityService

CREATE_STATEMENTS = (
    (
        "CREATE TABLE dim_unidade_consumidora (id_uc TEXT, nome_titular TEXT, alimentador TEXT, "
        "municipio TEXT, bairro TEXT)"
    ),
    (
        "CREATE TABLE fato_ocorrencias_rede (id_uc TEXT, id_alimentador TEXT, tipo_ocorrencia TEXT, causa TEXT, "
        "duracao_horas REAL, competencia TEXT)"
    ),
)
CUSTOMERS = [
    ("U1", "ANA", "F1", "RECIFE", "CENTRO"),
    ("U2", "BIA", "F1", "RECIFE", "BOA VISTA"),
    ("U3", "CAIO", "F1", "RECIFE", "CENTRO"),
    ("U4", "DAN", "F2", "OLINDA", "CARMO"),
]
OCCURRENCES = [
    ("U1", "F1", "2000-01", 10.0),
    ("U1", "F1", "2000-03", 2.0),
    ("U1", "F1", "2000-04", 3.0),
    ("U2", "F1", "2000-03", 4.0),
    ("U2", "F1", "2000-04", 4.0),
    ("U3", "F1", "2000-04", 1.0),
    ("U4", "F2", "2000-04", 100.0),
]


@pytest.fixture
async def service():
    """Serviço sobre um banco em memória com o seed do módulo."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as connection:
        for statement in CREATE_STATEMENTS:
            await connection.execute(text(statement))
        await connection.execute(
            text("INSERT INTO dim_unidade_consumidora VALUES (:id_uc, :nome, :feeder, :municipio, :bairro)"),
            [dict(zip(("id_uc", "nome", "feeder", "municipio", "bairro"), row, strict=True)) for row in CUSTOMERS],
        )
        await connection.execute(
            text(
                "INSERT INTO fato_ocorrencias_rede "
                "VALUES (:id_uc, :feeder, 'FALTA DE ENERGIA', 'CLIMATICA', :horas, :comp)"
            ),
            [{"id_uc": uc, "feeder": feeder, "comp": comp, "horas": horas} for uc, feeder, comp, horas in OCCURRENCES],
        )
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield ContinuityService(ContinuityRepository(session))
    await engine.dispose()


async def test_ranking_na_janela_dos_ultimos_meses_da_serie(service):
    customers = await service.get_affected_customers("F1", meses=2, limite=10)

    assert [customer.id_uc for customer in customers] == ["U2", "U1", "U3"]
    assert [customer.horas_sem_energia for customer in customers] == pytest.approx([8.0, 5.0, 1.0])
    assert [customer.ocorrencias for customer in customers] == [2, 2, 1]
    assert (customers[0].nome_titular, customers[0].bairro, customers[0].municipio) == ("BIA", "BOA VISTA", "RECIFE")


async def test_janela_maior_muda_a_ordem(service):
    customers = await service.get_affected_customers("F1", meses=4, limite=10)

    assert [customer.id_uc for customer in customers] == ["U1", "U2", "U3"]
    assert customers[0].horas_sem_energia == pytest.approx(15.0)


async def test_limite_corta_o_ranking(service):
    customers = await service.get_affected_customers("F1", meses=4, limite=2)

    assert [customer.id_uc for customer in customers] == ["U1", "U2"]


async def test_alimentador_sem_ocorrencias_devolve_lista_vazia(service):
    assert await service.get_affected_customers("F9", meses=4, limite=10) == []
