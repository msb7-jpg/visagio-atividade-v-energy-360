import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { DEMO_SENHA, MIN_STEP_MS, SSO_ACCOUNT, type DemoAccount } from '@/features/auth/lib/loginConfig'
import { resolveProfile, type LoginProfile } from '@/features/auth/lib/loginProfile'
import { loginErrorMessage, validateLogin, type LoginFieldError } from '@/features/auth/lib/loginValidation'

type LoginStage = 'form' | 'wait' | 'ok' | 'noprofile'
type LoginMode = 'sso' | 'senha'

/** Passos da tela de espera; o ativo acompanha o estado real do login (1 = resposta da API, 2 e 3 = depois dela). */
export const LOGIN_STEP_LABELS = [
  'Verificando e-mail e senha',
  'Lendo o seu cargo na conta',
  'Preparando o seu acesso'
] as const

const LAST_STEP = LOGIN_STEP_LABELS.length

const pause = (milliseconds: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, milliseconds)
})

/**
 * Controlador (headless) da tela de login: estados, validação e ligação com a autenticação real.
 *
 * @returns Estado e ações consumidos pelos painéis da tela.
 */
export function useLoginController() {
  const { login, logout } = useAuth()
  const [stage, setStage] = useState<LoginStage>('form')
  const [mode, setMode] = useState<LoginMode>('senha')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<LoginFieldError | null>(null)
  const [errorTick, setErrorTick] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [profile, setProfile] = useState<LoginProfile | null>(null)
  const attemptRef = useRef(0)

  useEffect(() => () => {
    attemptRef.current += 1
  }, [])

  const showError = (fieldError: LoginFieldError) => {
    setError(fieldError)
    setErrorTick((tick) => tick + 1)
  }

  const authenticate = async (nextMode: LoginMode, credentials: { email: string, senha: string }) => {
    const invalid = validateLogin(credentials.email, credentials.senha)
    if (invalid) {
      showError(invalid)
      return
    }

    attemptRef.current += 1
    const attemptId = attemptRef.current
    setMode(nextMode)
    setError(null)
    setActiveStep(1)
    setStage('wait')

    const [outcome] = await Promise.allSettled([
      login({ email: credentials.email.trim().toLowerCase(), senha: credentials.senha }),
      pause(MIN_STEP_MS)
    ])

    if (attemptRef.current !== attemptId) {
      if (outcome.status === 'fulfilled') logout()
      return
    }
    if (outcome.status === 'rejected') {
      setStage('form')
      setActiveStep(0)
      showError({ field: 'senha', message: loginErrorMessage(outcome.reason) })
      return
    }

    for (let step = 2; step <= LAST_STEP; step += 1) {
      setActiveStep(step)
      await pause(MIN_STEP_MS)
      if (attemptRef.current !== attemptId) return
    }

    const resolved = resolveProfile(outcome.value.user)
    setProfile(resolved)
    setStage(resolved ? 'ok' : 'noprofile')
  }

  /** Volta ao formulário; se já havia sessão (logado ou sem perfil), encerra-a. */
  const backToForm = () => {
    const hadSession = stage === 'ok' || stage === 'noprofile'
    attemptRef.current += 1
    setStage('form')
    setActiveStep(0)
    setProfile(null)
    setSenha('')
    if (hadSession) logout()
  }

  return {
    stage,
    mode,
    email,
    senha,
    error,
    errorTick,
    activeStep,
    profile,
    setEmail: (value: string) => {
      setEmail(value)
      setError(null)
    },
    setSenha: (value: string) => {
      setSenha(value)
      setError(null)
    },
    submitPassword: () => authenticate('senha', { email, senha }),
    submitSso: () => {
      setEmail(SSO_ACCOUNT.email)
      return authenticate('sso', { email: SSO_ACCOUNT.email, senha: DEMO_SENHA })
    },
    enterAsDemo: (account: DemoAccount) => {
      setEmail(account.email)
      return authenticate('senha', { email: account.email, senha: DEMO_SENHA })
    },
    backToForm
  }
}

export type LoginController = ReturnType<typeof useLoginController>
