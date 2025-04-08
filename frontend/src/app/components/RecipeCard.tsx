'use client';

import { useState, useRef, useEffect } from 'react';
import { SpiceRecommendation } from './SpiceRecommendation';
import { Recipe } from '../../types/recipe';
import { Spice } from '../../types/spices';
import { getFullBackendUrl, BACKEND_ENDPOINTS } from '../../config/api';

interface RecipeCardProps {
    recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    const [spices, setSpices] = useState<Spice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSpices = async () => {
            try {
                const response = await fetch(getFullBackendUrl(BACKEND_ENDPOINTS.GET_SPICES));
                if (!response.ok) {
                    throw new Error('Nie udało się pobrać przypraw');
                }
                const data = await response.json();
                setSpices(data.spices);
            } catch (err) {
                setError('Wystąpił błąd podczas ładowania przypraw');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpices();
    }, []);

    const getRandomSpice = () => {
        if (spices.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * spices.length);
        return spices[randomIndex];
    };

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
                            <SpiceRecommendation spice={spiceBlend} />
                        </li>
                    )}
                    {regularIngredients.map((ingredient: string, idx: number) => {
                        const recommendedSpice = getRandomSpice();
                        return (
                            <li key={idx} className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span className="text-gray-700">{ingredient}</span>
                                </div>
                                {recommendedSpice && (
                                    <div className="ml-4">
                                        <p className="text-sm text-green-600 mb-2">Polecana przyprawa:</p>
                                        <SpiceRecommendation spice={recommendedSpice} />
                                    </div>
                                )}
                            </li>
                        );
                    })}
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

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
} 