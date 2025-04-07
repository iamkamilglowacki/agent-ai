export function getApiUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname.includes('staging')) {
        return 'https://agent-ai-staging.up.railway.app';
    }
    return process.env.NODE_ENV === 'production'
        ? 'https://agent-ai.up.railway.app'
        : 'http://localhost:8000';
}

// Eksportujemy domyślny URL API
export const API_URL = getApiUrl(); 