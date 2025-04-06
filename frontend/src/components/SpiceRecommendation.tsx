'use client';

import { useState } from 'react';
import { Spice } from '../types/spices';

interface SpiceRecommendationProps {
    spice: Spice;
}

export function SpiceRecommendation({ spice }: SpiceRecommendationProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    const handleAddToCart = async () => {
        try {
            setIsAdding(true);
            const response = await fetch(spice.add_to_cart_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Nie udało się dodać produktu do koszyka');
            }

            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 3000); // Reset po 3 sekundach
        } catch (error) {
            console.error('Błąd podczas dodawania do koszyka:', error);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-100">
            <div className="flex-grow">
                <h4 className="font-medium text-gray-900">{spice.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{spice.description}</p>
                <span className="text-green-700 font-medium">{spice.price}</span>
            </div>
            <button
                onClick={handleAddToCart}
                disabled={isAdding || addedToCart}
                className={`ml-4 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    addedToCart
                        ? 'bg-green-100 text-green-700'
                        : isAdding
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
                {addedToCart
                    ? '✓ Dodano'
                    : isAdding
                    ? 'Dodawanie...'
                    : 'Dodaj do koszyka'}
            </button>
        </div>
    );
} 