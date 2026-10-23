import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { lossKeys } from '@/features/loss_management/queries/lossQueries'
import type { InspectionOrderCreate, InspectionOrderUpdate } from '@/features/loss_management/types/lossTypes'
import { saveBlobAsFile } from '@/features/loss_management/utils/downloadFile'

const EXPORT_FILENAME = 'ordens_inspecao_campo.csv'

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
 * Baixa o CSV das ordens ativas para a equipe de campo.
 *
 * @returns Mutação de exportação (não altera dados, então não invalida as listas).
 */
export function useExportInspectionsMutation() {
  return useMutation({
    mutationFn: async () => {
      const csvBlob = await lossApi.exportInspections()
      saveBlobAsFile(csvBlob, EXPORT_FILENAME)
    }
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

/**
 * Envia a planilha preenchida em campo e conclui as ordens conciliadas.
 *
 * @returns Mutação de upload (invalida fila e ordens, pois ordens concluídas mudam as duas listas).
 */
export function useUploadFieldResultsMutation() {
  const invalidateLosses = useInvalidateLosses()
  return useMutation({
    mutationFn: (file: File) => lossApi.uploadFieldResults(file),
    onSuccess: invalidateLosses
  })
}
