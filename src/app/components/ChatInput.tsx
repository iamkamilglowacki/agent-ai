'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface ChatInputProps {
    onResponse: (recipe: string) => void;
    onError: (error: string) => void;
}

export default function ChatInput({ onResponse, onError }: ChatInputProps) {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.ANALYZE_TEXT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query.trim(),
                    calories: null,
                    dietary_restrictions: null
                }),
            });

            if (!response.ok) {
                throw new Error('Nie udało się przetworzyć zapytania');
            }

            const data = await response.json();
            onResponse(data.recipe);
            setQuery('');
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Opisz, jakie danie chcesz przygotować..."
                    className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400"
                >
                    {isLoading ? 'Szukam...' : 'Wyślij'}
                </button>
            </div>
        </form>
    );
} 