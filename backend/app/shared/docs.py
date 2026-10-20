"""Metadados padronizados de documentação OpenAPI/Swagger para os endpoints."""

from dataclasses import asdict, dataclass
from typing import Any

type OpenApiResponses = dict[int | str, dict[str, Any]]


@dataclass(frozen=True, slots=True)
class EndpointDoc:
    """Metadados imutáveis de documentação OpenAPI/Swagger de um endpoint."""

    summary: str
    description: str
    response_description: str = "Operação concluída com sucesso"
    responses: OpenApiResponses | None = None

    def to_dict(self) -> dict[str, Any]:
        """Converte os metadados em kwargs do decorator FastAPI, omitindo valores None."""
        raw = asdict(self)
        return {key: value for key, value in raw.items() if value is not None}
