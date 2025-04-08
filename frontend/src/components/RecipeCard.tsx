import React, { useEffect, useState } from 'react';
import { SpiceRecommendation } from './SpiceRecommendation';
import { Spice } from '../types/spices';
import { getApiUrl } from '../config/api';
import { API_ENDPOINTS } from '../app/config/api';

interface Recipe {
    title: string;
    ingredients: string[];
    steps: string[];
}

interface RecipeCardProps {
    recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
    const [spices, setSpices] = useState<Spice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSpices = async () => {
            try {
                const response = await fetch(`${getApiUrl()}/spices`);
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

    // Funkcja do losowego przypisywania przypraw do składników
    const getRandomSpice = () => {
        if (spices.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * spices.length);
        return spices[randomIndex];
    };

    const refreshMiniCart = () => {
        fetch(API_ENDPOINTS.CART.GET, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => response.json())
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-2xl font-semibold text-green-700 mb-4">{recipe.title}</h3>
            
            <div className="mb-6">
                <h4 className="text-lg font-medium text-green-600 mb-3">Składniki:</h4>
                <ul className="space-y-4">
                    {recipe.ingredients.map((ingredient, index) => {
                        const recommendedSpice = getRandomSpice();
                        return (
                            <li key={index} className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    <span>{ingredient}</span>
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
            
            <div>
                <h4 className="text-lg font-medium text-green-600 mb-3">Sposób przygotowania:</h4>
                <ol className="space-y-3">
                    {recipe.steps.map((step, index) => (
                        <li key={index} className="flex space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
                                {index + 1}
                            </span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                </div>
            )}
        </div>
    );
}; 