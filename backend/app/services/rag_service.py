from app.services.recipe_db import recipe_db
from app.core.openai_config import client, SYSTEM_PROMPT
from typing import List, Optional

async def generate_rag_response(
    query: str,
    n_recipes: int = 3,
    filter_tags: Optional[List[str]] = None
) -> dict:
    """
    Generuje odpowiedź używając RAG (Retrieval Augmented Generation)
    """
    # Wyszukaj podobne przepisy
    similar_recipes = await recipe_db.search_recipes(
        query=query,
        n_results=n_recipes,
        filter_tags=filter_tags
    )
    
    # Przygotuj kontekst z podobnych przepisów
    context = "Na podstawie bazy przepisów, znalazłem następujące podobne przepisy:\n\n"
    for i, recipe in enumerate(similar_recipes, 1):
        context += f"{i}. {recipe.title}\n"
        context += f"Opis: {recipe.description}\n"
        context += "Składniki:\n"
        for ingredient in recipe.ingredients:
            amount = f" ({ingredient.amount} {ingredient.unit})" if ingredient.amount else ""
            context += f"- {ingredient.name}{amount}\n"
        context += "\n"
    
    # Generuj odpowiedź używając GPT-4
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Na podstawie tego kontekstu, odpowiedz na pytanie użytkownika.\n\nKontekst:\n{context}\n\nPytanie: {query}"}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    
    return {
        "recipe": response.choices[0].message.content,
        "similar_recipes": [recipe.model_dump() for recipe in similar_recipes],
        "tokens_used": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    } 