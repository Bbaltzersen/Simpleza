from fastapi import FastAPI, Depends, Security, HTTPException
from fastapi.security import HTTPBearer
from authentication.auth import get_current_user  # Import Auth0 validation

app = FastAPI()
security = HTTPBearer()

@app.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):  # Use async
    return {"message": "You are authenticated!", "user": user}
