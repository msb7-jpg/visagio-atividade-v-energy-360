"""Documentação OpenAPI dos endpoints de gestão de perdas."""

from app.shared.docs import EndpointDoc, OpenApiResponses

AUTH_ERROR_RESPONSES: OpenApiResponses = {
    401: {"description": "Token de acesso ausente, inválido ou expirado."},
    403: {"description": "Perfil sem permissão (apenas diretor e gerente de perdas)."},
}

list_suspicious_units_doc = EndpointDoc(
    summary="Fila de UCs suspeitas priorizada por energia esperada a recuperar",
    description=(
        "Fila classificada: lista UCs que caíram 20% ou mais além da queda da própria classe de consumo (os "
        "pares), medida pelo consumo médio das 3 últimas competências contra as 12 anteriores, ou com leitura "
        "zerada. Comparar com os pares tira a sazonalidade: quando o consumo da classe inteira sobe ou cai, só a "
        "UC que destoa entra. Com LOSS_USE_PEERS=false a fila volta a medir a queda bruta. A "
        "'probabilidade_acerto' segue dois patamares medidos em campo (7,9% abaixo de 20% de queda relativa; "
        "92,5% a partir de 30%), com rampa linear entre 20% e 30%, faixa sem medição. Exclui UCs com geração "
        "distribuída e as já inspecionadas dentro da janela de análise (ordem concluída ou histórico de "
        "campo). Quando a inspeção constatou irregularidade, a UC fica fora por 12 meses e volta antes só com "
        "uma nova queda súbita, posterior à inspeção. Também saem as com ordem cancelada por "
        "'cliente_regularizou' ou 'endereco_nao_localizado' nos últimos 90 "
        "dias; os demais motivos de cancelamento devolvem a UC à fila. UCs com ordem "
        "ativa seguem na lista, com `situacao` ordem_gerada ou em_campo. Cada UC traz `score` de 0 a 100 (kWh "
        "esperado relativo ao topo da fila). Filtros por município, bairro, classe e motivo; "
        "limite padrão de 200 por página (a equipe decide quantas UCs inspecionar; veja /losses/queue-curve). "
        "Ordenação decrescente por kWh esperado, isto é, kWh estimado a recuperar vezes a "
        "taxa histórica de acerto do sinal ('probabilidade_acerto'); o score de risco só desempata. "
        "Se a tabela de inspeções de campo (Fatia 02) ainda não existir, a fila é montada sem excluir esse "
        "histórico e a resposta traz o aviso 'historico_campo_nao_aplicado' em 'avisos'. Se a variável "
        "LOSS_REFERENCE_COMPETENCIA estiver definida (demonstração), a fila é calculada com os dados até essa "
        "competência, contando só as inspeções feitas até o fim dela, e a resposta traz o aviso "
        "'competencia_referencia_fixada'."
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

order_events_doc = EndpointDoc(
    summary="Histórico (trilha de auditoria) de uma ordem de inspeção",
    description=(
        "Lista, do primeiro passo ao mais recente, o que aconteceu com a ordem: geração, envio a campo, resultado "
        "(registrado ou importado por planilha) e cancelamento. Cada evento traz o autor (e-mail), a data e, por "
        "campo alterado, `[valor antes, valor depois]`. Só há eventos de mudanças feitas depois da criação da "
        "trilha; ordens anteriores respondem lista vazia, nunca um histórico reconstruído."
    ),
    response_description="Eventos da ordem em ordem cronológica.",
    responses={**AUTH_ERROR_RESPONSES, 404: {"description": "Ordem de inspeção não encontrada."}},
)

backtest_doc = EndpointDoc(
    summary="Backtest da seleção da fila numa data de corte",
    description=(
        "Refaz a fila como estava na competência de corte (`corte`, 'YYYY-MM'; vazio usa a anterior à primeira "
        "inspeção do histórico), seleciona o top `tamanho` e mede o acerto nas inspeções de campo dos 3 meses "
        "seguintes. A seleção usa só medições e inspeções até o fim do corte (sem vazamento temporal). "
        "`precisao_selecao` é irregulares ÷ inspecionadas entre as selecionadas; `linha_base` é a taxa de acerto "
        "de todas as inspeções da mesma janela, selecionadas ou não. `por_motivo` traz a taxa por motivo "
        "principal, com `amostra_suficiente` falso abaixo do mínimo. Sem histórico de inspeções, devolve "
        "`backtest_executado=false`. Corte fora do histórico responde 400."
    ),
    response_description="Precisão da seleção, linha de base, diferença em p.p., energia recuperada e taxa por motivo.",
    responses={
        **AUTH_ERROR_RESPONSES,
        400: {"description": "Data de corte fora do período do histórico de inspeções."},
        500: {"description": "Falha ao consultar tabelas Gold."},
    },
)

backtest_series_doc = EndpointDoc(
    summary="Backtest da seleção da fila em todos os cortes disponíveis",
    description=(
        "Roda o backtest de cada competência de corte do histórico de inspeções, com o tamanho da capacidade mensal "
        "(`tamanho`), e devolve um resultado por corte, do mais antigo ao mais recente, no mesmo formato de "
        "`/losses/backtest`. Como a fila de cada corte leva segundos para ser refeita, o resultado fica em memória e "
        "em disco e só é recalculado quando muda o Gold, o código ou as ordens do portal anteriores ao último corte "
        "(uma ordem de hoje não invalida). Sem histórico de inspeções, `cortes` vem vazio."
    ),
    response_description="Um resultado de backtest por corte, com precisão, linha de base e taxa por motivo.",
    responses={**AUTH_ERROR_RESPONSES, 500: {"description": "Falha ao consultar tabelas Gold."}},
)

excluded_units_doc = EndpointDoc(
    summary="UCs com queda de consumo que ficaram fora da fila",
    description=(
        "Aba 'Fora da fila': UCs com sinal de suspeita (queda de 20% ou mais, ou leitura zerada) que a fila não "
        "traz, cada uma com o motivo ('possui_gd', 'inspecionada_sem_achado', 'irregularidade_recente' ou "
        "'cancelamento_bloqueante'), a data do evento e `volta_a_ser_avaliada`, o primeiro dia em que a regra "
        "deixa de excluir a UC (vazio para GD, que não tem prazo). Só os motivos que a fila realmente aplica. "
        "Na irregularidade recente a UC pode voltar antes, com nova queda súbita. Usa a mesma competência de "
        "referência da fila. `resumo` conta o conjunto inteiro por motivo; `motivo`, `limit` e `offset` "
        "filtram e paginam `itens`."
    ),
    response_description="Página de UCs excluídas, total do filtro e resumo por motivo.",
    responses={**AUTH_ERROR_RESPONSES, 500: {"description": "Falha ao consultar tabelas Gold."}},
)

unit_detail_doc = EndpointDoc(
    summary="Detalhe de uma UC da Fila de Inspeção",
    description=(
        "Devolve, para uma UC que está na fila agora (com ou sem ordem gerada ou em campo): identificação e "
        "situação; o motivo, com uma frase em pt-BR gerada dos números reais da UC; a conta do score "
        "(kWh recuperável da janela x chance de acerto = kWh esperado; score = kWh esperado / maior kWh esperado "
        "da fila x 100); o consumo mensal das 12 últimas competências, ou desde a primeira leitura da UC com "
        "`historico_completo=true`, sempre até a competência da análise (mês sem leitura válida vem com "
        "`consumo_kwh` nulo, nunca zero) e as inspeções anteriores (histórico de campo e ordens concluídas no "
        "portal; lista vazia se a UC nunca foi inspecionada). UC com ordem concluída ou inspecionada na janela "
        "de análise sai da fila e responde 404, assim como a UC cancelada por cliente regularizado ou endereço "
        "não localizado nos últimos 90 dias; os demais cancelamentos devolvem a UC à fila. O score usa a mesma fila "
        "completa da lista, então os números batem com ela."
    ),
    response_description="Detalhe da UC com a decomposição do score, o consumo de 12 meses e o histórico.",
    responses={
        **AUTH_ERROR_RESPONSES,
        404: {"description": "UC inexistente no cadastro ou fora da fila de inspeção."},
        500: {"description": "Falha ao consultar tabelas Gold."},
    },
)

queue_summary_doc = EndpointDoc(
    summary="Cartões do topo da Fila de Inspeção",
    description=(
        "Resume as ordens abertas (geradas ou em campo, sem teto: a equipe decide quantas UCs inspecionar), "
        "a energia recuperável "
        "das UCs selecionadas (`ucs`, repetível), o retorno esperado (soma, por UC selecionada, de energia x chance "
        "de acerto da própria UC, em kWh/mês e R$/ano) e a taxa histórica de inspeções com irregularidade "
        "confirmada, que não entra no retorno. UCs que já têm ordem ativa ou que saíram da fila "
        "não contam como selecionadas. A tarifa de referência vem em `tarifa_rs_kwh`."
    ),
    response_description="Capacidade, energia e valor das selecionadas, retorno esperado e taxa de acerto.",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {"description": "Falha ao consultar tabelas Gold."},
    },
)

queue_curve_doc = EndpointDoc(
    summary="Curva de retorno acumulado da Fila de Inspeção",
    description=(
        "Soma, UC a UC e na ordem da fila, o retorno esperado (energia recuperável x chance de acerto) das UCs "
        "livres, sem ordem ativa. Mostra onde cada inspeção a mais rende pouco. Com `custo` (R$ por inspeção), "
        "`corte_sugerido` é quantas UCs inspecionar enquanto o retorno esperado em R$/ano de cada uma cobre o "
        "custo; sem `custo` devolve só a curva. `pontos` limita o tamanho da resposta e sempre inclui a última UC."
    ),
    response_description="Curva reduzida, total de UCs livres e corte sugerido.",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {"description": "Falha ao consultar tabelas Gold."},
    },
)

queue_filters_doc = EndpointDoc(
    summary="Opções dos filtros da Fila de Inspeção",
    description=(
        "Lista os municípios e as classes de consumo do cadastro de UCs, em ordem alfabética, e quantas UCs da fila "
        "cada município, classe e motivo devolve (0 quando nenhuma). A contagem é sobre a fila inteira, "
        "sem outros filtros."
    ),
    response_description="Municípios e classes para filtrar a fila, com a contagem de UCs de cada opção.",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {"description": "Falha ao consultar o cadastro de UCs."},
    },
)

list_inspectors_doc = EndpointDoc(
    summary="Listar os inspetores de campo",
    description=(
        "Lista os códigos de inspetor (INSP-001 a INSP-040) do histórico de inspeções de campo, em ordem "
        "crescente. A base não guarda nome de exibição: a resposta traz só `codigo`. Leitura liberada ao diretor "
        "e ao gerente de perdas."
    ),
    response_description="Inspetores do histórico de campo.",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {"description": "Falha ao consultar o histórico de inspeções (fato_inspecoes_perdas)."},
    },
)

list_inspections_doc = EndpointDoc(
    summary="Listar ordens de inspeção",
    description=(
        "Lista as ordens de inspeção da mais recente para a mais antiga, com filtro opcional por status. Cada "
        "ordem traz município, bairro e classe da UC (LEFT JOIN com o cadastro; vazios se a UC não estiver nele)."
    ),
    response_description="Ordens de inspeção encontradas, com o território da UC.",
    responses={
        **AUTH_ERROR_RESPONSES,
        500: {"description": "Falha ao consultar o cadastro de UCs."},
    },
)

export_inspections_doc = EndpointDoc(
    summary="Exportar para campo as ordens de inspeção ativas (CSV)",
    description=(
        "Baixa um CSV (separador ';', UTF-8 com BOM) com as ordens 'gerada' e 'pendente', que são as que vão "
        "a campo. Traz 'id_inspecao' e as colunas de resultado em branco, para a equipe preencher e devolver "
        "pelo upload. Textos livres que começam com '=', '+', '-' ou '@' recebem apóstrofo para não virarem fórmula."
    ),
    response_description="Arquivo CSV com uma linha por ordem ativa.",
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

upload_inspections_doc = EndpointDoc(
    summary="Subir a planilha de retorno de campo e registrar os resultados",
    description=(
        "Recebe o .csv (separador ';' ou ',') ou .xlsx (todas as abas) devolvido pela equipe de campo e concilia "
        "cada linha pelo 'id_inspecao' da planilha exportada. Ordens 'gerada' ou 'pendente' com resultado "
        "preenchido passam a 'concluida'. Aceita as variações reais de campo: resultado ('CONFIRMADA', 'NADA "
        "CONSTA', 'sim', 'não'), datas ('2025-08-01', '14.08.2025', '09-01-2025' como dia-mês-ano) e decimais "
        "com vírgula. Uma linha inválida é recusada com motivo sem abortar as demais; linhas sem resultado "
        "preenchido são contadas em 'ignoradas'. Com `dry_run=true` só valida e resume (`simulacao=true`), "
        "sem gravar nenhuma ordem, para pré-visualizar antes de importar. Limite de 5 MB e 10.000 linhas."
    ),
    response_description="Resumo da conciliação: conciliadas, ignoradas, rejeitadas com motivo e kWh total.",
    responses={
        **AUTH_ERROR_RESPONSES,
        400: {"description": "Formato inválido, arquivo corrompido ou sem a coluna 'id_inspecao'."},
        413: {"description": "Arquivo acima do limite de 5 MB."},
        422: {"description": "Arquivo não enviado (campo multipart 'file')."},
    },
)
