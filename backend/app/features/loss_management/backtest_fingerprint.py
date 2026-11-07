"""Chave que diz se o resultado guardado do backtest ainda vale: dados Gold, código e ordens que entram nos cortes."""

import hashlib
import json
import logging
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from sqlalchemy import Select, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.elements import ColumnElement

from app.features.loss_management.backtest_service import inspection_results
from app.features.loss_management.models import InspectionOrder
from app.features.loss_management.queries import (
    competencia_first_day,
    dim_unidade_consumidora,
    fato_faturamento,
    fato_medicao,
    shift_competencia,
)
from app.features.loss_management.queue_repository import GOLD_QUERY_ERRORS, GOLD_TABLES_ERROR_MESSAGE
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

PACKAGE_DIR = Path(__file__).parent


@lru_cache(maxsize=1)
def code_version() -> str:
    """Resumo do código da fatia: qualquer mudança nele invalida o resultado guardado.

    Cobre todo o pacote para nunca servir um número calculado por uma regra que já mudou.

    Returns:
        Digest SHA-256 (hexadecimal) dos arquivos Python do pacote, em ordem de nome.
    """
    digest = hashlib.sha256()
    for source_file in sorted(PACKAGE_DIR.glob("*.py")):
        digest.update(source_file.name.encode())
        digest.update(source_file.read_bytes())
    return digest.hexdigest()


def _flag_count(flag_column: ColumnElement) -> ColumnElement:
    return func.sum(case((flag_column.is_(True), 1), else_=0))


def _data_queries(last_cutoff: str) -> dict[str, Select]:
    """Uma consulta barata por fonte de dados do backtest; só contagens e máximos, nunca as linhas."""
    until = datetime.combine(competencia_first_day(shift_competencia(last_cutoff, 1)), datetime.min.time())
    return {
        "medicao": select(func.count(), func.max(fato_medicao.c.competencia), func.sum(fato_medicao.c.consumo_kwh)),
        # A tarifa média também entra no ranking, e uma carga corrigida pode manter as contagens iguais.
        "faturamento": select(
            func.count(),
            func.max(fato_faturamento.c.competencia),
            func.sum(fato_faturamento.c.valor_total_rs),
            func.sum(fato_faturamento.c.consumo_faturado_kwh),
        ),
        "unidades": select(func.count(), _flag_count(dim_unidade_consumidora.c.possui_gd)),
        "inspecoes": select(
            func.count(),
            func.max(inspection_results.c.data_inspecao),
            _flag_count(inspection_results.c.irregularidade_constatada),
            func.sum(inspection_results.c.kwh_recuperado),
        ),
        # Só as ordens anteriores ao último corte entram nas filas simuladas; uma ordem de hoje não muda o resultado.
        "ordens": select(func.count(InspectionOrder.id_inspecao), func.max(InspectionOrder.atualizado_em)).where(
            InspectionOrder.atualizado_em < until
        ),
    }


async def compute_backtest_fingerprint(session: AsyncSession, last_cutoff: str) -> str:
    """Calcula a chave do resultado do backtest para o último corte disponível.

    Args:
        session: Sessão do banco com as tabelas Gold e as ordens do portal.
        last_cutoff: Último corte da série ('YYYY-MM'); ordens a partir do mês seguinte não entram na chave.

    Returns:
        Digest SHA-256 (hexadecimal) do código, do último corte e do estado das fontes de dados.

    Raises:
        DatabaseReadError: Se as tabelas Gold estiverem ausentes ou fora do contrato.
    """
    parts: dict[str, object] = {"codigo": code_version(), "corte": last_cutoff}
    try:
        for source_name, query in _data_queries(last_cutoff).items():
            parts[source_name] = [str(value) for value in (await session.execute(query)).one()]
    except GOLD_QUERY_ERRORS as e:
        logger.exception("Falha ao calcular a chave do backtest.")
        raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
    return hashlib.sha256(json.dumps(parts, sort_keys=True).encode()).hexdigest()
