# main.py
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, world!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
