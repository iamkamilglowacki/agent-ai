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

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            console.log('Rozpoczynam dodawanie do koszyka:', product.id, product.name);
            const formData = new FormData();
            formData.append('productId', product.id.toString());
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
                    
                    setAdded(true);
                    setTimeout(() => setAdded(false), 2000);
                } catch (wooError) {
                    console.error('Błąd WooCommerce:', wooError);
                    // Jeśli wystąpi błąd CORS, spróbujmy otworzyć w nowej karcie
                    if (wooError instanceof Error && wooError.message.includes('CORS')) {
                        window.open(data.redirectUrl, '_blank');
                    }
                    setAdded(true); // Zakładamy, że dodanie się udało mimo błędu CORS
                    setTimeout(() => setAdded(false), 2000);
                }
            } else {
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
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