# main.py

from fastapi import FastAPI, APIRouter, Request, Security, HTTPException
from fastapi.responses import JSONResponse
from config import RATE_LIMIT, limiter
from slowapi import _rate_limit_exceeded_handler
from authentication.auth import get_or_create_current_user, get_auth0_token

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# --- Custom Exception Handlers ---

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """
    Handle HTTPExceptions and return a JSON response with additional details.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch all unhandled exceptions and return a generic error response.
    """
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": "Internal Server Error",
            "detail": str(exc)
        }
    )

# --- API Router Definition ---

api_v1 = APIRouter(prefix="/v1")

@api_v1.get("/protected")
@limiter.limit(RATE_LIMIT)
async def protected_route(
    request: Request,
    user=Security(get_or_create_current_user)  # Now using Security to enforce auth.
):
    return {
        "message": "You are authenticated and have been added to the database (if not already present)!",
        "user": {
            "username": user.username,
            "email": user.email,
            "user_id": str(user.user_id)
        }
    }

@api_v1.get("/token")
@limiter.limit(RATE_LIMIT)
async def token_route(request: Request):
    """
    Retrieve an Auth0 access token using the client credentials flow.
    
    NOTE:
    - This token is intended for server-to-server communication and does not include user-specific claims.
    - For user authentication (and to have get_or_create_current_user work properly),
      obtain a token via a user login flow.
    """
    token = await get_auth0_token()
    return {"access_token": token}

app.include_router(api_v1)

@app.get("/")
async def root():
    return {"message": "Welcome to the Recipe API"}
