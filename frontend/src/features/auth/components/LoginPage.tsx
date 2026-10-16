import { useState, type SyntheticEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useAuth } from '@/features/auth/hooks/useAuth'

/**
 * Página de login com design corporativo SaaS Enterprise Analytics (design.md).
 * Incorpora background com degradê Dark Navy (#0F172A) e Royal Blue (#1E40AF),
 * card em glassmorphism translúcido e raio de 12px.
 *
 * @returns Elemento LoginPage renderizado.
 */
export function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('diretor@venergy.com')
  const [senha, setSenha] = useState('venergy123')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (submitEvent: SyntheticEvent) => {
    submitEvent.preventDefault()
    setErrorMsg(null)
    try {
      await login({ email, senha })
      navigate('/dashboard')
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Falha ao autenticar')
      }
    }
  }

  const handleQuickSelect = (userEmail: string) => {
    setEmail(userEmail)
    setSenha('venergy123')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 glass-gradient">
      <Card variant="glass" className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl border border-primary/20">
            <Zap className="size-6" />
          </div>
          <CardTitle>
            V-Energy Grid 360
          </CardTitle>
          <CardDescription>
            Plataforma Integrada de Operação, Faturamento e IA
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg ? (
              <div className="bg-destructive/15 text-destructive rounded-xl p-3 text-xs border border-destructive/20">
                {errorMsg}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email-input">Email Corporativo</Label>
              <Input
                id="email-input"
                type="email"
                value={email}
                onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password-input">Senha</Label>
              <Input
                id="password-input"
                type="password"
                value={senha}
                onChange={(inputEvent) => setSenha(inputEvent.target.value)}
                required
              />
            </div>

            <Button type="submit" fullWidth disabled={isLoading}>
              <span>{isLoading ? 'Entrando...' : 'Entrar no Portal'}</span>
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
            <Separator />
            <p className="text-muted-foreground text-center text-xs font-semibold">
              Acesso Rápido por Perfil (Ambiente de Testes)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('diretor@venergy.com')}
              >
                <span>Diretor Comercial</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('operacao@venergy.com')}
              >
                <span>Gerente Operação</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('atendimento@venergy.com')}
              >
                <span>Atendente 360</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect('perdas@venergy.com')}
              >
                <span>Gerente Perdas</span>
              </Button>
            </div>
            <div className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-xs">
              <ShieldCheck className="text-primary size-4" />
              <span>Autenticação JWT com Controle de Acesso por Cargo (RBAC)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
