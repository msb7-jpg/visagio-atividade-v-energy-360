import { useCallback, useEffect, useState } from 'react'
import type { CustomerSummary } from '@/features/customer360/types/customer360Types'

const STORAGE_KEY = 'customer360:recentes'
const MAX_RECENT = 5

export interface RecentCustomer {
  id_uc: string
  bairro: string | null
}

function readRecent(): RecentCustomer[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? (parsed as RecentCustomer[]).slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function writeRecent(recentCustomers: RecentCustomer[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentCustomers))
  } catch {
    return
  }
}

function addToFront(currentList: RecentCustomer[], summary: CustomerSummary): RecentCustomer[] {
  if (currentList[0]?.id_uc === summary.id_uc) {
    return currentList
  }
  const withoutRepeated = currentList.filter((recent) => recent.id_uc !== summary.id_uc)
  return [{ id_uc: summary.id_uc, bairro: summary.bairro }, ...withoutRepeated].slice(0, MAX_RECENT)
}

/**
 * Últimas UCs consultadas pelo atendente, guardadas só no navegador dele.
 *
 * @returns Lista das UCs recentes, função para registrar uma consulta e função para limpar a lista.
 */
export function useRecentCustomers() {
  const [recentCustomers, setRecentCustomers] = useState<RecentCustomer[]>(readRecent)

  useEffect(() => {
    writeRecent(recentCustomers)
  }, [recentCustomers])

  const rememberCustomer = useCallback((summary: CustomerSummary) => {
    setRecentCustomers((currentList) => addToFront(currentList, summary))
  }, [])

  const clearRecent = useCallback(() => setRecentCustomers([]), [])

  return { recentCustomers, rememberCustomer, clearRecent }
}
