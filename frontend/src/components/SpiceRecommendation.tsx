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
            
            // Tworzymy iframe do obsługi dodawania do koszyka
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'add-to-cart-frame';
            document.body.appendChild(iframe);
            
            // Tworzymy formularz do wysłania przez iframe
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/add-to-cart';
            form.target = 'add-to-cart-frame';
            
            // Dodajemy pola formularza
            const productIdInput = document.createElement('input');
            productIdInput.type = 'hidden';
            productIdInput.name = 'productId';
            productIdInput.value = spice.id.toString();
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
                        setIsAdded(true);
                        setTimeout(() => setIsAdded(false), 2000);
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
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
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