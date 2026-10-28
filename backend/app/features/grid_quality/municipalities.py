"""Municípios da Região Metropolitana do Recife: nome de exibição e coordenadas de referência do mapa.

As coordenadas são uma APROXIMAÇÃO estática (centro aproximado de cada município), escolhida só para
posicionar os pontos do mapa. Não vêm do banco nem de nenhuma base geográfica oficial.
O banco guarda o município em MAIÚSCULAS e sem acento (`SAO LOURENCO DA MATA`); a chave deste módulo é esse valor.
"""

import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class MunicipalityReference:
    """Nome de exibição e posição aproximada de um município."""

    name: str
    latitude: float
    longitude: float


MUNICIPALITY_REFERENCES: dict[str, MunicipalityReference] = {
    "ABREU E LIMA": MunicipalityReference("Abreu e Lima", -7.9, -34.9),
    "ARACOIABA": MunicipalityReference("Araçoiaba", -7.78, -35.09),
    "CABO DE SANTO AGOSTINHO": MunicipalityReference("Cabo de Santo Agostinho", -8.29, -35.03),
    "CAMARAGIBE": MunicipalityReference("Camaragibe", -8.02, -34.98),
    "IGARASSU": MunicipalityReference("Igarassu", -7.83, -34.91),
    "ILHA DE ITAMARACA": MunicipalityReference("Ilha de Itamaracá", -7.75, -34.83),
    "IPOJUCA": MunicipalityReference("Ipojuca", -8.4, -35.06),
    "ITAPISSUMA": MunicipalityReference("Itapissuma", -7.77, -34.89),
    "JABOATAO DOS GUARARAPES": MunicipalityReference("Jaboatão dos Guararapes", -8.11, -35.01),
    "MORENO": MunicipalityReference("Moreno", -8.12, -35.09),
    "OLINDA": MunicipalityReference("Olinda", -8.01, -34.85),
    "PAULISTA": MunicipalityReference("Paulista", -7.94, -34.87),
    "RECIFE": MunicipalityReference("Recife", -8.05, -34.9),
    "SAO LOURENCO DA MATA": MunicipalityReference("São Lourenço da Mata", -8.0, -35.02),
}


def normalize_municipality(name: str) -> str:
    """Converte um nome de exibição para a chave do banco (sem acento, maiúsculas).

    Args:
        name: Nome como o usuário vê, por exemplo 'São Lourenço da Mata'.

    Returns:
        Chave no formato do banco, por exemplo 'SAO LOURENCO DA MATA'.
    """
    decomposed = unicodedata.normalize("NFKD", name.strip())
    return "".join(char for char in decomposed if not unicodedata.combining(char)).upper()
