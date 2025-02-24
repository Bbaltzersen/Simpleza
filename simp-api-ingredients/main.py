from fastapi import FastAPI
from dotenv import load_dotenv

# Import API routes
from api.routes.companies import router as companies_router

load_dotenv()  # Load environment variables from .env

app = FastAPI()

# Root endpoint for testing
@app.get("/")
def read_root():
    return {"message": "Ingredient API"}

# Include companies API
app.include_router(companies_router, prefix="/v1/companies")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
