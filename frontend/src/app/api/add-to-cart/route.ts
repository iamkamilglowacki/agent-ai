import { NextResponse } from 'next/server';

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

    // URL do dodania produktu do koszyka
    const addToCartUrl = `https://flavorinthejar.com/?wc-ajax=add_to_cart&product_id=${productId}&quantity=${quantity}`;
    
    // Przekieruj na WooCommerce AJAX endpoint
    const response = NextResponse.json({ 
      success: true, 
      redirectUrl: addToCartUrl,
      productId: productId,
      quantity: quantity
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