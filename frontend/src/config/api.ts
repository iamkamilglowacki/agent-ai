const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // Sprawdź czy to środowisko staging na podstawie URL
    if (typeof window !== 'undefined' && window.location.hostname.includes('staging')) {
        return 'https://agent-ai-staging.up.railway.app';
    }

    if (process.env.NODE_ENV === 'production') {
        // URL backendu na Railway
        return 'https://agent-ai-production.up.railway.app';
    }

    // URL lokalny dla developmentu
    return 'http://localhost:8000';
};

export const API_URL = getApiUrl(); 