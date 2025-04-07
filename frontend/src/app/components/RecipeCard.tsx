'use client';

import { useState } from 'react';
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

    const handleAddToCart = async (productId: number) => {
        setLoading(true);
        setError(null);
        
        try {
            console.log('Rozpoczynam dodawanie do koszyka:', productId);
            const formData = new FormData();
            formData.append('productId', productId.toString());
            formData.append('quantity', '1');
            
            console.log('Wysyłam żądanie POST do API proxy');
            
            // Wykonujemy żądanie do naszego API
            const response = await fetch('/api/add-to-cart', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Wystąpił błąd podczas dodawania do koszyka');
            }
            
            console.log('Otrzymano dane z API:', data);
            
            if (data.redirectUrl) {
                // Wykonujemy bezpośrednie żądanie AJAX do WooCommerce
                try {
                    const wooCommerceResponse = await fetch(data.redirectUrl, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                    
                    const wooCommerceData = await wooCommerceResponse.json();
                    console.log('Odpowiedź z WooCommerce:', wooCommerceData);
                    
                    if (wooCommerceData.error) {
                        throw new Error(wooCommerceData.error);
                    }
                    
                    setIsAdded(true);
                    setTimeout(() => setIsAdded(false), 2000);
                } catch (wooError) {
                    console.error('Błąd WooCommerce:', wooError);
                    // Jeśli wystąpi błąd CORS, spróbujmy otworzyć w nowej karcie
                    if (wooError instanceof Error && wooError.message.includes('CORS')) {
                        window.open(data.redirectUrl, '_blank');
                    }
                    setIsAdded(true); // Zakładamy, że dodanie się udało mimo błędu CORS
                    setTimeout(() => setIsAdded(false), 2000);
                }
            } else {
                setIsAdded(true);
                setTimeout(() => setIsAdded(false), 2000);
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