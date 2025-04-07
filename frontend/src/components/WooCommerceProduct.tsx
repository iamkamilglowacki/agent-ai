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
            
            // Tworzymy iframe do obsługi dodawania do koszyka
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'add-to-cart-frame-' + product.id;
            document.body.appendChild(iframe);
            
            // Tworzymy formularz do wysłania przez iframe
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/add-to-cart';
            form.target = 'add-to-cart-frame-' + product.id;
            
            // Dodajemy pola formularza
            const productIdInput = document.createElement('input');
            productIdInput.type = 'hidden';
            productIdInput.name = 'productId';
            productIdInput.value = product.id.toString();
            form.appendChild(productIdInput);
            
            const quantityInput = document.createElement('input');
            quantityInput.type = 'hidden';
            quantityInput.name = 'quantity';
            quantityInput.value = '1';
            form.appendChild(quantityInput);
            
            // Dodajemy formularz do dokumentu i wysyłamy
            document.body.appendChild(form);
            form.submit();
            
            // Nasłuchujemy na wiadomość z iframe
            window.addEventListener('message', function messageHandler(event) {
                if (event.data && (event.data.status === 'success' || event.data.status === 'error')) {
                    window.removeEventListener('message', messageHandler);
                    
                    if (event.data.status === 'success') {
                        console.log('Produkt dodany do koszyka:', event.data.message);
                        setAdded(true);
                        setTimeout(() => setAdded(false), 2000);
                    } else {
                        console.error('Błąd podczas dodawania do koszyka:', event.data.message);
                        setError(event.data.message || 'Wystąpił błąd podczas dodawania do koszyka');
                    }
                    
                    setLoading(false);
                    
                    // Usuwamy formularz i iframe
                    setTimeout(() => {
                        if (document.body.contains(form)) document.body.removeChild(form);
                        if (document.body.contains(iframe)) document.body.removeChild(iframe);
                    }, 2000);
                }
            });

            // Ustawiamy timeout na wypadek braku odpowiedzi
            setTimeout(() => {
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
                setLoading(false);
            }, 3000);
            
        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas dodawania do koszyka');
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