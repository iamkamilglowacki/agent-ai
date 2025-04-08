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
    console.log('Próba przełączenia koszyka:', {show});
    const cartSide = document.querySelector('.site-header-cart-side');
    console.log('Znaleziony element:', cartSide);
    
    if (cartSide) {
        if (show) {
            console.log('Dodaję klasę active');
            cartSide.classList.add('active');
        } else {
            console.log('Usuwam klasę active');
            cartSide.classList.remove('active');
        }
        console.log('Klasy po zmianie:', cartSide.classList.toString());
    } else {
        console.log('Nie znaleziono elementu koszyka!');
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

    const handleAddToCart = (clickEvent: React.MouseEvent<HTMLButtonElement>) => {
        clickEvent.preventDefault();
        if (loading || added) return; // Zapobiegaj wielokrotnemu kliknięciu

        setLoading(true);
        setError(null);

        const message = {
            type: 'addToCart',
            payload: {
                productId: product.id,
                quantity: 1 // Załóżmy, że zawsze dodajemy 1
            }
        };

        // Wyślij wiadomość do okna nadrzędnego
        window.parent.postMessage(message, 'https://flavorinthejar.com'); // Zmieniono '*' na właściwy origin

        // Wysuń koszyk od razu po kliknięciu
        toggleCartSide(true);
    };

    return (
        <div className="flex flex-col space-y-2">
            {/* Nie potrzebujemy już ukrytego iframe */}
            
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
                            disabled={loading || added}
                            data-product-id={product.id}
                            className={`px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors ${loading || added ? 'opacity-50' : ''}`}
                        >
                            {loading ? 'Dodawanie...' : added ? 'Dodano!' : 'Dodaj do koszyka'}
                        </button>
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded">
                    {error}
                </div>
            )}
            
            <div 
                className="text-sm text-gray-600" 
                dangerouslySetInnerHTML={{ __html: product.description }}
            />
        </div>
    );
} 