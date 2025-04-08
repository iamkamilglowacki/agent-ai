'use client';

import { useState, useRef } from 'react';
import { SpiceRecommendation } from '../../components/SpiceRecommendation';
import { Recipe } from '../../types/recipe';
import { AVAILABLE_SPICES } from '../../data/spices';

interface RecipeCardProps {
    recipe: Recipe;
}

const SHOP_URL = 'https://flavorinthejar.com';

export default function RecipeCard({ recipe }: RecipeCardProps) {
    const [isAdded, setIsAdded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Funkcja do odświeżania mini-koszyka
    const refreshMiniCart = () => {
        fetch('/api/cart/get', {
            method: 'GET',
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            const miniCartElements = document.querySelectorAll('.mini-cart-count');
            miniCartElements.forEach(element => {
                if (element instanceof HTMLElement) {
                    element.innerText = data.count?.toString() || '0';
                    element.classList.add('cart-updated');
                    setTimeout(() => element.classList.remove('cart-updated'), 1000);
                }
            });
        })
        .catch(error => console.error('Błąd podczas odświeżania koszyka:', error));
    };

    const handleAddToCart = async (productId: number) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('Dodawanie produktu przez iframe:', productId);
            
            // Dodaj produkt przez iframe bez przeładowania strony
            if (iframeRef.current) {
                // Użyj add-to-cart URL z parametrem wc-ajax
                const ajaxUrl = `https://smakosz.flavorinthejar.com/?add-to-cart=${productId}&quantity=1&wc-ajax=add_to_cart`;
                iframeRef.current.src = ajaxUrl;
                
                // Produkt został dodany do koszyka (zakładamy, że iframe zadziała)
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
                
                // Odśwież informację o koszyku
                setTimeout(refreshMiniCart, 1000);
                
                // Wysuń panel koszyka
                setTimeout(() => {
                    if (typeof window !== 'undefined') {
                        // Metoda 1: Bezpośrednie manipulowanie klasami panelu koszyka
                        const cartSidePanel = document.querySelector('.site-header-cart-side');
                        if (cartSidePanel && cartSidePanel instanceof HTMLElement) {
                            cartSidePanel.classList.add('active');
                            console.log('Wysunięto panel koszyka');
                        } 
                        // Metoda 2: Bezpośrednie kliknięcie ikony koszyka
                        else {
                            const cartIcon = document.querySelector('.cart-contents, .cart-icon, .mini-cart-icon, a[href*="cart"]');
                            if (cartIcon && cartIcon instanceof HTMLElement) {
                                cartIcon.click();
                                console.log('Kliknięto ikonę koszyka');
                            } 
                        }
                    }
                }, 1500);
            }
            
        } catch (err) {
            console.error('Błąd podczas dodawania do koszyka:', err);
            setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas dodawania do koszyka');
        } finally {
            setLoading(false);
        }
    };

    const renderRecipe = (recipe: Recipe) => {
        const regularIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        const spiceBlend = recipe.spice_recommendations?.recipe_blend;

        return (
            <div className="bg-white rounded-2xl p-8 hover:shadow-md transition-shadow duration-200">
                {/* Ukryty iframe do obsługi AJAX bez przeładowania strony */}
                <iframe ref={iframeRef} style={{ display: 'none' }} title="add-to-cart-frame" />
                
                <h2 className="text-3xl font-medium text-green-700 mb-8">
                    {recipe.title}
                </h2>
                
                <div className="mb-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Składniki:</h3>
                    <ul className="space-y-4">
                        {spiceBlend && (
                            <li className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    {spiceBlend.image_url && (
                                        <img 
                                            src={spiceBlend.image_url} 
                                            alt={spiceBlend.name} 
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    )}
                                    <div>
                                        <span className="text-gray-700 font-medium">{spiceBlend.name}</span>
                                        <p className="text-sm text-gray-600 mt-1">{spiceBlend.description}</p>
                                        <p className="text-sm font-medium text-green-700 mt-1">{spiceBlend.price}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAddToCart(spiceBlend.id)}
                                    disabled={loading || isAdded}
                                    className={`ml-4 px-4 py-2 rounded-lg transition-all duration-200 ${
                                        isAdded
                                            ? 'bg-green-100 text-green-700'
                                            : loading
                                                ? 'bg-gray-300 text-gray-700'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                >
                                    {loading ? 'Dodawanie...' : isAdded ? 'Dodano!' : 'Dodaj do koszyka'}
                                </button>
                            </li>
                        )}
                        {regularIngredients.map((ingredient: string, idx: number) => (
                            <li key={idx} className="flex items-center text-gray-700">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></span>
                                {ingredient}
                            </li>
                        ))}
                    </ul>
                </div>
                
                {recipe.steps && recipe.steps.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-xl font-medium text-gray-900 mb-4">Przygotowanie:</h3>
                        <ol className="space-y-4">
                            {recipe.steps.map((step: string, idx: number) => (
                                <li key={idx} className="flex items-start">
                                    <span className="font-medium text-green-600 mr-3">{idx + 1}.</span>
                                    <span className="text-gray-700">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {recipe.alternative_dishes && recipe.alternative_dishes.length > 0 && (
                    <div>
                        <h3 className="text-xl font-medium text-gray-900 mb-4">Alternatywne dania:</h3>
                        <ul className="space-y-2">
                            {recipe.alternative_dishes.map((dish: string, idx: number) => (
                                <li key={idx} className="text-gray-700">
                                    • {dish}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return recipe ? renderRecipe(recipe) : null;
} 