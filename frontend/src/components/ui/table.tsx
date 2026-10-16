import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Tabela de dados tabular para relatórios analíticos e telemetria.
 *
 * @param props - Propriedades nativas da tag table.
 * @returns Elemento Table renderizado em container com scroll horizontal.
 */
function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

/**
 * Cabeçalho da tabela com borda inferior semântica.
 *
 * @param props - Propriedades de thead.
 * @returns Elemento TableHeader renderizado.
 */
function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('[&_tr]:border-b border-border', className)} {...props} />
}

/**
 * Corpo da tabela de dados.
 *
 * @param props - Propriedades de tbody.
 * @returns Elemento TableBody renderizado.
 */
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

/**
 * Rodapé da tabela com fundo atenuado.
 *
 * @param props - Propriedades de tfoot.
 * @returns Elemento TableFooter renderizado.
 */
function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      className={cn(
        'border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className
      )}
      {...props}
    />
  )
}

/**
 * Linha de dados da tabela com transição e hover suave.
 *
 * @param props - Propriedades de tr.
 * @returns Elemento TableRow renderizado.
 */
function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

/**
 * Célula de cabeçalho da tabela com tipografia alinhada.
 *
 * @param props - Propriedades de th.
 * @returns Elemento TableHead renderizado.
 */
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      className={cn(
        'h-10 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

/**
 * Célula de corpo da tabela.
 *
 * @param props - Propriedades de td.
 * @returns Elemento TableCell renderizado.
 */
function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'p-3 align-middle [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
}

/**
 * Legenda explicativa da tabela.
 *
 * @param props - Propriedades de caption.
 * @returns Elemento TableCaption renderizado.
 */
function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
}
