from dotenv import load_dotenv
import os
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Jesteś asystentem kulinarnym, który pomaga użytkownikom znaleźć odpowiednie przepisy.
Twoje odpowiedzi powinny być w języku polskim i zawierać:
1. Sugerowany przepis
2. Listę składników
3. Kroki przygotowania
4. Szacunkowy czas przygotowania
5. Poziom trudności
""" 