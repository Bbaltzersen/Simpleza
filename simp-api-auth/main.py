from fastapi import FastAPI, APIRouter
from api.authentication_routes import router as auth_router
from api.authorization_routes import router as authz_router

app = FastAPI()

# Define API versioning
api_v1 = APIRouter(prefix="/v1")

# Include Authentication and Authorization Routes under `/v1`
api_v1.include_router(auth_router, prefix="/authentication", tags=["Authentication"])
api_v1.include_router(authz_router, prefix="/authorization", tags=["Authorization"])

# Register `/v1` with FastAPI app
app.include_router(api_v1)
