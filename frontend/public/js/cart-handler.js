(function() {
    const SHOP_URL = 'https://flavorinthejar.com';
    const DEBUG = true;
    
    const debug = (message, data) => {
        if (DEBUG) {
            console.log(`[Cart Handler] ${message}`, data || '');
        }
    };

    // Natychmiastowo wykonywana funkcja naprawiająca strukturę koszyka
    (function fixCartStructure() {
        debug('🔧 Naprawa struktury koszyka - start');
        
        function unwrapCartContents() {
            // Znajdź elementy cart-contents które są rodzicami
            const parentCartContents = Array.from(document.querySelectorAll('.cart-contents')).filter(el => 
                el.querySelector('.cart-contents')
            );
            
            parentCartContents.forEach(parent => {
                // Znajdź dziecko cart-contents
                const child = parent.querySelector('.cart-contents');
                if (child) {
                    debug('Przenosząc zawartość z:', parent, 'do:', parent.parentElement);
                    // Przenieś dziecko na miejsce rodzica
                    parent.parentElement.replaceChild(child, parent);
                }
            });
        }
        
        // Obserwuj zmiany w DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    setTimeout(unwrapCartContents, 0);
                }
            });
        });
        
        // Rozpocznij obserwację
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Wykonaj początkowe czyszczenie
        unwrapCartContents();
        
        debug('🔧 Naprawa struktury koszyka - koniec');
    })();

    document.addEventListener('DOMContentLoaded', function() {
        const toggleCartSide = (show = true) => {
            debug('Próba wysunięcia koszyka', { show });
            const cartSide = document.querySelector('.site-header-cart-side');
            if (cartSide) {
                if (show) {
                    cartSide.classList.add('active');
                    document.body.classList.add('cart-side-opened');
                } else {
                    cartSide.classList.remove('active');
                    document.body.classList.remove('cart-side-opened');
                }
            }
        };

        const refreshMiniCart = async () => {
            debug('Odświeżanie mini-koszyka...');
            try {
                const response = await fetch(`${SHOP_URL}/?wc-ajax=get_refreshed_fragments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include'
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = JSON.parse(await response.text());
                debug('Otrzymane dane:', data);

                if (data && data.fragments) {
                    // Aktualizuj koszyk boczny
                    const cartSide = document.querySelector('.site-header-cart-side');
                    if (cartSide && data.fragments['.site-header-cart-side']) {
                        cartSide.innerHTML = data.fragments['.site-header-cart-side'];
                    }

                    // Aktualizuj licznik w głównej ikonie
                    if (data.fragments['.cart-contents']) {
                        const temp = document.createElement('div');
                        temp.innerHTML = data.fragments['.cart-contents'];
                        const newCart = temp.querySelector('.cart-contents');
                        if (newCart) {
                            const mainCart = document.querySelector('.site-header-cart .cart-contents');
                            if (mainCart) {
                                mainCart.setAttribute('data-count', newCart.getAttribute('data-count'));
                                const mainSpan = mainCart.querySelector('span');
                                const newSpan = newCart.querySelector('span');
                                if (mainSpan && newSpan) {
                                    mainSpan.textContent = newSpan.textContent;
                                }
                            }
                        }
                    }
                    return true;
                }
                return false;
            } catch (error) {
                debug('Błąd podczas odświeżania koszyka:', error);
                return false;
            }
        };

        const addToCart = async (productId, quantity = 1) => {
            debug('Dodawanie do koszyka:', { productId, quantity });
            
            const formData = new FormData();
            formData.append('product_id', productId);
            formData.append('quantity', quantity);

            try {
                const response = await fetch(`${SHOP_URL}/?wc-ajax=add_to_cart`, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = JSON.parse(await response.text());
                debug('Odpowiedź dodawania do koszyka:', data);

                if (data && !data.error) {
                    await refreshMiniCart();
                    toggleCartSide(true);
                    
                    if (event && event.source) {
                        event.source.postMessage({
                            type: 'addToCartResponse',
                            success: true
                        }, event.origin);
                    }
                    return true;
                }
                
                if (event && event.source) {
                    event.source.postMessage({
                        type: 'addToCartResponse',
                        success: false
                    }, event.origin);
                }
                return false;
            } catch (error) {
                debug('Błąd podczas dodawania do koszyka:', error);
                if (event && event.source) {
                    event.source.postMessage({
                        type: 'addToCartResponse',
                        success: false
                    }, event.origin);
                }
                return false;
            }
        };

        // Nasłuchiwanie na wiadomości z iframe
        window.addEventListener('message', async (event) => {
            if (event.origin !== 'https://smakosz.flavorinthejar.com') {
                debug('Odrzucono wiadomość z nieprawidłowego źródła:', event.origin);
                return;
            }

            const { type, payload } = event.data;
            
            if (type === 'addToCart' && payload && payload.productId) {
                debug('Przetwarzanie żądania addToCart:', payload);
                await addToCart(payload.productId, payload.quantity || 1);
            } else if (type === 'toggleCart') {
                debug('Przetwarzanie żądania toggleCart');
                toggleCartSide(payload?.show !== false);
            }
        });

        // Obsługa zamykania koszyka
        document.addEventListener('click', (event) => {
            const closeButton = event.target.closest('.cart-side-close');
            if (closeButton) {
                debug('Kliknięto przycisk zamykania koszyka');
                toggleCartSide(false);
            }
        });
    });
})(); 