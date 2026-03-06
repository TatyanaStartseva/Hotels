from types import SimpleNamespace

import pytest

from src.api.rooms_search import _vacc_names
from src.services import search_both as search_both_module
from src.services import search_hotels as search_hotels_module


@pytest.mark.parametrize(
    ('payload', 'expected'),
    [
        (['rabies', 'flu'], ['rabies', 'flu']),
        ([{'name': 'rabies'}, {'name': 'flu'}], ['rabies', 'flu']),
        ([{'name': 'rabies'}, {'x': 'skip'}, 'plain'], ['rabies']),
        ([None, '', 'valid'], []),
        (None, []),
    ],
)
def test_vacc_names_extra_cases(payload, expected):
    assert _vacc_names(payload) == expected


@pytest.mark.parametrize(
    ('payload', 'expected'),
    [
        ({'items': [{'id': 1, 'title': 'A', 'location': 'MOW'}]}, [{'id': 1, 'title': 'A', 'location': 'MOW'}]),
        ([SimpleNamespace(id=2, title='B', location='LED')], [{'id': 2, 'title': 'B', 'location': 'LED'}]),
        ([{'id': 3, 'title': 'C', 'location': 'AER'}, SimpleNamespace(id=4, title='D', location='KZN')], [{'id': 3, 'title': 'C', 'location': 'AER'}, {'id': 4, 'title': 'D', 'location': 'KZN'}]),
        ({}, []),
    ],
)
def test_search_hotels_extract_edge_cases(payload, expected):
    assert search_hotels_module._extract_hotels(payload) == expected


@pytest.mark.parametrize(
    ('payload', 'expected'),
    [
        ({'items': [{'id': 1, 'title': 'A', 'location': 'MOW'}]}, [{'id': 1, 'title': 'A', 'location': 'MOW'}]),
        ([SimpleNamespace(id=2, title='B', location='LED')], [{'id': 2, 'title': 'B', 'location': 'LED'}]),
        ([{'id': 3, 'title': 'C', 'location': 'AER'}, {'id': 4, 'title': 'D', 'location': 'KZN'}], [{'id': 3, 'title': 'C', 'location': 'AER'}, {'id': 4, 'title': 'D', 'location': 'KZN'}]),
        (None, []),
    ],
)
def test_search_both_extract_edge_cases(payload, expected):
    assert search_both_module._extract_hotels(payload) == expected
