import { isValidElement, type ReactElement, type ReactNode } from 'react'

/**
 * Linha de tabela parseada contendo células em string.
 */
export interface ParsedRow {
  /** Valores textuais das colunas correspondentes nesta linha. */
  cells: string[]
}

/**
 * Estrutura tabular normalizada contendo cabeçalhos e linhas.
 */
export interface ParsedTableData {
  /** Nomes das colunas da tabela. */
  headers: string[]
  /** Linhas de dados contendo as células textuais. */
  tableData: ParsedRow[]
}

/**
 * Extrai cabeçalhos e células a partir de uma lista de registros chave-valor do SQLite.
 *
 * @param rows - Lista de dicionários de dados analíticos.
 * @returns Estrutura normalizada ParsedTableData com headers e tableData.
 */
export function extractTableFromRows(rows: Record<string, unknown>[]): ParsedTableData {
  if (rows.length === 0) {
    return { headers: [], tableData: [] }
  }

  const headers = Object.keys(rows[0])
  const tableData: ParsedRow[] = rows.map(rowRecord => ({
    cells: headers.map(headerKey =>
      rowRecord[headerKey] !== undefined && rowRecord[headerKey] !== null
        ? String(rowRecord[headerKey])
        : ''
    )
  }))

  return { headers, tableData }
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('')
  }
  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>
    const childrenText = props.children ? extractText(props.children as ReactNode) : ''

    if (typeof props.href === 'string') {
      return `[${childrenText}](${props.href})`
    }

    return childrenText
  }
  return ''
}

function toNodeArray(children: ReactNode): ReactNode[] {
  if (!children) return []
  return Array.isArray(children) ? children : [children]
}

function parseHeadersFromTr(trNode: ReactNode): string[] {
  if (!isValidElement(trNode)) return []
  const trProps = trNode.props as { children?: ReactNode }
  const thList = toNodeArray(trProps.children)
  return thList
    .filter(isValidElement)
    .map(th => extractText((th.props as { children?: ReactNode }).children).trim())
}

function parseRowFromTr(trNode: ReactNode): ParsedRow | null {
  if (!isValidElement(trNode)) return null
  const trProps = trNode.props as { children?: ReactNode }
  const tdList = toNodeArray(trProps.children)
  const cells = tdList
    .filter(isValidElement)
    .map(td => extractText((td.props as { children?: ReactNode }).children).trim())
  return cells.length > 0 ? { cells } : null
}

function parseSection(
  child: ReactElement<{ children?: ReactNode }>,
  headers: string[],
  tableData: ParsedRow[]
): void {
  const isThead = child.type === 'thead' || (child.type as { name?: string })?.name === 'thead'
  const isTbody = child.type === 'tbody' || (child.type as { name?: string })?.name === 'tbody'
  const trNodes = toNodeArray(child.props.children)

  if (isThead) {
    trNodes.forEach(tr => {
      headers.push(...parseHeadersFromTr(tr))
    })
    return
  }

  if (isTbody) {
    trNodes.forEach(tr => {
      const parsed = parseRowFromTr(tr)
      if (parsed) {
        tableData.push(parsed)
      }
    })
  }
}

/**
 * Analisa os nós filhos JSX de uma tabela Markdown (thead, tbody, tr, th, td) e constrói a estrutura tabular.
 *
 * @param children - Elementos filhos ReactNode da tag table.
 * @returns Estrutura normalizada com cabeçalhos e linhas.
 */
export function extractTableFromChildren(children: ReactNode): ParsedTableData {
  const headers: string[] = []
  const tableData: ParsedRow[] = []

  const topNodes = toNodeArray(children).filter(isValidElement)
  for (const child of topNodes) {
    parseSection(child as ReactElement<{ children?: ReactNode }>, headers, tableData)
  }

  return { headers, tableData }
}
