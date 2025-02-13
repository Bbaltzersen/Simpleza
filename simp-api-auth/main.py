import os
import uvicorn
from fastapi import FastAPI, APIRouter, Depends
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.authentication_routes import router as auth_router
from api.authorization_routes import router as authz_router

# Load environment variables
load_dotenv()

# Environment Config
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
RATE_LIMIT = os.getenv("RATE_LIMIT", "10/minute")
TEST_MODE = os.getenv("TEST_MODE", "False").lower() == "true"

# Ensure ALLOWED_ORIGINS is valid (avoid empty list issue)
if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == [""]:
    ALLOWED_ORIGINS = ["*"] if TEST_MODE else []  # Allow all in test mode, restrict in production

# Initialize FastAPI
app = FastAPI()

# Enable Rate Limiting only in production
if not TEST_MODE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
else:
    limiter = None  # No rate limiting in test mode

# CORS Middleware (Allow based on env settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# Create API v1 Router
api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(auth_router, prefix="/authentication", tags=["Authentication"])
api_v1.include_router(authz_router, prefix="/authorization", tags=["Authorization"])

# Rate-limited endpoint (Only applies when TEST_MODE=False)
@api_v1.get("/limited-endpoint")
async def limited_endpoint():
    if not TEST_MODE:
        return await limiter.limit(RATE_LIMIT)(lambda: {"message": "This endpoint has rate limiting applied."})()
    return {"message": "This endpoint has no rate limiting (TEST_MODE=True)."}

app.include_router(api_v1)

# Run FastAPI with HTTPS (if TEST_MODE=False)
if __name__ == "__main__":
    if TEST_MODE:
        # Run FastAPI in HTTP mode for local development
        uvicorn.run("main:app", host="127.0.0.1", port=8000)
    else:
        # Run FastAPI with HTTPS using SSL Certificates
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8000,
            ssl_keyfile=os.path.join("certs", "key.pem"),
            ssl_certfile=os.path.join("certs", "cert.pem"),
        )
