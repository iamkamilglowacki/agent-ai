'use client';

import { useState, useEffect, useRef } from 'react';
import { Spice } from '../types/spices';
import { API_ENDPOINTS } from '../app/config/api';

interface SpiceRecommendationProps {
    spice: Spice;
}

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [loading, setLoading] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Funkcja do odświeżania mini-koszyka
    const refreshMiniCart = () => {
        fetch('https://flavorinthejar.com/?wc-ajax=get_cart_totals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include'
        })
        .then(response => response.text())
        .then(text => {
            const cartCountMatch = text.match(/cart-contents-count[^>]*>(\d+)<\/span>/);
            const count = cartCountMatch ? cartCountMatch[1] : '0';
            
            const miniCartElements = document.querySelectorAll('.mini-cart-count');
            miniCartElements.forEach(element => {
                if (element instanceof HTMLElement) {
                    element.innerText = count;
                    element.classList.add('cart-updated');
                    setTimeout(() => element.classList.remove('cart-updated'), 1000);
                }
            });
        })
        .catch(error => console.error('Błąd podczas odświeżania koszyka:', error));
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams({
                'add-to-cart': spice.id.toString(),
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
            
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
            
            // Odśwież informację o koszyku
            refreshMiniCart();
        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError('Nie udało się dodać produktu do koszyka');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            {/* Ukryty iframe do obsługi AJAX bez przeładowania strony */}
            <iframe ref={iframeRef} style={{ display: 'none' }} title="add-to-cart-frame" />
            
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
                    {loading ? 'Dodawanie...' : isAdded ? 'Dodano!' : 'Dodaj do koszyka'}
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