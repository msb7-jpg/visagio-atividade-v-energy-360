import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import * as React from 'react'

/** Componente raiz de controle e estado do diálogo de alerta. */
function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

/** Gatilho de abertura do diálogo de alerta. */
function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}

/** Portal para renderização do diálogo de alerta no final do body. */
function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props): React.JSX.Element {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

/** Camada de sobreposição (backdrop) com desfoque de fundo (design.md). */
function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-background/80 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

/** Painel central de conteúdo com cantos arredondados de 12px (design.md). */
function AlertDialogContent({
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props): React.JSX.Element {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 text-foreground shadow-2xl duration-200 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

/** Cabeçalho do diálogo de alerta para título e descrição. */
function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  )
}

/** Rodapé do diálogo de alerta com ações de confirmação e cancelamento. */
function AlertDialogFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2', className)}
      {...props}
    />
  )
}

/** Título semântico do diálogo de alerta. */
function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-base font-bold text-foreground tracking-tight', className)}
      {...props}
    />
  )
}

/** Descrição explicativa do diálogo de alerta. */
function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
}

/** Botão de confirmação de ação do diálogo de alerta. */
function AlertDialogAction({ className, variant = 'default', ...props }: React.ComponentProps<typeof Button>): React.JSX.Element {
  return <Button data-slot="alert-dialog-action" variant={variant} className={cn(className)} {...props} />
}

/** Botão de cancelamento e fechamento do diálogo de alerta. */
function AlertDialogCancel({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: AlertDialogPrimitive.Close.Props & Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>): React.JSX.Element {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger
}
