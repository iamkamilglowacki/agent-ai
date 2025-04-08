// Główna konfiguracja API dla aplikacji
// Priorytetowo używamy zmiennej środowiskowej NEXT_PUBLIC_API_URL

// Stały URL API
const API_BASE_URL = 'https://agent-ai.up.railway.app';

// Funkcja zwracająca URL API
export function getApiUrl(): string {
    // Jeśli jest zdefiniowana zmienna środowiskowa, użyj jej
    if (process.env.NEXT_PUBLIC_API_URL) {
        console.log('Using API URL from env:', process.env.NEXT_PUBLIC_API_URL);
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // W przeciwnym razie użyj domyślnego URL
    console.log('Using default API URL:', API_BASE_URL);
    return API_BASE_URL;
}

// Eksportujemy URL API
export const API_URL = getApiUrl();
console.log('Configured API URL:', API_URL);

// Eksportujemy końcówki API używając relatywnych ścieżek
export const API_ENDPOINTS = {
    ANALYZE_TEXT: '/api/analyze/text',
    ANALYZE_VOICE: '/api/analyze/voice',
    ANALYZE_IMAGE: '/api/analyze/image',
    SEARCH_RECIPES: '/api/recipes/search',
    GET_SPICES: '/api/spices',
    CART: {
        GET: '/api/cart/get',
        ADD: '/api/add-to-cart'
    }
};

console.log('Configured API endpoints:', API_ENDPOINTS); 