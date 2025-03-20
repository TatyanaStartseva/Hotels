from http.client import HTTPException

from fastapi import FastAPI, Query, Body
import uvicorn
from fastapi.openapi.docs import get_swagger_ui_html
app = FastAPI(docs_url=None)
hotels = [
    {"id":1, "title":"Sochi"}
]
@app.get('/hotels')
def get_hotels(
        id: int| None =Query(None,  description= "id"),
        title : str| None= Query(None, description = "Name of hotel")
):
    global hotels
    hotels_ = []
    for hotel in hotels:
        if id and hotel['id'] != id:
            continue
        if title and hotel["title"] != title:
            continue
        hotels_.append(hotel)
    return hotels_

@app.delete("/hotels/{hotel_id}")
def delete_hotel(hotel_id:int ):
    global hotels
    hotels_ = [hotel for hotel in hotels if hotel['id']!= hotel_id]
    return hotels_

@app.post("/hotels")
def post_hotels(title:str = Body(embed=True)):
    global hotels
    hotels.append({"id": hotels[-1]['id']+1,"title":title})
    return {'status':"ok"}


@app.patch("/hotels/{id}")
def patch_hotels(id:int, title: str|None= Body(None,description="New title"), name: str|None = Body(None,description="New name")):
    global hotels
    for hotel in hotels:
        if title and hotel['id'] == id:
            hotel['title'] = title
        if name and hotel['id'] == id:
            hotel['name']= name
    return {"status":"Ok"}


@app.put("/hotels/{id}")
def patch_hotels(id: int,title: str= Body(...,description="New title"), name: str = Body(...,description="New name")):
    global hotels
    for hotel in hotels:
        if title and name and hotel['id'] == id:
            hotel['title'] = title
            hotel['name']= name
            return {"status":"Ok"}
    raise HTTPException(status_code=404, detail="Hotel not found")


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