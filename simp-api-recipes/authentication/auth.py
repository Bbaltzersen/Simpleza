from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer
from jose import jwt
from jose.exceptions import JWTError
import httpx  # Replaces requests (supports async calls)
import config

security = HTTPBearer()

# Get public keys from Auth0 (async version)
async def get_auth0_jwks():
    url = f"https://{config.AUTH0_DOMAIN}/.well-known/jwks.json"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# Verify JWT token (async version)
async def verify_jwt(token: str):
    jwks = await get_auth0_jwks()  # Await the async function
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}

    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not rsa_key:
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=config.ALGORITHMS,
            audience=config.AUTH0_AUDIENCE,
            issuer=f"https://{config.AUTH0_DOMAIN}/"
        )
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token verification failed")

# Secure routes (async version)
async def get_current_user(token: str = Security(security)):
    return await verify_jwt(token.credentials)  # Await token verification
