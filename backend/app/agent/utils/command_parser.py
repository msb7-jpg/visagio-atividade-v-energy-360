import re

from typing_extensions import TypedDict


class SlashCommandInfo(TypedDict, total=False):
    """Metadados do comando de barra identificado na mensagem."""

    name: str
    args: str | None


KNOWN_COMMANDS: dict[str, str] = {
    "sql": "Força rota e execução direta de consulta Text-to-SQL relacional",
    "direct": "Força resposta direta/institucional sem consulta ao banco",
    "explain": "Explica a metodologia analítica, métricas ou consulta executada",
    "clear": "Limpeza do contexto conversacional",
}


def parse_slash_command(text: str) -> tuple[SlashCommandInfo | None, str]:
    """
    Identifica comandos iniciados com '/' no início da mensagem.

    Args:
        text: Mensagem original do usuário.

    Returns:
        Tupla contendo as informações do comando (se conhecido) e o texto limpo restante.
    """
    if not text:
        return None, ""

    stripped = text.strip()
    match = re.match(r"^/([a-zA-Z_-]+)(?:\s+(.*))?$", stripped, re.DOTALL)
    if not match:
        return None, text

    cmd_raw = match.group(1).lower()
    args_raw = (match.group(2) or "").strip()

    if cmd_raw in KNOWN_COMMANDS:
        return (
            SlashCommandInfo(name=cmd_raw, args=args_raw or None),
            args_raw or text,
        )

    return None, text
