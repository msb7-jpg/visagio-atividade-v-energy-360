---
name: shadcn
description: Manages shadcn components and projects — adding, searching, fixing, debugging, styling, and composing UI, including chat interfaces. Provides project context, component docs, and usage examples. Applies when working with shadcn/ui, component registries, presets, --preset codes, or any project with a components.json file. Also triggers for "shadcn init", "create an app with --preset", or "switch to --preset".
user-invocable: false
allowed-tools: Bash(npx shadcn@latest *), Bash(pnpm dlx shadcn@latest *), Bash(bunx --bun shadcn@latest *)
---

# shadcn (ponte para `.agents/skills`)

A fonte canônica desta skill é compartilhada com os outros agentes do time e fica em `.agents/skills/shadcn/`.
Este arquivo só a expõe ao Claude Code.

1. Leia `.agents/skills/shadcn/SKILL.md` por inteiro.
2. Leia os arquivos de `.agents/skills/shadcn/` (`rules/`, `cli.md`, `customization.md`, `registry.md`, `mcp.md`)
   que ele indicar para a tarefa em curso.
3. O projeto usa Bun: rode o CLI com `bunx --bun shadcn@latest`.
4. Em caso de conflito, prevalecem `AGENTS.md`, `design.md` e `frontend/design-system.lint.json`.

Para alterar as regras, edite os arquivos em `.agents/skills/`, nunca esta ponte.
