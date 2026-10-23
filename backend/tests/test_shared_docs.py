from app.main import app
from app.shared.docs import EndpointDoc


def test_to_dict_omits_unset_responses():
    doc = EndpointDoc(summary="Resumo", description="Descrição")

    assert doc.to_dict() == {
        "summary": "Resumo",
        "description": "Descrição",
        "response_description": "Operação concluída com sucesso",
    }


def test_to_dict_keeps_custom_responses():
    doc = EndpointDoc(summary="Resumo", description="Descrição", responses={404: {"description": "Não achou"}})

    assert doc.to_dict()["responses"] == {404: {"description": "Não achou"}}


def test_endpoint_doc_is_published_in_openapi():
    operation = app.openapi()["paths"]["/api/v1/losses/inspections"]["post"]

    assert operation["summary"] == "Gerar ordem de inspeção para uma UC"
    assert "usuário autenticado" in operation["description"]
    assert operation["responses"]["201"]["description"] == "Ordem de inspeção criada."
    assert "409" in operation["responses"]


def test_loss_endpoints_document_auth_errors():
    operation = app.openapi()["paths"]["/api/v1/losses/suspicious-units"]["get"]

    assert {"401", "403", "500"} <= operation["responses"].keys()
