from fastapi import FastAPI, Depends
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from database.auth.authorize import is_authorized
from api.recipes import router as recipe_router
from api.tags import router as tag_router
from api.ingredient import router as ingredient_router
from api.cauldron import router as cauldron_router

load_dotenv()

app = FastAPI()

# Global dependency: Require admin access for all routes
admin_dependency = Depends(is_authorized("admin"))

ALLOWED_ORIGINS = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
)

# Include all API routes with admin dependency
app.include_router(recipe_router, prefix="/v1/recipes", dependencies=[admin_dependency])
app.include_router(tag_router, prefix="/v1/tags", dependencies=[admin_dependency])
app.include_router(ingredient_router, prefix="/v1/ingredients",dependencies=[admin_dependency])
app.include_router(cauldron_router, prefix="/v1/cauldrons", dependencies=[admin_dependency])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8020, reload=True)
