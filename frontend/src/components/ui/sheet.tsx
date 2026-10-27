import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import * as React from 'react'

/** Componente raiz da gaveta lateral (Sheet). */
function Sheet({ ...props }: DialogPrimitive.Root.Props): React.JSX.Element {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

/** Gatilho para abertura da gaveta lateral. */
function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props): React.JSX.Element {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

/** Elemento de fechamento da gaveta lateral. */
function SheetClose({ ...props }: DialogPrimitive.Close.Props): React.JSX.Element {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

/** Portal de renderização da gaveta lateral no final do body. */
function SheetPortal({ ...props }: DialogPrimitive.Portal.Props): React.JSX.Element {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/** Camada de sobreposição escurecida com desfoque de fundo. */
function SheetOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-background/80 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className
      )}
      {...props}
    />
  )
}

const sheetVariants = cva(
  'fixed z-50 gap-4 border-border bg-card p-6 text-foreground shadow-2xl duration-200 outline-none data-open:animate-in data-closed:animate-out',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-open:slide-in-from-top data-closed:slide-out-to-top',
        bottom: 'inset-x-0 bottom-0 border-t data-open:slide-in-from-bottom data-closed:slide-out-to-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-md data-open:slide-in-from-left data-closed:slide-out-to-left',
        right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-md data-open:slide-in-from-right data-closed:slide-out-to-right'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  }
)

/** Propriedades do painel de conteúdo da gaveta lateral. */
export interface SheetContentProps
  extends DialogPrimitive.Popup.Props,
  VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean
}

/** Painel de conteúdo deslizante da gaveta lateral. */
function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: SheetContentProps): React.JSX.Element {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="sheet-close"
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
    </SheetPortal>
  )
}

/** Cabeçalho da gaveta lateral para título e descrição. */
function SheetHeader({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  )
}

/** Rodapé da gaveta lateral para botões de ação e fechamento. */
function SheetFooter({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4', className)}
      {...props}
    />
  )
}

/** Título da gaveta lateral com tipografia destacada. */
function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-lg font-bold text-foreground tracking-tight', className)}
      {...props}
    />
  )
}

/** Descrição contextual da gaveta lateral. */
function SheetDescription({ className, ...props }: DialogPrimitive.Description.Props): React.JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground leading-relaxed', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger
}
