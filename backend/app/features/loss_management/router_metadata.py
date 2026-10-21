"""Documentação OpenAPI dos endpoints de gestão de perdas."""

from app.shared.docs import EndpointDoc, OpenApiResponses

AUTH_ERROR_RESPONSES: OpenApiResponses = {
    401: {"description": "Token de acesso ausente, inválido ou expirado."},
    403: {"description": "Perfil sem permissão (apenas diretor e gerente de perdas)."},
}

list_suspicious_units_doc = EndpointDoc(
    summary="Fila de UCs suspeitas priorizada por energia esperada a recuperar",
    description=(
        "Lista UCs com queda >= 50% do consumo médio das 3 últimas competências em relação às 12 anteriores, "
        "ou com leitura zerada. Exclui UCs com geração distribuída, com ordem de inspeção ativa e as já "
        "inspecionadas dentro da janela de análise (ordem concluída ou histórico de campo); ordem cancelada "
        "devolve a UC à fila. Filtros por município, bairro e classe; limite padrão de 200 (capacidade mensal "
        "da equipe de campo). Ordenação decrescente por valor esperado (score de risco x kWh estimado)."
    ),
    response_description="Fila priorizada de UCs suspeitas.",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {"description": "Falha ao consultar tabelas Gold (cadastro, medição ou inspeções)."},
    },
)

list_inspections_doc = EndpointDoc(
    summary="Listar ordens de inspeção",
    description="Lista as ordens de inspeção da mais recente para a mais antiga, com filtro opcional por status.",
    response_description="Ordens de inspeção encontradas.",
    responses=AUTH_ERROR_RESPONSES,
)

create_inspection_doc = EndpointDoc(
    summary="Gerar ordem de inspeção para uma UC",
    description="Abre uma ordem com status 'gerada' e registra o usuário autenticado como autor.",
    response_description="Ordem de inspeção criada.",
    responses={
        **AUTH_ERROR_RESPONSES,
        409: {"description": "A UC já possui ordem de inspeção ativa (gerada ou pendente)."},
    },
)

update_inspection_doc = EndpointDoc(
    summary="Atualizar status, registrar resultado de campo ou cancelar ordem",
    description=(
        "Transições permitidas: gerada -> pendente | cancelada; pendente -> concluida | cancelada. "
        "Concluir exige 'irregularidade_constatada'; cancelar exige 'justificativa_cancelamento'."
    ),
    response_description="Ordem de inspeção atualizada.",
    responses={
        **AUTH_ERROR_RESPONSES,
        400: {"description": "Dados obrigatórios da transição ausentes."},
        404: {"description": "Ordem de inspeção não encontrada."},
        409: {"description": "Transição de status inválida."},
    },
)
