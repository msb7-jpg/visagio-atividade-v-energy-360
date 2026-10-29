import { useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { useUpdateInspectionMutation } from '@/features/loss_management/hooks/useLossMutations'
import type { InspectionOrder, InspectionOrderUpdate } from '@/features/loss_management/types/lossTypes'
import { describeSubmitError } from '@/features/loss_management/utils/apiFieldErrors'
import { formatOrderCode } from '@/features/loss_management/utils/orderBoard'
import {
  EMPTY_RESULT_FORM,
  parseKwh,
  validateResultForm,
  type FieldResultErrors,
  type FieldResultForm
} from '@/features/loss_management/utils/resultFormValidation'

/** Campo do corpo da API → campo do formulário, para mostrar o 422 ao lado do campo certo. */
const FORM_FIELD_BY_API_FIELD: Record<string, keyof FieldResultErrors> = {
  inspetor: 'inspetor',
  data_inspecao: 'data',
  irregularidade_constatada: 'irregularidade',
  tipo_irregularidade: 'tipo',
  kwh_recuperado: 'kwh'
}

/**
 * Converte o formulário de campo no payload de conclusão, omitindo campos vazios.
 *
 * @param form - Valores digitados pelo gerente.
 * @returns Payload de conclusão da ordem.
 */
function buildResultPayload(form: FieldResultForm): InspectionOrderUpdate {
  const isIrregular = form.irregularidade === 'sim'
  const toiText = form.toi.trim()
  return {
    status: 'concluida',
    inspetor: form.inspetor,
    data_inspecao: form.data,
    irregularidade_constatada: isIrregular,
    ...(isIrregular ? { tipo_irregularidade: form.tipo, kwh_recuperado: parseKwh(form.kwh) } : {}),
    ...(isIrregular && toiText ? { numero_toi: toiText } : {})
  }
}

function toFormErrors(apiFields: Partial<Record<string, string>>): FieldResultErrors {
  const entries = Object.entries(apiFields).flatMap(([apiField, message]) => {
    const formField = FORM_FIELD_BY_API_FIELD[apiField]
    return formField && message ? [[formField, message] as const] : []
  })
  return Object.fromEntries(entries)
}

/**
 * Controlador headless do formulário de resultado de campo: estado, validação e envio.
 *
 * @param order - Ordem em campo que será concluída.
 * @param onClose - Chamado depois que a API confirma o resultado.
 * @returns Valores e erros do formulário (do cliente e do servidor), handlers de edição e confirmação e o estado do envio.
 */
export function useResultFormController(order: InspectionOrder, onClose: () => void) {
  const updateMutation = useUpdateInspectionMutation()
  const [form, setForm] = useState<FieldResultForm>({
    ...EMPTY_RESULT_FORM,
    inspetor: order.inspetor ?? '',
    data: order.data_inspecao ?? ''
  })
  const [clientErrors, setClientErrors] = useState<FieldResultErrors>({})
  const submitError = describeSubmitError(updateMutation.error)

  const setField = (field: keyof FieldResultForm, fieldValue: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: fieldValue }))
    if (updateMutation.isError) updateMutation.reset()
  }
  const updateField = (field: keyof FieldResultForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setField(field, event.target.value)

  const confirm = () => {
    const formErrors = validateResultForm(form)
    setClientErrors(formErrors)
    if (Object.keys(formErrors).length > 0) {
      return
    }
    updateMutation.mutate({ idInspecao: order.id_inspecao, payload: buildResultPayload(form) }, {
      onSuccess: () => {
        toast.success(`Resultado de ${formatOrderCode(order)} registrado.`)
        onClose()
      }
    })
  }

  return {
    form,
    errors: { ...toFormErrors(submitError.fields), ...clientErrors },
    setField,
    updateField,
    confirm,
    isPending: updateMutation.isPending,
    errorMessage: submitError.message
  }
}
