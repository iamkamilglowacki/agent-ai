from pydantic import BaseModel
from typing import List, Optional

class Ingredient(BaseModel):
    name: str
    amount: Optional[str] = None
    unit: Optional[str] = None

class Recipe(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    ingredients: List[Ingredient]
    instructions: List[str]
    prep_time: str
    cook_time: str
    servings: int
    difficulty: str
    tags: List[str]
    source: Optional[str] = None

class RecipeCreate(Recipe):
    pass

class RecipeResponse(Recipe):
    similarity_score: Optional[float] = None 