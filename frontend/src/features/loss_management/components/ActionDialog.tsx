import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ActionDialogProps {
  title: ReactNode
  description: ReactNode
  onClose: () => void
  children: ReactNode
}

/**
 * Moldura comum dos diálogos de ação sobre UCs e ordens: janela aberta, título, descrição e conteúdo.
 *
 * @param props - Título, descrição, callback de fechamento e corpo do diálogo (campos e rodapé).
 * @returns Diálogo aberto que fecha ao clicar fora ou pressionar Esc.
 */
export function ActionDialog({ title, description, onClose, children }: ActionDialogProps) {
  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
