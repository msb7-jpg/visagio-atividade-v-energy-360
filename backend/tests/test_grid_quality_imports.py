"""Contrato de imports do pacote grid_quality, verificado por AST (sem editar o pyproject.toml).

Cobre só imports diretos de cada arquivo; o import-linter também cobre os transitivos, mas o
contrato dele lista módulos explicitamente e é um arquivo compartilhado.
"""

import ast
from pathlib import Path

import pytest

PACKAGE_DIR = Path(__file__).resolve().parents[1] / "app" / "features" / "grid_quality"
MODULE_NAMES = sorted(module_path.stem for module_path in PACKAGE_DIR.glob("*.py"))
OWN_PACKAGE = "app.features.grid_quality"
FEATURES_PACKAGE = "app.features"
HTTP_FRAMEWORKS = ("fastapi", "starlette", "sse_starlette")


def parse_module(module_name: str) -> ast.Module:
    """Lê e interpreta o código-fonte de um módulo do pacote."""
    source_code = (PACKAGE_DIR / f"{module_name}.py").read_text(encoding="utf-8")
    return ast.parse(source_code)


def imported_modules(module_name: str) -> set[str]:
    """Coleta os módulos importados de forma absoluta por um arquivo do pacote."""
    imported: set[str] = set()
    for node in ast.walk(parse_module(module_name)):
        if isinstance(node, ast.Import):
            imported.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            imported.add(node.module)
    return imported


def is_under(module: str, package_names: tuple[str, ...]) -> bool:
    """Indica se o módulo é um dos pacotes informados ou está dentro de um deles."""
    return any(module == package or module.startswith(f"{package}.") for package in package_names)


def test_localiza_os_modulos_do_pacote():
    assert {"rules", "service", "router", "repository", "queries", "schemas"} <= set(MODULE_NAMES)


@pytest.mark.parametrize("module_name", ["service", "rules"])
def test_servico_e_regras_nao_importam_frameworks_http(module_name):
    http_imports = [module for module in imported_modules(module_name) if is_under(module, HTTP_FRAMEWORKS)]

    assert http_imports == []


def test_regras_puras_nao_importam_sqlalchemy():
    sqlalchemy_imports = [module for module in imported_modules("rules") if is_under(module, ("sqlalchemy",))]

    assert sqlalchemy_imports == []


@pytest.mark.parametrize("module_name", MODULE_NAMES)
def test_pacote_nao_importa_outras_features(module_name):
    foreign_imports = [
        module
        for module in imported_modules(module_name)
        if is_under(module, (FEATURES_PACKAGE,)) and not is_under(module, (OWN_PACKAGE,))
    ]

    assert foreign_imports == []


@pytest.mark.parametrize("module_name", MODULE_NAMES)
def test_pacote_usa_apenas_imports_absolutos(module_name):
    relative_imports = [
        node
        for node in ast.walk(parse_module(module_name))
        if isinstance(node, ast.ImportFrom) and node.level > 0
    ]

    assert relative_imports == []
