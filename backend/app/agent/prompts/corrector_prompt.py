"""Prompt para o nó de auto-recuperação (Self-Correction) de SQL."""

CORRECTOR_PROMPT = """A consulta SQL executada anteriormente falhou na validação de sintaxe ou no motor SQLite.
Seu objetivo é analisar a consulta com erro e a respectiva mensagem de falha, diagnosticando a causa raiz
e gerando uma NOVA consulta SQL devidamente corrigida.

DIRETRIZES DE CORREÇÃO:
1. Respeite as regras de sintaxe do dialeto SQLite.
2. Certifique-se de que os nomes de colunas, operadores de agregação e cláusulas
   de agrupamento (GROUP BY) estejam consistentes.
3. Garanta que a consulta permaneça estritamente no modo READ-ONLY (apenas SELECT ou WITH).
4. Responda obrigatoriamente com o bloco <thought> diagnosticando o erro e a correção efetuada </thought>
   seguido do bloco com a consulta corrigida em ```sql ... ```.
"""
