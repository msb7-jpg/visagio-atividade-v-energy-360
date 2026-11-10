import type { ReactNode } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip-card'
import { cn } from '@/lib/utils'

interface StatTileProps {
  label: string
  value: ReactNode
  /** Como o número é calculado; aparece no ícone de ajuda ao lado do rótulo. */
  hint?: string | ReactNode
  /** Linha logo abaixo do valor: a variação, um selo de situação ou o total de referência. */
  change?: ReactNode
  /** Rodapé discreto: o valor do período anterior ou o contexto do número. */
  footnote?: ReactNode
  /** Aviso sobre o número (ex.: evento climático no período), mostrado como ícone com tooltip. */
  warning?: string | null
  testId?: string
  className?: string
}

const DIGIT = /\d/
const SIGNS = new Set(['+', '-', '−'])

function splitNumber(text: string): [string, string, string] | null {
  const first = text.search(DIGIT)
  if (first < 0) return null
  let last = text.length - 1
  while (last > first && !DIGIT.test(text.charAt(last))) last -= 1
  const start = first > 0 && SIGNS.has(text.charAt(first - 1)) ? first - 1 : first
  return [text.slice(0, start), text.slice(start, last + 1), text.slice(last + 1)]
}

/**
 * Valor com o número em destaque e o prefixo e o sufixo (R$, %, kWh, mi) menores e em cinza.
 *
 * @param props - Valor já formatado.
 * @returns O valor dividido em partes, ou o texto como veio quando não há número ou unidade.
 */
function StatValue({ text }: { text: string }) {
  const parts = splitNumber(text)
  if (!parts || (!parts[0] && !parts[2])) return text
  const affix = 'text-muted-foreground text-base font-medium whitespace-pre'
  return (
    <>
      {parts[0] ? <span className={affix}>{parts[0]}</span> : null}
      {parts[1]}
      {parts[2] ? <span className={affix}>{parts[2]}</span> : null}
    </>
  )
}

/**
 * Bloco de indicador compartilhado pelas telas: rótulo, valor em destaque, variação e uma nota curta.
 *
 * @param props - Textos e conteúdo do indicador.
 * @returns Bloco com borda, sem sombra, alinhado à grade da tela.
 */
export function StatTile({ label, value, hint, change, footnote, warning, testId, className }: StatTileProps) {
  return (
    <div data-testid={testId} className={cn('bg-card border-border flex min-w-0 flex-col gap-2 rounded-md border p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        {hint ? (
          <Tooltip content={hint}>
            <span className="text-muted-foreground flex cursor-help items-center gap-1 text-sm font-medium">
              {label}
              <HelpCircle className="size-3.5 shrink-0" aria-hidden="true" />
            </span>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground text-sm font-medium">{label}</span>
        )}
        {warning ? (
          <Tooltip content={warning}>
            <span className="text-warning cursor-help">
              <AlertTriangle className="size-4" aria-hidden="true" />
              <span className="sr-only">{warning}</span>
            </span>
          </Tooltip>
        ) : null}
      </div>
      <div className="text-foreground text-2xl font-semibold tabular-nums">
        {typeof value === 'string' ? <StatValue text={value} /> : value}
      </div>
      {change ? <div className="flex flex-wrap items-center gap-2 text-xs">{change}</div> : null}
      {footnote ? <div className="text-muted-foreground mt-auto text-xs">{footnote}</div> : null}
    </div>
  )
}
