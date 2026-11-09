/**
 * Nó genérico da árvore sintática abstrata do Markdown (mdast).
 */
interface MdastNode {
  type: string
  value?: string
  data?: { hName?: string }
  children?: MdastNode[]
}

function createTextNode(value: string): MdastNode {
  return { type: 'text', value }
}

function createMarkNode(value: string): MdastNode {
  return {
    type: 'mark',
    data: { hName: 'mark' },
    children: [createTextNode(value)]
  }
}

function isValidHighlightContent(segment: string): boolean {
  const trimmed = segment.trim()
  return trimmed.length > 0 && !segment.includes('\n') && !segment.includes('=')
}

function splitTextByHighlight(textValue: string): MdastNode[] | null {
  if (!textValue.includes('==')) {
    return null
  }

  const fragments: MdastNode[] = []
  let cursor = 0
  let hasMark = false

  while (cursor < textValue.length) {
    const openIdx = textValue.indexOf('==', cursor)
    if (openIdx === -1) {
      break
    }

    const closeIdx = textValue.indexOf('==', openIdx + 2)
    if (closeIdx === -1) {
      break
    }

    const innerText = textValue.slice(openIdx + 2, closeIdx)
    if (!isValidHighlightContent(innerText)) {
      fragments.push(createTextNode(textValue.slice(cursor, openIdx + 2)))
      cursor = openIdx + 2
      continue
    }

    if (openIdx > cursor) {
      fragments.push(createTextNode(textValue.slice(cursor, openIdx)))
    }
    fragments.push(createMarkNode(innerText))
    hasMark = true
    cursor = closeIdx + 2
  }

  if (!hasMark) {
    return null
  }

  if (cursor < textValue.length) {
    fragments.push(createTextNode(textValue.slice(cursor)))
  }

  return fragments
}

function transformNodeChildren(parent: MdastNode): void {
  if (!parent.children || parent.type === 'code' || parent.type === 'inlineCode') {
    return
  }

  const nextChildren: MdastNode[] = []
  for (const child of parent.children) {
    if (child.type === 'text' && typeof child.value === 'string') {
      const splitNodes = splitTextByHighlight(child.value)
      if (splitNodes) {
        nextChildren.push(...splitNodes)
        continue
      }
    } else {
      transformNodeChildren(child)
    }
    nextChildren.push(child)
  }

  parent.children = nextChildren
}

/**
 * Plugin Remark para converter a sintaxe de grifo estilo Obsidian (`==texto==`)
 * em elementos HTML `<mark>` nativos no pipeline do ReactMarkdown.
 *
 * @returns Função transformadora da árvore mdast.
 */
export function remarkHighlight() {
  return (tree: MdastNode): void => {
    transformNodeChildren(tree)
  }
}
