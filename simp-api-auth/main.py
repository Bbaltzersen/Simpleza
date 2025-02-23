import os
import uvicorn
from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.authentication_routes import router as auth_router
from api.authorization_routes import router as authz_router

load_dotenv()

ALLOWED_ORIGINS = ["http://localhost:3000"]
IN_PRODUCTION = os.getenv("IN_PRODUCTION", "False").lower() == "true"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
)

@app.options("/{full_path:path}")
async def preflight_check(request: Request):
    print("\n🔹 OPTIONS Request Debugging")
    print(f"🔹 URL: {request.url}")
    print(f"🔹 Headers: {dict(request.headers)}")
    
    if "origin" not in request.headers:
        print("❌ ERROR: Missing Origin Header")
        return {"error": "Missing Origin Header"}

    origin = request.headers["origin"]
    if origin not in ALLOWED_ORIGINS:
        print(f"❌ ERROR: Origin {origin} is not allowed")
        return {"error": f"Origin {origin} is not allowed"}

    print("✅ OPTIONS Request Handled Successfully")
    return {}

api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(auth_router, prefix="/authentication", tags=["Authentication"])
api_v1.include_router(authz_router, prefix="/authorization", tags=["Authorization"])

app.include_router(api_v1)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
