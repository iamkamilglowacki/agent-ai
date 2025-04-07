'use client';

import { useState, useEffect } from 'react';
import { Spice } from '../types/spices';

interface SpiceRecommendationProps {
    spice: Spice;
}

const SHOP_URL = 'https://flavorinthejar.com';

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [loading, setLoading] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState<number | null>(null);

    // Po zamontowaniu komponentu, sprawdzamy stan koszyka
    useEffect(() => {
        // Możemy sprawdzić stan koszyka, jeśli potrzebujemy
    }, []);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            console.log('Rozpoczynam dodawanie do koszyka:', spice.id);
            const formData = new FormData();
            formData.append('productId', spice.id.toString());
            formData.append('quantity', '1');
            
            console.log('Wysyłam żądanie POST do API proxy');
            
            // Wykonujemy żądanie do naszego API
            const response = await fetch('/api/add-to-cart', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Wystąpił błąd podczas dodawania do koszyka');
            }
            
            console.log('Otrzymano dane z API:', data);
            
            if (data.redirectUrl) {
                // Wykonujemy bezpośrednie żądanie AJAX do WooCommerce
                try {
                    const wooCommerceResponse = await fetch(data.redirectUrl, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    const wooCommerceData = await wooCommerceResponse.json();
                    console.log('Odpowiedź z WooCommerce:', wooCommerceData);
                    
                    if (wooCommerceData.error) {
                        throw new Error(wooCommerceData.error);
                    }
                    
                    setIsAdded(true);
                    setTimeout(() => setIsAdded(false), 2000);
                } catch (wooError) {
                    console.error('Błąd WooCommerce:', wooError);
                    // Jeśli wystąpi błąd CORS, spróbujmy otworzyć w nowej karcie
                    if (wooError instanceof Error && wooError.message.includes('CORS')) {
                        window.open(data.redirectUrl, '_blank');
                    }
                    setIsAdded(true); // Zakładamy, że dodanie się udało mimo błędu CORS
                    setTimeout(() => setIsAdded(false), 2000);
                }
            } else {
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
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