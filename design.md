---
version: "1.0.0"
name: "SaaS Enterprise Analytics (V-Energy Grid 360)"
description: "Design System oficial do V-Energy Grid 360: plataforma de operação, medição, faturamento e inteligência artificial para concessionárias de energia. Visual corporativo, paleta Corporate Blue, tokens shadcn em hex (escuro por padrão), tipografia Inter e JetBrains Mono, raio base de 8px e total conformidade com os linters da codebase."
reference: https://designmd.app/library/saas-enterprise-analytics
colors:
  dark:
    background: "#0A121E"
    foreground: "#E7EDF4"
    card: "#111B2A"
    muted: "#172437"
    muted-foreground: "#A8B6C8"
    primary: "#5BB8DD"
    primary-foreground: "#06121C"
    secondary: "#1D2D44"
    accent: "#123349"
    destructive: "#F28479"
    success: "#5BCB93"
    warning: "#F2B92B"
    border: "#24354D"
    input: "#5A7396"
  light:
    background: "#F2F5F8"
    foreground: "#0F1B2D"
    card: "#FFFFFF"
    muted: "#F5F7FA"
    muted-foreground: "#4C5A6D"
    primary: "#0B5C7A"
    primary-foreground: "#FFFFFF"
    secondary: "#E9EEF4"
    accent: "#E1EEF4"
    destructive: "#B8322A"
    success: "#176B41"
    warning: "#7F5200"
    border: "#DCE2E9"
    input: "#7C8BA0"
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
  base: 8px                # --radius: 8px
  sm: 4px                  # barras, selos de tabela
  md: 8px                  # botões, campos, linhas
  lg: 12px                 # cards, gaveta, diálogos
components:
  button:
    rounded: "rounded-md (8px)"
    fontWeight: "font-semibold (600)"
    tactileEffect: "active:translate-y-px"
  card:
    rounded: "rounded-lg (12px)"
    shadow: "shadow-sm"
    variants: ["default", "glass", "interactive"]
---

# ⚡ V-Energy Grid 360 — Design System Specification (`design.md`)

Este documento é a **Fonte Única da Verdade (*Single Source of Truth - SSOT*)** para a interface do usuário do **V-Energy Grid 360**. Qualquer tela, componente ou fluxo desenvolvido no projeto deve seguir rigorosamente as regras, classes semânticas e contratos de componentes descritos aqui.

---

## 1. Visão Geral e Filosofia Visual

- **Estilo:** *Corporate Blue, Clean, Data-Driven & AI-Ready*.
- **Arquitetura de Cores:** B2B Enterprise — transmite confiança operacional, clareza métrica para lideranças e precisão para engenheiros de dados.
- **Profundidade:** Superfícies opacas com borda de 1px (`--border`) e sombra mínima (`shadow-sm` = `0 1px 2px rgba(0,0,0,.12)`); sem glows.
- **Física de Movimento:** Curvas suaves de desaceleração (*ease-out*), durações de 200–300ms, transições táteis em botões (`active:translate-y-px`) e micro-animações via `motion/react`.
- **Suporte a Temas:** Dark Mode por padrão (`<html class="dark">`); o modo claro é a variação e vive em `:root` (sem a classe `dark`). Fonte dos valores: `tokens-claro.png` e `tokens-escuro.png`.

---

## 2. Mapa de Cores e Tokens Semânticos do Tailwind

> [!CAUTION]
> **Proibição de Cores Brutas e Valores Arbitrários (`@shadcn/lint`):**
> Nunca utilize cores Tailwind brutas no JSX (ex: `bg-slate-900`, `text-blue-500`, `border-gray-200`) ou valores arbitrários entre colchetes (ex: `bg-[#0F172A]`, `text-[11px]`, `min-h-[100dvh]`).
> Use sempre as **classes semânticas oficiais** listadas abaixo:

| Token | Escuro (principal) | Claro (variação) | Classe Tailwind | Onde Utilizar |
|---|---|---|---|---|
| `--background` | `#0A121E` | `#F2F5F8` | `bg-background` | Fundo da página |
| `--foreground` | `#E7EDF4` | `#0F1B2D` | `text-foreground` | Texto principal |
| `--card` / `--card-foreground` | `#111B2A` / `#E7EDF4` | `#FFFFFF` / `#0F1B2D` | `bg-card text-card-foreground` | Cards, menus, barra superior, gaveta |
| `--muted` / `--muted-foreground` | `#172437` / `#A8B6C8` | `#F5F7FA` / `#4C5A6D` | `bg-muted text-muted-foreground` | Cabeçalho de tabela, hover de linha, rótulos, legendas |
| `--primary` / `--primary-foreground` | `#5BB8DD` / `#06121C` | `#0B5C7A` / `#FFFFFF` | `bg-primary text-primary-foreground` | Botão principal, links, item ativo, foco, série 1 |
| `--secondary` / `--secondary-foreground` | `#1D2D44` / `#E7EDF4` | `#E9EEF4` / `#0F1B2D` | `bg-secondary text-secondary-foreground` | Hover de botão neutro, chips |
| `--accent` / `--accent-foreground` | `#123349` / `#5BB8DD` | `#E1EEF4` / `#0B5C7A` | `bg-accent text-accent-foreground` | Item de menu ativo, linha selecionada |
| `--destructive` / `-foreground` | `#F28479` / `#1A0A09` | `#B8322A` / `#FFFFFF` | `bg-destructive text-destructive-foreground` | Piora, erro, atraso, recusa |
| `--success` / `-foreground` | `#5BCB93` / `#06121C` | `#176B41` / `#FFFFFF` | `bg-success text-success-foreground` | Melhoria, pago, concluído |
| `--warning` / `-foreground` | `#F2B92B` / `#1A1204` | `#7F5200` / `#FFFFFF` | `bg-warning text-warning-foreground` | Atenção, selo "Gerado por IA" |
| `--border` | `#24354D` | `#DCE2E9` | `border-border` | Divisórias, bordas de card e tabela |
| `--input` | `#5A7396` | `#7C8BA0` | `border-input` | Borda de campos e botões de contorno (3:1) |
| `--ring` | `#5BB8DD` | `#0B5C7A` | `ring-ring` | Anel de foco (2px, deslocado 2px) |
| `--chart-1…5` | `#5BB8DD #F59A6B #B39DF0 #F2B92B #4FD1C0` | `#0B5C7A #C2410C #7B4FC4 #8A5A00 #0E8C80` | `fill-chart-1` etc. | Séries de gráficos |

**Receitas derivadas (sem criar token novo):** tint de success/warning/destructive = `bg-success/15`; hover do primary = `bg-primary/85`; série "Outros" e eixos = `muted-foreground`; sombra = `shadow-sm`. Todo `-foreground` é texto sobre a cor correspondente (contraste AA ≥ 4,5).

**Fundo do login e banners hero:** `glass-gradient`, derivado de `--background` → `--accent` (sem hex próprio).

---

## 3. Tipografia Oficial

A tipografia do projeto utiliza duas fontes carregadas via Google Fonts em `frontend/index.html`:

1. **Inter (`font-sans`):** Fonte primária para interface, títulos, botões e tabelas.
   - **Hero / valor de KPI principal:** `text-3xl font-bold tracking-tight` (30/36)
   - **Título de tela:** `text-2xl font-bold tracking-tight` (24/32)
   - **Título de seção / KPI secundário:** `text-xl font-bold` (20/28)
   - **Títulos de Cards:** `text-lg font-semibold text-foreground` (16/24)
   - **Body e botões:** `text-base font-normal` (14/20)
   - **Tabelas e texto de apoio:** `text-sm` (13/18)
   - **Rótulos / Labels:** `text-xs font-semibold text-muted-foreground` (12/16; nada abaixo de 12px)
   - **Legendas / Badges:** `text-xs font-semibold`
2. **JetBrains Mono (`font-mono`):** Utilizada estritamente para dados técnicos, números de código, queries SQL do Agente de IA e hashes de transação.

---

## 4. Escala de Arredondamento e Espaçamento

- **Raio de Base:** **8px** (`--radius: 8px`). Escala: `rounded-sm` 4px, `rounded-md` 8px, `rounded-lg` 12px.
  - Cards, Modais, Drawers: `rounded-lg`
  - Inputs, Selects e Campos de Formulário: `rounded-md`
  - Botões Primários e Secundários: `rounded-md`
  - Badges, Tags e abas: `rounded-md`
- **Espaçamento e Layout:**
  - Base de 4px (escala padrão do Tailwind). Use `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px).
  - **Proibição de `space-x-*` e `space-y-*`:** Use sempre `flex flex-col gap-*` ou `flex items-center gap-*`.
  - **Proibição de `h-screen` e `min-h-[100dvh]`:** Use sempre `min-h-dvh`.
  - **Dimensões Iguais:** Use `size-*` (ex: `size-9`, `size-4`) em vez de `w-9 h-9`.

---

## 5. Contratos Obrigatórios dos Componentes (`src/components/ui/`)

### 5.1 `Button` (`@/components/ui/button`)
- **Regra de Ouro:** O linter proíbe classes de largura e cor no `className` do Button (`deny: ["w-*", "h-*", "p-*", "bg-*"]`).
- **Botão com 100% de largura:** Use a propriedade nativa `fullWidth` (`<Button fullWidth>Entrar</Button>`). Nunca passe `className="w-full"`.
- **Variantes:**
  - `default`: Fundo `bg-primary`, texto branco, sombra sutil.
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
      <div className="p-1.5 rounded-md bg-primary/10 text-primary">
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
- Variantes permitidas: `default`, `secondary`, `destructive`, `warning`, `success`, `outline`.
- `warning` marca atenção ou etapa pendente; `success` marca etapa concluída ou resultado confirmado.
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
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          <TrendingUp className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-bold tracking-tight">R$ 48.250.120</div>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="secondary">
            <span className="text-success flex items-center gap-1">
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

### Receita 2: Header de Página
```tsx
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PageHeader() {
  return (
    <header className="border-border bg-card/90 backdrop-blur-md border-b sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
            <Zap className="size-5" />
          </div>
          <div>
            <h1 className="text-foreground text-lg font-bold">V-Energy Grid 360</h1>
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