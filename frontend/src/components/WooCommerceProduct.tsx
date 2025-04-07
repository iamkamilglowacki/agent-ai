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

// Interfejs dla fragmentów koszyka z WooCommerce
interface CartFragments {
    cart_count?: number;
    cart_total?: string;
    [key: string]: unknown;
}

// Funkcja do odświeżania mini-koszyka
const refreshMiniCart = (fragments?: CartFragments) => {
    // Jeśli mamy fragmenty z WooCommerce, użyjmy ich
    if (fragments?.cart_count !== undefined) {
        const miniCartElements = document.querySelectorAll('.mini-cart-count');
        miniCartElements.forEach(element => {
            if (element instanceof HTMLElement) {
                element.innerText = fragments.cart_count.toString();
                element.classList.add('cart-updated');
                setTimeout(() => element.classList.remove('cart-updated'), 1000);
            }
        });
        return;
    }

    // Jeśli nie mamy fragmentów, pobierz stan koszyka z API
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

export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            console.log('Rozpoczynam dodawanie do koszyka:', product.id, product.name);
            const formData = new FormData();
            formData.append('productId', product.id.toString());
            formData.append('quantity', '1');
            
            console.log('Wysyłam żądanie POST do API proxy');
            
            // Wykonujemy żądanie do naszego API
            const response = await fetch('/api/add-to-cart', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            // Sprawdzamy czy odpowiedź jest JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('Odpowiedź JSON z API:', data);
            } else {
                const text = await response.text();
                console.log('Odpowiedź tekstowa z API:', text.substring(0, 200));
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Błąd parsowania JSON:', e);
                    data = { success: response.ok };
                }
            }
            
            if (!response.ok) {
                throw new Error(data?.error || `Nie udało się dodać produktu do koszyka. Status: ${response.status}`);
            }
            
            // Produkt został dodany do koszyka
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            
            // Wywołaj zdarzenie added_to_cart
            const event = new CustomEvent('added_to_cart', {
                detail: {
                    fragments: data.cartData,
                    cart_hash: '',
                    button: document.querySelector(`button[data-product-id="${product.id}"]`)
                }
            });
            document.body.dispatchEvent(event);
            
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