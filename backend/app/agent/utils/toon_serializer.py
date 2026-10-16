from collections.abc import Mapping, Sequence


def serialize_record_value(cell_value: object) -> str:
    """
    Formata um valor de célula individual para representação segura em linha tabular TOON.
    Aplica aspas duplas de escape caso o valor contenha delimitadores como vírgula,
    dois-pontos, aspas ou quebras de linha.
    """
    if cell_value is None:
        return ""

    string_representation = str(cell_value)
    requires_quoting = (
        "," in string_representation
        or '"' in string_representation
        or ":" in string_representation
        or "\n" in string_representation
    )

    if requires_quoting:
        escaped_quotes = string_representation.replace('"', '\\"')
        return f'"{escaped_quotes}"'

    return string_representation


def serialize_to_toon_tabular(
    dataset_name: str,
    records: Sequence[Mapping[str, object]],
) -> str:
    """
    Serializa uma coleção uniforme de registros no formato tabular TOON.

    Estrutura gerada:
        nome_dataset[N]{coluna_a,coluna_b,...}:
          valor_a1,valor_b1,...
          valor_a2,valor_b2,...
    """
    if not records:
        return f"{dataset_name}[0]: vazio"

    header_names: list[str] = list(records[0].keys())
    headers_declaration = ",".join(header_names)
    total_records = len(records)

    output_lines: list[str] = [f"{dataset_name}[{total_records}]{{{headers_declaration}}}:"]

    for row_record in records:
        formatted_row_values: list[str] = [
            serialize_record_value(row_record.get(column_name))
            for column_name in header_names
        ]
        output_lines.append(f"  {','.join(formatted_row_values)}")

    return "\n".join(output_lines)
