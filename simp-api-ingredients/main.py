from fastapi import FastAPI
from dotenv import load_dotenv
from api.routes.companies import router as companies_router
from api.routes.products import router as products_router

load_dotenv()

app = FastAPI()

# Include companies and products APIs
app.include_router(companies_router, prefix="/v1/companies")
app.include_router(products_router, prefix="/v1/products")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
