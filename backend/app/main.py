from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
from app.routers import recipes
from app.routers import spices
import os
from dotenv import load_dotenv
import logging

# Konfiguracja logowania
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(
    title="Agent AI API",
    description="Backend API dla asystenta kulinarnego z AI",
    version="1.0.0"
)

# Konfiguracja CORS
allowed_origins = [
    "https://smakosz.flavorinthejar.com",  # Subdomena smakosz (HTTPS)
    "http://localhost:3000",  # standardowy port dev
    "http://localhost:3001",  # alternatywny port dev
    "http://localhost:3005",  # alternatywny port dev
    "http://127.0.0.1:3000",  # localhost jako IP
    "http://127.0.0.1:3001",  # localhost jako IP
    "http://127.0.0.1:3005",  # localhost jako IP
    "https://agent-ai-spices.vercel.app",  # produkcyjny URL Vercel
    "https://agent-ai-git-staging-kamils-projects-887b8705.vercel.app",  # URL stagingowy Vercel
    "https://agent-ai-git-main-kamils-projects-887b8705.vercel.app",  # URL główny Vercel
    "https://agent-ai-staging.up.railway.app",  # URL stagingowy Railway
    "https://agent-ai-production.up.railway.app",  # URL produkcyjny Railway
]

# Dodaj origins z zmiennej środowiskowej, jeśli istnieje
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(",") if origin.strip()])

# Dodaj frontend URL z zmiennej środowiskowej, jeśli istnieje
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

# Usuń puste wartości i duplikaty
allowed_origins = list(set(filter(None, allowed_origins)))

logger.info(f"Configured CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Dodanie routera API
app.include_router(api_router, prefix="/api")
app.include_router(recipes.router, prefix="/api")
app.include_router(spices.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Agent AI API is running"} 