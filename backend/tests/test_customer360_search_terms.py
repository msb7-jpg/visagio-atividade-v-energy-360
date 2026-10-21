import pytest

from app.features.customer360.search_terms import (
    is_searchable,
    normalize_id_uc,
    normalize_meter,
    prefix_range,
)


@pytest.mark.parametrize("typed_text", ["UC100004", "uc100004", " uc 100004 ", "UC-100004", "100004", "100.004"])
def test_uc_number_is_accepted_in_any_format(typed_text):
    assert normalize_id_uc(typed_text) == "UC100004"


@pytest.mark.parametrize("typed_text", ["MD500004", "md 500004", "500004"])
def test_meter_number_is_accepted_in_any_format(typed_text):
    assert normalize_meter(typed_text) == "MD500004"


def test_prefix_range_covers_everything_that_starts_with_prefix():
    search_range = prefix_range("UC1000")

    assert search_range.start <= "UC100004" < search_range.end
    assert not search_range.start <= "UC100100" < search_range.end


@pytest.mark.parametrize(("typed_text", "expected"), [("10", False), (" u c ", False), ("100", True), ("UC1", True)])
def test_search_requires_three_useful_characters(typed_text, expected):
    assert is_searchable(typed_text) is expected
