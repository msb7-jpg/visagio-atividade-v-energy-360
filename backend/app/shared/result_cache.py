"""Cache em memória de resultados lidos da Gold, que só muda quando o pipeline exporta um banco novo."""

import asyncio
import time
from collections.abc import Awaitable, Callable, Hashable


class ResultCache[Key: Hashable, Value]:
    """Guarda cada resultado por um tempo fixo; depois disso a próxima leitura recalcula."""

    def __init__(self, ttl_seconds: float, clock: Callable[[], float] = time.monotonic) -> None:
        self.ttl_seconds = ttl_seconds
        self.clock = clock
        self._entries: dict[Key, tuple[float, Value]] = {}
        self._locks: dict[Key, asyncio.Lock] = {}

    def get(self, key: Key) -> Value | None:
        """Devolve o resultado guardado, ou None se não existe ou venceu."""
        entry = self._entries.get(key)
        if entry is None or entry[0] <= self.clock():
            return None
        return entry[1]

    def put(self, key: Key, value: Value) -> None:
        """Guarda o resultado até `ttl_seconds` a partir de agora."""
        self._entries[key] = (self.clock() + self.ttl_seconds, value)

    def clear(self) -> None:
        """Descarta todos os resultados guardados."""
        self._entries.clear()

    async def get_or_compute(self, key: Key, compute: Callable[[], Awaitable[Value]]) -> Value:
        """Devolve o resultado guardado ou o calcula uma única vez, mesmo com chamadas simultâneas para a mesma chave.

        Args:
            key: Parâmetros de que o resultado depende.
            compute: Cálculo do resultado; falhas propagam e nunca entram no cache.

        Returns:
            O resultado em cache ou o recém-calculado.
        """
        if (cached := self.get(key)) is not None:
            return cached
        async with self._locks.setdefault(key, asyncio.Lock()):
            if (cached := self.get(key)) is not None:
                return cached
            value = await compute()
            self.put(key, value)
            return value
