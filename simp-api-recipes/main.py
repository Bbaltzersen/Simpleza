from fastapi import FastAPI, Depends
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from database.auth.authorize import is_authorized
from api.recipes import router as recipe_router
from api.tags import router as tag_router

load_dotenv()

app = FastAPI()

ALLOWED_ORIGINS = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
)

# Apply authorization correctly as a dependency per router
app.include_router(
    recipe_router,
    prefix="/v1/recipes",
    tags=["recipes"],
    dependencies=[Depends(is_authorized("user"))],  # Adjust role as needed
)
app.include_router(
    tag_router,
    prefix="/v1/tags",
    tags=["tags"],
    dependencies=[Depends(is_authorized("admin"))],  # Adjust role as needed
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8050, reload=True)
