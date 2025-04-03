# Agent AI Backend

Backend dla asystenta kulinarnego wykorzystującego sztuczną inteligencję.

## Funkcjonalności

- Analiza tekstu przez GPT-4
- Rozpoznawanie mowy przez Whisper
- Analiza zdjęć przez GPT-4 Vision
- Baza przepisów z wykorzystaniem RAG (Retrieval Augmented Generation)

## Wymagania

- Python 3.9+
- Poetry (opcjonalnie)

## Instalacja

1. Sklonuj repozytorium
2. Przejdź do katalogu backend:
   ```bash
   cd backend
   ```

3. Stwórz i aktywuj wirtualne środowisko:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # lub
   .\venv\Scripts\activate  # Windows
   ```

4. Zainstaluj zależności:
   ```bash
   pip install -r requirements.txt
   ```

5. Skopiuj plik .env.example do .env i uzupełnij zmienne:
   ```bash
   cp .env.example .env
   ```

## Uruchomienie

1. Aktywuj wirtualne środowisko (jeśli nie jest aktywne)

2. Uruchom serwer deweloperski:
   ```bash
   uvicorn app.main:app --reload
   ```

Aplikacja będzie dostępna pod adresem: http://localhost:8000

## Dokumentacja API

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Struktura projektu

```
backend/
├── app/
│   ├── api/           # Endpointy API
│   ├── core/          # Konfiguracja i podstawowe funkcjonalności
│   ├── models/        # Modele danych
│   ├── services/      # Logika biznesowa
│   └── main.py        # Główny plik aplikacji
├── data/             # Dane (np. baza Chroma)
├── tests/            # Testy
├── .env.example      # Przykładowy plik zmiennych środowiskowych
└── requirements.txt  # Zależności
``` 