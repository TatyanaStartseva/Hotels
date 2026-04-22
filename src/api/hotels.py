from typing import Literal

from black import assert_equivalent
from fastapi import HTTPException

from fastapi import APIRouter , Query,Body

from src.api.dependencies import PaginationDep, AdminDep, HotelOwnerDep, ensure_hotel_owner_or_admin
from src.models.hotels import HotelsOrm
from src.schemas.hotels import Hotel, HotelPatch, HotelAdd, HotelOwnerCreate, HotelStatusPatch
from src.clients.amadeus import AmadeusClient
from src.services.search_both import search_hotels_read_through_both

router = APIRouter(prefix="/hotels",tags=['Отели'])
from datetime import date
from src.api.dependencies import DBDep
from src.services.search_hotels import search_hotels_catalog_read_through
from src.utils.city_normalize import normalize_city_input

@router.get('', summary='Получение информации об отелях')
async def get_hotels(
    pagination: PaginationDep,
    db: DBDep,
    id: int | None = Query(None, description="id"),
    title: str | None = Query(None, description="Название отеля"),
    location: str | None = Query(None, description="Адрес / город"),
):
    per_page = pagination.per_page or 5

    # сначала пробуем локальные алиасы (RU/EN -> IATA)
    if location:
        city_raw = location.strip()
        location_variants = {city_raw}

        city_code = normalize_city_input(city_raw)

        if not city_code:
            am = AmadeusClient()
            city_code = await am.resolve_city_code(city_raw)

        if city_code:
            location_variants.add(city_code)


    else:
        location_variants = None

    return await db.hotels.get_all(
        id=id,
        location_variants=list(location_variants) if location_variants else None,
        title=title,
        limit=per_page,
        offset=per_page * (pagination.page - 1),
    )


@router.delete("/{hotel_id}",summary='Удаление отеля из базы данных')
async def delete_hotel(hotel_id:int,admin_id: AdminDep,db : DBDep ):
    result = await db.hotels.delete(id=hotel_id)
    await db.commit()
    return result

# НУЖНО ЧТОБЫ ОН ТОЖЕ ПЕРЕДЕЛЫВАЛ ВБИТЫЙ ГОРОД ПО 3 БУКВЫ
@router.post("", summary="Добавление нового отеля")
async def post_hotels(
    db: DBDep,
    admin_id: AdminDep,
    hotel_data: HotelAdd = Body(
        openapi_examples={
            "1": {
                "summary": "Сочи",
                "value": {
                    "title": "Сочи Гранд Отель",
                    "location": "Сочи",
                    "images": ["https://picsum.photos/seed/sochi/900/600"],
                },
            }
        }
    ),
):
    city_raw = hotel_data.location.strip()

    #  1) сначала локально RU/EN -> IATA
    city_code = normalize_city_input(city_raw)

    # 2) если не получилось — пробуем Amadeus
    if not city_code:
        am = AmadeusClient()
        city_code = await am.resolve_city_code(city_raw)

    if not city_code:
        raise HTTPException(
            status_code=400,
            detail=f"Не удалось определить IATA-код для '{city_raw}'",
        )

    # 3) сохраняем ВСЕ поля (важно: images не потерять)
    payload = {
        "title": hotel_data.title,
        "location": city_code,
        "images": hotel_data.images,
    }

    #  если у тебя уже добавлены поля варианта 2 — сохраним русские значения
    if hasattr(HotelsOrm, "location_ru"):
        payload["location_ru"] = city_raw
    if hasattr(HotelsOrm, "title_ru"):
        payload["title_ru"] = hotel_data.title  # или введёшь отдельно

    normalized = HotelAdd(**payload)

    hotel = await db.hotels.add(normalized)
    await db.commit()
    return {"status": "ok", "saved": hotel}


@router.patch("/{id}", summary="Частичное обновление данных об отеле",
     description="<h1>Тут мы частично обновляем данные об отеле</h1>")
async def patch_hotels(id:int, hotel_data:HotelPatch,db : DBDep,admin_id: AdminDep):
    hotel = await db.hotels.edit(hotel_data, exclude_unset=True, id = id)
    if hotel["status"] == 'success':
        await db.commit()
        return {"status": "Ok"}
    else:
        raise HTTPException(status_code=404, detail="Hotel not found")


@router.put("/{id}",summary='Обновление данных об отеле')
async def patch_hotels(id: int,hotel_data:HotelAdd,db : DBDep,admin_id: AdminDep):
    hotel = await db.hotels.edit(hotel_data,id= id)
    if hotel["status"] =='success':
        await db.commit()
        return {"status": "Ok"}
    else:
        raise HTTPException(status_code=404, detail="Hotel not found")


@router.get("/{hotel_id}")
async def get_hotel(hotel_id:int,db : DBDep):
    return await db.hotels.get_hotel(hotel_id)


@router.post("/ingest/amadeus")
async def ingest_from_amadeus(
    db: DBDep,
    city: str = Query(...),
    check_in: str = Query(...),
    check_out: str = Query(...),
    adults: int = Query(1, ge=1, le=9),
    max_hotels: int = Query(600, ge=1, le=2000),  # ← опционально
):
    from src.services.ingest_amadeus import ingest_hotels_from_amadeus
    #приводим город к 3 буквенному значению
    city_raw = city.strip()
    if len(city_raw) == 3 and city_raw.isalpha():
        code = city_raw.upper()
    else:
        am = AmadeusClient()
        code = await am.resolve_city_code(city_raw)
        if not code:
            raise HTTPException(status_code = 400, detail=f"Не удалось определить IATA-код для '{city}'")

    summary = await ingest_hotels_from_amadeus(
        db, city_code=code, check_in=check_in, check_out=check_out, adults=adults
    )
    return {"status": "ok", **summary}


@router.get("/actions/search", summary="Поиск отелей + пополнение каталога (Amadeus/Xotelo/both)")
async def search_hotels_both(
    db: DBDep,
    city: str = Query(..., description="Город: Moscow или IATA (MOW)"),
    check_in: str = Query(..., description="YYYY-MM-DD"),
    check_out: str = Query(..., description="YYYY-MM-DD"),
    adults: int = Query(1, ge=1, le=9),
    providers: Literal["amadeus", "xotelo", "both"] = Query("both"),
    # провайдер-специфичные параметры:
    max_hotels_amadeus: int = Query(400, ge=1, le=1200),
    limit_hotels_xotelo: int = Query(80, ge=1, le=200),
    with_rates: bool = Query(False, description="Подтянуть цены Xotelo (/rates) — медленнее"),
    alias_location: bool = Query(False, description='Сохранять алиасы в location (например "MOW Moscow Москва")'),
):
    # валидация дат
    try:
        din = date.fromisoformat(check_in); dout = date.fromisoformat(check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Формат дат YYYY-MM-DD")
    if dout <= din:
        raise HTTPException(status_code=400, detail="check_out должен быть позже check_in")

    return await search_hotels_read_through_both(
        db=db,
        city_input=city.strip(),
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        providers=providers,
        max_hotels_amadeus=max_hotels_amadeus,
        limit_hotels_xotelo=limit_hotels_xotelo,
        with_rates=with_rates,
        alias_location=alias_location,
    )


@router.post("/owner", summary="Владелец создаёт свой отель")
async def create_owner_hotel(
    db: DBDep,
    owner_id: HotelOwnerDep,
    hotel_data: HotelOwnerCreate,
):
    city_raw = hotel_data.location.strip()

    city_code = normalize_city_input(city_raw)
    if not city_code:
        am = AmadeusClient()
        city_code = await am.resolve_city_code(city_raw)

    if not city_code:
        raise HTTPException(
            status_code=400,
            detail=f"Не удалось определить IATA-код для '{city_raw}'",
        )

    payload = {
        "title": hotel_data.title,
        "location": city_code,
        "images": hotel_data.images,
        "owner_id": owner_id,
        "status": "draft",
        "location_ru": hotel_data.location_ru or city_raw,
        "title_ru": hotel_data.title_ru or hotel_data.title,
    }

    hotel = await db.hotels.add(HotelAdd(**payload))
    await db.commit()
    return {"status": "ok", "saved": hotel}


@router.get("/owner/my", summary="Мои отели")
async def get_my_hotels(db: DBDep, owner_id: HotelOwnerDep):
    return await db.hotels.get_all(owner_id=owner_id, only_published=False, limit=100, offset=0)


@router.patch("/owner/{hotel_id}", summary="Владелец редактирует свой отель")
async def patch_my_hotel(
    hotel_id: int,
    hotel_data: HotelPatch,
    db: DBDep,
    owner_id: HotelOwnerDep,
):
    await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    update_data = hotel_data.model_dump(exclude_unset=True)

    if "location" in update_data and update_data["location"]:
        city_raw = update_data["location"].strip()
        city_code = normalize_city_input(city_raw)
        if not city_code:
            am = AmadeusClient()
            city_code = await am.resolve_city_code(city_raw)
        if not city_code:
            raise HTTPException(status_code=400, detail=f"Не удалось определить IATA-код для '{city_raw}'")
        update_data["location"] = city_code
        update_data["location_ru"] = city_raw

    res = await db.hotels.edit(HotelPatch(**update_data), exclude_unset=True, id=hotel_id)
    if res["status"] != "success":
        raise HTTPException(status_code=404, detail="Hotel not found")

    await db.commit()
    return {"status": "ok"}

@router.post("/owner/{hotel_id}/publish", summary="Опубликовать свой отель")
async def publish_my_hotel(
    hotel_id: int,
    db: DBDep,
    owner_id: HotelOwnerDep,
):
    hotel = await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    if not hotel.images:
        raise HTTPException(status_code=400, detail="Добавьте хотя бы одно изображение")

    res = await db.hotels.edit(HotelStatusPatch(status="published"), id=hotel_id)
    if res["status"] != "success":
        raise HTTPException(status_code=404, detail="Hotel not found")

    await db.commit()
    return {"status": "ok"}

@router.post("/owner/{hotel_id}/unpublish", summary="Снять свой отель с публикации")
async def unpublish_my_hotel(
    hotel_id: int,
    db: DBDep,
    owner_id: HotelOwnerDep,
):
    await ensure_hotel_owner_or_admin(hotel_id, owner_id, db)

    res = await db.hotels.edit(HotelStatusPatch(status="draft"), id=hotel_id)
    if res["status"] != "success":
        raise HTTPException(status_code=404, detail="Hotel not found")

    await db.commit()
    return {"status": "ok"}