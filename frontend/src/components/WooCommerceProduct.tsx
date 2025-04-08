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

// Funkcja do odświeżania mini-koszyka
const refreshMiniCart = (fragments?: CartFragments) => {
    // Jeśli mamy fragmenty z WooCommerce, użyjmy ich
    const cartCount = fragments?.cart_count;
    if (cartCount !== undefined) {
        const miniCartElements = document.querySelectorAll('.mini-cart-count');
        miniCartElements.forEach(element => {
            if (element instanceof HTMLElement) {
                element.innerText = cartCount.toString();
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
            console.log('Dodawanie produktu przez iframe:', product.id, product.name);
            
            // Dodaj produkt przez iframe bez przeładowania strony
            if (iframeRef.current) {
                // Użyj add-to-cart URL z parametrem wc-ajax
                const ajaxUrl = `https://smakosz.flavorinthejar.com/?add-to-cart=${product.id}&quantity=1&wc-ajax=add_to_cart`;
                iframeRef.current.src = ajaxUrl;
                
                // Produkt został dodany do koszyka (zakładamy, że iframe zadziała)
                setAdded(true);
                setTimeout(() => setAdded(false), 2000);
                
                // Odśwież informację o koszyku
                setTimeout(refreshMiniCart, 1000);
                
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
                }, 1500);
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
            {/* Ukryty iframe do obsługi AJAX bez przeładowania strony */}
            <iframe ref={iframeRef} style={{ display: 'none' }} title="add-to-cart-frame" />
            
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