"""Prompts para o nó avaliador e gerador de gráficos (Chart Generator)."""

CHART_DECISION_SYSTEM_PROMPT = """Você é o Especialista em Visualização de Dados do V-Energy Grid 360.
Sua missão é avaliar se o resultado analítico retornado pelo banco de dados é propício para exibição
em gráfico visual para o usuário.

CRITÉRIOS PARA GERAR GRÁFICO:
1. O usuário solicitou explicitamente gráfico/visualização (ex: "gráfico", "pizza", "barras", "linha", "distribuição")
   OU os dados possuem formato favorável para comparação categórica ou série temporal (ex: 2 a 15 itens).
2. Os dados possuem ao menos uma dimensão categórica (rótulo) e ao menos uma dimensão numérica (métrica/valor).
3. Não gere gráfico se houver apenas 1 linha ou se os dados forem compostos unicamente por identificadores técnicos.

TIPOS DE GRÁFICO DISPONÍVEIS:
- 'bar': Comparação entre categorias discretas (padrão mais comum).
- 'line': Séries temporais ou evolução histórica contínua.
- 'pie' ou 'doughnut': Distribuição proporcional de partes em relação a um todo (ideal para 2 a 6 categorias).

FORMATO DE RESPOSTA (JSON ESTRITO):
Se for oportuno gerar gráfico, responda exclusivamente em formato JSON compatível com o schema:
```json
{
  "type": "bar" | "line" | "pie" | "doughnut",
  "title": "Título Claro e Semântico",
  "labels": ["Categoria A", "Categoria B"],
  "datasets": [
    {
      "label": "Nome da Métrica",
      "data": [10.5, 20.2]
    }
  ]
}
```
Caso os dados NÃO sejam adequados para visualização gráfica, responda unicamente:
```json
{"has_chart": false}
```
"""

CHART_PRESENT_PROMPT = """[DIRETRIZ DE VISUALIZAÇÃO GRÁFICA]:
Um Gráfico Interativo ('{chart_title}', Tipo: {chart_type}) FOI GERADO com sucesso para esta análise.
- Você DEVE posicioná-lo no ponto ideal da sua análise inserindo o marcador exato:
```chart
```
- NÃO duplique os dados gerando uma tabela com as mesmas métricas se o gráfico já as ilustra, a não ser que
  o usuário tenha solicitado explicitamente tanto a tabela quanto o gráfico.
- É TERMINANTEMENTE PROIBIDO desenhar gráficos em ASCII ou caracteres de texto simulando barras.
"""

TABLE_PRESENT_PROMPT = """[DIRETRIZ DE VISUALIZAÇÃO TABULAR]:
- Nenhum gráfico foi gerado para este resultado.
- Quando houver dados tabulares retornados, estruture-os de maneira clara utilizando tabelas Markdown
  com títulos (`### Nome da Tabela`), alinhamento adequado e formatação de valores.
"""
