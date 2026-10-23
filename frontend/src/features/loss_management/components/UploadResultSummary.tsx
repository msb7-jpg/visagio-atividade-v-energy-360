import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { RejectedRow, UploadResult } from '@/features/loss_management/types/lossTypes'
import { formatKwh } from '@/features/loss_management/utils/lossFormatters'

interface UploadResultSummaryProps {
  result: UploadResult
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

function describeRejection(row: RejectedRow): string {
  const location = row.aba ? `Linha ${row.linha} (${row.aba})` : `Linha ${row.linha}`
  return `${location}: ${row.motivo}`
}

/**
 * Resumo da conciliação da planilha de campo: ordens concluídas, linhas sem resultado e recusas com motivo.
 *
 * @param props - Resultado devolvido pelo upload.
 * @returns Alertas de sucesso e, se houver, a lista de linhas rejeitadas.
 */
export function UploadResultSummary({ result }: UploadResultSummaryProps) {
  const { conciliadas, ignoradas, rejeitadas, kwh_recuperado_total: kwhTotal } = result
  const ignoredText = pluralize(ignoradas, 'linha sem resultado preenchido ignorada', 'linhas sem resultado preenchido ignoradas')

  return (
    <div className="flex flex-col gap-3">
      <Alert>
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div>
          <AlertTitle>{pluralize(conciliadas, 'ordem conciliada', 'ordens conciliadas')} com sucesso</AlertTitle>
          <AlertDescription>
            Energia recuperada registrada: {formatKwh(kwhTotal)}.
            {ignoradas > 0 ? ` ${ignoredText}.` : null}
          </AlertDescription>
        </div>
      </Alert>
      {rejeitadas.length > 0 ? (
        <Alert variant="warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <div>
            <AlertTitle>{pluralize(rejeitadas.length, 'linha rejeitada', 'linhas rejeitadas')}</AlertTitle>
            <ul className="mt-1 max-h-40 list-disc overflow-y-auto pl-4">
              {rejeitadas.map((row) => (
                <li key={`${row.aba ?? ''}-${row.linha}`}>{describeRejection(row)}</li>
              ))}
            </ul>
          </div>
        </Alert>
      ) : null}
    </div>
  )
}
