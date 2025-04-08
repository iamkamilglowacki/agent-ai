'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Spice } from '../../types/spices';
import { getFullWooCommerceUrl, WOOCOMMERCE_ENDPOINTS } from '../../config/api';

// Deklaracja typu dla jQuery
interface JQuery {
    (selector: string): {
        on: (event: string, handler: () => void) => void;
        off: (event: string, handler: () => void) => void;
    };
    (element: Element): {
        on: (event: string, handler: () => void) => void;
        off: (event: string, handler: () => void) => void;
    };
}

declare const jQuery: JQuery;

interface SpiceRecommendationProps {
    spice: Spice;
}

// Interfejs dla fragmentów koszyka z WooCommerce
interface CartFragments {
    cart_count?: number;
    cart_total?: string;
    [key: string]: unknown;
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

// Funkcja do przełączania widoczności koszyka
const toggleCartSide = (show: boolean) => {
    console.log('Próba przełączenia koszyka:', {show});
    // Szukamy elementu w oknie rodzica, nie w iframe
    const cartSide = window.parent.document.querySelector('.site-header-cart-side');
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

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [loading, setLoading] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dodaj listenery na wiadomości i zdarzenia WooCommerce
    useEffect(() => {
        // Listener na wiadomości
        const messageHandler = (e: MessageEvent) => {
            console.log('Otrzymano wiadomość:', e.data);
            if (e.data.type === 'cartUpdated' || e.data.type === 'addToCart') {
                console.log('Wywołuję toggleCartSide(true) dla typu:', e.data.type);
                toggleCartSide(true);
            }
        };

        // Listener na zdarzenia WooCommerce
        const wooCommerceHandler = () => {
            console.log('Złapano zdarzenie added_to_cart z WooCommerce');
            toggleCartSide(true);
        };

        // Dodaj listenery
        window.addEventListener('message', messageHandler);
        if (typeof jQuery !== 'undefined') {
            jQuery(document.body).on('added_to_cart', wooCommerceHandler);
        }

        // Cleanup przy odmontowaniu komponentu
        return () => {
            window.removeEventListener('message', messageHandler);
            if (typeof jQuery !== 'undefined') {
                jQuery(document.body).off('added_to_cart', wooCommerceHandler);
            }
        };
    }, []); // Pusta tablica zależności - uruchom tylko raz przy montowaniu

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('Kliknięto przycisk "Wrzuć do basket"');
        
        if (loading || isAdded) {
            console.log('Przycisk jest zablokowany:', { loading, isAdded });
            return;
        }

        setLoading(true);
        setError(null);
        console.log('Ustawiono stan loading=true');

        try {
            const message = {
                type: 'addToCart',
                payload: {
                    productId: spice.id,
                    quantity: 1
                }
            };

            // Wyślij wiadomość do okna nadrzędnego
            console.log('Wysyłanie wiadomości do rodzica:', message);
            window.parent.postMessage(message, 'https://flavorinthejar.com');
            
            // Oznacz jako dodane
            console.log('Ustawianie stanu added=true');
            setIsAdded(true);
            setLoading(false);

            // Po 2 sekundach resetuj stan
            console.log('Ustawianie timera na reset stanu');
            setTimeout(() => {
                console.log('Resetowanie stanów added i loading');
                setIsAdded(false);
                setLoading(false);
            }, 2000);

        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError('Nie udało się dodać produktu do koszyka. Spróbuj ponownie.');
            setIsAdded(false);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                    {spice.image_url && (
                        <img 
                            src={spice.image_url} 
                            alt={spice.name}
                            className="w-16 h-16 object-cover rounded-lg" 
                        />
                    )}
                    <div>
                        <h4 className="font-medium text-gray-900">{spice.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{spice.description}</p>
                        <p className="text-green-600 font-medium mt-2">{spice.price}</p>
                    </div>
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={loading || isAdded}
                    className={`ml-4 px-4 py-2 rounded-lg transition-all duration-200 ${
                        isAdded
                            ? 'bg-green-100 text-green-700'
                            : loading
                                ? 'bg-gray-300 text-gray-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                    {loading ? 'Dodawanie...' : isAdded ? 'Dodano!' : 'Wrzuć do basket'}
                </button>
            </div>
            
            {error && (
                <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded">
                    {error}
                </div>
            )}
        </div>
    );
}; 