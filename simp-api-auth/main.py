from fastapi import FastAPI
from api.authentication_routes import router as auth_router
from api.authorization_routes import router as authz_router

app = FastAPI()

# Include Authentication and Authorization Routes
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(authz_router, prefix="/authz", tags=["Authorization"])
