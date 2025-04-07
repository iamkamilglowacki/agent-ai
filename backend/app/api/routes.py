from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.services.text_analysis import analyze_text_query
from app.services.voice_analysis import analyze_voice_query
from app.services.image_analysis import analyze_image_query
from app.services.rag_service import generate_rag_response
from app.services.recipe_db import recipe_db
from app.models.recipe import Recipe, RecipeCreate, RecipeResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class RecipeRequest(BaseModel):
    query: str
    calories: Optional[int] = None
    dietary_restrictions: Optional[List[str]] = None

class RecipeItem(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    spice_recommendations: Dict[str, Any]

class MultipleRecipesResponse(BaseModel):
    recipes: List[RecipeItem]

@router.post("/analyze/text")
async def analyze_text(request: RecipeRequest):
    """
    Analizuje tekst użytkownika i zwraca sugerowany przepis
    """
    try:
        logger.info(f"Otrzymano zapytanie: {request.query}")
        
        # Najpierw spróbuj znaleźć podobne przepisy w bazie
        try:
            rag_result = await generate_rag_response(
                query=request.query,
                filter_tags=request.dietary_restrictions
            )
            logger.info("Otrzymano odpowiedź z RAG")
        except Exception as rag_error:
            logger.error(f"Błąd podczas generowania odpowiedzi RAG: {str(rag_error)}")
            # Jeśli RAG nie zadziała, użyj GPT-4
            result = await analyze_text_query(
                query=request.query,
                calories=request.calories,
                dietary_restrictions=request.dietary_restrictions
            )
            return result
        
        # Sprawdź czy znaleziono podobne przepisy
        if not rag_result.get("similar_recipes", []):
            logger.info("Nie znaleziono podobnych przepisów, używam GPT-4")
            result = await analyze_text_query(
                query=request.query,
                calories=request.calories,
                dietary_restrictions=request.dietary_restrictions
            )
            return result
        
        logger.info("Zwracam wynik z RAG")
        return rag_result
    except Exception as e:
        logger.error(f"Błąd podczas przetwarzania zapytania: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/voice")
async def analyze_voice(file: UploadFile = File(...)):
    """
    Przetwarza nagranie głosowe i zwraca sugerowany przepis
    """
    try:
        if not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Plik musi być nagraniem audio")
        
        result = await analyze_voice_query(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analizuje zdjęcie i rozpoznaje składniki
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Plik musi być obrazem")
        
        result = await analyze_image_query(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes/search")
async def search_recipes(
    query: str,
    tags: Optional[List[str]] = Query(None),
    limit: int = Query(5, ge=1, le=20)
):
    """
    Przeszukuje bazę przepisów
    """
    try:
        recipes = await recipe_db.search_recipes(
            query=query,
            n_results=limit,
            filter_tags=tags
        )
        return {"recipes": recipes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recipes", response_model=Recipe)
async def create_recipe(recipe: RecipeCreate):
    """
    Dodaje nowy przepis do bazy
    """
    try:
        recipe_id = await recipe_db.add_recipe(recipe)
        return await recipe_db.get_recipe_by_id(recipe_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    """
    Pobiera przepis po ID
    """
    recipe = await recipe_db.get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Przepis nie znaleziony")
    return recipe

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(recipe_id: str):
    """
    Usuwa przepis z bazy
    """
    success = await recipe_db.delete_recipe(recipe_id)
    if not success:
        raise HTTPException(status_code=404, detail="Przepis nie znaleziony")
    return {"message": "Przepis usunięty"} 