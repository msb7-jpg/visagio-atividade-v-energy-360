import { ArrowLeft, CloudOff, SearchX, UserSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Customer360Details } from '@/features/customer360/components/Customer360Details'
import { CustomerOverviewCard } from '@/features/customer360/components/CustomerOverviewCard'
import { CustomerSearchBar } from '@/features/customer360/components/CustomerSearchBar'
import { useCustomer360Controller } from '@/features/customer360/hooks/useCustomer360Controller'

type CustomerResultProps = Omit<ReturnType<typeof useCustomer360Controller>, 'typedId' | 'setTypedId' | 'submitSearch'>

function CustomerResult({ searchedId, summary, isNotFound, isError }: CustomerResultProps) {
  if (searchedId.length === 0) {
    return (
      <EmptyState
        title="Busque uma unidade consumidora"
        description="Digite o número da UC que está na conta do cliente para ver cadastro, consumo, faturas, interrupções e chamados."
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
  return (
    <div className="flex flex-col gap-4">
      <CustomerOverviewCard summary={summary} />
      <Customer360Details idUc={summary.id_uc} hasSolar={summary.possui_gd} />
    </div>
  )
}

/**
 * Página da Visão 360 da UC: o atendente digita o número da conta e vê o cliente numa tela só.
 *
 * @returns Página com busca, resumo do cliente, diagnóstico de conta alta e abas de detalhe.
 */
export function Customer360Page() {
  const { typedId, setTypedId, submitSearch, ...result } = useCustomer360Controller()

  return (
    <div className="bg-background min-h-dvh">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground text-xl font-bold tracking-tight">Visão 360 da Unidade Consumidora</h1>
            <p className="text-muted-foreground text-sm">
              Cadastro, consumo comparado ao ano anterior, faturas, interrupções e chamados numa tela só.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <span className="flex items-center gap-1.5">
                <ArrowLeft className="size-3.5" /> Voltar ao painel
              </span>
            </Link>
          </Button>
        </div>
        <CustomerSearchBar value={typedId} onChange={setTypedId} onSubmit={submitSearch} isSearching={result.isSearching} />
        <CustomerResult {...result} />
      </main>
    </div>
  )
}
