/** Domínio dos e-mails corporativos aceitos pelo backend (`default_users` em `backend/app/core/config.py`). */
export const ALLOWED_EMAIL_DOMAIN = 'venergy.com'

/** Tempo mínimo de cada passo na tela de espera, para a animação não piscar quando a API responde rápido. */
export const MIN_STEP_MS = 400

/** Senha pública das contas de exemplo (`default_users` do backend), usada só no bloco de demonstração. */
export const DEMO_SENHA = 'venergy123'

export interface DemoAccount {
  email: string
  nome: string
  role: string
}

/** Contas de exemplo, espelhando `default_users` do backend (nome sem o cargo entre parênteses). */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'diretor@venergy.com', nome: 'Henrique Duarte', role: 'diretor' },
  { email: 'operacao@venergy.com', nome: 'Beatriz Farias', role: 'gerente_operacao' },
  { email: 'atendimento@venergy.com', nome: 'Camila Barreto', role: 'atendente' },
  { email: 'gerente.atendimento@venergy.com', nome: 'Camila Barreto', role: 'gerente_atendimento' },
  { email: 'perdas@venergy.com', nome: 'Rafael Coutinho', role: 'gerente_perdas' }
]

/** Conta usada pelo botão "Entrar com SSO corporativo" (dados de exemplo: o SSO entra como diretor comercial). */
export const SSO_ACCOUNT: DemoAccount = DEMO_ACCOUNTS[0]

/**
 * Indica se o bloco "Acesso de demonstração" deve aparecer (variável de ambiente `VITE_DEMO_LOGIN`).
 *
 * @returns `true` só quando `VITE_DEMO_LOGIN` vale `'true'`.
 */
export function isDemoLoginEnabled(): boolean {
  return import.meta.env.VITE_DEMO_LOGIN === 'true'
}
