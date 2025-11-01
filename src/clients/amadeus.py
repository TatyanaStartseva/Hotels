# src/clients/amadeus.py
import time
import asyncio
from typing import Any, Dict, List
import httpx
from src.config import settings


class AmadeusClient:
    BASE = "https://test.api.amadeus.com"

    def __init__(self, api_key: str | None = None, api_secret: str | None = None):
        self.api_key = (api_key or settings.AMADEUS_KEY).strip()
        self.api_secret = (api_secret or settings.AMADEUS_SECRET).strip()
        if not self.api_key or not self.api_secret:
            raise RuntimeError("AMADEUS_KEY / AMADEUS_SECRET отсутствуют")
        self._token: str | None = None
        self._exp: float = 0.0
        self._city_cache: dict[str, tuple[str, float]] = {}

    async def _ensure_token(self) -> None:
        if self._token and (self._exp - time.time() > 60):
            return
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{self.BASE}/v1/security/oauth2/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.api_key,
                    "client_secret": self.api_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if r.status_code >= 400:
                try:
                    detail = r.json()
                except Exception:
                    detail = r.text
                raise RuntimeError(f"Amadeus token error {r.status_code}: {detail}")
            data = r.json()
            self._token = data["access_token"]
            self._exp = time.time() + int(data.get("expires_in", 1800))

    async def get_hotel_ids_by_city(self, *, city_code: str) -> List[str]:
        """
        Ищет отели по IATA-коду города через Hotel List API (/v1/.../by-city),
        без ручной передачи page[limit]/page[offset]; идём по meta.links.next.
        """
        await self._ensure_token()
        ids: List[str] = []
        url: str | None = f"{self.BASE}/v1/reference-data/locations/hotels/by-city"
        params: Dict[str, Any] | None = {"cityCode": city_code.upper(), "hotelSource": "ALL"}

        async with httpx.AsyncClient(timeout=30) as client:
            while url:
                r = await client.get(url, params=params, headers={"Authorization": f"Bearer {self._token}"})
                if r.status_code >= 400:
                    try:
                        detail = r.json()
                    except Exception:
                        detail = r.text
                    raise RuntimeError(f"Amadeus by-city error {r.status_code}: {detail}")

                payload = r.json()
                data = payload.get("data", [])
                ids.extend([h.get("hotelId") for h in data if h.get("hotelId")])

                links = (payload.get("meta") or {}).get("links") or {}
                next_url = links.get("next")
                # при переходе по next не передаём params (они уже в ссылке)
                url, params = (next_url, None) if next_url else (None, None)

        return ids

    async def _fetch_offers_chunk(
        self,
        client: httpx.AsyncClient,
        chunk: List[str],
        check_in: str,
        check_out: str,
        adults: int,
    ) -> List[Dict[str, Any]]:
        """
        Отправляет один батч hotelIds.
        При 400/477 'Exceeding max items' делит батч пополам рекурсивно.
        На 429 делает небольшой бэкофф и одну повторную попытку.
        """
        if not chunk:
            return []

        r = await client.get(
            f"{self.BASE}/v3/shopping/hotel-offers",
            params={
                "hotelIds": ",".join(chunk),
                "checkInDate": check_in,
                "checkOutDate": check_out,
                "adults": adults,
                "roomQuantity": 1,
            },
            headers={"Authorization": f"Bearer {self._token}"},
        )

        if r.status_code == 429:
            await asyncio.sleep(1.5)
            r = await client.get(
                f"{self.BASE}/v3/shopping/hotel-offers",
                params={
                    "hotelIds": ",".join(chunk),
                    "checkInDate": check_in,
                    "checkOutDate": check_out,
                    "adults": adults,
                    "roomQuantity": 1,
                },
                headers={"Authorization": f"Bearer {self._token}"},
            )

        if r.status_code >= 400:
            try:
                detail = r.json()
            except Exception:
                detail = {"text": r.text}

            if r.status_code == 400 and "Exceeding max items" in str(detail):
                mid = max(1, len(chunk) // 2)
                left = await self._fetch_offers_chunk(client, chunk[:mid], check_in, check_out, adults)
                right = await self._fetch_offers_chunk(client, chunk[mid:], check_in, check_out, adults)
                return left + right

            raise RuntimeError(f"Amadeus offers error {r.status_code}: {detail}")

        return r.json().get("data", [])

    async def offers_by_hotel_ids(
        self, *, hotel_ids: List[str], check_in: str, check_out: str, adults: int = 1
    ) -> List[Dict[str, Any]]:
        """Запрос офферов по списку hotelIds с адаптивным делением батчей."""
        await self._ensure_token()
        all_offers: List[Dict[str, Any]] = []
        base_chunk = 50  # стартуем аккуратно

        async with httpx.AsyncClient(timeout=30) as client:
            for i in range(0, len(hotel_ids), base_chunk):
                chunk = hotel_ids[i : i + base_chunk]
                data = await self._fetch_offers_chunk(client, chunk, check_in, check_out, adults)
                if data:
                    all_offers.extend(data)

        return all_offers

    async def search_offers_by_city(
        self, *, city_code: str, check_in: str, check_out: str, adults: int = 1, max_hotels: int = 600
    ) -> List[Dict[str, Any]]:
        """Шаг 1: /v1/.../by-city → hotelIds; Шаг 2: /v3/hotel-offers → офферы (с ограничением общего числа отелей)."""
        ids = await self.get_hotel_ids_by_city(city_code=city_code)
        if not ids:
            return []
        ids = ids[:max_hotels]  # не штурмуем API тысячами ID
        return await self.offers_by_hotel_ids(
            hotel_ids=ids, check_in=check_in, check_out=check_out, adults=adults
        )


    async def resolve_city_code(self, keyword: str) -> str | None:
        """
        Moscow/Москва -> MOW, Sochi/Сочи -> AER и т.п.
        Без параметров page[limit]/sort, с попытками в двух справочниках.
        """
        kw = (keyword or "").strip()
        if not kw:
            return None

        # кэш 30 минут
        now = time.time()
        if not hasattr(self, "_city_cache") or self._city_cache is None:
            self._city_cache = {}
        cached = self._city_cache.get(kw.lower())
        if cached and cached[1] > now:
            return cached[0]

        await self._ensure_token()
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept-Language": "ru,en",
        }

        async with httpx.AsyncClient(timeout=20) as client:
            # 1) Справочник городов: /v1/reference-data/locations/cities
            #    Поддерживает только keyword (и, опционально, countryCode), пагинация через meta.links.next
            url = f"{self.BASE}/v1/reference-data/locations/cities"
            params = {"keyword": kw}
            while url:
                r = await client.get(url, params=params, headers=headers)
                # после первого запроса дальше используем next как абсолютный URL → params=None
                params = None
                print(r.text)
                if r.status_code < 400:
                    payload = r.json()
                    for item in (payload.get("data") or []):
                        code = (item.get("iataCode") or "").upper()
                        if len(code) == 3:
                            self._city_cache[kw.lower()] = (code, now + 1800)
                            return code
                    links = ((payload.get("meta") or {}).get("links") or {})
                    url = links.get("next")
                else:
                    break  # если 4xx/5xx — падаем на fallback

            # 2) Общий справочник локаций: /v1/reference-data/locations?subType=CITY,AIRPORT
            #    Тоже только keyword/subType, без sort/limit; пагинация через meta.links.next
            url = f"{self.BASE}/v1/reference-data/locations"
            params = {"keyword": kw, "subType": "CITY,AIRPORT"}
            while url:
                r = await client.get(url, params=params, headers=headers)
                params = None
                print("no params", r.text)
                if r.status_code < 400:
                    payload = r.json()
                    for item in (payload.get("data") or []):
                        code = (item.get("iataCode") or "").upper()
                        if len(code) == 3:
                            self._city_cache[kw.lower()] = (code, now + 1800)
                            return code
                    links = ((payload.get("meta") or {}).get("links") or {})
                    url = links.get("next")
                else:
                    break

        return None
