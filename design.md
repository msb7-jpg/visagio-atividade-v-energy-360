---
version: "2.0.0"
name: "Grid 360 (V-Energy Grid 360)"
description: "Design System oficial do V-Energy Grid 360: ferramenta interna de operação, medição, faturamento e IA de uma distribuidora de energia. Visual corporativo e sóbrio: base neutra quente, um azul de marca, âmbar só no símbolo, tema claro por padrão, IBM Plex Sans e IBM Plex Mono, raio de 6px e superfícies planas."
colors:
  light:
    background: "#F6F6F3"
    foreground: "#18191C"
    card: "#FFFFFF"
    muted: "#F0F0EC"
    muted-foreground: "#5A5E66"
    primary: "#1B4D89"
    primary-foreground: "#FFFFFF"
    secondary: "#ECECE7"
    accent: "#E9EFF7"
    destructive: "#B42318"
    success: "#0D6640"
    warning: "#8A4600"
    border: "#E2E2DC"
    input: "#84888F"
    brand: "#F2B01E"
    sidebar: "#FBFBF9"
  dark:
    background: "#101113"
    foreground: "#ECECEE"
    card: "#17181B"
    muted: "#1E2024"
    muted-foreground: "#A3A7AE"
    primary: "#8CB2EE"
    primary-foreground: "#101113"
    secondary: "#232529"
    accent: "#1B2534"
    destructive: "#F2897E"
    success: "#5DC68F"
    warning: "#E6B045"
    border: "#2B2D32"
    input: "#60656D"
    brand: "#F2B01E"
    sidebar: "#131416"
typography:
  h1:
    fontFamily: IBM Plex Sans
    fontSize: 1.5rem
    fontWeight: 600
  h2:
    fontFamily: IBM Plex Sans
    fontSize: 1.125rem
    fontWeight: 600
  body:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: 400
    numbers: tabular-nums
  code:
    fontFamily: IBM Plex Mono
    fontSize: 0.75rem
rounded:
  base: 6px                # --radius: 6px
  sm: 4px                  # selos, barras, abas segmentadas
  md: 6px                  # botões, campos, linhas
  lg: 8px                  # cards, gaveta, diálogos
components:
  button:
    rounded: "rounded-md (6px)"
    fontWeight: "font-medium (500)"
    shadow: "nenhuma"
  card:
    rounded: "rounded-lg (8px)"
    surface: "plana: bg-card + borda de 1px, sem sombra nem blur"
    variants: ["default", "glass (sombra mínima)", "interactive (borda escurece no hover)"]
---

# ⚡ V-Energy Grid 360 — Design System Specification (`design.md`)

Este documento é a **Fonte Única da Verdade (*Single Source of Truth - SSOT*)** para a interface do usuário do **V-Energy Grid 360**. Qualquer tela, componente ou fluxo desenvolvido no projeto deve seguir rigorosamente as regras, classes semânticas e contratos de componentes descritos aqui.

---

## 1. Visão Geral e Filosofia Visual

- **Estilo:** ferramenta de trabalho de uma distribuidora de energia. Sóbria, densa e legível: o dado é o protagonista, a interface fica em segundo plano.
- **Cores:** base neutra quente (off-white e tinta quase preta), **um** azul de marca (`--primary`) para ações, links e item ativo, e o âmbar (`--brand`) só no símbolo da marca. Cor de estado (verde, âmbar, vermelho) só quando informa algo.
- **Profundidade:** superfícies planas com borda de 1px (`--border`). Sem vidro, sem `backdrop-blur`, sem brilho, sem cartões que sobem no hover. Sombra só em menus, diálogos e no botão do assistente.
- **Movimento:** curto e discreto (100–200ms, *ease-out*), via `motion/react`. Nada de molas, pulsos ou escala.
- **Texto:** frases curtas e objetivas. O subtítulo da tela diz o que ela responde em uma linha; explicação longa vai para tooltip. Sem CAIXA ALTA em títulos, cabeçalhos de tabela ou selos (dados que chegam em caixa alta são convertidos com `formatSentenceCase`).
- **Temas:** claro por padrão (`:root`); escuro opcional pelo menu do usuário (`<html class="dark">`), em grafite neutro.

---

## 2. Mapa de Cores e Tokens Semânticos do Tailwind

> [!CAUTION]
> **Proibição de Cores Brutas e Valores Arbitrários (`@shadcn/lint`):**
> Nunca utilize cores Tailwind brutas no JSX (ex: `bg-slate-900`, `text-blue-500`, `border-gray-200`) ou valores arbitrários entre colchetes (ex: `bg-[#0F172A]`, `text-[11px]`, `min-h-[100dvh]`).
> Use sempre as **classes semânticas oficiais** listadas abaixo:

| Token | Claro (padrão) | Escuro | Classe Tailwind | Onde Utilizar |
|---|---|---|---|---|
| `--background` | `#F6F6F3` | `#101113` | `bg-background` | Fundo da página |
| `--foreground` | `#18191C` | `#ECECEE` | `text-foreground` | Texto principal |
| `--card` / `--card-foreground` | `#FFFFFF` / `#18191C` | `#17181B` / `#ECECEE` | `bg-card text-card-foreground` | Cards, menus, barra superior, gaveta |
| `--muted` / `--muted-foreground` | `#F0F0EC` / `#5A5E66` | `#1E2024` / `#A3A7AE` | `bg-muted text-muted-foreground` | Cabeçalho de tabela, hover, rótulos, legendas |
| `--primary` / `--primary-foreground` | `#1B4D89` / `#FFFFFF` | `#8CB2EE` / `#101113` | `bg-primary text-primary-foreground` | Botão principal, links, foco, série 1 |
| `--secondary` / `--secondary-foreground` | `#ECECE7` / `#18191C` | `#232529` / `#ECECEE` | `bg-secondary text-secondary-foreground` | Botão neutro, avatar, balão do usuário no chat |
| `--accent` / `--accent-foreground` | `#E9EFF7` / `#1B4D89` | `#1B2534` / `#A9C6F5` | `bg-accent text-accent-foreground` | Linha selecionada, destaque informativo |
| `--destructive` / `-foreground` | `#B42318` / `#FFFFFF` | `#F2897E` / `#1A0A09` | `bg-destructive text-destructive-foreground` | Piora, erro, atraso, recusa |
| `--success` / `-foreground` | `#0D6640` / `#FFFFFF` | `#5DC68F` / `#101113` | `bg-success text-success-foreground` | Melhoria, pago, concluído |
| `--warning` / `-foreground` | `#8A4600` / `#FFFFFF` | `#E6B045` / `#1A1204` | `bg-warning text-warning-foreground` | Atenção |
| `--border` | `#E2E2DC` | `#2B2D32` | `border-border` | Divisórias, bordas de card e tabela |
| `--input` | `#84888F` | `#60656D` | `border-input` | Borda de campos (3:1 sobre fundo e card) |
| `--ring` | `#1B4D89` | `#8CB2EE` | `ring-ring` | Anel de foco (2px, deslocado 2px) |
| `--brand` / `-foreground` | `#F2B01E` / `#18191C` | `#F2B01E` / `#18191C` | `text-brand`, `bg-brand` | Só o raio do símbolo da marca e o ponto de "respondendo" do assistente |
| `--sidebar` | `#FBFBF9` | `#131416` | `bg-sidebar` | Menu lateral e painel de marca do login |
| `--chart-1…5` | `#1B4D89 #C2621B #6B5CA5 #868C94 #2A8577` | `#8CB2EE #EE9A5E #B3A6E8 #70767F #5FC4B4` | `fill-chart-1` etc. | Séries; `chart-4` é o cinza de comparação (ano anterior, "outros") |

**Receitas derivadas (sem criar token novo):** tint de success/warning/destructive = `bg-success/15`; hover do primary = `bg-primary/85`; série "Outros" e eixos = `muted-foreground`; sombra = `shadow-sm`. Todo `-foreground` é texto sobre a cor correspondente (contraste AA ≥ 4,5).

**Contraste:** todos os pares passam no AA (4,5:1 para texto, 3:1 para bordas e séries) nos dois temas, inclusive os selos com tint de 10–15%. Os testes `components/ui/__tests__/ui-contrast.test.ts`, `warning-token-contrast.test.ts` e `src/test/color-contrast.test.ts` leem os tokens direto do `index.css` e quebram o build se um valor novo não passar.

**Fundo do login:** `glass-gradient` virou um fundo liso `--sidebar` (sem gradiente).

---

## 3. Tipografia Oficial

A tipografia usa duas fontes carregadas via Google Fonts em `frontend/index.html`:

1. **IBM Plex Sans (`font-sans`):** interface, títulos, tabelas e números. O `body` liga `tabular-nums`, então colunas de valores alinham sem fonte mono.
   - **Título de tela (`PageHeader`):** `text-2xl font-semibold` (24/32)
   - **Título de seção:** `text-lg font-semibold` (16/24)
   - **Título de card:** `text-base font-semibold` (14/20)
   - **Valor de KPI:** `text-2xl font-semibold`
   - **Body, botões e células:** `text-sm` (13/18)
   - **Rótulos, cabeçalhos de tabela e selos:** `text-xs font-medium` (12/16; nada abaixo de 12px), sem caixa alta
   - Pesos: 400, 500 e 600. Evite `font-bold`.
2. **IBM Plex Mono (`font-mono`):** só código e identificadores — SQL do agente, número da UC, protocolo, inspetor. Nunca para valores numéricos.

---

## 4. Escala de Arredondamento e Espaçamento

- **Raio de Base:** **6px** (`--radius: 6px`). Escala: `rounded-sm` 4px, `rounded-md` 6px, `rounded-lg` 8px.
  - Cards, Modais, Drawers: `rounded-lg`
  - Inputs, Selects e Campos de Formulário: `rounded-md`
  - Botões Primários e Secundários: `rounded-md`
  - Badges e abas segmentadas: `rounded-sm`
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
  - `default`: fundo `bg-primary`, texto branco, sem sombra. Uma ação principal por área.
  - `outline`: borda de 1px (`border-border`) sobre `bg-card`, hover `bg-muted`.
  - `secondary`: fundo `bg-secondary`, para ações alternativas.
  - `destructive`: vermelho semântico para exclusão ou cancelamento.
  - `ghost`: texto `muted-foreground`, só hover.
  - `link`: texto `primary` com underline no hover.
  - `inline` (com `size="inline"`): texto normal com sublinhado pontilhado, para termos com explicação em tooltip (ex.: cabeçalhos "Queda" e "Score").
- **Tamanhos:** `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (size-9), `touch` (h-11), `inline` (sem altura nem padding).
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
  - `<Card variant="glass">`: o nome ficou por compatibilidade; hoje é o card padrão com `shadow-sm`, sem transparência nem blur.
  - `<Card variant="interactive">`: card de métrica cuja borda escurece no hover; não se desloca.
- **Espaçamento interno:** `CardHeader` tem `pb-3`; `CardContent` só ganha padding superior quando é o primeiro filho (`first:pt-*`). Ajustes como `pb-2` no cabeçalho funcionam em todas as larguras.
- **Composição Estruturada Obrigatória:**
  ```tsx
  <Card variant="interactive">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle>Diagnóstico de Receita</CardTitle>
      <div className="text-muted-foreground">
        <Zap className="size-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-foreground text-2xl font-semibold">R$ 1.42M</div>
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
        <div className="text-muted-foreground">
          <TrendingUp className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-foreground text-2xl font-semibold">R$ 48.250.120</div>
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