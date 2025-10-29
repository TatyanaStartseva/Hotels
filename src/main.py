from fastapi import FastAPI
import uvicorn
from fastapi.openapi.docs import get_swagger_ui_html
import sys
from pathlib import Path
# чтобы интерпретатор знал в какой папке он находится, и какая директория выше него пишем :
sys.path.append(str(Path(__file__).parent.parent))

from src.config import settings
from src.api.hotels import router as router_hotels
from src.api.auth import router as router_auth
from src.api.rooms import router as router_rooms
from src.database import *

app = FastAPI(docs_url=None)
app.include_router(router_auth)
app.include_router(router_hotels)
app.include_router(router_rooms)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css",
    )


if __name__ == '__main__':
    uvicorn.run("main:app", host="127.0.0.1", port=8000 ,reload =True)