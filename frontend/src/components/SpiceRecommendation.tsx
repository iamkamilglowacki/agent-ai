'use client';

import { useState } from 'react';
import { Spice } from '../types/spices';

interface SpiceRecommendationProps {
    spice: Spice;
}

const SHOP_URL = 'https://flavorinthejar.com';

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [loading, setLoading] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Używamy nonce jeśli jest dostępny (zabezpieczenie WooCommerce)
            const nonce = (window as any).wc_add_to_cart_params?.wc_ajax_nonce || '';
            
            // Dodajemy produkt do koszyka za pomocą WC AJAX API
            const response = await fetch(`${SHOP_URL}/?wc-ajax=add_to_cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Origin': 'https://smakosz.flavorinthejar.com',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: new URLSearchParams({
                    'product_id': spice.id.toString(),
                    'quantity': '1',
                    'add-to-cart': spice.id.toString(),
                    'security': nonce
                }).toString(),
                credentials: 'include',
                mode: 'cors',
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Sukces - produkt dodany
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
            } else if (data.error) {
                // Wyświetlamy błąd z odpowiedzi
                console.error('Błąd WooCommerce:', data.error);
                // Fallback - przekierowanie do URL dodania do koszyka
                redirectToAddToCart();
            } else {
                // Fallback - jeśli nie ma danych o sukcesie lub błędzie, zakładamy sukces
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
            }
        } catch (error) {
            console.error('Błąd podczas dodawania do koszyka:', error);
            // Spróbujmy fallback - przekierowanie do URL dodania do koszyka
            redirectToAddToCart();
        } finally {
            setLoading(false);
        }
    };
    
    // Funkcja przekierowująca do URL dodania do koszyka (fallback)
    const redirectToAddToCart = () => {
        window.open(`${SHOP_URL}/?add-to-cart=${spice.id}`, '_blank');
    };

    return (
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
    );
}; 