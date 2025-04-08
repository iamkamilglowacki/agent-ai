export {};

// Deklaracja rozszerzenia interfejsu Window
declare global {
    interface Window {
        toggleCartSide: (show: boolean) => void;
        jQuery: any; // To już istnieje w projekcie, więc nie powinno generować błędu
    }
}

// Funkcja do wysuwania karty koszyka
const toggleCartSide = (show: boolean): void => {
    console.log('Próba przełączenia koszyka:', {show});
    const cartSide = document.querySelector('.site-header-cart-side');
    console.log('Znaleziony element:', cartSide);
    
    if (cartSide) {
        if (show) {
            console.log('Dodaję klasę active');
            cartSide.classList.add('active');
        } else {
            console.log('Usuwam klasę active');
            cartSide.classList.remove('active');
        }
        console.log('Klasy po zmianie:', cartSide.classList.toString());
    } else {
        console.log('Nie znaleziono elementu koszyka!');
    }
};

// Dodaj toggleCartSide do window object
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.toggleCartSide = toggleCartSide;
} 