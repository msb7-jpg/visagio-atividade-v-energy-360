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

## Banco já criado: atualizar a tabela `ordem_inspecao`

A tabela `ordem_inspecao` é a única escrita pela API (as tabelas Gold vêm do pipeline) e ganhou as colunas anuláveis
`data_inspecao`, `inspetor` e `motivo_cancelamento`. Quem já tem o `v_energy.db` aplica a mudança, sem apagar nem
recriar nada, com:

```bash
make db-upgrade   # na raiz do repositório
# ou, dentro de backend/:
uv run alembic upgrade head
```

A migração do Alembic (`migrations/versions/0001_create_and_upgrade_ordem_inspecao.py`) chama o mesmo
`schema_upgrade`: é idempotente (só faz `ALTER TABLE ... ADD COLUMN` se a coluna ainda não existir), mantém as ordens
existentes e ignora as tabelas Gold. A subida da API também roda o `schema_upgrade`, então o comando só é necessário
para atualizar o banco sem subir a API.

Para a visão geral completa da arquitetura e do monorepo, consulte o [`README.md` raiz](../README.md) e o [`AGENTS.md`](../AGENTS.md).
