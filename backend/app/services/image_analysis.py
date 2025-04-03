from app.core.openai_config import client
import base64
from fastapi import UploadFile, HTTPException
import logging

logger = logging.getLogger(__name__)

async def encode_image(file: UploadFile) -> str:
    """
    Konwertuje plik obrazu na base64
    """
    try:
        # Upewnij się, że wskaźnik jest na początku pliku
        await file.seek(0)
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Pusty plik")
        return base64.b64encode(content).decode('utf-8')
    except Exception as e:
        logger.error(f"Błąd podczas kodowania obrazu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas przetwarzania obrazu: {str(e)}")

async def analyze_image_query(file: UploadFile) -> dict:
    """
    Analizuje zdjęcie i rozpoznaje składniki używając GPT-4 Vision
    """
    try:
        logger.info(f"Rozpoczynam analizę obrazu. Content type: {file.content_type}")
        
        if not file.content_type.startswith('image/'):
            logger.error(f"Nieprawidłowy typ pliku: {file.content_type}")
            raise HTTPException(status_code=400, detail="Plik musi być obrazem")
        
        # Sprawdź rozmiar pliku
        await file.seek(0)
        content = await file.read()
        file_size = len(content)
        await file.seek(0)  # Reset pozycji pliku
        
        logger.info(f"Rozmiar pliku: {file_size} bajtów")
        
        if file_size > 20 * 1024 * 1024:  # 20MB limit
            logger.error(f"Plik jest za duży: {file_size} bajtów")
            raise HTTPException(status_code=400, detail="Plik jest za duży (max 20MB)")
            
        # Konwertuj obraz na base64
        logger.info("Rozpoczynam konwersję obrazu na base64")
        base64_image = await encode_image(file)
        logger.info("Konwersja na base64 zakończona")
        
        # Przygotuj prompt dla GPT-4 Vision
        logger.info("Wysyłam zapytanie do OpenAI API")
        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """Jesteś asystentem kulinarnym. Przeanalizuj zdjęcie i:
                        1. Zidentyfikuj widoczne składniki
                        2. Zaproponuj przepis wykorzystujący te składniki
                        3. Podaj alternatywne propozycje dań
                        Odpowiedz w języku polskim."""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            },
                            {
                                "type": "text",
                                "text": "Jakie danie mogę przygotować z tych składników?"
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            logger.info("Otrzymano odpowiedź z OpenAI API")
        except Exception as api_error:
            logger.error(f"Błąd podczas komunikacji z OpenAI API: {str(api_error)}")
            raise HTTPException(status_code=500, detail=f"Błąd podczas komunikacji z OpenAI: {str(api_error)}")
        
        return {
            "analysis": response.choices[0].message.content,
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
        logger.error(f"Błąd podczas analizy obrazu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas analizy obrazu: {str(e)}") 