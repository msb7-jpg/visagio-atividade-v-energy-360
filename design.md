---
version: "2.1.0"
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
- **Texto:** frases curtas e objetivas. O subtítulo da tela diz o que ela responde em uma linha; explicação longa (fórmula, critério) vai para o ícone de ajuda ou tooltip. Sem CAIXA ALTA em títulos, selos e dados (dados que chegam em caixa alta são convertidos com `formatSentenceCase` ou `displayName`). A única exceção é o **rótulo de seção** e o **cabeçalho de tabela**, que usam caixa alta pequena e espaçada (`text-xs font-medium tracking-wide uppercase text-muted-foreground`) para separar a estrutura do conteúdo.
- **O dado primeiro:** cada tela abre pelo que responde a pergunta do usuário (resumo da IA e indicadores), depois o detalhe (tabela, mapa, histórico). Informação que o usuário procura com frequência não fica atrás de cliques: lista completa com busca vale mais que abrir item por item.
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
   - **Valor de KPI:** `text-2xl font-semibold`; prefixo e sufixo da unidade (`R$`, `mi`, `%`, `kWh`) em `text-base font-medium text-muted-foreground`, com o número sozinho em destaque (o `StatTile` faz isso sozinho quando o valor é texto)
   - **Manchete do resumo da IA:** `text-xl font-semibold text-balance`
   - **Body, botões e células:** `text-sm` (13/18)
   - **Rótulos e selos:** `text-xs font-medium` (12/16; nada abaixo de 12px), sem caixa alta
   - **Rótulo de seção e cabeçalho de tabela:** `text-xs font-medium tracking-wide uppercase text-muted-foreground` (o `TableHead` já aplica; em cabeçalho ordenável ou com ajuda, aplique no `<span>` dentro do `Button variant="inline"`)
   - **Menu lateral:** `text-base font-medium`, ícone `size-5`
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
- **Largura das telas:** o conteúdo ocupa a largura disponível ao lado do menu (`<main className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">`), sem `max-w-7xl` nem `mx-auto`. O layout reserva `pb-16` no fim para o botão do assistente não cobrir a paginação.
- **Menu lateral:** `w-72`, lista única de telas (sem grupos), item com `px-3 py-2.5`. O grupo de cada tela continua nos dados (`navItems.ts`) porque o caminho do topo ("Diretoria › Painel") usa o nome dele.

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
- Variantes permitidas: `default`, `secondary`, `destructive`, `warning`, `success`, `accent`, `muted`, `outline`.
- `warning` marca atenção ou etapa pendente; `success` marca etapa concluída ou resultado confirmado.
- Exemplo: `<Badge variant="secondary">DIRETOR</Badge>`.

### 5.5 Componentes de Feedback (`src/components/feedback/`)
- **Carregamento Estruturado (`LoadingSkeleton`):**
  - Nunca crie divs soltas com `animate-pulse`. Use `<LoadingSkeleton count={3} />`.
- **Ausência de Dados (`EmptyState`):**
  - Use `<EmptyState title="Nenhuma fatura encontrada" description="Não constam débitos em aberto para esta UC." icon={<FileSearch className="size-10" />} action={<Button size="sm">Emitir Segunda Via</Button>} />`.
- **Tratamento de Erros de Interface (`ErrorBoundary`):**
  - Encapsule módulos de dados e visualizações com `<ErrorBoundary>`.

### 5.6 Componentes de dados compartilhados (`src/components/data/`)
Use estes componentes antes de criar um novo; eles mantêm as telas com a mesma linguagem visual.

| Componente | Para que serve | Regras |
|---|---|---|
| `StatTile` | Bloco de indicador: rótulo, valor, variação (`change`), nota (`footnote`), ajuda (`hint`) e aviso (`warning`) | É o KPI padrão de todas as telas. A fórmula vai em `hint` (ícone de ajuda), nunca em texto corrido. Valor em texto ganha a unidade menor e cinza automaticamente. |
| `ShareBar` | Barra proporcional de 0 a 100% | Cor por token (`tone="bg-warning"`); largura via variável CSS, sem `style` com valor solto. |
| `RegionMap` | Mapa dos 14 municípios da RMR, pintado por valor | Cada município é um botão acessível (nome e valor no `aria-label`). Clicar aplica o filtro de município que a tela já tem; clicar de novo remove. Escala divergente (`fill-success/*` e `fill-destructive/*`) para ganho e perda; sequencial (um só token em 4 tons) para contagem. Sempre acompanhado de uma lista ou barras com os mesmos dados e o mesmo destaque ao passar o mouse. Contornos em `lib/geo/rmrMunicipalityShapes.ts` (malha pública do IBGE). |
| `PeriodPicker` | Filtro de período: "Período" + "Comparar com" + frase de confirmação | Nunca peça quatro datas como caminho padrão. A base é calculada (`lib/periods/periodPresets.ts`); só aparecem comparações cuja base cabe nos dados e termina antes do período analisado. "Personalizar datas" abre o `CustomWindowsEditor`. |
| `MonthPicker` | Campo de mês com calendário próprio (ano com setas, 12 meses em grade) | Substitui `<Input type="date">` e o calendário nativo: a API trabalha por competência. Mês escolhido em `default`, trecho em `secondary`, meses sem dados desabilitados. |

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

### Receita 1: Indicador (KPI) com variação
Use o `StatTile`; não monte card de KPI à mão.
```tsx
import { StatTile } from '@/components/data/StatTile'
import { VariationBadge } from '@/features/revenue/components/VariationBadge'

<StatTile
  label="Faturamento"
  hint="Soma do valor das faturas da janela, em reais."
  value="R$ 169,7 mi"
  change={<VariationBadge variation={8.0} />}
  footnote="Base: R$ 157,1 mi"
/>
```

### Receita 2: Página
```tsx
import { PageHeader } from '@/components/layout/PageHeader'

<main className="flex w-full flex-col gap-6 px-4 py-8 sm:px-6">
  <PageHeader title="Inteligência Comercial" description="Quanto da variação da receita veio de preço, volume e mix." />
  {/* filtro de período, resumo da IA, indicadores, detalhe */}
</main>
```
Ordem do conteúdo: filtro → resumo da IA → indicadores gerais → detalhe (tabelas, mapa, histórico).

### Receita 3: Rótulo de seção com atalho
```tsx
<div className="flex items-baseline justify-between gap-2">
  <h2 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Comercial</h2>
  <Link to="/revenue" className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline">
    Ver na Inteligência Comercial <ArrowRight aria-hidden="true" className="size-3" />
  </Link>
</div>
```
Cada área do Painel com tela própria leva ao detalhe (`GroupHeading`).

### Receita 4: Filtro de período
```tsx
import { PeriodPicker } from '@/components/data/PeriodPicker'

<PeriodPicker
  idPrefix="receita"
  windows={{ base, atual }}
  available={{ inicio: '2022-07', fim: '2026-06' }}
  isDefault={isDefault}
  resetLabel="Restaurar padrão"
  extra={<FilterPopover>{/* município, bairro, classe */}</FilterPopover>}
  onChange={setWindows}
  onReset={reset}
/>
```
Abre na pergunta do case (últimos 12 meses contra o primeiro ano da base). Recortes extras entram em `extra`, na mesma linha.

### Receita 5: Mapa territorial com lista ligada
```tsx
const [hovered, setHovered] = useState<string | null>(null)

<div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
  <div className="mx-auto w-full max-w-64 lg:col-span-2">
    <RegionMap
      label="Mapa da variação de receita"
      values={valuesByMunicipality}
      fillOf={(value) => fillFor(value, maximum)}
      describe={(municipio, value) => `${displayName(municipio)}: ${format(value)}`}
      selected={filters.municipio}
      hovered={hovered}
      onHover={setHovered}
      onSelect={toggleMunicipality}
    />
  </div>
  <div className="lg:col-span-3">{/* barras ou lista com o mesmo hovered/selected */}</div>
</div>
```

### Receita 6: Ficha em blocos numerados
Para telas longas de consulta (UC 360): faixa do topo com identificação e alertas, navegação fixa com atalhos numerados e um painel por bloco. Tudo visível, sem abas.
```tsx
<Customer360Section id="bloco-financeiro" step="2" title="Contas" description="Por que a conta veio assim e o que está em aberto." icon={<Receipt className="size-4" />}>
  {/* conteúdo do bloco */}
</Customer360Section>
```
Listas longas dentro de um bloco ganham altura máxima com rolagem própria (`max-h-96 overflow-auto`) para não esticar a página.

### Receita 7: Resumo da IA
O `SmartInsightCard` fica no topo da tela, na largura toda: fundo `bg-accent` com borda `border-primary/20`, selo "Resumo da IA" com o tom (positivo, estável, atenção, crítico), manchete em `text-xl`, frase de apoio, "Próximo passo" e até três números ao lado. Os números vêm das métricas do servidor, nunca do texto da IA.

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
- [ ] Indicadores usam `StatTile`, com a fórmula no `hint` e não em texto corrido?
- [ ] Caixa alta só aparece em rótulo de seção e cabeçalho de tabela?
- [ ] Período é escolhido com o `PeriodPicker` (e mês com o `MonthPicker`), nunca com `<Input type="date">`?
- [ ] A informação mais procurada da tela está visível sem precisar abrir item por item?
- [ ] A tela ocupa a largura disponível, sem `max-w-7xl`?
- [ ] O comando `make lint-frontend` e `cd frontend && bun run test` passaram com 100% de sucesso?