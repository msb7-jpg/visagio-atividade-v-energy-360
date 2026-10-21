import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { lossKeys } from '@/features/loss_management/queries/lossQueries'
import type { InspectionOrderCreate, InspectionOrderUpdate } from '@/features/loss_management/types/lossTypes'

interface UpdateInspectionVariables {
  idInspecao: number
  payload: InspectionOrderUpdate
}

/**
 * Invalida fila e ordens: gerar, concluir ou cancelar uma ordem muda ambas as listas.
 *
 * @returns Callback de invalidação do domínio de perdas.
 */
function useInvalidateLosses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: lossKeys.all })
}

/**
 * Gera uma ordem de inspeção a partir da fila.
 *
 * @returns Mutação de criação de ordem.
 */
export function useCreateInspectionMutation() {
  const invalidateLosses = useInvalidateLosses()
  return useMutation({
    mutationFn: (payload: InspectionOrderCreate) => lossApi.createInspection(payload),
    onSuccess: invalidateLosses
  })
}

/**
 * Avança status, registra resultado de campo ou cancela uma ordem.
 *
 * @returns Mutação de atualização de ordem.
 */
export function useUpdateInspectionMutation() {
  const invalidateLosses = useInvalidateLosses()
  return useMutation({
    mutationFn: ({ idInspecao, payload }: UpdateInspectionVariables) => lossApi.updateInspection(idInspecao, payload),
    onSuccess: invalidateLosses
  })
}
