'use client';

import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from 'react';

// Interfejs dla fragmentów koszyka (można przenieść do globalnych typów)
interface CartFragments {
  cart_count?: number;
  cart_total?: string;
  [key: string]: unknown;
}

// Funkcja do aktualizacji mini-koszyka (można przenieść do utils lub hooka)
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

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
        
        // Możesz tutaj dodatkowo wywołać globalne zdarzenie, jeśli inne komponenty muszą zareagować
        const updateEvent = new CustomEvent('cartStateUpdated', { detail: cartData });
        document.body.dispatchEvent(updateEvent);
        
        // Możesz też zaktualizować stan 'added' w odpowiednim komponencie,
        // ale to wymaga bardziej złożonego zarządzania stanem lub przekazywania callbacków.
        // Na razie skupiamy się na aktualizacji licznika.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${inter.variable} ${robotoMono.variable}`}
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
