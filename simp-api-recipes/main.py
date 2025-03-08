from fastapi import FastAPI, Depends
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from database.auth.authorize import is_authorized


load_dotenv()

app = FastAPI()

user_dependency = None

if is_authorized("user"):
    user_dependency = Depends(is_authorized("user"))
elif is_authorized("admin"):
    admin_dependency = Depends(is_authorized("admin"))

ALLOWED_ORIGINS = "http://localhost:3000"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS", "DELETE", "PUT"],
    allow_headers=["Content-Type", "X-CSRF-Token", "Authorization"],
)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8020, reload=True)
