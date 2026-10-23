import { useState, type DragEvent } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface UploadDropZoneProps {
  file: File | null
  disabled: boolean
  onSelect: (file: File | undefined) => void
}

/**
 * Área de arrastar e soltar da planilha de campo, com seleção por arquivo como alternativa acessível.
 *
 * @param props - Arquivo escolhido, estado de bloqueio e callback de seleção.
 * @returns Zona de soltar arquivo com o campo de arquivo e o nome do arquivo escolhido.
 */
export function UploadDropZone({ file, disabled, onSelect }: UploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      onSelect(event.dataTransfer.files[0])
    }
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  return (
    <div
      data-testid="upload-drop-zone"
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center',
        isDragging ? 'border-primary bg-accent' : 'border-border'
      )}
    >
      <Upload className="text-muted-foreground size-6" aria-hidden="true" />
      <p className="text-muted-foreground text-sm">Arraste a planilha preenchida aqui ou escolha o arquivo (.csv ou .xlsx).</p>
      <div className="flex w-full flex-col gap-1.5 text-left">
        <Label htmlFor="planilha-campo">Planilha de campo</Label>
        <Input
          id="planilha-campo"
          type="file"
          accept=".csv,.xlsx"
          disabled={disabled}
          onChange={(event) => onSelect(event.target.files?.[0])}
        />
      </div>
      {file ? (
        <p className="flex items-center gap-2 text-sm font-medium">
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          <span>{file.name}</span>
        </p>
      ) : null}
    </div>
  )
}
