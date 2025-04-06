from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import json
import os
from pydantic import BaseModel
from ..services.openai_service import openai_service
from ..services.woocommerce_service import woocommerce_service

router = APIRouter(
    prefix="/recipes",
    tags=["recipes"]
)

def load_sample_recipes() -> List[Dict[str, Any]]:
    """Ładuje przykładowe przepisy z pliku"""
    try:
        sample_recipes_path = os.path.join(os.path.dirname(__file__), "../data/sample_recipes.json")
        with open(sample_recipes_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Błąd podczas ładowania przepisów: {e}")
        return []

@router.get("/")
async def get_recipes():
    """
    Pobiera listę wszystkich przepisów
    """
    recipes = load_sample_recipes()
    if not recipes:
        raise HTTPException(status_code=404, detail="Nie znaleziono przepisów")
    return {"recipes": recipes}

@router.get("/{recipe_id}")
async def get_recipe(recipe_id: int):
    """
    Pobiera konkretny przepis po ID
    """
    recipes = load_sample_recipes()
    if recipe_id < 0 or recipe_id >= len(recipes):
        raise HTTPException(status_code=404, detail="Przepis nie został znaleziony")
    return recipes[recipe_id]

class RecipeRequest(BaseModel):
    query: str

class Recipe(BaseModel):
    title: str
    ingredients: List[str]
    steps: List[str]
    spice_recommendations: Dict[str, Dict]

class RecipeResponse(BaseModel):
    recipe: Recipe

@router.post("/generate", response_model=RecipeResponse)
async def generate_recipe(request: RecipeRequest):
    try:
        # Generuj przepis używając OpenAI
        recipe_data = await openai_service.generate_recipe(request.query)
        
        # Pobierz rekomendacje przypraw
        spice_recommendations = woocommerce_service.get_spice_recommendations(recipe_data["ingredients"])
        
        # Jeśli mamy rekomendowaną przyprawę, dodaj ją do składników
        if spice_recommendations.get("recipe_blend"):
            spice = spice_recommendations["recipe_blend"]
            recipe_data["ingredients"].append(f"Mieszanka przypraw: {spice['name']} ({spice['description']})")
        
        # Dodaj rekomendacje do przepisu
        recipe = Recipe(
            title=recipe_data["title"],
            ingredients=recipe_data["ingredients"],
            steps=recipe_data["steps"],
            spice_recommendations=spice_recommendations
        )
        
        return {"recipe": recipe}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 