---
name: medallion-lakehouse-pipeline
description: Architectural standards and guidelines for Databricks Serverless Medallion Lakehouse pipelines (Bronze, Silver, Gold), PySpark data quality contracts, regulatory metric calculations (DEC/FEC), declarative Databricks Workflows (job.yaml), and Gold Delta-to-SQLite export pipelines. Use when designing, implementing, or updating data engineering notebooks, data pipelines, schema modeling, or data export scripts.
---

# Medallion Lakehouse Pipeline (ponte para `.agents/skills`)

A fonte canônica desta skill é compartilhada com os outros agentes do time e fica em
`.agents/skills/medallion-lakehouse-pipeline/SKILL.md`. Este arquivo só a expõe ao Claude Code.

1. Leia `.agents/skills/medallion-lakehouse-pipeline/SKILL.md` por inteiro antes de mexer em `data-engineering/`
   ou na exportação Gold para o SQLite `v_energy.db`.
2. Em caso de conflito, prevalecem `AGENTS.md` e os contratos de tabela em `docs/planning/<membro>/`.

Para alterar as regras, edite os arquivos em `.agents/skills/`, nunca esta ponte.
