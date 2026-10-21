---
name: frontend-coding-standards
description: Architectural guidelines and best practices for modern frontend with React 19 and TypeScript: Vertical Slices architecture, component discovery and reuse (Shadcn, Aceternity UI, Base UI), asynchronous state governance (TanStack Query v5), React 19, motion/react, anti-god components, and design system linters. Use when planning, architecting, implementing, or refactoring frontend components, hooks, views, forms, or queries.
---

# Frontend Coding Standards (ponte para `.agents/skills`)

A fonte canônica desta skill é compartilhada com os outros agentes do time e fica em
`.agents/skills/frontend-coding-standards/`. Este arquivo só a expõe ao Claude Code.

Antes de escrever ou revisar código em `frontend/`:

1. Leia `.agents/skills/frontend-coding-standards/SKILL.md` por inteiro.
2. Leia as referências de `.agents/skills/frontend-coding-standards/references/` indicadas no mapa de navegação
   para a tarefa em curso (ex.: `async-state-and-query.md` ao buscar dados, `jsx-flow-and-motion.md` ao animar).
3. Siga `design.md` para tokens, componentes e receitas visuais.
4. Em caso de conflito, prevalecem `AGENTS.md`, `frontend/.fallowrc.jsonc` e `frontend/design-system.lint.json`.

Para alterar as regras, edite os arquivos em `.agents/skills/`, nunca esta ponte.
