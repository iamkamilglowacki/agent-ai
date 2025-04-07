import { NextResponse } from 'next/server';

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

    // Utwórz nowy FormData dla żądania do WooCommerce
    const wooFormData = new FormData();
    wooFormData.append('add-to-cart', productId.toString());
    wooFormData.append('quantity', quantity.toString());

    // Wykonaj żądanie do WooCommerce
    console.log('[API] Wysyłanie żądania do WooCommerce');
    const wooResponse = await fetch('https://flavorinthejar.com/', {
      method: 'POST',
      body: wooFormData,
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`[API] Odpowiedź WooCommerce: ${wooResponse.status} ${wooResponse.statusText}`);
    
    // Pobierz i zaloguj nagłówki odpowiedzi
    const responseHeaders = Object.fromEntries([...wooResponse.headers.entries()]);
    console.log('[API] Nagłówki odpowiedzi:', responseHeaders);

    // Pobierz treść odpowiedzi
    const responseText = await wooResponse.text();
    console.log('[API] Pierwsze 200 znaków odpowiedzi:', responseText.substring(0, 200));

    if (!wooResponse.ok) {
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

    // Pobierz ciasteczka z odpowiedzi WooCommerce
    const setCookieHeader = wooResponse.headers.get('set-cookie');
    console.log('[API] Set-Cookie header:', setCookieHeader);
    
    const response = NextResponse.json(
      { success: true, message: 'Produkt dodany do koszyka' },
      { status: 200 }
    );

    // Przekaż ciasteczka z WooCommerce do klienta
    if (setCookieHeader) {
      console.log('[API] Przekazywanie ciasteczek do klienta');
      response.headers.set('set-cookie', setCookieHeader);
    }

    return response;
  } catch (error) {
    console.error('[API] Błąd podczas przetwarzania żądania add-to-cart:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przetwarzania żądania', details: String(error) },
      { status: 500 }
    );
  }
} 