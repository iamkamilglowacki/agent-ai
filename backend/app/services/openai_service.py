from openai import AsyncOpenAI
import os
import json
from typing import Dict

class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def generate_recipe(self, query: str) -> Dict:
        """Generuje przepis na podstawie zapytania użytkownika."""
        try:
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """Jesteś ekspertem kulinarnym. Generuj przepisy w języku polskim.
                    Zwróć przepis w formacie JSON z następującymi polami:
                    - title: tytuł przepisu
                    - ingredients: lista składników (każdy składnik jako osobny string)
                    - steps: lista kroków przygotowania (każdy krok jako osobny string)
                    
                    WAŻNE: Nie dodawaj przypraw ani mieszanek przyprawowych do składników - zostaną one dodane automatycznie."""},
                    {"role": "user", "content": query}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            recipe_text = response.choices[0].message.content
            try:
                recipe_data = json.loads(recipe_text)
                return recipe_data
            except json.JSONDecodeError:
                # Jeśli odpowiedź nie jest poprawnym JSON, spróbuj wyekstrahować dane
                import re
                
                # Ekstrakcja tytułu
                title_match = re.search(r'"title":\s*"([^"]+)"', recipe_text)
                title = title_match.group(1) if title_match else "Przepis"
                
                # Ekstrakcja składników
                ingredients_match = re.search(r'"ingredients":\s*\[(.*?)\]', recipe_text, re.DOTALL)
                ingredients = []
                if ingredients_match:
                    ingredients_text = ingredients_match.group(1)
                    ingredients = [ing.strip().strip('"').strip("'") for ing in ingredients_text.split(",")]
                
                # Ekstrakcja kroków
                steps_match = re.search(r'"steps":\s*\[(.*?)\]', recipe_text, re.DOTALL)
                steps = []
                if steps_match:
                    steps_text = steps_match.group(1)
                    steps = [step.strip().strip('"').strip("'") for step in steps_text.split(",")]
                
                return {
                    "title": title,
                    "ingredients": ingredients,
                    "steps": steps
                }
                
        except Exception as e:
            print(f"Błąd podczas generowania przepisu: {str(e)}")
            raise

# Singleton instance
openai_service = OpenAIService() 