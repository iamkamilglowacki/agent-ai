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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        // Tworzymy XMLHttpRequest, które lepiej radzi sobie z CORS
        const xhr = new XMLHttpRequest();
        
        // Ustawiamy withCredentials na true, aby wysyłać ciasteczka
        xhr.withCredentials = true;
        
        xhr.open('POST', `${SHOP_URL}/?wc-ajax=add_to_cart`, true);
        
        // Ustawiamy odpowiednie nagłówki
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', 'application/json');
        
        // Nasłuchujemy na zmiany stanu
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                setLoading(false);
                
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        
                        if (response.success) {
                            // Sukces - produkt dodany
                            setIsAdded(true);
                            setTimeout(() => setIsAdded(false), 2000);
                            
                            // Aktualizacja liczby produktów w koszyku, jeśli dostępna
                            if (response.cart_count) {
                                setCartCount(response.cart_count);
                            }
                        } else if (response.error) {
                            // Błąd zwrócony przez WooCommerce
                            console.error('Błąd WooCommerce:', response.error);
                            setError(`Błąd: ${response.error}`);
                        } else {
                            // Zakładamy sukces, jeśli nie ma informacji o błędzie
                            setIsAdded(true);
                            setTimeout(() => setIsAdded(false), 2000);
                        }
                    } catch (e) {
                        console.error('Błąd parsowania odpowiedzi:', e, xhr.responseText);
                        setError('Wystąpił problem z dodaniem produktu do koszyka.');
                    }
                } else {
                    console.error('Błąd HTTP:', xhr.status);
                    setError(`Błąd połączenia: ${xhr.status}`);
                }
            }
        };
        
        // Obsługa błędów sieciowych
        xhr.onerror = function() {
            console.error('Błąd sieciowy podczas dodawania do koszyka');
            setLoading(false);
            setError('Wystąpił problem z połączeniem do sklepu.');
        };
        
        // Przygotowanie danych do wysłania
        const data = new URLSearchParams({
            'product_id': spice.id.toString(),
            'quantity': '1',
            'add-to-cart': spice.id.toString(),
            '_wpnonce': '', // Jeśli mamy nonce, warto je dodać
            'woocommerce-add-to-cart-nonce': '', // Alternatywny format nonce
            'add_to_cart_via_ajax': '1' // Specjalny parametr dla niektórych motywów WooCommerce
        }).toString();
        
        // Wysłanie żądania
        xhr.send(data);
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