from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.services.text_analysis import analyze_text_query

router = APIRouter()

class RecipeRequest(BaseModel):
    query: str
    calories: Optional[int] = None
    dietary_restrictions: Optional[list[str]] = None

@router.post("/analyze/text")
async def analyze_text(request: RecipeRequest):
    """
    Analizuje tekst użytkownika i zwraca sugerowany przepis
    """
    try:
        result = await analyze_text_query(
            query=request.query,
            calories=request.calories,
            dietary_restrictions=request.dietary_restrictions
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/voice")
async def analyze_voice(file: UploadFile = File(...)):
    """
    Przetwarza nagranie głosowe i zwraca sugerowany przepis
    """
    # TODO: Implementacja przetwarzania głosu przez Whisper
    return {"message": "Voice analysis endpoint"}

@router.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analizuje zdjęcie i rozpoznaje składniki
    """
    # TODO: Implementacja analizy obrazu przez GPT-4 Vision
    return {"message": "Image analysis endpoint"}

@router.get("/recipes/search")
async def search_recipes(query: str):
    """
    Przeszukuje bazę przepisów
    """
    # TODO: Implementacja wyszukiwania w bazie przepisów (RAG)
    return {"message": "Recipe search endpoint"} 