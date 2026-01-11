# src/clients/xotelo.py
from __future__ import annotations
import httpx
import logging
from typing import Any, Dict, Optional
from src.config import settings

log = logging.getLogger(__name__)

class XoteloClient:
    BASE = "https://xotelo-hotel-prices.p.rapidapi.com"

    def __init__(self, api_key: Optional[str] = None, host: Optional[str] = None, proxy_url: Optional[str] = None):
        self.api_key = api_key or settings.XOTELO_RAPIDAPI_KEY
        self.host = host or "xotelo-hotel-prices.p.rapidapi.com"
        self.proxy_url = proxy_url

        if not self.api_key:
            raise RuntimeError("XOTELO_RAPIDAPI_KEY не задан")

    def _headers(self) -> Dict[str, str]:
        return {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.host,
        }

    async def _get(self, url: str, params: Dict[str, Any]) -> httpx.Response:
        log.info("XOTELO GET %s params=%s", url, params)
        async with httpx.AsyncClient(timeout=25, proxies=self.proxy_url or None) as client:
            return await client.get(url, params=params, headers=self._headers())

    async def _get_json(self, url: str, params: Dict[str, Any]) -> Dict[str, Any] | None:
        try:
            r = await self._get(url, params)
        except httpx.HTTPError as e:
            log.warning("Xotelo httpx error: %s", e)
            return {"_error": {"status": 0, "message": f"httpx: {e}"}}

        if r.status_code == 451:
            # геоблок — считаем штатной ситуацией
            return {"_error": {"status": 451, "message": "Geo-blocked by RapidAPI"}}

        if r.status_code == 404:
            return {"_error": {"status": 404, "message": "Endpoint not found"}}

        if r.status_code >= 400:
            # попытаемся достать тело
            body: Any
            try:
                body = r.json()
            except Exception:
                body = r.text
            return {"_error": {"status": r.status_code, "message": body}}

        try:
            return r.json()
        except Exception as e:
            log.warning("Xotelo bad json: %s", e)
            return {"_error": {"status": 0, "message": f"bad json: {e}"}}

    # ---- ПОДСТРАХОВКА: пробуем несколько путей для /search ----
    async def search(self, query: str) -> Dict[str, Any] | None:
        candidates = [
            f"{self.BASE}/search",
            f"{self.BASE}/v1/search",
            f"{self.BASE}/locations/search",
            f"{self.BASE}/v1/locations/search",
        ]
        params = {"query": query}

        for url in candidates:
            resp = await self._get_json(url, params)
            if not isinstance(resp, dict):
                continue
            if "_error" not in resp:
                return resp
            # если 404 — пробуем следующий путь
            if resp["_error"].get("status") == 404:
                log.info("Xotelo: %s вернул 404, пробуем следующий", url)
                continue
            # если 451 — сразу возвращаем это как штатную ситуацию
            if resp["_error"].get("status") == 451:
                return resp
            # другие ошибки тоже возвращаем (чтобы наверху корректно обработать)
            return resp

        # всё перепробовали — ничего
        return {"_error": {"status": 404, "message": "No working search endpoint"}}

    # Список отелей по location_key (аналогично — несколько потенциальных путей)
    async def list_hotels(self, location_key: str, *, limit: int = 100, offset: int = 0) -> Dict[str, Any] | None:
        candidates = [
            f"{self.BASE}/list",
            f"{self.BASE}/v1/list",
            f"{self.BASE}/hotels/list",
            f"{self.BASE}/v1/hotels/list",
        ]
        params = {"location_key": location_key, "limit": limit, "offset": offset}
        for url in candidates:
            resp = await self._get_json(url, params)
            if not isinstance(resp, dict):
                continue
            if "_error" not in resp:
                return resp
            if resp["_error"].get("status") == 404:
                log.info("Xotelo: %s вернул 404, пробуем следующий", url)
                continue
            return resp
        return {"_error": {"status": 404, "message": "No working list endpoint"}}

    # Цены по hotel_key (если нужно)
    async def rates(self, hotel_key: str, *, chk_in: str, chk_out: str, adults: int = 1) -> Dict[str, Any] | None:
        candidates = [
            f"{self.BASE}/rates",
            f"{self.BASE}/v1/rates",
            f"{self.BASE}/hotels/rates",
            f"{self.BASE}/v1/hotels/rates",
        ]
        params = {"hotel_key": hotel_key, "check_in": chk_in, "check_out": chk_out, "adults": adults}
        for url in candidates:
            resp = await self._get_json(url, params)
            if not isinstance(resp, dict):
                continue
            if "_error" not in resp:
                return resp
            if resp["_error"].get("status") == 404:
                log.info("Xotelo: %s вернул 404, пробуем следующий", url)
                continue
            return resp
        return {"_error": {"status": 404, "message": "No working rates endpoint"}}