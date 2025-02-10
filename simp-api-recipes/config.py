import os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

load_dotenv()

# Auth0 configuration
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")
ALGORITHMS = ["RS256"]

# Rate limiting configuration (e.g., "10/minute")
RATE_LIMIT = os.getenv("RATE_LIMIT", "10/minute")

# Create a limiter instance that can be shared across modules
limiter = Limiter(key_func=get_remote_address)

