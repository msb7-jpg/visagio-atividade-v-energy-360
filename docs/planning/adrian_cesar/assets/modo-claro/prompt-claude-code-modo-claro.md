# Prompt — implementar o modo claro

Antes de colar: copie para `docs/planning/adrian_cesar/assets/modo-claro/` a pasta `grid360/png-claro` (11 telas no modo claro) e, se quiser, `grid360/png-escuro` ao lado, para comparação. O prompt tem duas fases; o Claude Code PARA no fim da fase 1.

```markdown
Implemente o modo claro no V-Energy Grid 360 (React + TypeScript + Tailwind + shadcn). Hoje só existe o modo escuro. O escuro é o padrão e não pode mudar de aparência.

## Referências
- Imagens do modo claro de todas as telas: `docs/planning/adrian_cesar/assets/modo-claro/png-claro/`. Imagens do escuro para comparar: `.../png-escuro/`.
- Tokens: abaixo. São os mesmos nomes do padrão shadcn (variáveis CSS em `globals.css`).

## Fase 1 — só leitura (não altere código)
Descubra no código real e responda no chat:
1. Onde os tokens do escuro estão definidos hoje (arquivo e linha) e se já seguem o padrão shadcn (`--background`, `--foreground`, `--card`...). Se o escuro estiver em `:root`, diga como separar sem mudar o visual dele.
2. Quantas cores fixas existem fora dos tokens: hexadecimais (`#...`), `rgb()`/`hsl()`, classes Tailwind de cor fixa (`bg-slate-900`, `text-white`, `bg-[#...]`), `style={{ color }}`. Liste por arquivo, com a contagem, e separe: componentes de UI, gráficos, telas.
3. Como os gráficos pegam cor hoje (Recharts, ECharts etc.) e se leem tokens.
4. Se há ícones, imagens ou logotipos com cor fixa que quebram no fundo claro.
5. Como o tema seria aplicado: classe `dark` no `<html>` ou outra. Se já existe provedor de tema.
6. Estimativa de esforço: lista de arquivos a tocar em ordem.
Escreva as respostas e PARE. Não implemente até eu responder.

## Fase 2 — implementação (só depois da minha resposta)

### Tokens
Escuro (padrão, não alterar): background #0A121E · foreground #E7EDF4 · card #111B2A · card-foreground #E7EDF4 · primary #5BB8DD · primary-foreground #06121C · secondary #1D2D44 · secondary-foreground #E7EDF4 · muted #172437 · muted-foreground #A8B6C8 · accent #123349 · accent-foreground #5BB8DD · destructive #F28479 · destructive-foreground #1A0A09 · success #5BCB93 · success-foreground #06121C · warning #F2B92B · warning-foreground #1A1204 · border #24354D · input #5A7396 · ring #5BB8DD · chart-1 #5BB8DD · chart-2 #F59A6B · chart-3 #B39DF0 · chart-4 #F2B92B · chart-5 #4FD1C0

Claro: background #F2F5F8 · foreground #0F1B2D · card #FFFFFF · card-foreground #0F1B2D · primary #0B5C7A · primary-foreground #FFFFFF · secondary #E9EEF4 · secondary-foreground #0F1B2D · muted #F5F7FA · muted-foreground #4C5A6D · accent #E1EEF4 · accent-foreground #0B5C7A · destructive #B8322A · destructive-foreground #FFFFFF · success #176B41 · success-foreground #FFFFFF · warning #8A5A00 · warning-foreground #FFFFFF · border #DCE2E9 · input #7C8BA0 · ring #0B5C7A · chart-1 #0B5C7A · chart-2 #C2410C · chart-3 #7B4FC4 · chart-4 #8A5A00 · chart-5 #0E8C80

`--radius`: 8px nos dois modos. Os valores de success e input do claro já foram ajustados para passar no contraste (sucesso sobre fundo tingido e borda de campo sobre card); não "melhore" sem medir.

Receitas derivadas, sem criar tokens novos:
- fundo tingido de selo/badge: `color-mix(in srgb, var(--token) 16%, var(--card))`; linhas de tabela: 8%;
- hover do botão primário: `color-mix(in srgb, var(--primary) 85%, var(--foreground))`;
- sombra: `0 1px 2px rgba(0,0,0,.12)`.

### Regras
1. Tema por classe `dark` no `<html>`: `:root` = claro, `.dark` = escuro (ou o equivalente que você achar na fase 1). Como o escuro é o padrão, quem nunca escolheu nada vê o escuro.
2. Provedor de tema (um único arquivo): estados claro e escuro, sem opção "Sistema". Guardar a escolha em `localStorage` na chave `grid360.tema` (valores `claro` e `escuro`), dentro de try/catch (pode falhar em janela privada).
3. Sem piscar: um script curto no `<head>` do `index.html` aplica a classe antes da primeira pintura. Teste que recarregar no claro não mostra escuro por um instante.
4. Trocar toda cor fixa encontrada na fase 1 por token. Se uma cor não couber em nenhum token, NÃO invente variação: liste e me pergunte.
5. Gráficos: ler as cores `chart-1..5` dos tokens (não de constantes). Grade e eixos com `border` e `muted-foreground`. Conferir legibilidade nos dois modos.
6. Selos de status (fatura, ordem, leitura) e as colunas do quadro de ordens: mesma receita de tingimento nos dois modos; texto com `*-foreground` ou a cor do token.
7. Foco visível com `ring` nos dois modos; contraste mínimo 4,5:1 para texto e 3:1 para bordas de campo e ícones. Se algum par falhar, liste o par e o valor medido, sem trocar o token por conta própria.
8. Elementos de sombra e sobreposição (menus, painéis, diálogos): no claro, sombra suave e borda `border`; no escuro, só borda.
9. Imagens, ícones e logotipo: usar `currentColor` ou token; nada com preto ou branco fixo.
10. Não use `transition: all`. Se houver transição de cor ao alternar o tema, só em `background-color`, `color` e `border-color`, 200 ms, e desligada em `prefers-reduced-motion: reduce`.
11. Não mexa no layout, nos textos nem nos espaçamentos. Só cor.

### Entrega
1. Liste os arquivos que vai alterar antes de começar e trabalhe em fatias: (a) tokens e provedor; (b) componentes base (botão, campo, tabela, selo, cartão, menu, diálogo); (c) gráficos; (d) uma tela por vez, com commit separado.
2. Vitest: o provedor aplica a classe correta, lê e grava a escolha, tolera `localStorage` indisponível; teste de que nenhum arquivo de componente contém cor hexadecimal fora de `globals.css` (um teste simples de varredura, com lista de exceções justificadas).
3. Contraste: gere uma tabela com as razões medidas dos pares principais (texto sobre card, texto suave sobre card, primário sobre fundo, selos, borda de campo) nos dois modos e confira o mínimo.
4. Se conseguir subir o front (sem Playwright, use o que o projeto tiver), capture as 11 telas no claro e no escuro e compare com as imagens de referência; diga o que ficou diferente e por quê.
5. `make lint-all` e `make test-all`.
6. Não altere o backend nem os dados.
```
