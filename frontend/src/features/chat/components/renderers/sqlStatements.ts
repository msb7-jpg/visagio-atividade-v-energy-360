/**
 * Representa uma instrução SQL individual extraída de um bloco simple ou multi-query.
 */
export interface SqlStatementItem {
  /** Identificador único da instrução para chaves React e abas. */
  id: string
  /** Índice sequencial baseado em 1 (1, 2, 3...). */
  index: number
  /** Rótulo amigável de negócio extraído do cabeçalho ou gerado por índice. */
  title: string
  /** Código SQL formatado correspondente a esta instrução. */
  sql: string
}

type ActiveDelimiter = '\'' | '"' | '--' | null

const HEADER_KEYWORD_PREFIX = /^(?:consulta|query|bloco)\b/i

function nextDelimiterState(
  currentDelimiter: ActiveDelimiter,
  currentChar: string,
  nextChar: string | undefined
): ActiveDelimiter {
  if (currentDelimiter === '--') {
    return currentChar === '\n' ? null : '--'
  }
  if (currentDelimiter !== null) {
    return currentChar === currentDelimiter ? null : currentDelimiter
  }
  if (currentChar === '-' && nextChar === '-') {
    return '--'
  }
  if (currentChar === '\'' || currentChar === '"') {
    return currentChar
  }
  return null
}

function splitByTopLevelSemicolon(rawSql: string): string[] {
  const chunks: string[] = []
  let activeDelimiter: ActiveDelimiter = null
  let currentBuffer = ''

  for (let charIndex = 0; charIndex < rawSql.length; charIndex += 1) {
    const currentChar = rawSql[charIndex]
    activeDelimiter = nextDelimiterState(activeDelimiter, currentChar, rawSql[charIndex + 1])

    if (activeDelimiter === null && currentChar === ';') {
      const trimmedChunk = currentBuffer.trim()
      if (trimmedChunk.length > 0) {
        chunks.push(`${trimmedChunk};`)
      }
      currentBuffer = ''
    } else {
      currentBuffer += currentChar
    }
  }

  const remainingChunk = currentBuffer.trim()
  if (remainingChunk.length > 0) {
    chunks.push(remainingChunk)
  }

  return chunks
}

function isExecutableLine(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.length > 0 && !trimmed.startsWith('--') && trimmed !== ';'
}

function hasExecutableCode(statementText: string): boolean {
  return statementText.split('\n').some(isExecutableLine)
}

function unwrapCommentContent(commentLine: string): string {
  const withoutDashes = commentLine.slice(2).trim()
  const withoutOpen = withoutDashes.startsWith('[') ? withoutDashes.slice(1).trim() : withoutDashes
  return withoutOpen.endsWith(']') ? withoutOpen.slice(0, -1).trim() : withoutOpen
}

function parseCommentHeaderLine(commentLine: string): string | null {
  const inner = unwrapCommentContent(commentLine)
  if (!HEADER_KEYWORD_PREFIX.test(inner)) {
    return null
  }
  const separatorIdx = inner.search(/[:-]/)
  if (separatorIdx === -1) {
    return null
  }
  const candidateTitle = inner.slice(separatorIdx + 1).trim()
  return candidateTitle.length > 0 ? candidateTitle : null
}

function extractQueryTitle(statementText: string, index: number, totalCount: number): string {
  const commentLines = statementText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('--'))

  for (const commentLine of commentLines) {
    const parsedTitle = parseCommentHeaderLine(commentLine)
    if (parsedTitle) {
      return totalCount > 1 ? `${index}. ${parsedTitle}` : parsedTitle
    }
  }

  return totalCount > 1 ? `Consulta ${index}` : 'Consulta SQL'
}

/**
 * Divide e cataloga uma string SQL em instruções individuais para auditoria em abas.
 *
 * @param rawSql - String SQL completa emitida pelo agente.
 * @returns Lista estruturada de instruções SQL com títulos e código individual.
 */
export function splitSqlStatements(rawSql: string): SqlStatementItem[] {
  const cleanedRaw = rawSql.trim()
  if (!cleanedRaw) {
    return []
  }

  const rawChunks = splitByTopLevelSemicolon(cleanedRaw).filter(hasExecutableCode)
  if (rawChunks.length === 0) {
    return [
      {
        id: 'sql-stmt-1',
        index: 1,
        title: 'Consulta SQL',
        sql: cleanedRaw
      }
    ]
  }

  return rawChunks.map((chunkText, arrayIdx) => {
    const statementIndex = arrayIdx + 1
    return {
      id: `sql-stmt-${statementIndex}`,
      index: statementIndex,
      title: extractQueryTitle(chunkText, statementIndex, rawChunks.length),
      sql: chunkText
    }
  })
}
