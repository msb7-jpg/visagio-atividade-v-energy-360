import { describe, expect, it } from 'vitest'
import { splitSqlStatements } from '@/features/chat/components/renderers/sqlStatements'

describe('splitSqlStatements', () => {
  it('retorna lista vazia quando a string SQL está vazia', () => {
    expect(splitSqlStatements('   ')).toEqual([])
  })

  it('retorna instrução única para consulta simples sem cabeçalho', () => {
    const query = 'SELECT SUM(valor_total_rs) FROM fato_faturamento;'
    const statements = splitSqlStatements(query)

    expect(statements).toHaveLength(1)
    expect(statements[0]).toEqual({
      id: 'sql-stmt-1',
      index: 1,
      title: 'Consulta SQL',
      sql: 'SELECT SUM(valor_total_rs) FROM fato_faturamento;'
    })
  })

  it('divide múltiplas consultas separadas por ponto-e-vírgula e extrai rótulos dos cabeçalhos', () => {
    const multiQuery = `
-- [CONSULTA 1: Decomposicao da Receita]
SELECT SUM(valor_total_rs) FROM fato_faturamento WHERE competencia LIKE '2024-%';

-- [CONSULTA 2: Impacto da GD Solar]
SELECT possui_gd, COUNT(*) FROM dim_unidade_consumidora GROUP BY possui_gd;

-- [CONSULTA 3: Fraudes em Bairros Criticos]
SELECT bairro, COUNT(*) FROM fato_inspecoes_perdas GROUP BY bairro LIMIT 4;
`
    const statements = splitSqlStatements(multiQuery)

    expect(statements).toHaveLength(3)
    expect(statements[0]?.title).toBe('1. Decomposicao da Receita')
    expect(statements[1]?.title).toBe('2. Impacto da GD Solar')
    expect(statements[2]?.title).toBe('3. Fraudes em Bairros Criticos')
    expect(statements[0]?.sql).toContain('FROM fato_faturamento')
    expect(statements[1]?.sql).toContain('FROM dim_unidade_consumidora')
    expect(statements[2]?.sql).toContain('FROM fato_inspecoes_perdas')
  })

  it('ignora ponto-e-vírgula dentro de literais de string SQL', () => {
    const queryWithStringLiteral = "SELECT * FROM fato_atendimentos WHERE canal = 'WEB;APP';"
    const statements = splitSqlStatements(queryWithStringLiteral)

    expect(statements).toHaveLength(1)
    expect(statements[0]?.sql).toContain("'WEB;APP'")
  })
})
