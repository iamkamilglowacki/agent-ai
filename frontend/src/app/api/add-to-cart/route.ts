import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const productId = formData.get('productId');
    const quantity = formData.get('quantity') || '1';

    console.log(`[API] Dodawanie produktu ${productId} do koszyka, ilość: ${quantity}`);

    if (!productId) {
      console.error('[API] Błąd: Brak ID produktu');
      return NextResponse.json({ error: 'Brak ID produktu' }, { status: 400 });
    }

    // Pobierz wszystkie ciasteczka z żądania klienta
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    console.log('[API] Ciasteczka klienta:', allCookies.map(c => `${c.name}=${c.value}`));
    
    // Przygotuj nagłówek Cookie dla żądania do WooCommerce
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // URL do dodania produktu do koszyka WooCommerce
    const wooCommerceUrl = `https://flavorinthejar.com/?add-to-cart=${productId}&quantity=${quantity}`;
    console.log('[API] Wysyłanie żądania do WooCommerce URL:', wooCommerceUrl);

    // Wykonaj żądanie do WooCommerce
    const wooResponse = await fetch(wooCommerceUrl, {
      method: 'GET', // Zmiana na GET zgodnie z metodą używaną przez ?add-to-cart=
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (compatible; Flavor-Proxy/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml'
      },
      redirect: 'follow', // Śledzenie przekierowań
    });

    console.log(`[API] Odpowiedź WooCommerce: ${wooResponse.status} ${wooResponse.statusText}`);
    console.log('[API] URL odpowiedzi:', wooResponse.url);
    
    // Pobierz i zaloguj nagłówki odpowiedzi
    const responseHeaders = Object.fromEntries([...wooResponse.headers.entries()]);
    console.log('[API] Nagłówki odpowiedzi:', responseHeaders);

    // Zbierz wszystkie nagłówki Set-Cookie
    const setCookieHeaders: string[] = [];
    // Pobieramy wszystkie nagłówki Set-Cookie ręcznie, bo Headers.getAll nie jest dostępne
    wooResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    });
    console.log('[API] Set-Cookie headers:', setCookieHeaders);

    if (!wooResponse.ok && wooResponse.status !== 302) { // 302 jest oczekiwany dla przekierowań po dodaniu do koszyka
      console.error(`[API] Błąd podczas dodawania do koszyka: ${wooResponse.status}`);
      return NextResponse.json(
        { 
          error: 'Nie udało się dodać produktu do koszyka',
          statusCode: wooResponse.status,
          statusText: wooResponse.statusText
        },
        { status: 500 }
      );
    }

    // Możemy teraz dodatkowo sprawdzić, czy produkt został faktycznie dodany do koszyka
    // poprzez pobranie zawartości koszyka

    // Tworzymy odpowiedź z success
    const response = NextResponse.json(
      { success: true, message: 'Produkt dodany do koszyka' },
      { status: 200 }
    );

    // Przekazujemy wszystkie ciasteczka z odpowiedzi WooCommerce do klienta
    setCookieHeaders.forEach((cookieHeader: string) => {
      response.headers.append('set-cookie', cookieHeader);
    });

    return response;
  } catch (error) {
    console.error('[API] Błąd podczas przetwarzania żądania add-to-cart:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przetwarzania żądania', details: String(error) },
      { status: 500 }
    );
  }
} 