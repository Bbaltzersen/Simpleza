from fastapi import FastAPI
from dotenv import load_dotenv
from api.routes.companies import router as companies_router
from api.routes.products import router as products_router
from api.routes.nutritions import router as nutritions_router
from api.routes.ingredients import router as ingredients_router

load_dotenv()

app = FastAPI()

# Include company, product, nutrition, and ingredient APIs
app.include_router(companies_router, prefix="/v1/companies")
app.include_router(products_router, prefix="/v1/products")
app.include_router(nutritions_router, prefix="/v1/nutritions")
app.include_router(ingredients_router, prefix="/v1/ingredients")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
