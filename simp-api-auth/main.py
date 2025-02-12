import os
from fastapi import FastAPI, APIRouter, Depends
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.authentication_routes import router as auth_router
from api.authorization_routes import router as authz_router

load_dotenv()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
RATE_LIMIT = os.getenv("RATE_LIMIT", "10/minute")

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type", "Authorization"],
)

api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(auth_router, prefix="/authentication", tags=["Authentication"])
api_v1.include_router(authz_router, prefix="/authorization", tags=["Authorization"])

@api_v1.get("/limited-endpoint", dependencies=[Depends(limiter.limit(RATE_LIMIT))])
async def limited_endpoint():
    return {"message": "This endpoint has rate limiting applied."}

app.include_router(api_v1)