from app.core.openai_config import client
import tempfile
import os
from fastapi import UploadFile
import json

async def transcribe_audio(file: UploadFile) -> str:
    """
    Transkrybuje plik audio używając OpenAI Whisper
    """
    # Zapisz plik tymczasowo
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file.flush()
        
        try:
            # Transkrypcja używając Whisper
            with open(temp_file.name, 'rb') as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="pl"
                )
            return transcript.text
        finally:
            # Usuń plik tymczasowy
            os.unlink(temp_file.name)

async def analyze_voice_query(file: UploadFile) -> dict:
    """
    Analizuje nagranie głosowe i zwraca transkrypcję oraz sugerowany przepis
    """
    # Transkrybuj audio
    transcript = await transcribe_audio(file)
    
    # Generuj odpowiedź używając GPT-4
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": """Jesteś asystentem kulinarnym. Użytkownik przesłał nagranie głosowe z pytaniem o przepis. 
Wygeneruj TRZY różne przepisy na podstawie zapytania. Nie zwracaj surowego JSONa, tylko sformatowany tekst w następującej strukturze:

PRZEPIS 1:
Tytuł: [tytuł przepisu]
Składniki:
- [składnik 1 z ilością]
- [składnik 2 z ilością]
...

Przygotowanie:
1. [krok 1]
2. [krok 2]
...

Polecana mieszanka przypraw:
[nazwa mieszanki]
[opis mieszanki]
Cena: [cena] zł

Alternatywne dania:
- [alternatywne danie 1]
- [alternatywne danie 2]

PRZEPIS 2:
[tak samo jak wyżej]

PRZEPIS 3:
[tak samo jak wyżej]

Pamiętaj, aby:
1. Wygenerować DOKŁADNIE 3 różne przepisy
2. Podać dokładne ilości składników
3. Opisać kroki przygotowania szczegółowo
4. Dla każdego przepisu zaproponować odpowiednią mieszankę przypraw
5. Używać języka polskiego"""},
            {"role": "user", "content": transcript}
        ],
        temperature=0.7,
        max_tokens=2000
    )

    text_response = response.choices[0].message.content
    
    # Przetwórz tekst na strukturę JSON
    recipes = []
    current_recipe = None
    current_section = None
    
    for line in text_response.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('PRZEPIS'):
            if current_recipe:
                recipes.append(current_recipe)
            current_recipe = {
                'title': '',
                'ingredients': [],
                'steps': [],
                'spice_recommendations': {
                    'recipe_blend': {
                        'name': '',
                        'description': '',
                        'price': '',
                        'image_url': 'https://flavorinthejar.com/wp-content/uploads/2024/03/spices.jpg',
                        'product_url': 'https://flavorinthejar.com/shop',
                        'add_to_cart_url': 'https://flavorinthejar.com/cart'
                    }
                },
                'alternative_dishes': []
            }
            current_section = None
        elif line.startswith('Tytuł:'):
            current_recipe['title'] = line.replace('Tytuł:', '').strip()
            current_section = None
        elif line == 'Składniki:':
            current_section = 'ingredients'
        elif line == 'Przygotowanie:':
            current_section = 'steps'
        elif line == 'Polecana mieszanka przypraw:':
            current_section = 'spices'
        elif line == 'Alternatywne dania:':
            current_section = 'alternatives'
        elif current_section == 'ingredients' and line.startswith('-'):
            current_recipe['ingredients'].append(line.replace('-', '').strip())
        elif current_section == 'steps' and line[0].isdigit():
            current_recipe['steps'].append(line.split('.', 1)[1].strip())
        elif current_section == 'spices':
            if 'Cena:' in line:
                current_recipe['spice_recommendations']['recipe_blend']['price'] = line.split('Cena:', 1)[1].replace('zł', '').strip()
            elif not current_recipe['spice_recommendations']['recipe_blend']['name']:
                current_recipe['spice_recommendations']['recipe_blend']['name'] = line
            else:
                current_recipe['spice_recommendations']['recipe_blend']['description'] = line
        elif current_section == 'alternatives' and line.startswith('-'):
            current_recipe['alternative_dishes'].append(line.replace('-', '').strip())
    
    # Dodaj ostatni przepis
    if current_recipe:
        recipes.append(current_recipe)
    
    return {
        "transcript": transcript,
        "recipes": recipes,
        "tokens_used": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    } 