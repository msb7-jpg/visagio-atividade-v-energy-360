import type { JSX } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CommandBadge } from '@/features/chat/components/feed/CommandBadge'
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

/**
 * Renderizador de Markdown enriquecido com suporte a tabelas analíticas e comandos.
 *
 * @param props - Propriedades com conteúdo textual e estilização.
 * @returns Elemento JSX contendo o Markdown processado e estilizado.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps): JSX.Element {
  return (
    <div
      className={cn(
        'prose prose-invert max-w-none text-sm leading-relaxed text-foreground',
        'prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight',
        'prose-h1:text-xl prose-h1:border-b prose-h1:border-border prose-h1:pb-2 prose-h1:mt-4 prose-h1:mb-2',
        'prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-1.5',
        'prose-h3:text-base prose-h3:mt-2.5 prose-h3:mb-1 text-foreground',
        'prose-p:my-2 prose-p:leading-relaxed',
        'prose-ul:my-2 prose-li:my-0.5',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-table:w-full prose-table:border-collapse prose-table:text-left prose-table:my-0',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
              <code className={codeClassName} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
