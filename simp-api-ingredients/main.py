from fastapi import FastAPI, Depends
from dotenv import load_dotenv
from api.routes.companies import router as companies_router
from api.routes.products import router as products_router
from api.routes.nutrients import router as nutrients_router
from api.routes.ingredients import router as ingredients_router
from fastapi.middleware.cors import CORSMiddleware
from auth.utils import is_authorized

load_dotenv()

app = FastAPI()

# Global dependency: Require admin access for all routes
admin_dependency = Depends(is_authorized("admin"))
ALLOWED_ORIGINS = "http://localhost:3000"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
)

# Include all API routes with admin dependency
app.include_router(companies_router, prefix="/v1/admin/companies", dependencies=[admin_dependency])
app.include_router(products_router, prefix="/v1/admin/products", dependencies=[admin_dependency])
app.include_router(nutrients_router, prefix="/v1/admin/nutrients", dependencies=[admin_dependency])
app.include_router(ingredients_router, prefix="/v1/admin/ingredients", dependencies=[admin_dependency])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
