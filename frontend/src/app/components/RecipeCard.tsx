'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/config/api';
import { SpiceRecommendation } from '../../components/SpiceRecommendation';
import { Spice } from '../../types/spices';

interface Recipe {
    title: string;
    ingredients: string[];
    steps: string[];
    spice_recommendations: {
        recipe_blend?: Spice;
    };
}

interface RecipeCardProps {
    recipe: string;
}

export default function RecipeCard({ recipe: initialRecipe }: RecipeCardProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${getApiUrl()}/api/recipes/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: initialRecipe })
                });

                if (!response.ok) {
                    throw new Error('Nie udało się pobrać przepisu');
                }

                const data = await response.json();
                setRecipes([data.recipe]);
            } catch (err) {
                setError('Wystąpił błąd podczas ładowania przepisu');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [initialRecipe]);

    const renderRecipe = (recipe: Recipe) => {
        return (
            <div className="bg-white rounded-2xl p-8 hover:shadow-md transition-shadow duration-200">
                <h2 className="text-3xl font-medium text-green-700 mb-8">
                    {recipe.title}
                </h2>
                
                <div className="mb-8">
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Składniki:</h3>
                    <ul className="space-y-4">
                        {recipe.ingredients.map((ingredient: string, idx: number) => {
                            // Sprawdź, czy składnik to mieszanka przypraw
                            const isSpiceBlend = ingredient.startsWith('Mieszanka przypraw:');
                            if (isSpiceBlend && recipe.spice_recommendations?.recipe_blend) {
                                return (
                                    <li key={idx} className="flex flex-col space-y-2">
                                        <SpiceRecommendation spice={recipe.spice_recommendations.recipe_blend} />
                                    </li>
                                );
                            }
                            
                            return (
                                <li key={idx} className="flex items-center text-gray-700">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></span>
                                    {ingredient}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-4">Przygotowanie:</h3>
                    <div className="space-y-4">
                        {recipe.steps.map((step: string, idx: number) => (
                            <div key={idx} className="flex items-start group">
                                <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover:bg-green-600 group-hover:text-white transition-colors duration-200">
                                    {idx + 1}
                                </span>
                                <p className="text-gray-700 flex-grow leading-relaxed">
                                    {step}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="text-center">Ładowanie przepisu...</div>;
    }

    if (error) {
        return <div className="text-red-600">{error}</div>;
    }

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="grid grid-cols-1 gap-8">
                {recipes.map((recipe, index) => (
                    <div key={index}>
                        {renderRecipe(recipe)}
                    </div>
                ))}
            </div>
        </div>
    );
} 