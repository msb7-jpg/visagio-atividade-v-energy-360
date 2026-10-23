---
version: "1.0.0"
name: "SaaS Enterprise Analytics (V-Energy Grid 360)"
description: "Design System oficial do V-Energy Grid 360: plataforma de operação, medição, faturamento e inteligência artificial para concessionárias de energia. Visual corporativo, paleta Corporate Blue, glassmorphism com backdrop blur, tipografia Inter e JetBrains Mono, cantos arredondados de 12px e total conformidade com os linters da codebase."
reference: https://designmd.app/library/saas-enterprise-analytics
colors:
  primary: "#0F172A"       # Dark Navy (Superfície escura / texto principal)
  secondary: "#1E40AF"     # Royal Blue (Ação primária / destaque institucional)
  tertiary: "#3B82F6"      # Blue (Acento interativo / focus ring)
  neutral: "#60A5FA"       # Light Blue (Métricas / badges / acento suave)
  surface: "#FFFFFF"       # White (Superfície de cards e modais)
  accent: "#F8FAFC"        # Light Grey (Fundo no modo claro / texto atenuado)
  contrast: "#334155"      # Dark Grey (Bordas e superfícies de alto contraste)
typography:
  display:
    fontFamily: Inter
    fontSize: clamp(2rem, 4vw, 3rem)
    fontWeight: 700
  h1:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: 700
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    lineHeight: 1.6
    fontWeight: 400
  caption:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 500
  code:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
rounded:
  base: 12px               # --radius: 0.75rem / rounded-xl
  sm: 12px
  md: 24px
  lg: 36px
components:
  button:
    rounded: "rounded-xl (12px)"
    fontWeight: "font-semibold (600)"
    tactileEffect: "active:translate-y-px"
  card:
    rounded: "rounded-xl (12px)"
    shadow: "shadow-sm"
    variants: ["default", "glass", "interactive"]
---

# ⚡ V-Energy Grid 360 — Design System Specification (`design.md`)

Este documento é a **Fonte Única da Verdade (*Single Source of Truth - SSOT*)** para a interface do usuário do **V-Energy Grid 360**. Qualquer tela, componente ou fluxo desenvolvido no projeto deve seguir rigorosamente as regras, classes semânticas e contratos de componentes descritos aqui.

---

## 1. Visão Geral e Filosofia Visual

- **Estilo:** *Corporate Blue, Clean, Data-Driven & AI-Ready*.
- **Arquitetura de Cores:** B2B Enterprise — transmite confiança operacional, clareza métrica para lideranças e precisão para engenheiros de dados.
- **Profundidade:** Glassmorphism suave (`backdrop-filter: blur(12px)`), bordas translúcidas de 1px e elevações sutis sem glows agressivos.
- **Física de Movimento:** Curvas suaves de desaceleração (*ease-out*), durações de 200–300ms, transições táteis em botões (`active:translate-y-px`) e micro-animações via `motion/react`.
- **Suporte a Temas:** Dark Mode por padrão (`:root, .dark` com `<html class="dark">`), com suporte opcional a Light Mode via classe `.light`.

---

## 2. Mapa de Cores e Tokens Semânticos do Tailwind

> [!CAUTION]
> **Proibição de Cores Brutas e Valores Arbitrários (`@shadcn/lint`):**
> Nunca utilize cores Tailwind brutas no JSX (ex: `bg-slate-900`, `text-blue-500`, `border-gray-200`) ou valores arbitrários entre colchetes (ex: `bg-[#0F172A]`, `text-[11px]`, `min-h-[100dvh]`).
> Use sempre as **classes semânticas oficiais** listadas abaixo:

| Token Semântico do Design System | Cor Hex / OKLCH | Classe Tailwind Obrigatória | Onde Utilizar |
|---|---|---|---|
| **Fundo Primário** | `#F8FAFC` (Light) / `#0F172A` (Dark) | `bg-background` | Fundo principal da página e containers raiz |
| **Texto Primário** | `#0F172A` (Light) / `#F8FAFC` (Dark) | `text-foreground` | Títulos, valores numéricos e textos de destaque |
| **Superfície de Cards** | `#FFFFFF` (Light) / `#1E293B` (Dark) | `bg-card text-card-foreground` | Cards de dados, modais e containers |
| **Ação Primária (Royal Blue)** | `#1E40AF` | `bg-primary text-primary-foreground` | Botões primários, ícones de destaque e links |
| **Acento Interativo (Blue)** | `#3B82F6` | `text-primary ring-ring border-primary` | Anéis de foco, tabs ativas e bordas hover |
| **Métricas e Badges (Light Blue)** | `#60A5FA` | `bg-secondary text-secondary-foreground` | Badges de status, tags e destaques analíticos |
| **Texto Atenuado (Muted)** | `#64748B` / `#94A3B8` | `text-muted-foreground` | Legendas, rótulos auxiliares e descrições |
| **Fundo Atenuado (Muted)** | `#F1F5F9` / `#334155` | `bg-muted` | Linhas de tabela hover, fundos de inputs |
| **Bordas Estruturais** | `#E2E8F0` / `rgba(255,255,255,0.12)` | `border-border` | Divisores, bordas de tabela e contornos de cards |
| **Bordas de Formulário** | `#E2E8F0` / `rgba(255,255,255,0.14)` | `border-input` | Contorno de inputs e caixas de seleção |
| **Destrutivo / Alerta** | `oklch(0.58 0.22 25)` | `bg-destructive text-destructive-foreground` | Botões de exclusão, badges de erro e alertas |
| **Atenção / Warning** | `oklch(0.80 0.16 80)` (Dark) / `oklch(0.52 0.14 65)` (Light) | `text-warning border-warning/50 bg-warning/10` (ou `<Alert variant="warning">`) | Avisos que não bloqueiam o uso, como dados parcialmente indisponíveis |
| **Gradiente Institucional** | `#0F172A` $\to$ `#1E40AF` | `glass-gradient` | Fundo da tela de login e banners hero |

---

## 3. Tipografia Oficial

A tipografia do projeto utiliza duas fontes carregadas via Google Fonts em `frontend/index.html`:

1. **Inter (`font-sans`):** Fonte primária para interface, títulos, botões e tabelas.
   - **Hero / Display:** `text-2xl md:text-3xl font-bold tracking-tight`
   - **H1:** `text-xl font-bold tracking-tight`
   - **H2 / Títulos de Cards:** `text-base font-bold text-foreground`
   - **Body:** `text-sm font-normal leading-relaxed`
   - **Rótulos / Labels:** `text-xs font-semibold text-muted-foreground`
   - **Legendas / Badges:** `text-xs font-semibold`
2. **JetBrains Mono (`font-mono`):** Utilizada estritamente para dados técnicos, números de código, queries SQL do Agente de IA e hashes de transação.

---

## 4. Escala de Arredondamento e Espaçamento

- **Raio de Base:** **12px** (`--radius: 0.75rem` / `rounded-xl`).
  - Cards, Modais, Drawers: `rounded-xl`
  - Inputs e Campos de Formulário: `rounded-xl`
  - Botões Primários e Secundários: `rounded-xl`
  - Badges e Tags: `rounded-lg` (8px)
- **Espaçamento e Layout:**
  - Base unitária: `0.5rem` (8px). Use `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px).
  - **Proibição de `space-x-*` e `space-y-*`:** Use sempre `flex flex-col gap-*` ou `flex items-center gap-*`.
  - **Proibição de `h-screen` e `min-h-[100dvh]`:** Use sempre `min-h-dvh`.
  - **Dimensões Iguais:** Use `size-*` (ex: `size-9`, `size-4`) em vez de `w-9 h-9`.

---

## 5. Contratos Obrigatórios dos Componentes (`src/components/ui/`)

### 5.1 `Button` (`@/components/ui/button`)
- **Regra de Ouro:** O linter proíbe classes de largura e cor no `className` do Button (`deny: ["w-*", "h-*", "p-*", "bg-*"]`).
- **Botão com 100% de largura:** Use a propriedade nativa `fullWidth` (`<Button fullWidth>Entrar</Button>`). Nunca passe `className="w-full"`.
- **Variantes:**
  - `default`: Fundo Royal Blue (`bg-primary`), texto branco, sombra sutil.
  - `outline`: Borda de 1.5px (`border-border`), texto semântico, hover com preenchimento atenuado.
  - `secondary`: Fundo cinza suave (`bg-secondary`), ideal para ações alternativas.
  - `destructive`: Vermelho semântico para exclusão ou revogação.
  - `ghost`: Sem borda nem fundo fixo, apenas hover.
  - `link`: Texto com underline no hover.
- **Tamanhos Padronizados:** `size="sm"` (h-8), `size="default"` (h-9), `size="lg"` (h-10), `size="icon"` (size-9).
- **Ícones em Botões:** Componha ícones dentro de `<span>` ou utilize `[&_svg]:size-4` automático:
  ```tsx
  <Button variant="outline" size="sm">
    <span className="flex items-center gap-1.5">
      <LogOut className="size-3.5" /> Sair
    </span>
  </Button>
  ```

### 5.2 `Card` (`@/components/ui/card`)
- **Regra de Ouro:** O `className` do Card **só aceita classes de layout e espaçamento** (`w-*`, `max-w-*`, `p-*`, `grid`, `flex`). Modificações visuais de borda, cor, sombra ou transição devem ser feitas **exclusivamente através de variantes**:
  - `<Card>`: Card padrão de superfície limpa com borda sutil.
  - `<Card variant="glass">`: Card translúcido com `backdrop-blur-md`, ideal para formulários de login e sobreposições.
  - `<Card variant="interactive">`: Card analítico com transição hover de borda (`hover:border-primary/40`), ideal para dashboards e métricas.
- **Composição Estruturada Obrigatória:**
  ```tsx
  <Card variant="interactive">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle>Diagnóstico de Receita</CardTitle>
      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
        <Zap className="size-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-foreground text-2xl font-bold tracking-tight">R$ 1.42M</div>
      <CardDescription className="mt-1">
        Consumo faturado por classe residencial e comercial.
      </CardDescription>
    </CardContent>
  </Card>
  ```

### 5.3 `Input` (`@/components/ui/input`)
- Nunca utilize `<input>` nativo fora de `src/components/ui/`.
- Estruture sempre com label explicativa acima do campo:
  ```tsx
  <div className="flex flex-col gap-1.5">
    <label className="text-muted-foreground text-xs font-semibold" htmlFor="email-input">
      Email Corporativo
    </label>
    <Input id="email-input" type="email" placeholder="nome@venergy.com" required />
  </div>
  ```

### 5.4 `Badge` (`@/components/ui/badge`)
- Variantes permitidas: `default`, `secondary`, `destructive`, `outline`.
- Exemplo: `<Badge variant="secondary">DIRETOR</Badge>`.

### 5.5 Componentes de Feedback (`src/components/feedback/`)
- **Carregamento Estruturado (`LoadingSkeleton`):**
  - Nunca crie divs soltas com `animate-pulse`. Use `<LoadingSkeleton count={3} />`.
- **Ausência de Dados (`EmptyState`):**
  - Use `<EmptyState title="Nenhuma fatura encontrada" description="Não constam débitos em aberto para esta UC." icon={<FileSearch className="size-10" />} action={<Button size="sm">Emitir Segunda Via</Button>} />`.
- **Tratamento de Erros de Interface (`ErrorBoundary`):**
  - Encapsule módulos de dados e visualizações com `<ErrorBoundary>`.

---

## 6. Regras de Código e Boas Práticas do React 19

1. **Anti-Leaked-Render (Ternários Explícitos Obrigatórios):**
   - ❌ **Proibido:** `{errorMsg && <div className="text-destructive">{errorMsg}</div>}`
   - ✅ **Obrigatório:** `{errorMsg ? <div className="text-destructive">{errorMsg}</div> : null}`
2. **Limite Físico por Componente (Fallow):**
   - Máximo de **150 linhas por arquivo `.tsx`**. Se atingir 130 linhas, decomponha o JSX ou extraia um hook headless em `hooks/use*Controller.ts`.
3. **Animações Exclusivamente via `motion/react`:**
   - ❌ **Proibido:** `import { motion } from 'framer-motion'`
   - ✅ **Obrigatório:** `import { motion } from 'motion/react'`
4. **Sem Arquivos Barrel (`index.ts`):**
   - Importe componentes e utilitários diretamente de seus arquivos de definição.

---

## 7. Receitas Prontas de UI (*Ready-to-Use Recipes*)

### Receita 1: Card de Métrica KPI com Tendência
```tsx
import { ArrowUpRight, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function KpiMetricCard() {
  return (
    <Card variant="interactive">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Receita Total Faturada</CardTitle>
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold tracking-tight">R$ 48.250.120</div>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="size-3" /> +4.2%
            </span>
          </Badge>
          <CardDescription>em relação ao mês anterior</CardDescription>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Receita 2: Header de Página com Glassmorphism
```tsx
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PageHeader() {
  return (
    <header className="border-border bg-card/90 backdrop-blur-md border-b sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
            <Zap className="size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-base font-bold">V-Energy Grid 360</h1>
            <p className="text-muted-foreground text-xs">Visão Integrada de Concessionária</p>
          </div>
        </div>
        <Button variant="default" size="sm">
          <span>Nova Consulta</span>
        </Button>
      </div>
    </header>
  )
}
```

---

## 8. Checklist de Validação para Desenvolvedores e Agentes

Antes de submeter qualquer tela ou componente:
- [ ] O componente tem $\le 150$ linhas?
- [ ] Todas as cores usam tokens semânticos (`bg-primary`, `bg-background`, `text-foreground`, etc.) sem valores hex ou classes brutas?
- [ ] O componente respeita a altura `min-h-dvh` sem utilizar `h-screen` ou `min-h-[100dvh]`?
- [ ] Os botões com 100% de largura usam a prop `fullWidth` e não `className="w-full"`?
- [ ] Os cards usam variantes (`variant="glass"` ou `variant="interactive"`) em vez de classes arbitrárias de hover/sombra?
- [ ] As renderizações condicionais utilizam ternários explícitos (`? : null`)?
- [ ] Todos os métodos e funções exportadas possuem documentação JSDoc?
- [ ] O comando `make lint-frontend` e `cd frontend && bun run test` passaram com 100% de sucesso?