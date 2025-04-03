from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Agent AI API",
    description="Backend API dla asystenta kulinarnego z AI",
    version="1.0.0"
)

# Konfiguracja CORS
allowed_origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),  # URL frontendu
    "https://agent-ai-spices.vercel.app"  # URL produkcyjny
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dodanie routera API
app.include_router(api_router, prefix="/api") 