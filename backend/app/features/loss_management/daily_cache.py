"""Cache por dia e por banco para leituras pesadas do Gold, com um único cálculo para chamadas simultâneas."""

import asyncio
from collections.abc import Awaitable, Callable, Hashable
from datetime import date
from weakref import WeakKeyDictionary

from sqlalchemy import Engine


class DailyEngineCache[T]:
    """Guarda um valor por banco até o fim do dia; quem chega durante o cálculo espera o mesmo resultado.

    O Gold só muda quando o pipeline recarrega, então o resultado vale o dia inteiro. Sem a trava, a subida da API
    (pré-cálculo do Painel) e as chamadas da tela calculariam o mesmo valor ao mesmo tempo e se atrasariam.
    """

    def __init__(self) -> None:
        self._entries: WeakKeyDictionary[Engine, tuple[date, Hashable, T]] = WeakKeyDictionary()
        self._locks: WeakKeyDictionary[Engine, asyncio.Lock] = WeakKeyDictionary()

    def _fresh_value(self, engine: Engine, key: Hashable) -> tuple[T] | None:
        entry = self._entries.get(engine)
        is_fresh = entry is not None and entry[0] == date.today() and entry[1] == key
        return (entry[2],) if entry is not None and is_fresh else None

    async def get_or_compute(self, engine: Engine, key: Hashable, compute: Callable[[], Awaitable[T]]) -> T:
        """Devolve o valor do dia para o banco e a chave, calculando-o uma única vez.

        Args:
            engine: Banco a que o valor pertence (uma entrada por banco).
            key: Parâmetro de que o valor depende (por exemplo, a competência de referência).
            compute: Cálculo do valor; falhas propagam e nunca entram no cache.

        Returns:
            O valor em cache ou o recém-calculado.
        """
        if (cached := self._fresh_value(engine, key)) is not None:
            return cached[0]
        lock = self._locks.setdefault(engine, asyncio.Lock())
        async with lock:
            if (cached := self._fresh_value(engine, key)) is not None:
                return cached[0]
            value = await compute()
            self._entries[engine] = (date.today(), key, value)
            return value
