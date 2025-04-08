'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { WOOCOMMERCE_ENDPOINTS, getFullWooCommerceUrl } from '../../config/api';
import type jQuery from 'jquery';

// Deklaracja typów dla jQuery
declare global {
  interface Window {
    jQuery: typeof jQuery;
    toggleCartSide: (show: boolean) => void;
  }
}

interface WooCommerceProductProps {
    product: {
        id: number;
        name: string;
        description: string;
        price: string;
        image_url: string;
        product_url: string;
        add_to_cart_url: string;
    };
}

// Interfejs dla fragmentów koszyka z WooCommerce
interface CartFragments {
    cart_count?: number;
    cart_total?: string;
    [key: string]: unknown;
}

// Funkcja do wysuwania karty koszyka
const toggleCartSide = (show: boolean) => {
    console.log('🔍 TEST DEPLOYU - NOWA WERSJA 🔍');
    console.log('Próba przełączenia koszyka:', {show});
    
    // Spróbuj różne selektory
    const selectors = [
        '.site-header-cart-side',
        '#site-header-cart',
        '.cart-side',
        '.widget_shopping_cart',
        '.widget_shopping_cart_content'
    ];
    
    let cartSide = null;
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        console.log(`Szukam elementu ${selector}:`, element);
        if (element) {
            cartSide = element;
            console.log('Znaleziono element koszyka:', selector);
            break;
        }
    }
    
    if (cartSide) {
        if (show) {
            console.log('Dodaję klasę active');
            cartSide.classList.add('active');
            // Spróbuj też inne klasy używane przez WooCommerce
            cartSide.classList.add('visible');
            cartSide.classList.add('shown');
            if (cartSide instanceof HTMLElement) {
                cartSide.style.display = 'block';
            }
        } else {
            console.log('Usuwam klasę active');
            cartSide.classList.remove('active');
            cartSide.classList.remove('visible');
            cartSide.classList.remove('shown');
            if (cartSide instanceof HTMLElement) {
                cartSide.style.display = 'none';
            }
        }
        console.log('Klasy po zmianie:', cartSide.classList.toString());
    } else {
        console.error('Nie znaleziono elementu koszyka! Dostępne elementy:');
        document.querySelectorAll('*').forEach(el => {
            if (el.classList.length > 0 && (
                el.classList.toString().includes('cart') || 
                el.classList.toString().includes('shop') ||
                el.id.includes('cart') ||
                el.id.includes('shop')
            )) {
                console.log('Potencjalny element:', el.tagName, {
                    id: el.id,
                    classes: el.classList.toString()
                });
            }
        });
    }
};

// Dodaj toggleCartSide do window object
if (typeof window !== 'undefined') {
    window.toggleCartSide = toggleCartSide;
}

// Funkcja pomocnicza do aktualizacji elementów mini-koszyka
const updateMiniCartElements = (count: string) => {
    const miniCartElements = document.querySelectorAll('.mini-cart-count');
    miniCartElements.forEach(element => {
        if (element instanceof HTMLElement) {
            element.innerText = count;
            element.classList.add('cart-updated');
            setTimeout(() => element.classList.remove('cart-updated'), 1000);
        }
    });
};

// Funkcja do odświeżania mini-koszyka
const refreshMiniCart = async (fragments?: CartFragments) => {
    try {
        if (fragments) {
            const cartCount = fragments?.cart_count;
            if (cartCount !== undefined) {
                updateMiniCartElements(cartCount.toString());
                return;
            }
        }

        const response = await fetch(getFullWooCommerceUrl(WOOCOMMERCE_ENDPOINTS.CART.GET), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const count = data.cart_count || '0';
        updateMiniCartElements(count.toString());
    } catch (error) {
        console.error('Błąd podczas odświeżania koszyka:', error);
        updateMiniCartElements('0');
    }
};

// Komponent produktu WooCommerce - zaktualizowany
export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Upewnij się, że kod wykonuje się tylko po stronie klienta
        if (typeof window === 'undefined') return;

        // Poczekaj na pełne załadowanie DOM
        const initializeListeners = () => {
            console.log('Inicjalizacja listenerów...');

            // Dodaj listener na wiadomości
            const handleMessage = (e: MessageEvent) => {
                console.log('Otrzymano wiadomość:', e.data);
                if (e.data.type === 'cartUpdated' || e.data.type === 'addToCart') {
                    console.log('Wywołuję toggleCartSide(true) dla typu:', e.data.type);
                    toggleCartSide(true);
                }
            };

            window.addEventListener('message', handleMessage);

            // Dodaj listener na zdarzenie added_to_cart z WooCommerce
            if (window.jQuery) {
                window.jQuery(document.body).on('added_to_cart', () => {
                    console.log('Złapano zdarzenie added_to_cart z WooCommerce');
                    toggleCartSide(true);
                });
            }

            // Cleanup
            return () => {
                window.removeEventListener('message', handleMessage);
                if (window.jQuery) {
                    window.jQuery(document.body).off('added_to_cart');
                }
            };
        };

        // Uruchom inicjalizację po załadowaniu dokumentu
        if (document.readyState === 'complete') {
            initializeListeners();
        } else {
            window.addEventListener('load', initializeListeners);
            return () => window.removeEventListener('load', initializeListeners);
        }
    }, []);

    const handleAddToCart = async (clickEvent: React.MouseEvent<HTMLButtonElement>) => {
        clickEvent.preventDefault();
        console.log('Kliknięto przycisk "Dodaj do koszyka"');
        
        if (loading || added) {
            console.log('Przycisk jest zablokowany:', { loading, added });
            return;
        }

        setLoading(true);
        setError(null);
        console.log('Ustawiono stan loading=true');

        try {
            const message = {
                type: 'addToCart',
                payload: {
                    productId: product.id,
                    quantity: 1
                }
            };

            // Wyślij wiadomość do okna nadrzędnego
            console.log('Wysyłanie wiadomości do rodzica:', message);
            window.parent.postMessage(message, 'https://flavorinthejar.com');
            
            // Oznacz jako dodane
            console.log('Ustawianie stanu added=true');
            setAdded(true);
            setLoading(false);

            // Po 2 sekundach resetuj stan
            console.log('Ustawianie timera na reset stanu');
            setTimeout(() => {
                console.log('Resetowanie stanów added i loading');
                setAdded(false);
                setLoading(false);
            }, 2000);

        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError('Nie udało się dodać produktu do koszyka. Spróbuj ponownie.');
            setAdded(false);
            setLoading(false);
        }
    };

    // Komponent przycisku
    const buttonText = loading ? 'Dodawanie...' : added ? 'Dodano!' : 'Wrzuć do basket';
    const buttonDisabled = loading || added;

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-md overflow-hidden">
                    {product.image_url && (
                        <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="object-cover w-full h-full" 
                        />
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-green-700">{product.name}</h4>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{product.price} zł</p>
                        <button 
                            onClick={handleAddToCart}
                            disabled={buttonDisabled}
                            data-product-id={product.id}
                            className={`px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors ${buttonDisabled ? 'opacity-50' : ''}`}
                        >
                            {buttonText}
                        </button>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div 
                className="text-sm text-gray-600" 
                dangerouslySetInnerHTML={{ __html: product.description }}
            />
        </div>
    );
} 