# authentication/auth.py

import logging
import httpx
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from dotenv import load_dotenv
from config import AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, ALGORITHMS
from sqlalchemy.orm import Session
from database.db_init import get_db  # Your get_db dependency
from database.user_crud import add_user  # The helper function to add a user

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

security = HTTPBearer()

async def get_auth0_token():
    """Fetch an access token from Auth0 using client credentials flow."""
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
                logger.error(f"Auth0 Token Error: {response.text}")
                raise HTTPException(status_code=401, detail="Failed to fetch Auth0 token")
            return response.json().get("access_token")
    except httpx.RequestError as e:
        logger.error(f"Network error while fetching token: {str(e)}")
        raise HTTPException(status_code=500, detail="Auth0 token service unavailable")

async def get_auth0_jwks():
    """Retrieve JWKS from Auth0."""
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
    """Verify a JWT token using Auth0's JWKS."""
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

async def get_current_user(token: str = Security(security)):
    """
    Dependency that verifies the JWT and returns the token payload.
    """
    return await verify_jwt(token.credentials)

async def get_or_create_current_user(
    db: Session = Depends(get_db),
    token_payload: dict = Depends(get_current_user)
):
    """
    Dependency to get or create the current user.
    
    If the token is a client credentials token (i.e. it has "gty": "client-credentials"),
    or if the token does not include an email claim, we raise an error.
    """
    # Check if the token is a client credentials token.
    if token_payload.get("gty") == "client-credentials":
        raise HTTPException(status_code=401, detail="User token required, not a client credentials token.")
    
    # Extract user details from the token payload.
    username = token_payload.get("nickname") or token_payload.get("name") or token_payload.get("sub")
    email = token_payload.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not found in token payload.")

    # Add the user to the DB if they don't exist, or return the existing user.
    user = add_user(db, username, email)
    return user
