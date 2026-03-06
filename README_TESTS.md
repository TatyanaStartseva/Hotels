# Набор тестов для Hotels-main

## Куда вставлять

Скопировать содержимое архива в корень проекта `Hotels-main`.

После копирования структура будет такой:

```text
Hotels-main/
├── tests/
│   ├── conftest.py
│   ├── unit/
│   └── integration/
├── pytest.ini
├── requirements-test.txt
└── hotels-frontend/
    ├── playwright.config.ts
    └── e2e/
```

## Что внутри

### Unit
- `tests/unit/test_auth_service.py`
- `tests/unit/test_dependencies.py`
- `tests/unit/test_search_hotels_service.py`
- `tests/unit/test_rooms_search_helpers.py`

### Integration
- `tests/integration/test_auth_api.py`
- `tests/integration/test_hotels_api.py`
- `tests/integration/test_rooms_api.py`
- `tests/integration/test_bookings_api.py`
- `tests/integration/test_pets_api.py`

### E2E
- `hotels-frontend/e2e/auth.spec.ts`
- `hotels-frontend/e2e/hotels.spec.ts`
- `hotels-frontend/e2e/booking-and-pets.spec.ts`

## Как запускать backend-тесты

```bash
pip install -r requirements.txt
pip install -r requirements-test.txt
pytest -q
```

Запуск только unit:

```bash
pytest tests/unit -q
```

Запуск только integration:

```bash
pytest tests/integration -q
```

## Как запускать E2E

```bash
cd hotels-frontend
npm ci
npx playwright install chromium
npx playwright test
```

## Важные замечания

1. Backend-тесты сделаны через `dependency_overrides` и fake DB, поэтому не требуют реального PostgreSQL.
2. E2E-тесты мокают HTTP-запросы фронтенда. Это удобно для курсовой, потому что сценарии воспроизводимы и не зависят от нестабильного backend.
3. В самом проекте уже есть ошибки, из-за которых часть реальных сквозных сценариев может падать даже без проблем в тестах. Например:
   - `src/api/rooms.py` использует `model_dupm()` вместо `model_dump()` в `PUT /rooms/{hotel_id}/rooms/{room_id}`
   - frontend вызывает бронирование без `pet_id`, а backend сейчас требует `pet_id`
   - `rooms_search_router` подключён дважды в `src/main.py`

Для отчёта это даже полезно: можно показать, что тесты находят реальные дефекты.
