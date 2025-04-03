'use client';

import { useState, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';
import Image from 'next/image';

interface ImageInputProps {
    onResponse: (analysis: string) => void;
    onError: (error: string) => void;
}

export default function ImageInput({ onResponse, onError }: ImageInputProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (typeof window === 'undefined') return;
        
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                onError('Proszę wybrać plik obrazu');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            handleSubmit(file);
        }
    };

    const handleSubmit = async (file: File) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(API_ENDPOINTS.ANALYZE_IMAGE, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                },
                body: formData,
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error('Nie udało się przetworzyć zdjęcia');
            }

            const data = await response.json();
            onResponse(data.analysis);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
            />
            <button
                type="button"
                onClick={handleClick}
                disabled={isLoading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400"
            >
                {isLoading ? 'Analizuję...' : 'Wybierz zdjęcie'}
            </button>
            {preview && (
                <div className="mt-4 relative">
                    <Image 
                        src={preview} 
                        alt="Preview" 
                        width={200} 
                        height={200}
                        style={{ objectFit: 'cover' }}
                    />
                    {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                            <div className="text-white">Analizuję...</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 