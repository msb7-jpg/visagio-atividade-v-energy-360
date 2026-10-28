import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { useResultFormController } from '@/features/loss_management/hooks/useResultFormController'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { IRREGULARITY_TYPES } from '@/features/loss_management/utils/lossFormatters'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'

interface FieldErrorProps {
  id: string
  message: string | undefined
}

/**
 * Mensagem de erro de um campo, ligada a ele por `aria-describedby`.
 *
 * @param props - Id do elemento de erro e a mensagem (nada é exibido sem mensagem).
 * @returns Texto de erro em destructive, ou nada.
 */
function FieldError({ id, message }: FieldErrorProps) {
  return message ? <p id={id} className="text-destructive text-xs" role="alert">{message}</p> : null
}

interface RegisterResultDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Registra o resultado encontrado em campo e conclui a ordem.
 *
 * @param props - Ordem em campo e callback de fechamento.
 * @returns Diálogo de registro de resultado com validação por campo.
 */
export function RegisterResultDialog({ order, onClose }: RegisterResultDialogProps) {
  const { form, inspector, setInspector, errors, updateField, confirm, isPending, errorMessage } =
    useResultFormController(order, onClose)
  const isIrregular = form.irregularidade === 'sim'

  return (
    <ActionDialog title={`Registrar resultado da ordem ${formatOrderCode(order)}`} description={`UC ${order.id_uc} · a ordem será concluída.`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="irregularidade" required>Irregularidade constatada?</Label>
          <Select id="irregularidade" value={form.irregularidade} onChange={updateField('irregularidade')} error={Boolean(errors.irregularidade)} aria-invalid={Boolean(errors.irregularidade)} aria-describedby="irregularidade-erro">
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </Select>
          <FieldError id="irregularidade-erro" message={errors.irregularidade} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo-irregularidade" required={isIrregular}>Tipo de irregularidade</Label>
          <Select id="tipo-irregularidade" value={form.tipo} onChange={updateField('tipo')} disabled={!isIrregular} error={Boolean(errors.tipo)} aria-invalid={Boolean(errors.tipo)} aria-describedby="tipo-erro">
            <option value="">Selecione</option>
            {IRREGULARITY_TYPES.map((irregularityType) => (
              <option key={irregularityType} value={irregularityType}>{irregularityType}</option>
            ))}
          </Select>
          <FieldError id="tipo-erro" message={errors.tipo} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kwh-recuperado" required={isIrregular}>kWh recuperado</Label>
          <Input id="kwh-recuperado" type="number" min={0} step="0.1" value={form.kwh} onChange={updateField('kwh')} disabled={!isIrregular} error={Boolean(errors.kwh)} aria-invalid={Boolean(errors.kwh)} aria-describedby="kwh-erro" />
          <FieldError id="kwh-erro" message={errors.kwh} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inspetor-resultado">Inspetor</Label>
          <Input id="inspetor-resultado" value={inspector} onChange={(event) => setInspector(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="numero-toi">Número do TOI</Label>
          <Input id="numero-toi" value={form.toi} onChange={updateField('toi')} disabled={!isIrregular} />
        </div>
      </div>
      <ActionDialogFooter
        confirmLabel="Salvar resultado"
        isPending={isPending}
        errorMessage={errorMessage}
        onCancel={onClose}
        onConfirm={confirm}
      />
    </ActionDialog>
  )
}
