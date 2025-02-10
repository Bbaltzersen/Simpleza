from fastapi import FastAPI, APIRouter, Request, Depends, HTTPException
from config import RATE_LIMIT, limiter
from authentication.auth import get_current_user, get_auth0_token
from slowapi import _rate_limit_exceeded_handler
from recipes.routes import router as recipes_router

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

api_v1 = APIRouter(prefix="/v1")

@api_v1.get("/protected")
@limiter.limit(RATE_LIMIT)
async def protected_route(request: Request, user: dict = Depends(get_current_user)):
    """Test that a user is authenticated."""
    return {"message": "You are authenticated!", "user": user}

@api_v1.get("/token")
@limiter.limit(RATE_LIMIT)
async def get_token(request: Request):
    """Retrieve an Auth0 access token."""
    token = await get_auth0_token()
    return {"access_token": token}

# Include the recipe endpoints (they should also include `request: Request`)
api_v1.include_router(recipes_router)

app.include_router(api_v1)

@app.get("/")
async def root():
    return {"message": "Welcome to the Recipe API"}
