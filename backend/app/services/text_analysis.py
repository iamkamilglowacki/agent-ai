from app.core.openai_config import client, SYSTEM_PROMPT
from openai.types.chat import ChatCompletion
from typing import Optional, List, Dict
from fastapi import HTTPException
import logging
from app.services.spice_mapping import spice_mapping_service
import re
import json

logger = logging.getLogger(__name__)

async def extract_ingredients_from_response(response: str) -> List[str]:
    """
    Wyciąga listę składników z odpowiedzi AI
    """
    ingredients = []
    # Szukaj sekcji składników
    ingredients_section = re.search(r"Składniki:?\n(.*?)(?:\n\n|\n[A-Z])", response, re.DOTALL)
    if ingredients_section:
        # Podziel na linie i wyczyść
        ingredients_lines = ingredients_section.group(1).strip().split('\n')
        for line in ingredients_lines:
            # Usuń punktory i białe znaki
            ingredient = re.sub(r'^[-•*]\s*', '', line.strip())
            if ingredient:
                ingredients.append(ingredient)
    return ingredients

async def analyze_text_query(
    query: str,
    calories: Optional[int] = None,
    dietary_restrictions: Optional[List[str]] = None
) -> dict:
    """
    Analizuje zapytanie użytkownika i zwraca sugerowane przepisy używając GPT-4
    """
    try:
        # Przygotuj kontekst zapytania
        user_message = query
        if calories:
            user_message += f"\nMaksymalna liczba kalorii: {calories}"
        if dietary_restrictions:
            user_message += f"\nOgraniczenia dietetyczne: {', '.join(dietary_restrictions)}"

        logger.info(f"Wysyłam zapytanie do OpenAI API: {user_message}")

        # Wywołaj API OpenAI
        try:
            response: ChatCompletion = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": """Jesteś ekspertem kulinarnym. Generuj przepisy w języku polskim.
                    Zwróć TRZY warianty przepisów w formacie JSON z następującą strukturą:
                    {
                      "recipes": [
                        {
                          "title": "Tytuł przepisu 1",
                          "ingredients": ["składnik 1", "składnik 2", ...],
                          "steps": ["krok 1", "krok 2", ...]
                        },
                        {
                          "title": "Tytuł przepisu 2",
                          "ingredients": ["składnik 1", "składnik 2", ...],
                          "steps": ["krok 1", "krok 2", ...]
                        },
                        {
                          "title": "Tytuł przepisu 3",
                          "ingredients": ["składnik 1", "składnik 2", ...],
                          "steps": ["krok 1", "krok 2", ...]
                        }
                      ]
                    }
                    
                    WAŻNE: 
                    1. Nie dodawaj przypraw ani mieszanek przyprawowych do składników - zostaną one dodane automatycznie
                    2. Zaproponuj trzy RÓŻNE przepisy, które pasują do zapytania użytkownika
                    3. Każdy przepis powinien być inny, ale pasujący do tematu zapytania"""},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            logger.info("Otrzymano odpowiedź z OpenAI API")
        except Exception as api_error:
            logger.error(f"Błąd podczas komunikacji z OpenAI API: {str(api_error)}")
            raise HTTPException(status_code=500, detail=f"Błąd podczas komunikacji z OpenAI: {str(api_error)}")

        # Parsuj odpowiedź jako JSON
        recipe_text = response.choices[0].message.content
        try:
            data = json.loads(recipe_text)
            recipes_data = data.get("recipes", [])
            
            if not recipes_data:
                # Jeśli nie ma recipes, to może być pojedynczy przepis
                recipes_data = [data]
        except json.JSONDecodeError:
            # Jeśli odpowiedź nie jest poprawnym JSON, próbujemy wyodrębnić dane
            logger.warning("Nie udało się sparsować odpowiedzi jako JSON, próbuję wyodrębnić dane ręcznie")
            # Spróbuj znaleźć przepisy ręcznie
            recipe_blocks = re.split(r'\n*(?:Przepis|Wariant) \d+:', recipe_text)
            if len(recipe_blocks) > 1:
                recipe_blocks = recipe_blocks[1:]  # Usuń pierwszy element, który jest pusty lub wprowadzeniem
            else:
                # Jeśli nie znaleziono podziału, traktuj całość jako jeden przepis
                recipe_blocks = [recipe_text]
                
            recipes_data = []
            for block in recipe_blocks:
                title_match = re.search(r'(?:Tytuł:|#)(.*?)(?:\n|$)', block)
                title = title_match.group(1).strip() if title_match else "Przepis"
                
                ingredients = await extract_ingredients_from_response(block)
                
                steps = []
                steps_section = re.search(r'(?:Przygotowanie:|Kroki:|Sposób przygotowania:)\n(.*?)(?:\n\n|$)', block, re.DOTALL)
                if steps_section:
                    steps_text = steps_section.group(1)
                    steps = [step.strip() for step in re.split(r'\d+\.\s*', steps_text) if step.strip()]
                
                recipes_data.append({
                    "title": title,
                    "ingredients": ingredients,
                    "steps": steps
                })
            
            # Jeśli nadal nie mamy przepisów, utwórz domyślny
            if not recipes_data:
                recipes_data = [{
                    "title": "Przepis",
                    "ingredients": [],
                    "steps": ["Nie udało się wygenerować szczegółów przepisu"]
                }]

        # Lista na przetworzone przepisy
        processed_recipes = []
        
        # Przetwórz każdy przepis
        for recipe_data in recipes_data[:3]:  # Bierzemy maksymalnie 3 przepisy
            # Pobierz rekomendacje przypraw dla każdego składnika
            spice_recommendations = await spice_mapping_service.get_spice_recommendations(recipe_data.get("ingredients", []))
            
            # Dodaj przetworzone dane
            processed_recipes.append({
                "title": recipe_data.get("title", "Przepis"),
                "ingredients": recipe_data.get("ingredients", []),
                "steps": recipe_data.get("steps", []),
                "spice_recommendations": spice_recommendations
            })
        
        # Jeśli mamy mniej niż 3 przepisy, dodaj przykładowe
        while len(processed_recipes) < 3:
            processed_recipes.append({
                "title": f"Alternatywny przepis {len(processed_recipes) + 1}",
                "ingredients": ["Składnik 1", "Składnik 2"],
                "steps": ["Krok 1", "Krok 2"],
                "spice_recommendations": {}
            })

        # Zwróć odpowiedź
        return {
            "recipes": processed_recipes
        }
    except HTTPException as he:
        logger.error(f"HTTP Error: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Błąd podczas analizy tekstu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas analizy tekstu: {str(e)}") 