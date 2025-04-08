// Główna konfiguracja API dla aplikacji

// Stałe URL-e dla różnych serwisów (bez końcowych ukośników)
const BACKEND_BASE_URL = 'https://agent-ai.up.railway.app';
const WOOCOMMERCE_BASE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL || 'https://flavorinthejar.com';

// Funkcja pomocnicza do łączenia URL-i
function joinUrl(base: string, path: string): string {
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${cleanBase}/${cleanPath}`;
}

// Funkcje zwracające URL-e dla różnych serwisów
export function getBackendUrl(): string {
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
        console.log('Using Backend URL from env:', process.env.NEXT_PUBLIC_BACKEND_URL);
        return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    console.log('Using default Backend URL:', BACKEND_BASE_URL);
    return BACKEND_BASE_URL;
}

export function getWooCommerceUrl(): string {
    return WOOCOMMERCE_BASE_URL;
}

// Eksportujemy URL-e
export const BACKEND_URL = getBackendUrl();
export const WOOCOMMERCE_URL = getWooCommerceUrl();

console.log('Configured Backend URL:', BACKEND_URL);
console.log('Configured WooCommerce URL:', WOOCOMMERCE_URL);

// Endpointy dla backendu (AI)
export const BACKEND_ENDPOINTS = {
    ANALYZE_TEXT: '/api/analyze/text',
    ANALYZE_VOICE: '/api/analyze/voice',
    ANALYZE_IMAGE: '/api/analyze/image',
    SEARCH_RECIPES: '/api/recipes/search',
    GET_SPICES: '/api/spices',
};

// Endpointy dla WooCommerce
export const WOOCOMMERCE_ENDPOINTS = {
    CART: {
        GET: '/api/cart/get',
        ADD: '/api/add-to-cart'
    }
};

// Funkcje pomocnicze do tworzenia pełnych URL-i
export function getFullBackendUrl(endpoint: string): string {
    return joinUrl(getBackendUrl(), endpoint);
}

export function getFullWooCommerceUrl(endpoint: string): string {
    return joinUrl(getWooCommerceUrl(), endpoint);
}

// Dla zachowania kompatybilności wstecznej
export const API_ENDPOINTS = {
    ...BACKEND_ENDPOINTS,
    CART: WOOCOMMERCE_ENDPOINTS.CART
};

export const getFullApiUrl = getFullBackendUrl;

console.log('Configured Backend endpoints:', BACKEND_ENDPOINTS);
console.log('Configured WooCommerce endpoints:', WOOCOMMERCE_ENDPOINTS); 