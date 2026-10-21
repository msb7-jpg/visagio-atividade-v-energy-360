---
name: backend-coding-standards
description: Architectural patterns and guidelines for modern Python 3.12+ and FastAPI backends: Clean Architecture, Vertical Slices, Dependency Injection (DI), anti-god files, separation of concerns (Routers/Services/Repositories), linters/formatters (Ruff, Pyright, import-linter), testing, and resilience. Use when architecting, refactoring, implementing APIs, services, routers, repositories, linters, or backend tests.
---

# Backend Coding Standards (ponte para `.agents/skills`)

A fonte canônica desta skill é compartilhada com os outros agentes do time e fica em
`.agents/skills/backend-coding-standards/`. Este arquivo só a expõe ao Claude Code.

Antes de escrever ou revisar código em `backend/`:

1. Leia `.agents/skills/backend-coding-standards/SKILL.md` por inteiro.
2. Leia as referências de `.agents/skills/backend-coding-standards/references/` indicadas no mapa de navegação
   para a tarefa em curso (ex.: `testing.md` ao escrever testes, `dependency-injection.md` ao criar dependências).
3. Em caso de conflito, prevalecem `AGENTS.md` e a configuração dos linters em `backend/pyproject.toml`.

Para alterar as regras, edite os arquivos em `.agents/skills/`, nunca esta ponte.
