from src.api.rooms_search import _vacc_names


def test_vacc_names_from_string_list():
    assert _vacc_names(['rabies', 'flu']) == ['rabies', 'flu']


def test_vacc_names_from_dict_list():
    assert _vacc_names([{'name': 'rabies'}, {'name': 'flu'}, {'x': 'skip'}]) == ['rabies', 'flu']


def test_vacc_names_empty_input():
    assert _vacc_names(None) == []
    assert _vacc_names([]) == []
