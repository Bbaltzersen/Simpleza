from fastapi import FastAPI, Depends
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from database.auth.authorize import is_authorized
from api.recipes import router as recipe_router
from api.tags import router as tag_router

load_dotenv()

app = FastAPI()

admin_dependency = Depends(is_authorized("admin"))
dependency = None

if is_authorized("admin"):
    dependency = Depends(is_authorized("admin"))
elif is_authorized("user"):
    dependency = Depends(is_authorized("user"))

ALLOWED_ORIGINS = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
)

# Apply authorization correctly as a dependency
app.include_router(
    recipe_router,
    prefix="/recipes",
    tags=["recipes"],
    dependencies=[admin_dependency],  
)
app.include_router(
    tag_router,
    prefix="/tags",
    tags=["tags"],
    dependencies=[dependency],  
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8020, reload=True)
