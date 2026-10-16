# V-Energy Grid 360 - FastAPI & AI Agent Backend

API assíncrona FastAPI com Agente Text-to-SQL embutido (LangGraph) para o setor elétrico.

## Comandos Rápidos com uv

```bash
# Instalar dependências
uv sync --all-extras

# Iniciar servidor local com reload
uv run uvicorn app.main:app --reload --port 8000

# Executar linters
uv run ruff check .      # Estilo e sintaxe PEP 8
uv run pylint app        # Limites de tamanho, métodos e variáveis expressivas
uv run lint-imports      # Verificação matemática de contratos arquiteturais
uv run pyright           # Checagem estrita de tipos estáticos

# Executar testes
uv run pytest
```

Para a visão geral completa da arquitetura e do monorepo, consulte o [`README.md` raiz](../README.md) e o [`AGENTS.md`](../AGENTS.md).
