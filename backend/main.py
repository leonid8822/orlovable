from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="OLAI.art Jewelry API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://olai.art",
        "https://storage.googleapis.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "OLAI.art Jewelry API v2.0 - Supabase Edition"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
