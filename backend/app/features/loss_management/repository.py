"""Acesso a dados da gestão de perdas: perfis de consumo (Gold) e ordens de inspeção."""

import logging
from collections.abc import Collection, Mapping
from itertools import batched

from sqlalchemy import RowMapping, exists, inspect, select
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.exceptions import ActiveOrderConflictError
from app.features.loss_management.models import ACTIVE_STATUSES, InspectionOrder
from app.features.loss_management.queries import (
    SuspicionFilters,
    build_windows,
    fato_inspecoes_perdas,
    latest_competencia_query,
    registered_unit_query,
    suspicious_profiles_query,
)
from app.features.loss_management.schemas import (
    InspectionOrderCreateDTO,
    InspectionOrderDTO,
    InspectionOrderUpdateDTO,
    InspectionStatus,
)
from app.features.loss_management.scoring import ConsumptionProfile, QueueCandidates, RegisteredUnit
from app.shared.exceptions import DatabaseReadError

logger = logging.getLogger(__name__)

ID_BATCH_SIZE = 500  # abaixo do limite de 999 variáveis do SQLite antigo

# Tabela ausente (SQLite: OperationalError; Postgres: ProgrammingError) ou coluna fora do contrato Gold.
GOLD_QUERY_ERRORS = (OperationalError, ProgrammingError)
GOLD_TABLES_ERROR_MESSAGE = (
    "Falha ao consultar tabelas Gold (dim_unidade_consumidora/fato_medicao/fato_inspecoes_perdas)."
)


def to_order_dto(order: InspectionOrder) -> InspectionOrderDTO:
    """Converte o modelo ORM em DTO, isolando o ORM dentro do repositório.

    Args:
        order: Ordem de inspeção carregada pela sessão.

    Returns:
        Representação da ordem para as camadas de serviço e transporte.
    """
    return InspectionOrderDTO.model_validate(order)


def to_registered_unit(row: RowMapping) -> RegisteredUnit:
    """Converte a linha do cadastro em UC registrada; consumo ausente vira zero e sem leitura recente.

    Args:
        row: Linha de `registered_unit_query`.

    Returns:
        A UC com perfil de consumo e indicação de geração distribuída.
    """
    profile = ConsumptionProfile(
        id_uc=row["id_uc"],
        municipio=row["municipio"],
        bairro=row["bairro"],
        classe_consumo=row["classe_consumo"],
        consumo_base_kwh=row.get("consumo_base_kwh") or 0.0,
        consumo_recente_kwh=row.get("consumo_recente_kwh") or 0.0,
        meses_zerados=row.get("meses_zerados") or 0,
    )
    has_recent_reading = row.get("consumo_recente_kwh") is not None
    return RegisteredUnit(profile=profile, possui_gd=bool(row["possui_gd"]), has_recent_reading=has_recent_reading)


class LossRepository:
    """Consultas analíticas de consumo e persistência das ordens de inspeção."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def has_field_history_table(self) -> bool:
        """Indica se `fato_inspecoes_perdas` (Fatia 02) já foi exportada para o banco Gold.

        Returns:
            True se a tabela existe; só a ausência da tabela é tolerada, colunas fora do contrato não.
        """
        return await self.session.run_sync(
            lambda sync_session: inspect(sync_session.connection()).has_table(fato_inspecoes_perdas.name)
        )

    async def fetch_consumption_profiles(self, filters: SuspicionFilters) -> QueueCandidates:
        """Busca os perfis de consumo candidatos à fila de suspeitas.

        A janela de análise é ancorada na competência mais recente de `fato_medicao`. Sem a tabela
        `fato_inspecoes_perdas`, a fila é montada sem excluir o histórico de campo.

        Args:
            filters: Limiar de queda e filtros territoriais/de classe da fila.

        Returns:
            Perfis das UCs candidatas (vazio se ainda não há medições) e se o histórico de campo foi aplicado.

        Raises:
            DatabaseReadError: Se as tabelas de cadastro/medição estiverem ausentes ou fora do contrato.
        """
        try:
            field_history_applied = await self.has_field_history_table()
            ultima_competencia = await self.session.scalar(latest_competencia_query())
            if ultima_competencia is None:
                return QueueCandidates(profiles=[], field_history_applied=field_history_applied)
            windows = build_windows(ultima_competencia)
            query = suspicious_profiles_query(windows, filters, include_field_history=field_history_applied)
            result = await self.session.execute(query)
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar tabelas Gold para a fila de suspeitas.")
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        profiles = [ConsumptionProfile(**row) for row in result.mappings()]
        return QueueCandidates(profiles=profiles, field_history_applied=field_history_applied)

    async def fetch_registered_unit(self, id_uc: str) -> RegisteredUnit | None:
        """Busca a UC no cadastro com o consumo da mesma janela usada pela fila.

        Args:
            id_uc: Identificador da unidade consumidora.

        Returns:
            A UC com perfil de consumo, ou None se ela não existir no cadastro.

        Raises:
            DatabaseReadError: Se as tabelas Gold estiverem ausentes ou fora do contrato.
        """
        try:
            ultima_competencia = await self.session.scalar(latest_competencia_query())
            windows = build_windows(ultima_competencia) if ultima_competencia else None
            result = await self.session.execute(registered_unit_query(id_uc, windows))
        except GOLD_QUERY_ERRORS as e:
            logger.exception("Falha ao consultar tabelas Gold para validar a UC %s.", id_uc)
            raise DatabaseReadError(GOLD_TABLES_ERROR_MESSAGE) from e
        row = result.mappings().first()
        return to_registered_unit(row) if row else None

    async def list_orders(self, status: InspectionStatus | None) -> list[InspectionOrderDTO]:
        """Lista as ordens de inspeção da mais recente para a mais antiga.

        Args:
            status: Status para filtrar; None devolve todas as ordens.

        Returns:
            Ordens de inspeção encontradas.
        """
        query = select(InspectionOrder).order_by(InspectionOrder.criado_em.desc())
        filtered_query = query.where(InspectionOrder.status == status.value) if status else query
        result = await self.session.scalars(filtered_query)
        return [to_order_dto(order) for order in result.all()]

    async def list_active_orders(self) -> list[InspectionOrderDTO]:
        """Lista as ordens que seguem para campo (geradas e pendentes), da mais antiga para a mais nova.

        Returns:
            Ordens ativas em ordem crescente de identificador.
        """
        query = (
            select(InspectionOrder)
            .where(InspectionOrder.status.in_(ACTIVE_STATUSES))
            .order_by(InspectionOrder.id_inspecao)
        )
        result = await self.session.scalars(query)
        return [to_order_dto(order) for order in result.all()]

    async def get_order(self, id_inspecao: int) -> InspectionOrderDTO | None:
        """Busca uma ordem de inspeção pelo identificador.

        Args:
            id_inspecao: Identificador da ordem.

        Returns:
            A ordem encontrada, ou None se não existir.
        """
        order = await self.session.get(InspectionOrder, id_inspecao)
        return to_order_dto(order) if order else None

    async def has_active_order(self, id_uc: str) -> bool:
        """Indica se a UC já possui ordem gerada ou pendente.

        Args:
            id_uc: Identificador da unidade consumidora.

        Returns:
            True se existir ordem ativa para a UC.
        """
        active_order_exists = exists().where(
            InspectionOrder.id_uc == id_uc,
            InspectionOrder.status.in_(ACTIVE_STATUSES),
        )
        return bool(await self.session.scalar(select(active_order_exists)))

    async def create_order(
        self, payload: InspectionOrderCreateDTO, criado_por: str, *, kwh_estimado: float
    ) -> InspectionOrderDTO:
        """Persiste uma nova ordem com status inicial `gerada`.

        Args:
            payload: Dados de abertura da ordem.
            criado_por: E-mail do usuário que gerou a ordem.
            kwh_estimado: Energia estimada a recuperar, calculada pelo serviço.

        Returns:
            A ordem criada, com identificador e datas preenchidos.

        Raises:
            ActiveOrderConflictError: Se a UC já tiver ordem ativa (índice único parcial no banco).
        """
        order = InspectionOrder(
            **payload.model_dump(),
            kwh_estimado=kwh_estimado,
            status=InspectionStatus.GERADA.value,
            criado_por=criado_por,
        )
        self.session.add(order)
        try:
            await self.session.commit()
        except IntegrityError as e:
            await self.session.rollback()
            raise ActiveOrderConflictError(payload.id_uc) from e
        await self.session.refresh(order)
        return to_order_dto(order)

    async def update_order(self, id_inspecao: int, payload: InspectionOrderUpdateDTO) -> InspectionOrderDTO | None:
        """Aplica uma alteração já validada pelo serviço a uma ordem existente.

        Args:
            id_inspecao: Identificador da ordem.
            payload: Novo status e dados associados; campos None não são alterados.

        Returns:
            A ordem atualizada, ou None se ela não existir.
        """
        order = await self.session.get(InspectionOrder, id_inspecao)
        if order is None:
            return None
        informed_changes = payload.model_dump(exclude_none=True)
        for field_name, field_value in informed_changes.items():
            setattr(order, field_name, field_value)
        await self.session.commit()
        await self.session.refresh(order)
        return to_order_dto(order)

    async def get_order_statuses(self, ids: Collection[int]) -> dict[int, InspectionStatus]:
        """Busca o status atual das ordens citadas, numa única consulta.

        Args:
            ids: Identificadores das ordens.

        Returns:
            Status por identificador; ordens inexistentes ficam de fora.
        """
        statuses: dict[int, InspectionStatus] = {}
        for id_batch in batched(sorted(ids), ID_BATCH_SIZE):
            query = select(InspectionOrder.id_inspecao, InspectionOrder.status).where(
                InspectionOrder.id_inspecao.in_(id_batch)
            )
            result = await self.session.execute(query)
            statuses.update({id_inspecao: InspectionStatus(status) for id_inspecao, status in result.all()})
        return statuses

    async def apply_field_results(self, updates: Mapping[int, InspectionOrderUpdateDTO]) -> list[int]:
        """Conclui, num único commit, as ordens que ainda estão em campo.

        Args:
            updates: Resultado de campo já validado, por identificador de ordem.

        Returns:
            Identificadores das ordens de fato atualizadas; as que deixaram o fluxo de campo entre a
            validação e a gravação (ex.: canceladas por outro usuário) ficam intactas e de fora.
        """
        applied_ids: list[int] = []
        for id_batch in batched(sorted(updates), ID_BATCH_SIZE):
            query = select(InspectionOrder).where(
                InspectionOrder.id_inspecao.in_(id_batch), InspectionOrder.status.in_(ACTIVE_STATUSES)
            )
            for order in (await self.session.scalars(query)).all():
                for field_name, field_value in updates[order.id_inspecao].model_dump(exclude_none=True).items():
                    setattr(order, field_name, field_value)
                applied_ids.append(order.id_inspecao)
        await self.session.commit()
        return applied_ids
