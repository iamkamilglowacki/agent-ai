'use client';

import { useState } from 'react';
import { Spice } from '../types/spices';

interface SpiceRecommendationProps {
    spice: Spice;
}

export const SpiceRecommendation: React.FC<SpiceRecommendationProps> = ({ spice }) => {
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = () => {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center space-x-4">
                {spice.image_url && (
                    <img 
                        src={spice.image_url} 
                        alt={spice.name}
                        className="w-16 h-16 object-cover rounded-lg" 
                    />
                )}
                <div>
                    <h4 className="font-medium text-gray-900">{spice.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{spice.description}</p>
                    <p className="text-green-600 font-medium mt-2">{spice.price}</p>
                </div>
            </div>
            <a
                href={spice.add_to_cart_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`ml-4 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isAdded
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart();
                    window.open(spice.add_to_cart_url, '_blank');
                }}
            >
                {isAdded ? 'Dodano!' : 'Dodaj do koszyka'}
            </a>
        </div>
    );
}; 