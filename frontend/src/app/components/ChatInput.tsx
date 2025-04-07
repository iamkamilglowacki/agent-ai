'use client';

import { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Recipe } from '@/types/recipe';

// Usuwam sztywne ustawienie adresu API
// const API_URL = 'https://agent-ai.up.railway.app';
// const API_ENDPOINTS = {
//     ANALYZE_TEXT: `${API_URL}/api/analyze/text`,
//     ANALYZE_VOICE: `${API_URL}/api/analyze/voice`,
//     ANALYZE_IMAGE: `${API_URL}/api/analyze/image`,
// };

interface ChatInputProps {
    onResponse: (data: { recipes: Recipe[] }, isPartial: boolean) => void;
    onError: (error: string) => void;
    setIsLoading: (isLoading: boolean) => void;
}

export default function ChatInput({ onResponse, onError, setIsLoading }: ChatInputProps) {
    const [query, setQuery] = useState('');

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
            onResponse(data, false);
            setQuery('');
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
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
                />
                <button
                    type="submit"
                    disabled={!query.trim()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400"
                >
                    Wyślij
                </button>
            </div>
        </form>
    );
} 