import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-lg glass-panel text-card-foreground transition duration-200',
  {
    variants: {
      variant: {
        default: '',
        glass: 'bg-card/40 backdrop-blur-2xl border-border shadow-2xl',
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
 * Aplica raio de 12px (rounded-lg), borda sutil e fundo de superfície.
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
      className={cn('flex flex-col gap-1.5 p-4 sm:p-5', className)}
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
      className={cn('text-base font-semibold leading-none tracking-tight text-foreground', className)}
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
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
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
  return <div className={cn('p-4 sm:p-5 pt-0', className)} {...props} />
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
      className={cn('flex items-center p-4 sm:p-5 pt-0', className)}
      {...props}
    />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
