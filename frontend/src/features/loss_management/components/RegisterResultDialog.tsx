import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { FieldError } from '@/features/loss_management/components/FieldError'
import { InspectorField } from '@/features/loss_management/components/InspectorField'
import { useResultFormController } from '@/features/loss_management/hooks/useResultFormController'
import type { InspectionOrder } from '@/features/loss_management/types/lossTypes'
import { IRREGULARITY_TYPES } from '@/features/loss_management/utils/lossFormatters'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'
import { todayIsoDate } from '@/features/loss_management/utils/resultFormValidation'
import { formatIrregularityType } from '@/features/loss_management/utils/textFormat'

interface RegisterResultDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Registra o resultado encontrado em campo e conclui a ordem. Inspetor, data (dd/mm/aaaa, sem data futura) e
 * resultado são obrigatórios; erros do servidor aparecem ao lado do campo e o diálogo só fecha com sucesso.
 *
 * @param props - Ordem em campo e callback de fechamento.
 * @returns Diálogo de registro de resultado com validação por campo.
 */
export function RegisterResultDialog({ order, onClose }: RegisterResultDialogProps) {
  const { form, errors, setField, updateField, confirm, isPending, errorMessage } =
    useResultFormController(order, onClose)
  const isIrregular = form.irregularidade === 'sim'

  return (
    <ActionDialog title={`Registrar resultado da ordem ${formatOrderCode(order)}`} description={`UC ${order.id_uc} · a ordem será concluída. Campos com * são obrigatórios.`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InspectorField id="inspetor-resultado" value={form.inspetor} onChange={(code) => setField('inspetor', code)} required error={errors.inspetor} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="data-inspecao" required>Data da inspeção (dd/mm/aaaa)</Label>
          <Input id="data-inspecao" type="date" lang="pt-BR" max={todayIsoDate()} value={form.data} onChange={updateField('data')} error={Boolean(errors.data)} aria-invalid={Boolean(errors.data)} aria-describedby="data-erro" />
          <FieldError id="data-erro" message={errors.data} />
        </div>
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
              <option key={irregularityType} value={irregularityType}>{formatIrregularityType(irregularityType)}</option>
            ))}
          </Select>
          <FieldError id="tipo-erro" message={errors.tipo} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kwh-recuperado" required={isIrregular}>kWh recuperado</Label>
          <Input id="kwh-recuperado" type="text" inputMode="decimal" value={form.kwh} onChange={updateField('kwh')} disabled={!isIrregular} error={Boolean(errors.kwh)} aria-invalid={Boolean(errors.kwh)} aria-describedby="kwh-erro" />
          <FieldError id="kwh-erro" message={errors.kwh} />
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
