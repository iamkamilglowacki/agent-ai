from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router
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
    "http://localhost:3000",  # standardowy port dev
    "http://localhost:3005",  # alternatywny port dev
    "https://agent-ai-spices.vercel.app",  # produkcyjny URL
    "https://agent-afxbyggz0-kamils-projects-887b8705.vercel.app",  # nowy produkcyjny URL
    os.getenv("FRONTEND_URL", "")  # URL z zmiennej środowiskowej
]

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

@app.get("/")
async def root():
    return {"message": "Agent AI API is running"} 