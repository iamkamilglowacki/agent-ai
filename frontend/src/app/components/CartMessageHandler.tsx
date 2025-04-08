'use client';

import { useEffect } from 'react';

// Interfejs dla fragmentów koszyka
interface CartFragments {
  cart_count?: number;
  cart_total?: string;
  [key: string]: unknown;
}

// Funkcja do aktualizacji mini-koszyka
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

// Funkcja do wysuwania karty koszyka
const toggleCartSide = (show: boolean) => {
  console.log('Próba przełączenia koszyka:', {show});
  const cartSide = document.querySelector('.site-header-cart-side');
  
  if (cartSide) {
    if (show) {
      console.log('Dodaję klasę active');
      cartSide.classList.add('active');
    } else {
      console.log('Usuwam klasę active');
      cartSide.classList.remove('active');
    }
  }
};

export function CartMessageHandler() {
  console.log('CartMessageHandler - komponent się montuje');
  
  useEffect(() => {
    console.log('CartMessageHandler - useEffect się wykonuje');
    
    const handleMessage = (event: MessageEvent) => {
      console.log('Próba obsługi wiadomości:', event);
      
      // WAŻNE: Zawsze sprawdzaj origin!
      // W produkcji ustaw na 'https://flavorinthejar.com'
      if (event.origin !== window.location.origin && event.origin !== 'https://flavorinthejar.com') { 
        console.warn('Otrzymano wiadomość z nieoczekiwanego origin:', event.origin);
        return;
      }

      // Reaguj zarówno na cartUpdated jak i addToCart
      if (event.data && (event.data.type === 'cartUpdated' || event.data.type === 'addToCart')) {
        const cartData = event.data.payload;
        console.log('Otrzymano aktualizację koszyka:', event.data.type, cartData);
        
        // Aktualizuj UI koszyka
        if (cartData.fragments && cartData.fragments.cart_count !== undefined) {
          updateMiniCartElements(cartData.fragments.cart_count.toString());
        }
        
        // Wysuń kartę koszyka
        toggleCartSide(true);
        
        // Wywołaj globalne zdarzenie, aby inne komponenty mogły zareagować
        const updateEvent = new CustomEvent('cartStateUpdated', { detail: cartData });
        document.body.dispatchEvent(updateEvent);
      }
    };

    console.log('CartMessageHandler - dodaję listener na message');
    window.addEventListener('message', handleMessage);

    // Dodaj listener na zdarzenie WooCommerce (jeśli jQuery jest dostępne)
    if (typeof window !== 'undefined' && (window as any).jQuery) {
      (window as any).jQuery(document.body).on('added_to_cart', function() {
        console.log('Złapano zdarzenie added_to_cart z WooCommerce');
        toggleCartSide(true);
      });
    }

    return () => {
      console.log('CartMessageHandler - usuwam listener');
      window.removeEventListener('message', handleMessage);
      // Cleanup dla jQuery listenera
      if (typeof window !== 'undefined' && (window as any).jQuery) {
        (window as any).jQuery(document.body).off('added_to_cart');
      }
    };
  }, []);

  // Ten komponent nie renderuje niczego widocznego
  return null;
} 