'use client';

import { useRef } from 'react';
import { API_URL } from '@/config/api';

interface ImageInputProps {
    onResponse: (response: string) => void;
    onError: (error: string) => void;
    onImageUpload: (imageUrl: string) => void;
}

export default function ImageInput({ onResponse, onError, onImageUpload }: ImageInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            // Tworzenie URL-a dla wgranego zdjęcia
            const imageUrl = URL.createObjectURL(file);
            onImageUpload(imageUrl);

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/api/analyze/image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Błąd podczas analizy zdjęcia');
            }

            const data = await response.json();
            onResponse(data.analysis);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
        }
    };

    return (
        <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            data-image-input
        />
    );
} 