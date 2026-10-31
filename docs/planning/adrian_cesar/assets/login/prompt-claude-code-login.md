# Prompt — implementar a tela de login

Antes de colar: copie esta pasta para `docs/planning/adrian_cesar/assets/login/` (imagens em `telas/`, `Login.dc.html` e `login-animacoes.md`).

```markdown
Implemente a tela de login do V-Energy Grid 360 em React + TypeScript, seguindo a referência visual e o comportamento abaixo.

## Referências (leia e abra antes de começar)
- Imagens dos estados: `docs/planning/adrian_cesar/assets/login/telas/` (01-formulario, 02-formulario-erro, 03-aguardando, 04-logado, 05-sem-perfil, 06-formulario-modo-claro). O modo escuro é o padrão.
- Especificação de movimento: `docs/planning/adrian_cesar/assets/login/login-animacoes.md`. Implemente todas as 11 animações da tabela e as regras gerais.
- Protótipo de referência (HTML): `docs/planning/adrian_cesar/assets/login/Login.dc.html`. Use-o para estrutura, textos em pt-BR, tokens e tempos. NÃO copie o HTML: recrie com os componentes e tokens shadcn do projeto (Button, Input, Label, etc.).

## Comportamento
- Estados: formulário, aguardando (3 passos de verificação em sequência), logado, sem perfil.
- Entrar com SSO ou com e-mail e senha. Validar e-mail @v-energy.com.br e senha preenchida; o erro aparece abaixo dos campos, com role="alert" e aria-invalid no campo.
- Os passos do protótipo duram 0,8 s cada só para demonstração. Na implementação real, cada passo acompanha a resposta real da autenticação; a animação apenas reage ao estado. Descubra como o backend autentica hoje (rota, perfis, token) lendo o código e me diga antes de ligar o front; não invente rotas.
- O perfil vem do grupo da conta (Diretoria, Atendimento, Perdas, Operação). Conta sem grupo vai ao estado "sem perfil".
- O bloco "Acesso de demonstração" só aparece se uma variável de ambiente de demo estiver ligada.

## Movimento
- Preferir CSS/Tailwind (transition, keyframes). Só use biblioteca de animação se o projeto já tiver uma; não instale nenhuma.
- Animar apenas opacity e transform.
- Respeitar prefers-reduced-motion conforme o arquivo de especificação.

## Idioma e acessibilidade
- Tudo em pt-BR. Tokens e escalas de espaçamento existentes; sem cores novas.
- O campo de e-mail recebe foco ao abrir. Rótulos ligados aos campos. Enter na senha envia. Região de status com aria-live nos passos de verificação.

## Entrega
1. Liste os arquivos que vai criar antes de começar.
2. Vitest: estados do componente, validação, mensagem de erro, avanço dos passos, e que com reduced-motion nenhuma classe de movimento é aplicada.
3. `make lint-all` e `make test-all`.
4. Se conseguir subir o front, capture os 6 estados e compare com as imagens de referência; diga o que ficou diferente.
5. Não altere outras telas.
```
