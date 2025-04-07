// Główna konfiguracja API dla aplikacji
// Priorytetowo używamy zmiennej środowiskowej NEXT_PUBLIC_API_URL

// Funkcja do wykrywania środowiska
function detectEnvironment() {
    // Sprawdź, czy kod działa w przeglądarce
    if (typeof window !== 'undefined') {
        // Sprawdź staging na podstawie URL
        if (window.location.hostname.includes('staging')) {
            return 'staging';
        }
        // Sprawdź produkcję na podstawie URL
        if (window.location.hostname === 'smakosz.flavorinthejar.com' || 
            window.location.hostname.includes('vercel.app')) {
            return 'production';
        }
        // Domyślnie development
        return 'development';
    }
    // Jeśli nie jesteśmy w przeglądarce, użyj NODE_ENV
    return process.env.NODE_ENV || 'development';
}

// Funkcja zwracająca odpowiedni URL API w zależności od środowiska
export function getApiUrl(): string {
    // Priorytet 1: Zdefiniowana zmienna środowiskowa
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Priorytet 2: Wykrywanie na podstawie środowiska
    const environment = detectEnvironment();
    
    switch (environment) {
        case 'production':
            return 'https://agent-ai.up.railway.app';
        case 'staging':
            return 'https://agent-ai-staging.up.railway.app';
        case 'development':
        default:
            return 'http://localhost:8000';
    }
}

// Eksportujemy URL API
export const API_URL = getApiUrl();

// Eksportujemy końcówki API
export const API_ENDPOINTS = {
    ANALYZE_TEXT: `${API_URL}/api/analyze/text`,
    ANALYZE_VOICE: `${API_URL}/api/analyze/voice`,
    ANALYZE_IMAGE: `${API_URL}/api/analyze/image`,
    SEARCH_RECIPES: `${API_URL}/api/recipes/search`,
    GET_SPICES: `${API_URL}/api/spices`,
}; 