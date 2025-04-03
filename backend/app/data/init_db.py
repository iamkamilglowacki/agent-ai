import asyncio
from app.services.recipe_db import recipe_db
from app.data.sample_recipes import SAMPLE_RECIPES

async def init_database():
    print("Inicjalizacja bazy danych przepisów...")
    
    # Upewnij się, że katalog dla ChromaDB istnieje
    recipe_db.ensure_collection()
    
    # Dodaj przykładowe przepisy
    for recipe in SAMPLE_RECIPES:
        print(f"Dodawanie przepisu: {recipe.title}")
        await recipe_db.add_recipe(recipe)
    
    print("Inicjalizacja zakończona pomyślnie!")

if __name__ == "__main__":
    asyncio.run(init_database()) 