import { useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { InspectionOrder, InspectionOrderUpdate } from '@/features/loss_management/types/lossTypes'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'
import {
  EMPTY_RESULT_FORM,
  parseKwh,
  validateResultForm,
  type FieldResultErrors,
  type FieldResultForm
} from '@/features/loss_management/utils/resultFormValidation'

/**
 * Converte o formulário de campo no payload de conclusão, omitindo campos vazios.
 *
 * @param form - Valores digitados pelo gerente.
 * @param inspector - Inspetor que fez a vistoria (pode ser vazio).
 * @returns Payload de conclusão da ordem.
 */
function buildResultPayload(form: FieldResultForm, inspector: string): InspectionOrderUpdate {
  const isIrregular = form.irregularidade === 'sim'
  const toiText = form.toi.trim()
  const inspectorName = inspector.trim()
  return {
    status: 'concluida',
    irregularidade_constatada: isIrregular,
    ...(inspectorName ? { fiscal_responsavel: inspectorName } : {}),
    ...(isIrregular ? { tipo_irregularidade: form.tipo, kwh_recuperado: parseKwh(form.kwh) } : {}),
    ...(isIrregular && toiText ? { numero_toi: toiText } : {})
  }
}

/**
 * Controlador headless do formulário de resultado de campo: estado, validação e envio.
 *
 * @param order - Ordem em campo que será concluída.
 * @param onClose - Chamado depois que a API confirma o resultado.
 * @returns Valores e erros do formulário, handlers de edição e confirmação e o estado do envio.
 */
export function useResultFormController(order: InspectionOrder, onClose: () => void) {
  const updateMutation = useUpdateInspectionMutation()
  const [form, setForm] = useState<FieldResultForm>(EMPTY_RESULT_FORM)
  const [inspector, setInspector] = useState(order.fiscal_responsavel ?? '')
  const [errors, setErrors] = useState<FieldResultErrors>({})

  const updateField = (field: keyof FieldResultForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((currentForm) => ({ ...currentForm, [field]: event.target.value }))
  }

  const confirm = () => {
    const formErrors = validateResultForm(form)
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) {
      return
    }
    updateMutation.mutate({ idInspecao: order.id_inspecao, payload: buildResultPayload(form, inspector) }, {
      onSuccess: () => {
        toast.success(`Resultado de ${formatOrderCode(order)} registrado.`)
        onClose()
      }
    })
  }

  return {
    form,
    inspector,
    setInspector,
    errors,
    updateField,
    confirm,
    isPending: updateMutation.isPending,
    errorMessage: updateMutation.isError ? getApiErrorMessage(updateMutation.error) : null
  }
}
