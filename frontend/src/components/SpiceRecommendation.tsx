'use client';

import { useState, useEffect, useRef } from 'react';
import { Spice } from '../types/spices';

interface SpiceRecommendationProps {
    spice: Spice;
}

const SHOP_URL = 'https://flavorinthejar.com';

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [loading, setLoading] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Funkcja do odświeżania mini-koszyka
    const refreshMiniCart = () => {
        fetch('/api/cart/get', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const miniCartElements = document.querySelectorAll('.mini-cart-count');
            miniCartElements.forEach(element => {
                if (element instanceof HTMLElement) {
                    element.innerText = data.count?.toString() || '0';
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
            console.log('Dodawanie produktu przez iframe:', spice.id, spice.name);
            
            // Dodaj produkt przez iframe bez przeładowania strony
            if (iframeRef.current) {
                // Użyj add-to-cart URL z parametrem wc-ajax
                const ajaxUrl = `https://smakosz.flavorinthejar.com/?add-to-cart=${spice.id}&quantity=1&wc-ajax=add_to_cart`;
                iframeRef.current.src = ajaxUrl;
                
                // Produkt został dodany do koszyka (zakładamy, że iframe zadziała)
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
                
                // Odśwież informację o koszyku
                setTimeout(refreshMiniCart, 1000);
                
                // Wysuń panel koszyka
                setTimeout(() => {
                    if (typeof window !== 'undefined') {
                        // Metoda 1: Bezpośrednie manipulowanie klasami panelu koszyka
                        const cartSidePanel = document.querySelector('.site-header-cart-side');
                        if (cartSidePanel && cartSidePanel instanceof HTMLElement) {
                            cartSidePanel.classList.add('active');
                            console.log('Wysunięto panel koszyka');
                        } 
                        // Metoda 2: Bezpośrednie kliknięcie ikony koszyka
                        else {
                            const cartIcon = document.querySelector('.cart-contents, .cart-icon, .mini-cart-icon, a[href*="cart"]');
                            if (cartIcon && cartIcon instanceof HTMLElement) {
                                cartIcon.click();
                                console.log('Kliknięto ikonę koszyka');
                            } 
                        }
                    }
                }, 1500);
            }
            
        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas dodawania do koszyka');
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