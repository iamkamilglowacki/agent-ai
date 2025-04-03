export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    ANALYZE_TEXT: `${API_URL}/api/analyze/text`,
    ANALYZE_VOICE: `${API_URL}/api/analyze/voice`,
    ANALYZE_IMAGE: `${API_URL}/api/analyze/image`,
    SEARCH_RECIPES: `${API_URL}/api/recipes/search`,
}; 