from app.core.openai_config import client, SYSTEM_PROMPT
from openai.types.chat import ChatCompletion
from typing import Optional, List, Dict
from fastapi import HTTPException
import logging
from app.services.spice_mapping import spice_mapping_service
import re

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
    Analizuje zapytanie użytkownika i zwraca sugerowany przepis używając GPT-4
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
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            logger.info("Otrzymano odpowiedź z OpenAI API")
        except Exception as api_error:
            logger.error(f"Błąd podczas komunikacji z OpenAI API: {str(api_error)}")
            raise HTTPException(status_code=500, detail=f"Błąd podczas komunikacji z OpenAI: {str(api_error)}")

        # Wyciągnij składniki z odpowiedzi
        recipe_text = response.choices[0].message.content
        ingredients = await extract_ingredients_from_response(recipe_text)

        # Pobierz rekomendacje przypraw dla każdego składnika
        spice_recommendations: Dict[str, Dict] = {}
        for ingredient in ingredients:
            recommendation = await spice_mapping_service.get_spice_recommendation(ingredient)
            if recommendation:
                spice_recommendations[ingredient] = recommendation

        # Zwróć odpowiedź
        return {
            "recipe": recipe_text,
            "spice_recommendations": spice_recommendations,
            "tokens_used": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    except HTTPException as he:
        logger.error(f"HTTP Error: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Błąd podczas analizy tekstu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas analizy tekstu: {str(e)}") 