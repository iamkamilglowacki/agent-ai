from app.core.openai_config import client, SYSTEM_PROMPT
from openai.types.chat import ChatCompletion
from typing import Optional, List

async def analyze_text_query(
    query: str,
    calories: Optional[int] = None,
    dietary_restrictions: Optional[List[str]] = None
) -> dict:
    """
    Analizuje zapytanie użytkownika i zwraca sugerowany przepis używając GPT-4
    """
    # Przygotuj kontekst zapytania
    user_message = query
    if calories:
        user_message += f"\nMaksymalna liczba kalorii: {calories}"
    if dietary_restrictions:
        user_message += f"\nOgraniczenia dietetyczne: {', '.join(dietary_restrictions)}"

    # Wywołaj API OpenAI
    response: ChatCompletion = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7,
        max_tokens=1000
    )

    # Zwróć odpowiedź
    return {
        "recipe": response.choices[0].message.content,
        "tokens_used": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    } 