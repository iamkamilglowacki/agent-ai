import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Przekierowanie użytkownika do strony z formularzem, który automatycznie wyśle żądanie
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
    
    // Przygotuj dane formularza w formacie application/x-www-form-urlencoded
    const wooFormData = new URLSearchParams();
    wooFormData.append('product_id', productId.toString());
    wooFormData.append('quantity', quantity.toString());
    wooFormData.append('add-to-cart', productId.toString());
    wooFormData.append('wc-ajax', 'add_to_cart');
    
    console.log('[API] Przygotowane dane formularza:', wooFormData.toString());
    
    // Wykonaj żądanie POST do WooCommerce
    const wooCommerceUrl = 'https://flavorinthejar.com/';
    console.log('[API] Wysyłanie żądania POST do WooCommerce:', wooCommerceUrl);

    const wooResponse = await fetch(wooCommerceUrl + '?wc-ajax=add_to_cart', {
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
      body: wooFormData.toString(),
      credentials: 'include'
    });

    console.log(`[API] Odpowiedź WooCommerce: ${wooResponse.status} ${wooResponse.statusText}`);
    
    // Pobierz i zaloguj nagłówki odpowiedzi
    const responseHeaders = Object.fromEntries([...wooResponse.headers.entries()]);
    console.log('[API] Nagłówki odpowiedzi:', responseHeaders);

    // Zbierz wszystkie nagłówki Set-Cookie
    const setCookieHeaders: string[] = [];
    // Pobieramy wszystkie nagłówki Set-Cookie ręcznie, bo Headers.getAll nie jest dostępne
    wooResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
        console.log('[API] Set-Cookie otrzymane:', value);
      }
    });

    // Sprawdź czy odpowiedź jest JSON
    const contentType = wooResponse.headers.get('content-type');
    let responseData;
    let responseText;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await wooResponse.json();
        console.log('[API] Odpowiedź JSON z WooCommerce:', responseData);
      } else {
        responseText = await wooResponse.text();
        console.log('[API] Odpowiedź tekstowa z WooCommerce:', responseText.substring(0, 200) + '...');
        try {
          // Spróbuj sparsować jako JSON mimo braku Content-Type
          responseData = JSON.parse(responseText);
          console.log('[API] Sparsowano odpowiedź tekstową jako JSON:', responseData);
        } catch (jsonError) {
          console.error('[API] Nie udało się sparsować odpowiedzi jako JSON:', jsonError);
        }
      }
    } catch (error) {
      console.error('[API] Błąd podczas przetwarzania odpowiedzi:', error);
      responseText = await wooResponse.text();
      console.log('[API] Odpowiedź tekstowa z WooCommerce (po błędzie):', responseText.substring(0, 200) + '...');
    }

    if (!wooResponse.ok) {
      console.error(`[API] Błąd podczas dodawania do koszyka: ${wooResponse.status}`);
      return NextResponse.json(
        { 
          error: 'Nie udało się dodać produktu do koszyka',
          status: wooResponse.status,
          statusText: wooResponse.statusText,
          response: responseData || responseText?.substring(0, 200) || null
        },
        { status: 500 }
      );
    }

    // Tworzymy odpowiedź z success
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Produkt dodany do koszyka',
        cartData: responseData || null
      },
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