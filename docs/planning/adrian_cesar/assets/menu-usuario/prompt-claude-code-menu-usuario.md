# Prompt — implementar o menu do usuário

Antes de colar: copie esta pasta para `docs/planning/adrian_cesar/assets/menu-usuario/` (imagens em `telas/`).
Este prompt tem duas fases. O Claude Code PARA no fim da fase 1 e espera sua resposta.

```markdown
Implemente o menu do usuário do AppShell do V-Energy Grid 360 (React + TypeScript + shadcn).

## Referências (leia e abra antes de começar)
- Especificação: `docs/planning/adrian_cesar/assets/menu-usuario/menu-usuario-especificacao.md`.
- Imagens: `docs/planning/adrian_cesar/assets/menu-usuario/telas/`. O modo escuro é o padrão.
- Use o `DropdownMenu` do shadcn (Radix), com `DropdownMenuRadioGroup` para os perfis. Se o componente ainda não estiver no projeto, adicione-o pelo CLI do shadcn e avise.

## Fase 1 — só leitura (não altere código)
Descubra no código real e responda:
1. Como o usuário autenticado e o perfil chegam ao front hoje (rota, token, campos; de onde vem o grupo). Cite arquivo e linha.
2. Onde fica o AppShell, o tema atual (claro/escuro) e onde ele é guardado.
3. Existe hoje um modo demonstração, usuários de exemplo ou uma forma de entrar como outro perfil? Como o backend decide as permissões por rota?
4. Qual das opções serve melhor para a troca de perfil em demonstração, com justificativa: (a) fazer login como o usuário de exemplo escolhido; (b) o front só muda a visão e o backend aceita um perfil de demo; (c) outra. Diga os riscos de segurança de cada uma.
5. Qual é a tela inicial de cada perfil no front (rota).
Escreva as respostas no chat e PARE. Não implemente nada até eu responder.

## Fase 2 — implementação (só depois da minha resposta)
Itens do menu, na ordem: cabeçalho (nome; cargo e perfil; grupo), alternar tema, [só em demonstração: aviso e lista de perfis], Sair. Cada item como na especificação.

- Dados do cabeçalho vêm da conta autenticada; nada fixo no código.
- Tema: salvar em `grid360.tema`, aplicar antes da primeira pintura (sem piscar), padrão escuro. Sem opção "Sistema".
- Demonstração controlada por variável de ambiente; em produção o menu não mostra aviso nem perfis.
- Ao trocar de perfil, navegar para a tela inicial do novo perfil.
- "Sair" encerra a sessão de verdade (limpa token) e vai ao login.
- Fecha com `Esc` (foco volta ao botão) e ao clicar fora. No celular, altura máxima com rolagem interna e largura dentro da tela.
- Movimento: tabela da seção "Movimento" da especificação, só com CSS/Tailwind; respeitar prefers-reduced-motion.
- Tudo em pt-BR; tokens e espaçamentos existentes; alvos de toque de 44 px.

## Entrega da fase 2
1. Liste os arquivos que vai criar ou alterar antes de começar.
2. Vitest: abre e fecha (clique, `Esc`, clique fora); itens corretos em produção e em demonstração; troca de tema grava e aplica; troca de perfil navega para a tela inicial; perfil atual marcado; Sair limpa a sessão.
3. `make lint-all` e `make test-all`.
4. Se conseguir subir o front, capture os estados das imagens de referência e diga o que ficou diferente.
5. Não altere outras telas.
```
