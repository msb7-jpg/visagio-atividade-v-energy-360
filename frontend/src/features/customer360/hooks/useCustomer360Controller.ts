import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCustomerSummaryQuery } from '@/features/customer360/hooks/useCustomer360Queries'
import { useRecentCustomers } from '@/features/customer360/hooks/useRecentCustomers'
import { isNotFoundError } from '@/features/customer360/queries/customer360Queries'
import { normalizeIdUc } from '@/features/customer360/utils/searchTerms'

const UC_PARAM = 'uc'

/**
 * Controller headless da Visão 360: a UC buscada vive no endereço da página (`?uc=UC100004`),
 * o que permite atualizar, voltar e compartilhar o link sem perder o cliente.
 *
 * @returns UC buscada, ação de busca, estados do cadastro e buscas recentes.
 */
export function useCustomer360Controller() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchedId = normalizeIdUc(searchParams.get(UC_PARAM) ?? '')
  const summaryQuery = useCustomerSummaryQuery(searchedId)
  const { recentCustomers, rememberCustomer, clearRecent } = useRecentCustomers()
  const summary = summaryQuery.data

  useEffect(() => {
    if (summary) {
      rememberCustomer(summary)
    }
  }, [summary, rememberCustomer])

  const submitSearch = (typedText: string) => {
    const normalizedId = normalizeIdUc(typedText)
    if (normalizedId.length > 0) {
      setSearchParams({ [UC_PARAM]: normalizedId })
    }
  }

  return {
    searchedId,
    submitSearch,
    summary,
    isSearching: summaryQuery.isFetching,
    isNotFound: isNotFoundError(summaryQuery.error),
    isError: summaryQuery.isError && !isNotFoundError(summaryQuery.error),
    recentCustomers,
    clearRecent
  }
}
