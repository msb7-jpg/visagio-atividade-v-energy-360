# Login — especificação de movimento

Proposta para a implementação em React. O protótipo (`Login.dc.html`) só tem uma animação: o giro do spinner dos passos (0,8 s, linear, infinito). As demais abaixo são propostas a aprovar.

## Regras gerais

- Animar apenas `opacity` e `transform`.
- Com `prefers-reduced-motion: reduce`: sem movimento; trocas instantâneas ou fade de 100 ms. O spinner vira um indicador estático (ícone de relógio ou três pontos fixos) com o texto do passo.
- Nenhuma animação atrasa o uso: o campo de e-mail recebe foco imediatamente.
- Foco visível e ordem de tabulação intactos durante as transições.
- Duração máxima de qualquer transição: 300 ms (exceto o spinner).

## Tabela

| # | Quando | O que acontece | Duração e curva |
|---|---|---|---|
| 1 | Página abre | Painel do formulário entra com fade e sobe 8 px. Painel azul à esquerda só faz fade. | 300 ms, ease-out |
| 2 | Foco em campo | Borda vai para `primary` e aparece o anel de 3 px (`accent`). | 150 ms, ease |
| 3 | Mouse sobre botões | Troca de cor (`primary` 85% sobre `foreground`; secundário vai para `muted`). | 150 ms |
| 4 | Clique nos botões | Afunda para `scale(.98)` enquanto pressionado. | 100 ms |
| 5 | Erro de validação | Campo balança 2 vezes (±4 px); mensagem entra com fade. | 300 ms e 150 ms |
| 6 | Clicou em "Entrar" ou SSO | Formulário sai com fade; tela de espera entra. Os 3 passos aparecem em sequência. | 200 ms + 200 ms |
| 7 | Cada passo conclui | Spinner vira check; o traço do check se desenha; cor passa a `success`. | 250 ms |
| 8 | Login concluído | Avatar entra com escala 0,9 para 1; botão "Ir para..." aparece em seguida. | 300 ms, ease-out, atraso de 100 ms |
| 9 | Sem perfil | Caixa de aviso entra com fade, sem balanço. | 200 ms |
| 10 | Volta ao formulário ("Cancelar", "Usar outra conta", "Voltar") | Mesma transição do formulário, no sentido inverso. | 200 ms |
| 11 | Spinner dos passos | Giro contínuo. | 800 ms por volta, linear, infinito |

## Estados e imagens

| Estado | Imagem |
|---|---|
| Formulário | `telas/01-formulario.png` |
| Formulário com erro | `telas/02-formulario-erro.png` |
| Aguardando (passo 2 de 3 em andamento) | `telas/03-aguardando.png` |
| Logado | `telas/04-logado.png` |
| Sem perfil | `telas/05-sem-perfil.png` |
| Formulário, modo claro | `telas/06-formulario-modo-claro.png` |

Tempos do protótipo: os passos avançam em 0,8 s, 1,6 s e 2,4 s só para demonstração. Na implementação real, cada passo acompanha a resposta da autenticação.
