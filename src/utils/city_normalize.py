import re

CITY_RU_TO_IATA = {
    "москва": "MOW",
    "париж": "PAR",
    "сочи": "AER",
    "краснодар": "KRR",
    "санкт-петербург": "LED",
    "санкт петербург": "LED",
    "спб": "LED",
    "питер": "LED",
    "ленинград": "LED",
}

CITY_EN_TO_IATA = {
    "moscow": "MOW",
    "paris": "PAR",
    "sochi": "AER",
    "krasnodar": "KRR",
    "saint petersburg": "LED",
    "st petersburg": "LED",
    "st. petersburg": "LED",
    "saint-petersburg": "LED",
}


def normalize_city_input(raw: str) -> str | None:
    """
    Возвращает IATA-код (MOW/PAR/...) если удалось определить по локальным алиасам.
    Если это уже IATA — вернёт upper.
    Если определить не удалось — None.
    """
    if not raw:
        return None

    s = raw.strip()
    if not s:
        return None

    # уже IATA
    if len(s) == 3 and s.isalpha():
        return s.upper()

    low = s.lower().strip()

    # убрать лишние пробелы
    low = re.sub(r"\s+", " ", low)

    if low in CITY_RU_TO_IATA:
        return CITY_RU_TO_IATA[low]
    if low in CITY_EN_TO_IATA:
        return CITY_EN_TO_IATA[low]

    return None