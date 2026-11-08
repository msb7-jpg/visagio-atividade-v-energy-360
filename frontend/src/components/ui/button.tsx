import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

/**
 * Variantes de estilo do botão base (design.md): raio de 6px, peso 500, sem sombra nem deslocamento.
 */
const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-border bg-card text-foreground hover:bg-muted',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        brand: 'bg-brand text-brand-foreground hover:bg-brand/90',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        inline: 'text-inherit underline decoration-dotted decoration-muted-foreground underline-offset-4 hover:text-foreground'
      },
      size: {
        default: 'h-9 px-3.5',
        sm: 'h-8 px-3',
        lg: 'h-10 px-5 text-base',
        icon: 'size-9',
        iconLg: 'size-14 [&_svg]:size-6',
        touch: 'h-11 px-3',
        inline: 'h-auto px-0'
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false
    }
  }
)

/**
 * Propriedades do componente Button.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * Componente Button padronizado conforme o design.md (SaaS Enterprise Analytics).
 *
 * @param props - Propriedades do botão incluindo variante, tamanho e fullWidth.
 * @returns Elemento de botão renderizado.
 */
function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
