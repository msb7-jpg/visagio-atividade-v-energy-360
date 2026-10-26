import { useState, type ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ActionDialog } from '@/features/loss_management/components/ActionDialog'
import { ActionDialogFooter } from '@/features/loss_management/components/ActionDialogFooter'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { InspectionOrder, InspectionOrderUpdate } from '@/features/loss_management/types/lossTypes'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'
import { IRREGULARITY_TYPES } from '@/features/loss_management/utils/lossFormatters'

interface FieldResultForm {
  irregularidade: '' | 'sim' | 'nao'
  tipo: string
  kwh: string
  toi: string
}

const EMPTY_FORM: FieldResultForm = { irregularidade: '', tipo: '', kwh: '', toi: '' }

/**
 * Converte o formulário de campo no payload de conclusão, omitindo campos vazios.
 *
 * @param form - Valores digitados pelo gerente.
 * @returns Payload de conclusão da ordem.
 */
function buildResultPayload(form: FieldResultForm): InspectionOrderUpdate {
  const isIrregular = form.irregularidade === 'sim'
  const kwhText = form.kwh.trim().replace(',', '.')
  const toiText = form.toi.trim()
  return {
    status: 'concluida',
    irregularidade_constatada: isIrregular,
    ...(isIrregular && form.tipo ? { tipo_irregularidade: form.tipo } : {}),
    ...(isIrregular && kwhText ? { kwh_recuperado: Number(kwhText) } : {}),
    ...(isIrregular && toiText ? { numero_toi: toiText } : {})
  }
}

interface RegisterResultDialogProps {
  order: InspectionOrder
  onClose: () => void
}

/**
 * Registra o resultado encontrado em campo e conclui a ordem.
 *
 * @param props - Ordem pendente e callback de fechamento.
 * @returns Diálogo de registro de resultado.
 */
export function RegisterResultDialog({ order, onClose }: RegisterResultDialogProps) {
  const updateMutation = useUpdateInspectionMutation()
  const [form, setForm] = useState<FieldResultForm>(EMPTY_FORM)
  const updateField = (field: keyof FieldResultForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((currentForm) => ({ ...currentForm, [field]: event.target.value }))
  }

  const handleConfirm = () => {
    updateMutation.mutate({ idInspecao: order.id_inspecao, payload: buildResultPayload(form) }, { onSuccess: onClose })
  }

  return (
    <ActionDialog title={`Registrar resultado da ordem #${order.id_inspecao}`} description={`UC ${order.id_uc} · a ordem será concluída.`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="irregularidade" required>Irregularidade constatada?</Label>
          <Select id="irregularidade" value={form.irregularidade} onChange={updateField('irregularidade')}>
            <option value="">Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tipo-irregularidade">Tipo de irregularidade</Label>
          <Select
            id="tipo-irregularidade"
            value={form.tipo}
            onChange={updateField('tipo')}
            disabled={form.irregularidade !== 'sim'}
          >
            <option value="">Não informado</option>
            {IRREGULARITY_TYPES.map((irregularityType) => (
              <option key={irregularityType} value={irregularityType}>{irregularityType}</option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kwh-recuperado">kWh recuperado</Label>
          <Input
            id="kwh-recuperado"
            type="number"
            min={0}
            step="0.1"
            value={form.kwh}
            onChange={updateField('kwh')}
            disabled={form.irregularidade !== 'sim'}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="numero-toi">Número do TOI</Label>
          <Input id="numero-toi" value={form.toi} onChange={updateField('toi')} disabled={form.irregularidade !== 'sim'} />
        </div>
      </div>
      <ActionDialogFooter
        confirmLabel="Salvar resultado"
        isPending={updateMutation.isPending}
        isConfirmDisabled={form.irregularidade === ''}
        errorMessage={updateMutation.isError ? getApiErrorMessage(updateMutation.error) : null}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
    </ActionDialog>
  )
}
