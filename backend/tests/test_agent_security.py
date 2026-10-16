from app.agent.nodes.sql_validator import validate_sql_query
from app.core.constants import SqlErrorCategory


def test_sql_validator_allows_select_and_cte():
    valid_select = "SELECT id_uc, consumo FROM fato_medicao WHERE mes = '2026-01';"
    is_valid, err, _ = validate_sql_query(valid_select)
    assert is_valid is True
    assert err is None

    valid_cte = "WITH resumo AS (SELECT id_uc, sum(valor) as total FROM faturas GROUP BY id_uc) SELECT * FROM resumo;"
    is_valid_cte, err_cte, _ = validate_sql_query(valid_cte)
    assert is_valid_cte is True
    assert err_cte is None


def test_sql_validator_blocks_ddl_and_dml():
    destructive_queries = [
        "DROP TABLE clientes;",
        "DELETE FROM faturas WHERE id = 1;",
        "UPDATE faturas SET valor = 0;",
        "INSERT INTO medidores VALUES (1, 'hack');",
        "ALTER TABLE contratos ADD COLUMN pwned TEXT;",
        "ATTACH DATABASE 'evil.db' AS evil;",
        "PRAGMA table_info(clientes);",
    ]

    for query in destructive_queries:
        is_valid, _err, cat = validate_sql_query(query)
        assert is_valid is False, f"Deveria ter bloqueado: {query}"
        assert cat == SqlErrorCategory.SECURITY_VIOLATION


def test_sql_validator_blocks_multi_statement():
    multi_query = "SELECT 1; DROP TABLE faturas;"
    is_valid, _err, cat = validate_sql_query(multi_query)
    assert is_valid is False
    assert cat == SqlErrorCategory.SECURITY_VIOLATION


def test_sql_validator_blocks_system_tables():
    sys_query = "SELECT * FROM sqlite_master;"
    is_valid, _err, cat = validate_sql_query(sys_query)
    assert is_valid is False
    assert cat == SqlErrorCategory.SECURITY_VIOLATION
