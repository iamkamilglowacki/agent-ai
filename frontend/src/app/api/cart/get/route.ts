import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Pobierz wszystkie ciasteczka
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Wykonaj żądanie do WooCommerce aby pobrać stan koszyka
    const wooCommerceUrl = 'https://smakosz.flavorinthejar.com/';
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

    if (!wooResponse.ok) {
      throw new Error(`Błąd podczas pobierania stanu koszyka: ${wooResponse.status}`);
    }

    const cartData = await wooResponse.json();
    
    // Pobierz i przekaż ciasteczka z odpowiedzi
    const setCookieHeaders: string[] = [];
    wooResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
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
  } catch (error) {
    console.error('[API] Błąd podczas pobierania stanu koszyka:', error);
    return NextResponse.json(
      { error: 'Nie udało się pobrać stanu koszyka', details: String(error) },
      { status: 500 }
    );
  }
} 