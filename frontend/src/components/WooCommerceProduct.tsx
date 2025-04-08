'use client';
import { useState, useEffect } from 'react';
import React from 'react';
import { API_ENDPOINTS } from '../app/config/api';

// Deklaracja interfejsu dla jQuery w window
interface WindowWithJQuery extends Window {
    jQuery?: {
        (selector: string): {
            length: number;
            addClass: (className: string) => void;
            slideDown: () => void;
        };
        fn?: {
            slideToggle?: () => void;
        };
    };
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

        const response = await fetch('https://flavorinthejar.com/?wc-ajax=get_cart_totals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        });

        const text = await response.text();
        // Parsujemy HTML aby wyciągnąć ilość produktów
        const cartCountMatch = text.match(/cart-contents-count[^>]*>(\d+)<\/span>/);
        const count = cartCountMatch ? cartCountMatch[1] : '0';
        
        updateMiniCartElements(count);
    } catch (error) {
        console.error('Błąd podczas odświeżania koszyka:', error);
        updateMiniCartElements('0');
    }
};

export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    // Nasłuchuj na zdarzenie added_to_cart z WooCommerce
    useEffect(() => {
        const handleAddedToCart = (e: CustomEvent<{ fragments: CartFragments; cart_hash: string; button?: HTMLElement }>) => {
            console.log('Produkt dodany do koszyka:', e.detail.fragments);
            refreshMiniCart(e.detail.fragments);
            
            // Jeśli mamy przycisk, dodaj animację
            const button = e.detail.button;
            if (button) {
                button.classList.add('added-to-cart');
                setTimeout(() => button.classList.remove('added-to-cart'), 1000);
            }
        };

        // Dodaj nasłuchiwanie na zdarzenie
        document.body.addEventListener('added_to_cart', handleAddedToCart as EventListener);

        // Usuń nasłuchiwanie przy odmontowaniu komponentu
        return () => {
            document.body.removeEventListener('added_to_cart', handleAddedToCart as EventListener);
        };
    }, []);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            console.log('Dodawanie produktu:', product.id, product.name);
            
            const params = new URLSearchParams({
                'add-to-cart': product.id.toString(),
                'quantity': '1',
                'wc-ajax': 'add_to_cart'
            });
            
            const response = await fetch(`https://flavorinthejar.com/?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`Błąd dodawania do koszyka: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Odpowiedź z WooCommerce:', data);
            
            // Aktualizuj mini-koszyk
            if (data.fragments) {
                refreshMiniCart(data.fragments);
            } else {
                refreshMiniCart();
            }
            
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError('Nie udało się dodać produktu do koszyka');
        } finally {
            setLoading(false);
        }
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