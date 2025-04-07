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
        console.log('Using API URL from env:', process.env.NEXT_PUBLIC_API_URL);
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Priorytet 2: Wykrywanie na podstawie środowiska
    const environment = detectEnvironment();
    console.log('Detected environment:', environment);
    
    let apiUrl;
    switch (environment) {
        case 'production':
            apiUrl = 'https://agent-ai.up.railway.app';
            break;
        case 'staging':
            apiUrl = 'https://agent-ai-staging.up.railway.app';
            break;
        case 'development':
        default:
            apiUrl = 'http://localhost:8000';
            break;
    }
    
    // Upewnij się, że URL zawiera protokół i jest absolutny
    if (apiUrl) {
        if (!apiUrl.startsWith('http')) {
            apiUrl = `https://${apiUrl}`;
        }
        // Usuń trailing slash jeśli istnieje
        apiUrl = apiUrl.replace(/\/$/, '');
    }
    
    console.log('Using API URL:', apiUrl);
    return apiUrl;
}

// Eksportujemy URL API
export const API_URL = getApiUrl();
console.log('Configured API URL:', API_URL);

// Eksportujemy końcówki API z pełnymi URL-ami
export const API_ENDPOINTS = {
    ANALYZE_TEXT: new URL('/api/analyze/text', API_URL).toString(),
    ANALYZE_VOICE: new URL('/api/analyze/voice', API_URL).toString(),
    ANALYZE_IMAGE: new URL('/api/analyze/image', API_URL).toString(),
    SEARCH_RECIPES: new URL('/api/recipes/search', API_URL).toString(),
    GET_SPICES: new URL('/api/spices', API_URL).toString(),
};

console.log('Configured API endpoints:', API_ENDPOINTS); 