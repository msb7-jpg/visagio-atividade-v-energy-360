import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { UploadDropZone } from '@/features/loss_management/components/UploadDropZone'
import { UploadResultSummary } from '@/features/loss_management/components/UploadResultSummary'
import { useUploadFieldResultsMutation } from '@/features/loss_management/hooks/useLossMutations'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'

const ACCEPTED_FILE_PATTERN = /\.(csv|xlsx)$/i
const UNSUPPORTED_FILE_MESSAGE = 'Formato não suportado: envie um arquivo .csv ou .xlsx.'

interface InspectionUploadModalProps {
  onClose: () => void
}

/**
 * Upload da planilha preenchida pela equipe de campo, com resumo da conciliação por ordem.
 *
 * @param props - Callback de fechamento do diálogo.
 * @returns Diálogo com área de arrastar e soltar e, após o envio, o resumo do lote.
 */
export function InspectionUploadModal({ onClose }: InspectionUploadModalProps) {
  const uploadMutation = useUploadFieldResultsMutation()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const apiError = uploadMutation.isError ? getApiErrorMessage(uploadMutation.error) : null

  const handleSelect = (candidate: File | undefined) => {
    uploadMutation.reset()
    if (!candidate) {
      return
    }
    const isSupported = ACCEPTED_FILE_PATTERN.test(candidate.name)
    setFile(isSupported ? candidate : null)
    setFileError(isSupported ? null : UNSUPPORTED_FILE_MESSAGE)
  }

  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir planilha de retorno de campo</DialogTitle>
          <DialogDescription>
            Os resultados são conciliados pelo id_inspecao da planilha exportada; linhas inválidas são recusadas com
            motivo sem barrar as demais.
          </DialogDescription>
        </DialogHeader>
        {uploadMutation.data ? (
          <>
            <UploadResultSummary result={uploadMutation.data} />
            <DialogFooter>
              <Button type="button" onClick={onClose}>Fechar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <UploadDropZone file={file} disabled={uploadMutation.isPending} onSelect={handleSelect} />
            <ActionDialogFooter
              confirmLabel="Enviar planilha"
              isPending={uploadMutation.isPending}
              isConfirmDisabled={!file}
              errorMessage={fileError ?? apiError}
              onCancel={onClose}
              onConfirm={() => (file ? uploadMutation.mutate(file) : undefined)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
