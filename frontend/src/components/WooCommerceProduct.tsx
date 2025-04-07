'use client';
import { useState, useEffect } from 'react';

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

const SHOP_URL = 'https://flavorinthejar.com';

export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
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
                            setAdded(true);
                            setTimeout(() => setAdded(false), 2000);
                            
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
                            setAdded(true);
                            setTimeout(() => setAdded(false), 2000);
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
            'product_id': product.id.toString(),
            'quantity': '1',
            'add-to-cart': product.id.toString(),
            '_wpnonce': '', // Jeśli mamy nonce, warto je dodać
            'woocommerce-add-to-cart-nonce': '', // Alternatywny format nonce
            'add_to_cart_via_ajax': '1' // Specjalny parametr dla niektórych motywów WooCommerce
        }).toString();
        
        // Wysłanie żądania
        xhr.send(data);
    };

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
                            disabled={loading || added}
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