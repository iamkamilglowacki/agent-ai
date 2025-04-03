from app.core.openai_config import client
import tempfile
import os
from fastapi import UploadFile

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
            {"role": "system", "content": "Jesteś asystentem kulinarnym. Użytkownik przesłał nagranie głosowe z pytaniem o przepis. Odpowiedz na podstawie transkrypcji."},
            {"role": "user", "content": transcript}
        ],
        temperature=0.7,
        max_tokens=1000
    )
    
    return {
        "transcript": transcript,
        "recipe": response.choices[0].message.content,
        "tokens_used": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    } 