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
IN_PRODUCTION = os.getenv("IN_PRODUCTION", "False").lower() == "true"

# Ensure ALLOWED_ORIGINS is valid
if not ALLOWED_ORIGINS or ALLOWED_ORIGINS == [""]:
    ALLOWED_ORIGINS = ["*"] if not IN_PRODUCTION else ["http://localhost:3000"]  # Allow frontend in dev

# Initialize FastAPI
app = FastAPI()

# Enable Rate Limiting only in production
if IN_PRODUCTION:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
else:
    limiter = None  # No rate limiting in dev mode

# CORS Middleware (Allow based on environment settings)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Create API v1 Router
api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(auth_router, prefix="/authentication", tags=["Authentication"])
api_v1.include_router(authz_router, prefix="/authorization", tags=["Authorization"])

# Rate-limited endpoint (Only applies when IN_PRODUCTION=True)
@api_v1.get("/limited-endpoint")
async def limited_endpoint():
    if not IN_PRODUCTION:
        return {"message": "This endpoint has no rate limiting (IN_PRODUCTION=False)."}
    
    # Apply rate limiting dynamically
    return await limiter.limit(RATE_LIMIT)(lambda: {"message": "This endpoint has rate limiting applied."})()

# Include the v1 API router
app.include_router(api_v1)

# Run FastAPI with or without HTTPS
if __name__ == "__main__":
    if not IN_PRODUCTION:
        print("🔧 Running FastAPI in HTTP mode for development.")
        uvicorn.run("main:app", host="0.0.0.0", port=8000)
    else:
        # Check if SSL certificates exist before enabling HTTPS
        ssl_keyfile = os.getenv("SSL_KEYFILE", "certs/key.pem")
        ssl_certfile = os.getenv("SSL_CERTFILE", "certs/cert.pem")

        if os.path.exists(ssl_keyfile) and os.path.exists(ssl_certfile):
            print("Running FastAPI with HTTPS.")
            uvicorn.run(
                "main:app",
                host="0.0.0.0",
                port=8000,
                ssl_keyfile=ssl_keyfile,
                ssl_certfile=ssl_certfile,
            )
        else:
            print("SSL certificates not found. Running FastAPI in HTTP mode.")
            uvicorn.run("main:app", host="0.0.0.0", port=8000)
