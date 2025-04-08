'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface CartMessage {
    type: string;
    payload: {
        productId: number;
        quantity?: number;
    };
}

interface CartResponse {
    type: string;
    success: boolean;
    payload?: {
        productId: number;
    };
}

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [loading, setLoading] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Nasłuchiwanie odpowiedzi z parent window
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://flavorinthejar.com') return;

            const data = event.data as CartResponse;
            if (data.type === 'addToCartResponse' && 
                data.payload?.productId === spice.id) { // Sprawdź czy odpowiedź dotyczy tego produktu
                setLoading(false);
                if (data.success) {
                    setIsAdded(true);
                    setTimeout(() => setIsAdded(false), 2000);
                } else {
                    setError('Nie udało się dodać produktu do koszyka');
                    setTimeout(() => setError(null), 3000);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [spice.id]); // Dodaj spice.id do zależności

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        console.log('Kliknięto przycisk "Wrzuć do basket" dla produktu:', spice.id);
        
        if (loading || isAdded) {
            console.log('Przycisk jest zablokowany:', { loading, isAdded });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const message: CartMessage = {
                type: 'addToCart',
                payload: {
                    productId: spice.id,
                    quantity: 1
                }
            };

            console.log('Wysyłanie wiadomości do parent:', message);
            window.parent.postMessage(message, 'https://flavorinthejar.com');
        } catch (err) {
            console.error('Błąd podczas wysyłania wiadomości:', err);
            setError('Wystąpił błąd podczas komunikacji ze sklepem');
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
                    ref={buttonRef}
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