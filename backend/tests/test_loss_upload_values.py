from datetime import date, datetime

import pytest

from app.features.loss_management.upload_values import (
    InvalidValueError,
    normalize_header,
    parse_field_date,
    parse_irregularity,
    parse_kwh,
)


@pytest.mark.parametrize(
    "raw",
    ["CONFIRMADA", "irregularidade confirmada", "Sim", " S ", "sim.", True, "Irregularidade Confirmada "],
)
def test_irregularity_confirmed_variants_are_true(raw):
    assert parse_irregularity(raw) is True


@pytest.mark.parametrize(
    "raw",
    ["NADA CONSTA", "não", "Nao", "N", "sem irregularidade", "não confirmada", "irregularidade não confirmada", False],
)
def test_irregularity_negative_variants_are_false(raw):
    assert parse_irregularity(raw) is False


@pytest.mark.parametrize("raw", [None, "", "   "])
def test_irregularity_blank_means_not_filled(raw):
    assert parse_irregularity(raw) is None


def test_irregularity_unknown_text_is_rejected():
    with pytest.raises(InvalidValueError, match="irregularidade_constatada"):
        parse_irregularity("talvez")


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("2025-08-01", date(2025, 8, 1)),
        ("14.08.2025", date(2025, 8, 14)),
        ("09-01-2025", date(2025, 9, 1)),
        ("09-25-2025", date(2025, 9, 25)),
        ("14-08-2025", date(2025, 8, 14)),
        ("14/08/2025", date(2025, 8, 14)),
        ("2025-08-01 10:30:00", date(2025, 8, 1)),
        (datetime(2025, 8, 1, 10, 30), date(2025, 8, 1)),
        (date(2025, 8, 1), date(2025, 8, 1)),
        ("", None),
        (None, None),
    ],
)
def test_field_date_accepts_the_formats_seen_in_field(raw, expected):
    assert parse_field_date(raw) == expected


@pytest.mark.parametrize("raw", ["31.02.2025", "ontem", "2025/13/40"])
def test_field_date_rejects_impossible_values(raw):
    with pytest.raises(InvalidValueError, match="data_inspecao"):
        parse_field_date(raw)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("1234,56", 1234.56),
        ("1.234,56", 1234.56),
        ("1,234.56", 1234.56),
        ("1234.56", 1234.56),
        ("1.234", 1234.0),
        ("0,5", 0.5),
        ("850 kWh", 850.0),
        (850, 850.0),
        (12.5, 12.5),
        ("", None),
        (None, None),
    ],
)
def test_kwh_accepts_comma_dot_and_thousand_separators(raw, expected):
    assert parse_kwh(raw) == expected


@pytest.mark.parametrize("raw", ["abc", "-5", -3, "1,2,3", "nan", "inf"])
def test_kwh_rejects_text_negative_and_non_finite(raw):
    with pytest.raises(InvalidValueError, match="kwh_recuperado"):
        parse_kwh(raw)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("id_inspecao", "id_inspecao"),
        (" ID Inspeção ", "id_inspecao"),
        ("Irregularidade Constatada", "irregularidade_constatada"),
        ("kWh Recuperado", "kwh_recuperado"),
        (None, ""),
    ],
)
def test_header_is_normalized_to_snake_case_without_accents(raw, expected):
    assert normalize_header(raw) == expected
