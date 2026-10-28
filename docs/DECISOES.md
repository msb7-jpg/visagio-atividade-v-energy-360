# Registro de Decisões Arquiteturais (ADRs)

---

## 1. Ferramental de Testes e Linters
- **Backend:** `pytest` para testes unitários e de integração; `ruff` para formatação e estilo; `pylint` para governança de design, limites físicos ($\le 300$ linhas) e nomenclatura; `import-linter` para contratos formais de fronteiras arquiteturais.
- **Frontend:** `vitest` para testes unitários de componentes e hooks; `eslint` para análise estática React 19; `fallow` para monitoramento de complexidade cognitiva/ciclomática, CRAP e código morto.

---

## 2. Decisão 003: Purgação dos Nós de Gráficos da FSM do Agente de IA (Fatia 07)
- **Data:** 2026-10-25
- **Contexto:** A especificação inicial de Text-to-SQL previa um nó de geração de especificações visuais de gráficos (`chart_prompt`, `chart_schema`, `chart_builder`).
- **Decisão:** Remover integralmente a geração autônoma de gráficos do agente de IA e da interface de chat.
- **Justificativa:** A plataforma V-Energy Grid 360 já conta com dashboards analíticos visuais ricos e canônicos (Receita, Qualidade DEC/FEC, Perdas e Visão 360). Gerar gráficos dinamicamente no assistente aumentava a latência, a probabilidade de alucinações de eixos/dados e a duplicação de componentes, em contraste com o objetivo de entregar respostas analíticas diretas, síntese em Markdown executiva e tabelas com auditoria SQL, ordenação e exportação CSV.

---

## 3. Decisão 004: Assistente Flutuante Redimensionável e Não-Bloqueante (Fatia 07)
- **Data:** 2026-10-25
- **Contexto:** A proposta de gaveta modal lateral (`<Sheet>`) ocupando 400px fixos bloqueava a visão e a interação simultânea com as tabelas e gráficos da tela subjacente.
- **Decisão:** Implementar o assistente como um widget flutuante, arrastável e redimensionável globalmente acionável (ou expansível para tela cheia), com selo de modo seguro (Read-Only) e atalhos rápidos.
- **Justificativa:** Proporciona ao usuário não técnico e ao analista a liberdade de consultar dados operacionais sem perder o contexto visual da tela ativa, consultando métricas e comparando valores em tempo real.
