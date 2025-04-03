import chromadb
from chromadb.config import Settings
import json
import os
from typing import List, Optional
from app.models.recipe import Recipe, RecipeResponse
from app.core.openai_config import client
import logging

logger = logging.getLogger(__name__)

class RecipeDatabase:
    def __init__(self, db_path: str = "./data/chroma"):
        self.db_path = db_path
        # Upewnij się, że katalog istnieje
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        logger.info(f"Inicjalizacja bazy danych w {db_path}")
        try:
            self.client = chromadb.PersistentClient(path=db_path, settings=Settings(allow_reset=True))
            self.ensure_collection()
        except Exception as e:
            logger.error(f"Błąd podczas inicjalizacji bazy danych: {str(e)}")
            raise

    def ensure_collection(self):
        """Upewnia się, że kolekcja recipes istnieje."""
        try:
            self.collection = self.client.get_collection("recipes")
            logger.info("Znaleziono istniejącą kolekcję recipes")
        except ValueError:
            logger.info("Tworzenie nowej kolekcji recipes")
            self.collection = self.client.create_collection("recipes")

    def _get_embedding(self, text: str) -> List[float]:
        """Generuje embedding dla tekstu używając OpenAI API."""
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding

    async def add_recipe(self, recipe: Recipe):
        """Dodaje przepis do bazy danych."""
        # Przygotuj tekst do embeddingu
        recipe_text = f"{recipe.title}\n{recipe.description}\n"
        recipe_text += "Składniki:\n" + "\n".join([f"{i.amount} {i.unit} {i.name}" for i in recipe.ingredients])
        recipe_text += "\nInstrukcje:\n" + "\n".join(recipe.instructions)
        
        # Generuj embedding
        embedding = self._get_embedding(recipe_text)
        
        # Przygotuj metadane
        metadata = {
            "title": recipe.title,
            "description": recipe.description,
            "prep_time": recipe.prep_time,
            "cook_time": recipe.cook_time,
            "servings": recipe.servings,
            "difficulty": recipe.difficulty,
            "tags": ",".join(recipe.tags),
            "source": recipe.source or ""
        }
        
        # Dodaj do ChromaDB
        self.collection.add(
            documents=[recipe_text],
            embeddings=[embedding],
            metadatas=[metadata],
            ids=[recipe.id]
        )

    async def search_recipes(self, query: str, n_results: int = 3, filter_tags: Optional[List[str]] = None) -> List[RecipeResponse]:
        """Wyszukuje przepisy podobne do zapytania."""
        # Generuj embedding dla zapytania
        query_embedding = self._get_embedding(query)
        
        # Przygotuj filtr dla tagów
        where = {"$and": [{"tags": {"$contains": tag}} for tag in (filter_tags or [])]} if filter_tags else None
        
        # Wyszukaj podobne przepisy
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where
        )
        
        # Konwertuj wyniki na RecipeResponse
        recipes = []
        for i in range(len(results['ids'][0])):
            recipe_data = results['metadatas'][0][i]
            recipe = Recipe(**recipe_data)
            similarity = float(results['distances'][0][i])
            recipes.append(RecipeResponse(
                **recipe.model_dump(),
                similarity_score=1.0 - similarity  # Konwertuj odległość na podobieństwo
            ))
        
        return recipes

    def get_recipe_by_id(self, recipe_id: str) -> Optional[Recipe]:
        """Pobiera przepis po ID."""
        try:
            result = self.collection.get(ids=[recipe_id])
            if result['ids']:
                return Recipe(**result['metadatas'][0])
            return None
        except Exception:
            return None

    def delete_recipe(self, recipe_id: str) -> bool:
        """Usuwa przepis z bazy danych."""
        try:
            self.collection.delete(ids=[recipe_id])
            return True
        except Exception:
            return False

# Singleton instance
recipe_db = RecipeDatabase() 