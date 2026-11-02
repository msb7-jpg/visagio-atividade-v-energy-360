import { CloudOff, SearchX, UserSearch } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Customer360Details } from '@/features/customer360/components/Customer360Details'
import { CustomerSearchBar } from '@/features/customer360/components/CustomerSearchBar'
import { RecentCustomers } from '@/features/customer360/components/RecentCustomers'
import { useCustomer360Controller } from '@/features/customer360/hooks/useCustomer360Controller'

type CustomerResultProps = Pick<ReturnType<typeof useCustomer360Controller>, 'searchedId' | 'summary' | 'isNotFound' | 'isError'>

function CustomerResult({ searchedId, summary, isNotFound, isError }: CustomerResultProps) {
  if (searchedId.length === 0) {
    return (
      <EmptyState
        title="Busque uma unidade consumidora"
        description="Digite o número da UC que está na conta do cliente, o número do medidor ou o nome do titular para ver cadastro, consumo, faturas, interrupções, chamados e inspeções."
        icon={<UserSearch className="size-10" />}
      />
    )
  }
  if (isNotFound) {
    return (
      <EmptyState
        title="Unidade Consumidora não encontrada"
        description={`Nenhuma unidade com o número ${searchedId}. Verifique o número informado na conta.`}
        icon={<SearchX className="size-10" />}
      />
    )
  }
  if (isError) {
    return (
      <EmptyState
        title="Não foi possível buscar a unidade"
        description="Verifique a conexão com a API e tente novamente."
        icon={<CloudOff className="size-10" />}
      />
    )
  }
  if (!summary) {
    return <LoadingSkeleton count={3} className="h-24" />
  }
  return <Customer360Details summary={summary} />
}

/**
 * Página da Visão 360 da UC: o atendente digita o número da conta e vê o cliente numa tela só.
 *
 * @returns Página com busca e a ficha da UC em blocos, com o que precisa de atenção no topo.
 */
export function Customer360Page() {
  const { submitSearch, isSearching, recentCustomers, clearRecent, ...result } = useCustomer360Controller()

  return (
    <div className="bg-background min-h-dvh">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground text-xl font-bold tracking-tight">Visão 360 da Unidade Consumidora</h1>
            <p className="text-muted-foreground text-sm">
              Cadastro, consumo comparado ao ano anterior, faturas, interrupções, chamados e inspeções numa tela só.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <CustomerSearchBar key={result.searchedId} initialText={result.searchedId} onSubmit={submitSearch} isSearching={isSearching} />
          <RecentCustomers recentCustomers={recentCustomers} onSelect={submitSearch} onClear={clearRecent} />
        </div>
        <CustomerResult {...result} />
      </main>
    </div>
  )
}
