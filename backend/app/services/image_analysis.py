from app.core.openai_config import client
import base64
from fastapi import UploadFile, HTTPException
import logging
import io
from fastapi.responses import StreamingResponse
import json
import asyncio

logger = logging.getLogger(__name__)

async def analyze_image_query(file: UploadFile) -> StreamingResponse:
    """
    Analizuje zdjęcie i rozpoznaje składniki używając GPT-4 Turbo
    """
    try:
        logger.info(f"Rozpoczynam analizę obrazu. Content type: {file.content_type}")
        
        if not file.content_type.startswith('image/'):
            logger.error(f"Nieprawidłowy typ pliku: {file.content_type}")
            raise HTTPException(status_code=400, detail="Plik musi być obrazem")
        
        # Sprawdź rozmiar pliku
        content = await file.read()
        file_size = len(content)
        
        logger.info(f"Rozmiar pliku: {file_size} bajtów")
        
        if file_size > 20 * 1024 * 1024:  # 20MB limit
            logger.error(f"Plik jest za duży: {file_size} bajtów")
            raise HTTPException(status_code=400, detail="Plik jest za duży (max 20MB)")
        
        # Zakoduj obraz w base64
        base64_encoded = base64.b64encode(content).decode('utf-8')
        
        # Wysyłamy plik binarny bezpośrednio do OpenAI
        logger.info("Wysyłam zapytanie do OpenAI API")
        try:
            response = client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """Jesteś asystentem kulinarnym. Przeanalizuj zdjęcie i:
                        1. Zidentyfikuj widoczne składniki
                        2. Zaproponuj TRZY RÓŻNE przepisy wykorzystujące te składniki
                        3. Dla każdego przepisu podaj:
                           - tytuł
                           - listę składników
                           - kroki przygotowania
                        
                        Odpowiedz w języku polskim.
                        
                        STRUKTURA ODPOWIEDZI:
                        Na zdjęciu widać: [lista zidentyfikowanych składników]
                        
                        PRZEPIS 1:
                        Tytuł: [tytuł przepisu]
                        Składniki:
                        - składnik 1
                        - składnik 2
                        ...
                        Przygotowanie:
                        1. krok 1
                        2. krok 2
                        ...
                        
                        PRZEPIS 2:
                        Tytuł: [tytuł przepisu]
                        Składniki:
                        - składnik 1
                        - składnik 2
                        ...
                        Przygotowanie:
                        1. krok 1
                        2. krok 2
                        ...
                        
                        PRZEPIS 3:
                        Tytuł: [tytuł przepisu]
                        Składniki:
                        - składnik 1
                        - składnik 2
                        ...
                        Przygotowanie:
                        1. krok 1
                        2. krok 2
                        ..."""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{file.content_type};base64,{base64_encoded}",
                                    "detail": "low"
                                }
                            },
                            {
                                "type": "text",
                                "text": "Jakie trzy różne dania mogę przygotować z tych składników?"
                            }
                        ]
                    }
                ],
                max_tokens=1500,
                stream=True,
                temperature=0.7
            )
            
            async def generate():
                full_response = ""
                try:
                    for chunk in response:
                        if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                            content = chunk.choices[0].delta.content
                            full_response += content
                            # Wysyłamy każdy fragment jako prawidłowy JSON
                            response_chunk = {
                                "analysis": content,
                                "status": "streaming"
                            }
                            yield json.dumps(response_chunk, ensure_ascii=False) + "\n"
                            await asyncio.sleep(0.01)
                    
                    # Końcowa odpowiedź
                    final_response = {
                        "analysis": full_response,
                        "status": "completed",
                        "tokens_used": {
                            "prompt_tokens": getattr(response, 'usage', {}).get('prompt_tokens', 0),
                            "completion_tokens": getattr(response, 'usage', {}).get('completion_tokens', 0),
                            "total_tokens": getattr(response, 'usage', {}).get('total_tokens', 0)
                        }
                    }
                    yield json.dumps(final_response, ensure_ascii=False) + "\n"
                except Exception as e:
                    logger.error(f"Błąd podczas generowania odpowiedzi: {str(e)}")
                    yield json.dumps({"error": str(e)}, ensure_ascii=False) + "\n"
            
            return StreamingResponse(
                generate(),
                media_type="application/x-ndjson",
                headers={
                    "X-Content-Type-Options": "nosniff",
                    "Cache-Control": "no-cache"
                }
            )
            
        except Exception as api_error:
            logger.error(f"Błąd podczas komunikacji z OpenAI API: {str(api_error)}")
            
            # Sprawdź czy to błąd limitu (quota)
            error_message = str(api_error).lower()
            if "insufficient_quota" in error_message or "quota" in error_message or "billing" in error_message:
                raise HTTPException(
                    status_code=402, 
                    detail="Przekroczono limit użycia API OpenAI. Prosimy spróbować później lub skontaktować się z administratorem."
                )
            
            raise HTTPException(status_code=500, detail=f"Błąd podczas komunikacji z OpenAI: {str(api_error)}")
    except HTTPException as he:
        logger.error(f"HTTP Error: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Błąd podczas analizy obrazu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Błąd podczas analizy obrazu: {str(e)}") 