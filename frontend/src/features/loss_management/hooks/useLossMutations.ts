import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lossApi } from '@/features/loss_management/api/lossApi'
import { lossKeys } from '@/features/loss_management/queries/lossQueries'
import type {
  BatchResult,
  InspectionOrderCreate,
  InspectionOrderUpdate
} from '@/features/loss_management/types/lossTypes'
import { getApiErrorMessage } from '@/features/loss_management/utils/apiErrorMessage'
import { saveBlobAsFile } from '@/features/loss_management/utils/downloadFile'

const EXPORT_FILENAME = 'ordens_inspecao_campo.csv'
// Poucas requisições por vez: o banco local é SQLite e cada ordem faz checagem e escrita.
const BATCH_CONCURRENCY = 5

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

const EMPTY_BATCH: BatchResult = { created: [], failed: [] }

/**
 * Divide a lista em blocos consecutivos.
 *
 * @param items - Itens a dividir.
 * @param size - Tamanho máximo de cada bloco.
 * @returns Blocos na ordem original.
 */
function splitInChunks<Item>(items: Item[], size: number): Item[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, chunkIndex) =>
    items.slice(chunkIndex * size, (chunkIndex + 1) * size)
  )
}

/**
 * Gera as ordens de um bloco em paralelo; uma UC que falha entra em `failed`.
 *
 * @param chunkPayloads - Ordens a criar neste bloco.
 * @returns Ordens criadas e UCs que falharam neste bloco.
 */
async function createChunkOfInspections(chunkPayloads: InspectionOrderCreate[]): Promise<BatchResult> {
  const outcomes = await Promise.allSettled(chunkPayloads.map((payload) => lossApi.createInspection(payload)))
  return outcomes.reduce<BatchResult>(
    (partial, outcome, outcomeIndex) =>
      outcome.status === 'fulfilled'
        ? { ...partial, created: [...partial.created, outcome.value] }
        : {
          ...partial,
          failed: [...partial.failed, { id_uc: chunkPayloads[outcomeIndex].id_uc, message: getApiErrorMessage(outcome.reason) }]
        },
    EMPTY_BATCH
  )
}

/**
 * Gera as ordens em blocos sequenciais de poucas UCs, para não abrir dezenas de requisições de uma vez.
 *
 * @param payloads - Ordens a criar (UC e motivo), na ordem da fila.
 * @returns Ordens criadas e UCs que falharam, ambas na ordem da fila.
 */
function createInspectionsInChunks(payloads: InspectionOrderCreate[]): Promise<BatchResult> {
  return splitInChunks(payloads, BATCH_CONCURRENCY).reduce<Promise<BatchResult>>(
    async (previousChunks, chunkPayloads) => {
      const doneSoFar = await previousChunks
      const chunkResult = await createChunkOfInspections(chunkPayloads)
      return {
        created: [...doneSoFar.created, ...chunkResult.created],
        failed: [...doneSoFar.failed, ...chunkResult.failed]
      }
    },
    Promise.resolve(EMPTY_BATCH)
  )
}

/**
 * Gera uma ordem para cada UC selecionada; uma UC que falha não aborta as demais.
 *
 * @returns Mutação em lote que devolve as ordens criadas e as UCs que falharam, e invalida as listas em qualquer caso.
 */
export function useCreateInspectionsBatchMutation() {
  const invalidateLosses = useInvalidateLosses()
  return useMutation({
    mutationFn: createInspectionsInChunks,
    onSettled: invalidateLosses
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
