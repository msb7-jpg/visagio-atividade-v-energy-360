import { GroupHeading } from '@/features/executive_dashboard/components/GroupHeading'
import { IndicatorTile } from '@/features/executive_dashboard/components/IndicatorTile'
import type { IndicatorGroup } from '@/features/executive_dashboard/types/executiveDashboardTypes'
import { cn } from '@/lib/utils'

const GROUP_SPAN = ['xl:col-span-1', 'xl:col-span-1', 'xl:col-span-2', 'xl:col-span-3', 'xl:col-span-4']
const GROUP_COLUMNS = ['xl:grid-cols-1', 'xl:grid-cols-1', 'xl:grid-cols-2', 'xl:grid-cols-3', 'xl:grid-cols-4']

const spanOf = (count: number) => Math.min(Math.max(count, 1), 4)

/**
 * Indicadores do Painel numa grade de 4 colunas: cada área ocupa tantas colunas quantos indicadores tem, com o
 * nome da área acima dos blocos. Todos os blocos têm a mesma largura e a mesma estrutura (`IndicatorTile`), e a
 * área "Perdas" segue o mesmo padrão logo abaixo.
 *
 * @param props - Grupos de indicadores devolvidos pela API.
 * @returns Grade com um bloco por indicador, agrupado por área.
 */
export function IndicatorGroups({ groups }: { groups: IndicatorGroup[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-3 gap-y-6 xl:grid-cols-4">
      {groups.map((group) => {
        const span = spanOf(group.indicadores.length)
        return (
          <section key={group.id} aria-labelledby={`grupo-${group.id}`} className={cn('flex min-w-0 flex-col gap-2', GROUP_SPAN[span])}>
            <GroupHeading id={group.id} title={group.titulo} />
            <div className={cn('grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2', GROUP_COLUMNS[span])}>
              {group.indicadores.map((indicator) => <IndicatorTile key={indicator.id} indicator={indicator} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}
