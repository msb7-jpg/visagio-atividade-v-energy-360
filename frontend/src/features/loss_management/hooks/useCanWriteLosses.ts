import { useAuth } from '@/features/auth/hooks/useAuth'

/** Único papel que escreve na Fila de Inspeção; espelha `PERDAS_WRITE` em `backend/app/shared/role_groups.py`. */
const WRITE_ROLE = 'gerente_perdas'

/**
 * Diz se o usuário logado pode gerar, atualizar, cancelar ou importar ordens. O diretor só consulta.
 *
 * @returns True apenas para o gerente de perdas.
 */
export function useCanWriteLosses(): boolean {
  const { user } = useAuth()
  return user?.role === WRITE_ROLE
}
