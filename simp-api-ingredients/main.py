from fastapi import FastAPI, Depends
from dotenv import load_dotenv
from api.routes.companies import router as companies_router
from api.routes.products import router as products_router
from api.routes.nutritions import router as nutritions_router
from api.routes.ingredients import router as ingredients_router
from auth.utils import is_authorized

load_dotenv()

app = FastAPI()

# Global dependency: Require admin access for all routes
admin_dependency = Depends(is_authorized("admin"))

# Include all API routes with admin dependency
app.include_router(companies_router, prefix="/v1/companies", dependencies=[admin_dependency])
app.include_router(products_router, prefix="/v1/products", dependencies=[admin_dependency])
app.include_router(nutritions_router, prefix="/v1/nutritions", dependencies=[admin_dependency])
app.include_router(ingredients_router, prefix="/v1/ingredients", dependencies=[admin_dependency])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
