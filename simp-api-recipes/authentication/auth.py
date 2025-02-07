import os
import json
import logging
import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer
from jose import jwt, JWTError

# Load environment variables
load_dotenv()

# Auth0 Configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")
ALGORITHMS = ["RS256"]

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer()


async def get_auth0_token():
    """Fetches an access token from Auth0."""
    url = f"https://{AUTH0_DOMAIN}/oauth/token"
    payload = {
        "client_id": AUTH0_CLIENT_ID,
        "client_secret": AUTH0_CLIENT_SECRET,
        "audience": AUTH0_AUDIENCE,
        "grant_type": "client_credentials",
    }
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code != 200:
                logger.error(f"Auth0 Token Error: {response.text}")  # Logs full error
                raise HTTPException(status_code=401, detail="Failed to fetch Auth0 token")
            return response.json().get("access_token")
    except httpx.RequestError as e:
        logger.error(f"Network error while fetching token: {str(e)}")
        raise HTTPException(status_code=500, detail="Auth0 token service unavailable")

async def get_auth0_jwks():
    url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            jwks = response.json()
            logger.info("Successfully fetched JWKS from Auth0.")
            return jwks
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to fetch JWKS: {e.response.text}")
        raise HTTPException(status_code=500, detail="Failed to fetch JWKS")
    except httpx.RequestError as e:
        logger.error(f"Network error while fetching JWKS: {str(e)}")
        raise HTTPException(status_code=500, detail="Auth0 JWKS service unavailable")

async def verify_jwt(token: str):
    if not token or "." not in token:
        logger.warning("Token is missing or malformed.")
        raise HTTPException(status_code=401, detail="Invalid JWT format")

    jwks = await get_auth0_jwks()
    
    try:
        unverified_header = jwt.get_unverified_header(token)
        logger.info(f"Unverified token header: {unverified_header}")
    except JWTError:
        logger.error("Error decoding token headers.")
        raise HTTPException(status_code=401, detail="Invalid token headers")

    rsa_key = None
    for key in jwks.get("keys", []):
        if key.get("kid") == unverified_header.get("kid"):
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"],
            }
            break

    if not rsa_key:
        logger.warning("No matching key ID found in JWKS.")
        raise HTTPException(status_code=401, detail="Invalid token key ID")

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )
        logger.info(f"Token successfully decoded. User: {payload.get('sub')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired.")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTClaimsError:
        logger.error("Invalid claims in token.")
        raise HTTPException(status_code=401, detail="Invalid token claims")
    except JWTError:
        logger.error("General token verification error.")
        raise HTTPException(status_code=401, detail="Token verification failed")

### ✅ Secure Route Dependency ###
async def get_current_user(token: str = Security(security)):
    return await verify_jwt(token.credentials)
