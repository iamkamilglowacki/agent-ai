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

    // URL do dodania produktu do koszyka
    const addToCartUrl = `https://flavorinthejar.com/?add-to-cart=${productId}&quantity=${quantity}`;
    
    // Tworzymy stronę HTML z automatycznym przekierowaniem/formularzem
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Przekierowywanie do koszyka...</title>
        <script>
          // Funkcja do tworzenia iframe i wysyłania formularza
          function addToCart() {
            // Tworzymy ukryty iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // Po załadowaniu iframe, tworzymy i wysyłamy formularz
            iframe.onload = function() {
              try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const form = iframeDoc.createElement('form');
                form.method = 'POST';
                form.action = 'https://flavorinthejar.com/';
                
                // Dodajemy pola formularza
                const addToCartInput = iframeDoc.createElement('input');
                addToCartInput.type = 'hidden';
                addToCartInput.name = 'add-to-cart';
                addToCartInput.value = '${productId}';
                form.appendChild(addToCartInput);
                
                const quantityInput = iframeDoc.createElement('input');
                quantityInput.type = 'hidden';
                quantityInput.name = 'quantity';
                quantityInput.value = '${quantity}';
                form.appendChild(quantityInput);
                
                // Dodajemy formularz do iframe i wysyłamy
                iframeDoc.body.appendChild(form);
                form.submit();
                
                // Informujemy rodzica o sukcesie
                window.parent.postMessage({ status: 'success', message: 'Produkt dodany do koszyka' }, '*');
              } catch(e) {
                console.error('Błąd podczas dodawania do koszyka:', e);
                window.parent.postMessage({ status: 'error', message: e.toString() }, '*');
              }
            };
            
            // Ustawiamy źródło iframe na pusty dokument HTML
            iframe.src = 'about:blank';
          }
          
          // Wywołujemy funkcję po załadowaniu strony
          window.onload = addToCart;
        </script>
      </head>
      <body>
        <p>Dodawanie produktu do koszyka...</p>
      </body>
      </html>
    `;
    
    // Zwracamy stronę HTML jako odpowiedź
    const response = new NextResponse(htmlResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
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