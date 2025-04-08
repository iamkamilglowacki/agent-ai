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

export function CartMessageHandler() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // WAŻNE: Zawsze sprawdzaj origin!
      // W produkcji ustaw na 'https://flavorinthejar.com'
      if (event.origin !== window.location.origin && event.origin !== 'https://flavorinthejar.com') { 
        // Akceptujemy wiadomości z własnego origin (np. dla hot reload) LUB z domeny nadrzędnej
        console.warn('Otrzymano wiadomość z nieoczekiwanego origin:', event.origin);
        return;
      }

      if (event.data && event.data.type === 'cartUpdated') {
        const cartData = event.data.payload;
        console.log('Otrzymano aktualizację koszyka od rodzica:', cartData);
        
        // Aktualizuj UI koszyka
        if (cartData.fragments && cartData.fragments.cart_count !== undefined) {
          updateMiniCartElements(cartData.fragments.cart_count.toString());
        }
        
        // Wywołaj globalne zdarzenie, aby inne komponenty mogły zareagować
        const updateEvent = new CustomEvent('cartStateUpdated', { detail: cartData });
        document.body.dispatchEvent(updateEvent);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Ten komponent nie renderuje niczego widocznego
  return null;
} 