import { useState } from 'react'
import { isNotFoundError } from '@/features/customer360/queries/customer360Queries'
import { useCustomerSummaryQuery } from '@/features/customer360/hooks/useCustomer360Queries'

/**
 * Padroniza o número digitado pelo atendente para o formato do cadastro (ex: ` uc100000 ` → `UC100000`).
 *
 * @param typedId - Texto digitado no campo de busca.
 * @returns Número sem espaços e em caixa alta.
 */
function normalizeIdUc(typedId: string): string {
  return typedId.trim().toUpperCase()
}

/**
 * Controller headless da Visão 360: guarda a UC digitada, dispara a busca e expõe o estado do cadastro.
 *
 * @returns Texto digitado, UC buscada, ações de busca e estados do cadastro.
 */
export function useCustomer360Controller() {
  const [typedId, setTypedId] = useState('')
  const [searchedId, setSearchedId] = useState('')
  const summaryQuery = useCustomerSummaryQuery(searchedId)

  const submitSearch = () => {
    const normalizedId = normalizeIdUc(typedId)
    if (normalizedId.length > 0) {
      setSearchedId(normalizedId)
    }
  }

  return {
    typedId,
    setTypedId,
    searchedId,
    submitSearch,
    summary: summaryQuery.data,
    isSearching: summaryQuery.isFetching,
    isNotFound: isNotFoundError(summaryQuery.error),
    isError: summaryQuery.isError && !isNotFoundError(summaryQuery.error)
  }
}
