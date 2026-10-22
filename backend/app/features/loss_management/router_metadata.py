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
        "da equipe de campo). Ordenação decrescente por valor esperado (score de risco x kWh estimado). "
        "Se a tabela de inspeções de campo (Fatia 02) ainda não existir, a fila é montada sem excluir esse "
        "histórico e a resposta traz o aviso 'historico_campo_nao_aplicado' em 'avisos'."
    ),
    response_description="Fila priorizada de UCs suspeitas (`itens`) e avisos de degradação da análise (`avisos`).",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {
            "description": (
                "Falha ao consultar tabelas Gold: cadastro ou medição ausentes ou fora do contrato, ou "
                "inspeções de campo existentes com colunas fora do contrato (só a ausência da tabela de "
                "inspeções é tolerada, com aviso)."
            )
        },
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
    description=(
        "Abre uma ordem com status 'gerada' e registra o usuário autenticado como autor. A UC precisa existir "
        "no cadastro. O kWh estimado é calculado pelo servidor com a regra da fila (não é aceito no corpo); "
        "UC fora da fila (sem suspeita ou com GD) gera ordem manual com 0 kWh."
    ),
    response_description="Ordem de inspeção criada.",
    responses={
        **AUTH_ERROR_RESPONSES,
        404: {"description": "UC não encontrada no cadastro."},
        409: {"description": "A UC já possui ordem de inspeção ativa (gerada ou pendente)."},
        422: {"description": "Corpo inválido, inclusive campos não aceitos como 'kwh_estimado'."},
        500: {"description": "Falha ao consultar tabelas Gold (cadastro ou medição)."},
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
