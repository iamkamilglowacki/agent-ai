'use client';
import { useState } from 'react';

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

// Interfejs dla globalnego obiektu WooCommerce
interface WCWindow extends Window {
    wc_add_to_cart_params?: {
        wc_ajax_nonce: string;
    };
}

const SHOP_URL = 'https://flavorinthejar.com';

export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Używamy nonce jeśli jest dostępny (zabezpieczenie WooCommerce)
            const nonce = ((window as WCWindow).wc_add_to_cart_params?.wc_ajax_nonce || '');
            
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
                    'product_id': product.id.toString(),
                    'quantity': '1',
                    'add-to-cart': product.id.toString(),
                    'security': nonce
                }).toString(),
                credentials: 'include',
                mode: 'cors',
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Sukces - produkt dodany
                setAdded(true);
                // Pokazujemy powiadomienie
                showNotification(`${product.name} został dodany do koszyka`);
            } else if (data.error) {
                // Wyświetlamy błąd z odpowiedzi
                console.error('Błąd WooCommerce:', data.error);
                alert(data.error);
            } else {
                // Fallback - jeśli nie ma danych o sukcesie lub błędzie, zakładamy sukces
                setAdded(true);
                showNotification(`${product.name} został dodany do koszyka`);
            }
        } catch (error) {
            console.error('Błąd podczas dodawania do koszyka:', error);
            // Spróbujmy fallback - przekierowanie do URL dodania do koszyka
            redirectToAddToCart();
        } finally {
            setLoading(false);
        }
    };

    // Funkcja pokazująca powiadomienie z opcją przejścia do koszyka
    const showNotification = (message: string) => {
        const confirmed = window.confirm(`${message}. Czy chcesz przejść do koszyka?`);
        if (confirmed) {
            window.location.href = `${SHOP_URL}/cart/`;
        }
    };

    // Funkcja przekierowująca do URL dodania do koszyka (fallback)
    const redirectToAddToCart = () => {
        window.location.href = `${SHOP_URL}/?add-to-cart=${product.id}`;
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
            <div 
                className="text-sm text-gray-600" 
                dangerouslySetInnerHTML={{ __html: product.description }}
            />
        </div>
    );
} 