'use client';
import { useState, useEffect } from 'react';
import React from 'react';

// Deklaracja interfejsu dla jQuery w window
interface WindowWithJQuery extends Window {
    jQuery?: {
        (selector: string): {
            length: number;
            addClass: (className: string) => void;
            slideDown: () => void;
        };
        fn?: {
            slideToggle?: () => void;
        };
    };
}

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

// Funkcja pomocnicza do aktualizacji elementów mini-koszyka
const updateMiniCartElements = (count: string) => {
    const miniCartElements = document.querySelectorAll('.mini-cart-count');
    miniCartElements.forEach(element => {
        if (element instanceof HTMLElement) {
            element.innerText = count;
            element.classList.add('cart-updated');
            setTimeout(() => element.classList.remove('cart-updated'), 1000);
        }
    });
};

// Funkcja do odświeżania mini-koszyka
const refreshMiniCart = async (fragments?: CartFragments) => {
    try {
        if (fragments) {
            const cartCount = fragments?.cart_count;
            if (cartCount !== undefined) {
                updateMiniCartElements(cartCount.toString());
                return;
            }
        }

        const response = await fetch('/api/cart/get', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Sprawdź status odpowiedzi i typ zawartości
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        const data = await response.json();
        console.log('Pobrano dane koszyka:', data);
        updateMiniCartElements(data.count.toString());
    } catch (error) {
        console.error('Błąd podczas odświeżania koszyka:', error);
        // W przypadku błędu, ustaw wartość 0
        updateMiniCartElements('0');
    }
};

export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

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
            console.log('Dodawanie produktu:', product.id, product.name);
            
            // Zamiast używać iframe, użyjmy bezpośredniego fetch z obsługą błędów
            const formData = new FormData();
            formData.append('productId', product.id.toString());
            formData.append('quantity', '1');
            
            console.log('Wysyłanie żądania POST do API proxy');
            
            // Wykonujemy żądanie do naszego API
            const response = await fetch('/api/add-to-cart', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Błąd dodawania do koszyka:', response.status, errorText);
                throw new Error(`Błąd dodawania do koszyka: ${response.status}`);
            }
            
            // Parsuj odpowiedź
            let data;
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.warn('Nieoczekiwany format odpowiedzi:', text.substring(0, 100));
                    // Spróbuj stworzyć podstawową strukturę danych
                    data = { fragments: { cart_count: 1 } };
                }
            } catch (parseError) {
                console.error('Błąd parsowania odpowiedzi:', parseError);
                // Jeśli parsowanie nie powiodło się, użyj domyślnych danych
                data = { fragments: { cart_count: 1 } };
            }
            
            console.log('Odpowiedź z API:', data);
            
            // Produkt został dodany do koszyka
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
            
            // Odśwież informację o koszyku
            refreshMiniCart(data.fragments);
            
            // Wysuń panel koszyka - wywołaj funkcję WooCommerce
            setTimeout(() => {
                // Sprawdź, czy istnieje panel boczny koszyka
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
                        // Metoda 3: Użycie jQuery (jeśli dostępne)
                        else if (typeof window !== 'undefined' && 'jQuery' in window) {
                            const windowWithJQuery = window as WindowWithJQuery;
                            const jQuery = windowWithJQuery.jQuery;
                            if (jQuery) {
                                // Próba 1: Klasyczny panel boczny
                                const sideCart = jQuery('.site-header-cart-side');
                                if (sideCart.length) {
                                    sideCart.addClass('active');
                                    console.log('Wysunięto panel koszyka przez jQuery');
                                }
                                // Próba 2: Widget koszyka
                                else {
                                    jQuery('.widget_shopping_cart_content').slideDown();
                                    console.log('Wysunięto widget koszyka przez jQuery');
                                }
                            }
                        }
                        // Metoda 4: Otwórz modal z iframe do koszyka jako ostateczność
                        else {
                            // Utworzenie modala z widokiem koszyka
                            const modal = document.createElement('div');
                            modal.style.position = 'fixed';
                            modal.style.top = '0';
                            modal.style.right = '0';
                            modal.style.bottom = '0';
                            modal.style.width = '400px';
                            modal.style.background = 'white';
                            modal.style.boxShadow = '-5px 0 15px rgba(0,0,0,0.1)';
                            modal.style.zIndex = '9999';
                            modal.style.transition = 'transform 0.3s ease';
                            modal.style.transform = 'translateX(100%)';
                            
                            const cartIframe = document.createElement('iframe');
                            cartIframe.src = 'https://smakosz.flavorinthejar.com/cart/';
                            cartIframe.style.width = '100%';
                            cartIframe.style.height = '100%';
                            cartIframe.style.border = 'none';
                            
                            const closeBtn = document.createElement('button');
                            closeBtn.textContent = 'ZAMKNIJ ×';
                            closeBtn.style.position = 'absolute';
                            closeBtn.style.top = '10px';
                            closeBtn.style.right = '10px';
                            closeBtn.style.background = 'none';
                            closeBtn.style.border = 'none';
                            closeBtn.style.fontSize = '16px';
                            closeBtn.style.cursor = 'pointer';
                            closeBtn.style.padding = '5px 10px';
                            
                            closeBtn.onclick = () => {
                                document.body.removeChild(modal);
                            };
                            
                            modal.appendChild(closeBtn);
                            modal.appendChild(cartIframe);
                            document.body.appendChild(modal);
                            
                            // Animacja wysuwania
                            setTimeout(() => {
                                modal.style.transform = 'translateX(0)';
                            }, 10);
                        }
                    }
                }
            }, 1000);
        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas dodawania do koszyka');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-2">
            {/* Nie potrzebujemy już ukrytego iframe */}
            
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