from fastapi import FastAPI, Depends
from authentication.auth import get_current_user, get_auth0_token

app = FastAPI()

@app.get("/protected")
async def protected_route(user: dict = Depends(get_current_user)):
    return {"message": "You are authenticated!", "user": user}

@app.get("/token")
async def get_token():
    token = await get_auth0_token()
    return {"access_token": token}
