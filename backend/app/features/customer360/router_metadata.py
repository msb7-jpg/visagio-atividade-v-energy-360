"""Documentação OpenAPI dos endpoints da Visão 360 da Unidade Consumidora."""

from app.shared.docs import EndpointDoc, OpenApiResponses

AUTH_ERROR_RESPONSES: OpenApiResponses = {
    401: {"description": "Token de acesso ausente, inválido ou expirado."},
    403: {
        "description": (
            "Perfil sem permissão (acessam atendente, gerente de atendimento, gerente de perdas, "
            "gerente de operação e diretor)."
        )
    },
}
NOT_FOUND_RESPONSE: OpenApiResponses = {
    404: {"description": "Nenhuma UC com esse número no cadastro (`CustomerNotFoundError`)."},
}
GOLD_ERROR_RESPONSE: OpenApiResponses = {
    500: {"description": "Tabela Gold ausente ou fora do contrato (`DatabaseReadError`, com o nome da tabela)."},
}

search_customers_doc = EndpointDoc(
    summary="Sugestões de UC pelo número da UC, do medidor ou por parte do nome do titular",
    description=(
        "Busca enquanto o atendente digita. O número é normalizado (sem espaços nem separadores; prefixo `UC` ou "
        "`MD` quando só há dígitos) e buscado por \"começa com\" no número da UC e do medidor; o nome é buscado por "
        "\"contém\", com espaços normalizados e curingas escapados. Abaixo de 3 caracteres devolve lista vazia. "
        "Resultados em ordem de número da UC (ADR-021)."
    ),
    response_description="Até `limite` UCs (padrão 8, máximo 20) com nome, medidor, bairro, município e classe.",
    responses={**AUTH_ERROR_RESPONSES, **GOLD_ERROR_RESPONSE},
)

customer_summary_doc = EndpointDoc(
    summary="Cadastro, medidor e geração solar da UC",
    description=(
        "Quem é o cliente: titular, classe e subgrupo, endereço, alimentador, medidor ativo e, quando houver, a "
        "potência e a data de conexão do painel solar. Aceita o número digitado em vários formatos "
        "(`UC100004`, ` uc100004 `, `100004`)."
    ),
    response_description="Cadastro da UC.",
    responses={**AUTH_ERROR_RESPONSES, **NOT_FOUND_RESPONSE, **GOLD_ERROR_RESPONSE},
)

customer_history_doc = EndpointDoc(
    summary="Consumo de 12 meses contra o ano anterior, faturas e diagnóstico de conta alta",
    description=(
        "Janela de 12 meses que termina na última leitura da própria UC, cada mês ao lado do mesmo mês do ano "
        "anterior; os totais somam só os meses que existem nos dois anos (ADR-019). O diagnóstico de conta alta "
        "traz cinco causas, sem texto: consumo (subiu ou caiu acima de 10%, ADR-017), leitura estimada, dias "
        "faturados, bandeira e preço médio do kWh (ADR-018). Inclui todas as faturas, as em aberto (`ABERTA` e "
        "`VENCIDA`) com o total e a pontualidade de pagamento."
    ),
    response_description="Histórico mensal, totais de 12 meses, diagnóstico, faturas e pontualidade.",
    responses={**AUTH_ERROR_RESPONSES, **NOT_FOUND_RESPONSE, **GOLD_ERROR_RESPONSE},
)

customer_events_doc = EndpointDoc(
    summary="Interrupções da UC e do alimentador, chamados e inspeções de perdas",
    description=(
        "Falta de luz em dois níveis: cada interrupção que atingiu a própria UC depois da ligação (até 50, da "
        "mais recente para a mais antiga, com o resumo de todas) e o DEC/FEC mensal do alimentador, sem limite "
        "ANEEL (ADR-020). Inclui os chamados do cliente e o histórico de inspeções de perdas da UC."
    ),
    response_description="Interrupções, qualidade do alimentador, chamados e inspeções.",
    responses={**AUTH_ERROR_RESPONSES, **NOT_FOUND_RESPONSE, **GOLD_ERROR_RESPONSE},
)
