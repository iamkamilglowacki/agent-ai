'use client';
import { useState } from 'react';

interface WooCommerceProductProps {
    product: {
        id: number;
        name: string;
        description: string;
        price: string;
        image_url: string;
        product_url: string;
        add_to_cart_url: string;
    };
}

const SHOP_URL = 'https://flavorinthejar.com';

export default function WooCommerceProduct({ product }: WooCommerceProductProps) {
    const [loading, setLoading] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Bezpośrednie przekierowanie do adresu dodania produktu
        // Dla lepszego UX, najpierw pokazujemy stan "Dodawanie..."
        setTimeout(() => {
            window.location.href = `${SHOP_URL}/?add-to-cart=${product.id}`;
        }, 500);
    };

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-md overflow-hidden">
                    {product.image_url && (
                        <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="object-cover w-full h-full" 
                        />
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="font-medium text-green-700">{product.name}</h4>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{product.price} zł</p>
                        <button 
                            onClick={handleAddToCart}
                            disabled={loading || added}
                            className={`px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors ${loading || added ? 'opacity-50' : ''}`}
                        >
                            {loading ? 'Dodawanie...' : added ? 'Dodano!' : 'Dodaj do koszyka'}
                        </button>
                    </div>
                </div>
            </div>
            <div 
                className="text-sm text-gray-600" 
                dangerouslySetInnerHTML={{ __html: product.description }}
            />
        </div>
    );
} 