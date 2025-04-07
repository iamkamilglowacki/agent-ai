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