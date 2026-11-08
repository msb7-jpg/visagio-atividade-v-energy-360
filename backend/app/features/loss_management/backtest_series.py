"""Backtest de todos os cortes de uma vez, guardado em memória e em disco enquanto os dados não mudam."""

from collections.abc import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession

from app.features.loss_management.backtest_fingerprint import compute_backtest_fingerprint
from app.features.loss_management.backtest_schemas import (
    BacktestDTO,
    BacktestFilterDTO,
    BacktestSeriesDTO,
    BacktestSizeDTO,
)
from app.features.loss_management.backtest_service import BacktestService, available_cutoffs
from app.features.loss_management.backtest_store import BacktestSeriesStore
from app.features.loss_management.daily_cache import DailyEngineCache
from app.features.loss_management.repository import LossRepository
from app.features.loss_management.schemas import FILA_CAPACIDADE_MENSAL

Fingerprint = Callable[[AsyncSession, str], Awaitable[str]]

# Tamanhos da seleção medidos em cada corte: mostram onde a cobertura sobe e a precisão cai conforme a equipe inspeciona
# mais UCs. O padrão (a capacidade mensal) é o de `cortes`; 400 é o máximo que a tela marca por vez.
BACKTEST_SIZES = (50, 100, FILA_CAPACIDADE_MENSAL, 400)

# Memória do dia por banco: o disco vale entre reinícios, e a memória evita ler o arquivo a cada requisição.
_series_memory_cache = DailyEngineCache[BacktestSeriesDTO]()
# A chave varre o Gold (contagens e somas): como os demais caches, vale o dia, e o disco a confere a cada subida.
_fingerprint_memory_cache = DailyEngineCache[str]()


class BacktestSeriesService:
    """Mede a seleção da fila em todos os cortes disponíveis, com o tamanho da capacidade mensal."""

    def __init__(
        self,
        repository: LossRepository,
        backtest: BacktestService,
        store: BacktestSeriesStore,
        *,
        fingerprint: Fingerprint = compute_backtest_fingerprint,
        memory_cache: DailyEngineCache[BacktestSeriesDTO] | None = None,
        fingerprint_cache: DailyEngineCache[str] | None = None,
    ) -> None:
        self.repository = repository
        self.backtest = backtest
        self.store = store
        self.fingerprint = fingerprint
        self.memory_cache = memory_cache or _series_memory_cache
        self.fingerprint_cache = fingerprint_cache or _fingerprint_memory_cache

    async def run(self) -> BacktestSeriesDTO:
        """Devolve o backtest de cada corte, calculando-o só quando os dados ou o código mudaram.

        A ordem de busca é a memória do dia, o arquivo em disco e, por último, o cálculo (alguns segundos por corte).
        Requisições simultâneas esperam o mesmo cálculo.

        Returns:
            Um resultado por corte, do mais antigo ao mais recente; vazio se não há histórico de inspeções.

        Raises:
            DatabaseReadError: Se as tabelas Gold não puderem ser consultadas.
        """
        hit_rate = await self.repository.fetch_field_hit_rate()
        if hit_rate is None or not hit_rate.first_date or not hit_rate.last_date:
            return BacktestSeriesDTO(tamanho=FILA_CAPACIDADE_MENSAL, cortes=[])
        cutoffs = available_cutoffs(hit_rate.first_date, hit_rate.last_date)
        session = self.repository.session
        fingerprint = await self.fingerprint_cache.get_or_compute(
            session.get_bind(), cutoffs[-1], lambda: self.fingerprint(session, cutoffs[-1])
        )
        # A série mede o modelo que a fila de produção usa; ligar ou desligar os pares não pode reaproveitar a gravada.
        model = "novo" if self.repository.use_peers else "atual"
        fingerprint = f"{fingerprint}|modelo={model}"

        async def load_or_compute() -> BacktestSeriesDTO:
            if (saved := self.store.load(fingerprint)) is not None:
                return saved
            results_by_size: dict[int, list[BacktestDTO]] = {size: [] for size in BACKTEST_SIZES}
            # Um corte de cada vez: a fila do corte fica em cache, e os outros tamanhos só refazem a medição.
            for cutoff in cutoffs:
                for size in BACKTEST_SIZES:
                    filter_dto = BacktestFilterDTO(corte=cutoff, tamanho=size, modelo=model)
                    results_by_size[size].append(await self.backtest.run(filter_dto))
            series = BacktestSeriesDTO(
                tamanho=FILA_CAPACIDADE_MENSAL,
                cortes=results_by_size[FILA_CAPACIDADE_MENSAL],
                tamanhos=[BacktestSizeDTO(tamanho=size, cortes=results) for size, results in results_by_size.items()],
            )
            self.store.save(fingerprint, series)
            return series

        return await self.memory_cache.get_or_compute(self.repository.session.get_bind(), fingerprint, load_or_compute)
