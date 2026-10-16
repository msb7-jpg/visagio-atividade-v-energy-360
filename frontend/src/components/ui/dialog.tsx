import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import * as React from 'react'

/** Componente raiz de gerenciamento de estado para diálogos modais. */
function Dialog({ ...props }: DialogPrimitive.Root.Props): React.JSX.Element {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

/** Gatilho de abertura do diálogo modal. */
function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props): React.JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

/** Portal para renderização do modal no final do body. */
function DialogPortal({ ...props }: DialogPrimitive.Portal.Props): React.JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

/** Elemento interativo para fechar o diálogo modal. */
function DialogClose({ ...props }: DialogPrimitive.Close.Props): React.JSX.Element {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

/** Pano de fundo com desfoque e transparência semântica (design.md). */
function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-background/80 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

/** Painel de conteúdo centralizado com cantos arredondados de 12px (design.md). */
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }): React.JSX.Element {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 text-foreground shadow-2xl duration-200 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            }
          />
        ) : null}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

/** Cabeçalho do diálogo para abrigar o título e a descrição. */
function DialogHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  )
}

/** Rodapé do diálogo para abrigar botões de ação e cancelamento. */
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2', className)}
      {...props}
    />
  )
}

/** Título semântico com tipografia destacada do design system. */
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-base font-bold text-foreground tracking-tight', className)}
      {...props}
    />
  )
}

/** Descrição textual de contexto e instruções do diálogo. */
function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
}
