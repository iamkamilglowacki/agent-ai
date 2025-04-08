import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Interfejs dla błędów fetch
interface FetchError extends Error {
  status?: number;
  statusText?: string;
  message: string;
}

export async function GET() {
  try {
    // Pobierz wszystkie ciasteczka
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    console.log('[API cart/get] Ciasteczka klienta:', allCookies.map(c => `${c.name}`));

    // Wykonaj żądanie do WooCommerce aby pobrać stan koszyka
    const wooCommerceUrl = 'https://smakosz.flavorinthejar.com/';
    console.log('[API cart/get] Wysyłanie żądania do:', wooCommerceUrl + '?wc-ajax=get_cart_totals');
    
    try {
      const wooResponse = await fetch(wooCommerceUrl + '?wc-ajax=get_cart_totals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': cookieHeader,
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'User-Agent': 'Mozilla/5.0 (compatible; FlavoAI/1.0)',
          'Origin': 'https://smakosz.flavorinthejar.com',
          'Referer': 'https://smakosz.flavorinthejar.com/',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });

      console.log('[API cart/get] Status odpowiedzi WooCommerce:', wooResponse.status, wooResponse.statusText);
      
      // Pobierz i zaloguj nagłówki odpowiedzi
      const responseHeaders = Object.fromEntries([...wooResponse.headers.entries()]);
      console.log('[API cart/get] Nagłówki odpowiedzi:', responseHeaders);

      if (!wooResponse.ok) {
        // Spróbuj odczytać treść odpowiedzi, nawet jeśli status jest błędny
        const errorText = await wooResponse.text();
        console.error('[API cart/get] Odpowiedź błędu:', errorText.substring(0, 200) + '...');
        throw new Error(`Błąd podczas pobierania stanu koszyka: ${wooResponse.status} ${wooResponse.statusText}`);
      }

      // Sprawdź czy odpowiedź jest faktycznie JSONem
      const contentType = wooResponse.headers.get('content-type');
      let cartData;

      if (contentType && contentType.includes('application/json')) {
        cartData = await wooResponse.json();
      } else {
        const text = await wooResponse.text();
        console.log('[API cart/get] Otrzymano odpowiedź nie-JSON:', text.substring(0, 200) + '...');
        
        try {
          // Spróbuj sparsować jako JSON, nawet jeśli Content-Type jest inny
          cartData = JSON.parse(text);
        } catch (e) {
          console.error('[API cart/get] Nie udało się sparsować odpowiedzi jako JSON:', e);
          throw new Error('Otrzymano nieprawidłową odpowiedź z WooCommerce (nie JSON)');
        }
      }
      
      console.log('[API cart/get] Pomyślnie pobrano dane koszyka:', cartData.cart_contents_count || 0, 'produktów');
    
      // Pobierz i przekaż ciasteczka z odpowiedzi
      const setCookieHeaders: string[] = [];
      wooResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          setCookieHeaders.push(value);
          console.log('[API cart/get] Przekazuję ciasteczko:', value.split(';')[0]);
        }
      });

      // Przygotuj odpowiedź
      const response = NextResponse.json({
        success: true,
        count: cartData.cart_contents_count || 0,
        total: cartData.cart_total || '0.00 zł',
        data: cartData
      });

      // Przekaż ciasteczka do klienta
      setCookieHeaders.forEach(cookieHeader => {
        response.headers.append('set-cookie', cookieHeader);
      });

      return response;
    } catch (fetchError: unknown) {
      console.error('[API cart/get] Błąd podczas pobierania danych z WooCommerce:', fetchError);
      
      // W przypadku błędu połączenia, zwróć pusty koszyk zamiast błędu 500
      return NextResponse.json({
        success: false,
        count: 0,
        total: '0.00 zł',
        data: {},
        error: `Problem z połączeniem do sklepu: ${fetchError instanceof Error ? fetchError.message : 'Nieznany błąd'}`
      });
    }
  } catch (error) {
    console.error('[API cart/get] Błąd podczas pobierania stanu koszyka:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Nie udało się pobrać stanu koszyka', 
        details: String(error),
        count: 0,
        total: '0.00 zł'
      },
      { status: 500 }
    );
  }
} 