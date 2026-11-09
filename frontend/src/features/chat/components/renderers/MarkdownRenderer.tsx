import type { JSX } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CommandBadge } from '@/features/chat/components/feed/CommandBadge'
import { remarkHighlight } from '@/features/chat/components/renderers/remarkHighlight'
import { TableRenderer } from '@/features/chat/components/renderers/TableRenderer'
import { cn } from '@/lib/utils'

/**
 * Propriedades para renderização de conteúdo Markdown formatado.
 */
export interface MarkdownRendererProps {
  /** Texto puro em Markdown formatado. */
  content: string
  /** Classes CSS adicionais. */
  className?: string
}

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mt-5 mb-2.5 border-b border-border pb-1.5 text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 text-lg font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-base font-semibold tracking-tight text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-1.5 text-sm leading-relaxed text-foreground">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-2 list-disc pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 list-decimal pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="my-0.5">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 rounded-r border-l-2 border-primary/60 bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  mark: ({ children }) => (
    <mark className="rounded-sm bg-primary/25 px-1 py-0.5 font-medium text-foreground box-decoration-clone">
      {children}
    </mark>
  ),
  hr: () => (
    <hr className="my-3 border-border" />
  ),
  table: ({ children }) => <TableRenderer>{children}</TableRenderer>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:text-primary/80"
    >
      {children}
    </a>
  ),
  code: ({ className: codeClassName, children, ...props }) => {
    if (typeof children === 'string' && children.trim().startsWith('/')) {
      const trimmed = children.trim()
      const spaceIdx = trimmed.indexOf(' ')
      const cmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
      const args = spaceIdx !== -1 ? trimmed.slice(spaceIdx + 1) : undefined
      return <CommandBadge command={cmd} args={args} />
    }

    return (
      <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs', codeClassName)} {...props}>
        {children}
      </code>
    )
  }
}

/**
 * Renderizador de Markdown enriquecido com hierarquia tipográfica do design.md,
 * grifo embutido estilo Obsidian (`==texto==`), tabelas analíticas e comandos slash.
 *
 * @param props - Propriedades com conteúdo textual e estilização.
 * @returns Elemento JSX contendo o Markdown processado e estilizado.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps): JSX.Element {
  return (
    <div className={cn('max-w-none text-sm leading-relaxed text-foreground', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkHighlight]}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
