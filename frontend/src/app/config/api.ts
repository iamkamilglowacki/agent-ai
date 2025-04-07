// Używamy zmiennej środowiskowej lub domyślnego adresu API
// Uwaga: W środowisku produkcyjnym powinno być ustawione NEXT_PUBLIC_API_URL na https://agent-ai.up.railway.app
// lub preferowane jest używanie relatywnego URL (/api) jeśli działamy na tej samej domenie
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agent-ai.up.railway.app';

export const API_ENDPOINTS = {
    ANALYZE_TEXT: `${API_URL}/api/analyze/text`,
    ANALYZE_VOICE: `${API_URL}/api/analyze/voice`,
    ANALYZE_IMAGE: `${API_URL}/api/analyze/image`,
    SEARCH_RECIPES: `${API_URL}/api/recipes/search`,
    GET_SPICES: `${API_URL}/api/spices`,
}; 