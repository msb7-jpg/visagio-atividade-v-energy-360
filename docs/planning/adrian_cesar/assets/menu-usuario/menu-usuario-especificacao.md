# Menu do usuário (AppShell) — especificação

Referência: `Main.dc.html` (cabeçalho do AppShell). O componente é um `DropdownMenu` do shadcn aberto pelo botão do avatar, no canto direito da barra superior.

## Elementos, na ordem

| # | Elemento | O que mostra | Ao interagir |
|---|---|---|---|
| 1 | Botão de abertura | Iniciais em círculo, nome, perfil, seta para baixo. `aria-haspopup="menu"`, `aria-expanded`, `aria-label="Menu do usuário {nome}"`. | Abre e fecha o menu. A seta gira 180° quando aberto. |
| 2 | Cabeçalho (não clicável) | Nome; "cargo · perfil {perfil}"; "Grupo {GG-PORTAL-...}". | Nada. Os três dados vêm da conta autenticada. |
| 3 | Alternar tema | "Usar modo claro" (com ícone de sol) quando está escuro; "Usar modo escuro" (lua) quando está claro. | Troca o tema, grava a escolha e fecha o menu. |
| 4 | Aviso de demonstração (só no modo demo) | "Modo demonstração. Trocar de usuário existe só na apresentação. Em produção, o perfil vem do grupo da conta no diretório corporativo." | Nada. |
| 5 | Lista de perfis (só no modo demo) | 4 itens de seleção única: Henrique Duarte (Diretoria), Camila Barreto (Atendimento), Rafael Coutinho (Perdas), Beatriz Farias (Operação). O atual aparece marcado. `role="menuitemradio"`, `aria-checked`. | Troca o usuário ativo e fecha o menu. |
| 6 | Sair | Ícone de porta e "Sair". | Encerra a sessão e leva para o login. |

Também na barra, fora do menu: a etiqueta "Modo demonstração" (amarela), visível só no modo demo.

## Produção × demonstração

- **Produção:** o menu tem os itens 1, 2, 3 e 6. Não existe troca de perfil; o perfil vem do grupo da conta e só muda se a pessoa sair e entrar com outra conta.
- **Demonstração** (variável de ambiente ligada): acrescenta os itens 4 e 5 e a etiqueta na barra.

## Pontos que o protótipo deixa em aberto (decida antes de implementar)

1. **Ao trocar de perfil, a tela atual pode ficar proibida.** Em `telas/05-apos-trocar-perfil-sem-acesso.png`, Camila (Atendimento) cai em "Sem permissão para esta tela" na Visão Geral. Recomendação: ao trocar de perfil, ir para a tela inicial do novo perfil (Diretoria: Visão Geral; Atendimento: UC 360; Perdas: Fila de Inspeção; Operação: Continuidade).
2. **A troca de perfil é só visual ou muda o usuário de verdade?** No protótipo é só o front. No código real, as permissões vêm do backend. A troca de demonstração precisa fazer login como o usuário de exemplo (ou o backend precisa aceitar o perfil de demo); caso contrário o front mostra telas que a API recusa. O Claude Code deve investigar e relatar antes de ligar.
3. **Fechamento do menu:** o protótipo só fecha ao clicar de novo no botão ou em um item. O componente real deve fechar também com `Esc` (devolvendo o foco ao botão) e ao clicar fora.
4. **Celular:** em 390 px o menu passa da altura da tela (`telas/07-menu-aberto-celular.png`). O componente real deve limitar a altura (`max-height` com rolagem interna) e ficar dentro da largura da tela.
5. **Tema:** o protótipo oferece só claro e escuro, com escuro como padrão. Não inclua a opção "Sistema" sem decisão.

## Comportamento esperado

- **Tema:** a escolha fica salva no navegador (chave `grid360.tema`) e é aplicada antes da primeira pintura, para não piscar o tema errado ao recarregar. Padrão: escuro.
- **Teclado:** `Enter` ou `Espaço` abre; setas navegam; `Home` e `End` vão ao primeiro e ao último item; `Esc` fecha e devolve o foco ao botão; digitar uma letra salta ao item que começa com ela. O shadcn (Radix) já entrega isso; use `DropdownMenuRadioGroup` para os perfis.
- **Leitor de tela:** o perfil atual é anunciado como marcado; a troca de tema anuncia o novo estado.
- **Alvos de toque:** pelo menos 44 px de altura nos itens.
- **Larguras:** menu com 300 px no computador; no celular, no máximo a largura da tela menos 16 px de cada lado.

## Movimento

| # | Quando | O que acontece | Duração e curva |
|---|---|---|---|
| 1 | Abrir o menu | Fade e escala de 0,96 para 1, com origem no canto superior direito. | 150 ms, ease-out |
| 2 | Fechar o menu | Fade para zero. | 100 ms, ease-in |
| 3 | Seta do botão | Gira 180° ao abrir e volta ao fechar. | 150 ms |
| 4 | Passar o mouse ou focar um item | Fundo troca para `muted`. | 100 ms |
| 5 | Item de perfil marcado | O fundo `accent` do item atual aparece com fade. | 150 ms |
| 6 | Alternar tema | Cores de fundo, texto e borda fazem transição suave; o ícone sol/lua troca com giro de 90° e fade. | 200 ms |
| 7 | Trocar de perfil | O conteúdo da página faz fade (sai e entra) ao ir para a tela inicial do novo perfil. | 150 ms + 150 ms |

Regras: animar apenas `opacity`, `transform` e, no tema, `background-color`, `color` e `border-color`. Com `prefers-reduced-motion: reduce`, nada se move e a troca de tema é instantânea.

## Imagens

| Arquivo | Estado |
|---|---|
| `telas/01-barra-menu-fechado.png` | Barra superior com o botão fechado |
| `telas/02-menu-aberto-demo-escuro.png` e `02b-...-detalhe.png` | Menu aberto em demonstração, modo escuro (tela inteira e recorte) |
| `telas/03-menu-aberto-producao.png` | Menu aberto em produção (sem aviso nem perfis) |
| `telas/04-menu-aberto-demo-claro.png` | Menu aberto em demonstração, modo claro |
| `telas/05-apos-trocar-perfil-sem-acesso.png` | Resultado de trocar de perfil na tela errada |
| `telas/06-apos-alternar-tema.png` | Depois de alternar o tema |
| `telas/07-menu-aberto-celular.png` | Menu aberto em 390 px |

Os dados de nomes e grupos são fictícios, de demonstração.
