import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg glass-panel text-card-foreground',
  {
    variants: {
      variant: {
        default: '',
        glass: 'shadow-sm',
        interactive: 'glass-panel-interactive'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

/**
 * Propriedades do componente Card com variantes do Design System.
 */
export interface CardProps
  extends React.ComponentProps<'div'>,
  VariantProps<typeof cardVariants> {}

/**
 * Container Card padronizado conforme design.md (SaaS Enterprise Analytics).
 * Superfície plana: raio de 8px, borda de 1px e fundo `card`.
 *
 * @param props - Propriedades de div nativas, variantes e classes de layout.
 * @returns Elemento Card renderizado.
 */
function Card({ className, variant, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

/**
 * Cabeçalho do Card com espaçamento estruturado.
 *
 * @param props - Propriedades de cabeçalho do Card.
 * @returns Elemento CardHeader renderizado.
 */
function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-4 pt-4 pb-3 sm:px-5 sm:pt-5', className)}
      {...props}
    />
  )
}

/**
 * Título do Card com tipografia limpa e semântica.
 *
 * @param props - Propriedades de título do Card.
 * @returns Elemento CardTitle renderizado.
 */
function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-base font-semibold leading-tight text-foreground', className)}
      {...props}
    />
  )
}

/**
 * Descrição do Card com texto atenuado para suporte contextual.
 *
 * @param props - Propriedades de descrição do Card.
 * @returns Elemento CardDescription renderizado.
 */
function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

/**
 * Conteúdo interno do Card.
 *
 * @param props - Propriedades de conteúdo do Card.
 * @returns Elemento CardContent renderizado.
 */
function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('px-4 pb-4 first:pt-4 sm:px-5 sm:pb-5 sm:first:pt-5', className)} {...props} />
}

/**
 * Rodapé do Card para ações e metadados contextuais.
 *
 * @param props - Propriedades de rodapé do Card.
 * @returns Elemento CardFooter renderizado.
 */
function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center px-4 pb-4 sm:px-5 sm:pb-5', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
