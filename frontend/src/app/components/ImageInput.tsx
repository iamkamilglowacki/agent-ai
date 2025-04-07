'use client';

import React, { useRef, useState } from 'react';
// Unikamy importowania z @/config/api, zamiast tego importujemy bezpośrednio stały adres
// import { API_URL } from '@/config/api';
import { getSpiceRecommendationByIngredients } from '@/services/spiceRecommendations';
import { Recipe } from '@/types/recipe';

// Stały adres API
const API_URL = 'https://agent-ai.up.railway.app';

interface ImageInputProps {
    onResponse: (response: { recipes: Recipe[] }, isPartial: boolean) => void;
    onError: (error: string) => void;
    onImageUpload: (imageUrl: string) => void;
    setIsLoading: (isLoading: boolean) => void;
}

const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Zmniejszone maksymalne wymiary
            const MAX_WIDTH = 512;
            const MAX_HEIGHT = 512;
            
            let width = img.width;
            let height = img.height;
            
            // Zachowaj proporcje przy skalowaniu
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Włącz smoothing dla lepszej jakości przy skalowaniu w dół
            if (ctx) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
            
            // Narysuj obraz na canvas
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Konwertuj do WebP z kompresją
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                            type: 'image/webp',
                            lastModified: Date.now()
                        });
                        resolve(optimizedFile);
                    } else {
                        reject(new Error('Nie udało się zoptymalizować obrazu'));
                    }
                },
                'image/webp',
                0.85 // Zwiększona jakość do 85% dla lepszej jakości przy mniejszym rozmiarze
            );
        };
        
        img.onerror = () => reject(new Error('Nie udało się załadować obrazu'));
    });
};

export default function ImageInput({ onResponse, onError, onImageUpload, setIsLoading }: ImageInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            setIsLoading(true);
            setProgress(10); // Rozpoczęcie optymalizacji

            // Optymalizuj obraz przed wysłaniem
            const optimizedFile = await optimizeImage(file);
            setProgress(30); // Obraz zoptymalizowany
            
            // Tworzenie URL-a dla wgranego zdjęcia
            const imageUrl = URL.createObjectURL(optimizedFile);
            onImageUpload(imageUrl);
            setProgress(40); // Obraz wyświetlony

            const formData = new FormData();
            formData.append('file', optimizedFile);

            // Bezpośrednie użycie poprawnego adresu API zamiast zmiennej z konfiguracji
            const apiUrl = 'https://agent-ai.up.railway.app';
            const response = await fetch(`${apiUrl}/api/analyze/image`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/x-ndjson',
                },
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Błąd podczas analizy zdjęcia');
            }

            setProgress(60); // Obraz przesłany do API

            // Obsługa streamingu odpowiedzi
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Nie można odczytać odpowiedzi');

            const decoder = new TextDecoder();
            let buffer = ''; // Bufor na niekompletne chunki
            let fullAnalysis = ''; // Pełna analiza
            let finalResponseReceived = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    if (!finalResponseReceived) {
                        // Jeśli nie otrzymaliśmy ostatecznej odpowiedzi, a strumień się zakończył
                        setProgress(100);
                        setIsProcessing(false);
                        setIsLoading(false);
                        break;
                    }
                    break;
                }
                
                // Dodaj nowe dane do bufora
                buffer += decoder.decode(value, { stream: true });
                
                // Podziel na linie i przetwórz kompletne JSON-y
                const lines = buffer.split('\n');
                // Zachowaj ostatnią (potencjalnie niekompletną) linię w buforze
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.error) {
                                throw new Error(data.error);
                            }
                            if (data.analysis) {
                                fullAnalysis = data.analysis;
                                
                                // Jeśli to ostateczna odpowiedź, próbujemy ją sparsować jako JSON
                                if (data.status === 'completed') {
                                    finalResponseReceived = true;
                                    try {
                                        // Najpierw spróbuj potraktować analizę jako JSON
                                        const recipeObj = JSON.parse(fullAnalysis);
                                        onResponse(recipeObj, false); // Finalna odpowiedź
                                        setProgress(100);
                                        setIsProcessing(false);
                                        setIsLoading(false);
                                    } catch (e) {
                                        // Jeśli nie jest JSON, przekaż jako tekst
                                        onResponse(formatTextResponse(fullAnalysis), false); // Finalna odpowiedź
                                        setProgress(100);
                                        setIsProcessing(false);
                                        setIsLoading(false);
                                    }
                                } else {
                                    // Dla częściowych odpowiedzi, aktualizuj tekst ale zachowaj stan ładowania
                                    onResponse(formatTextResponse(fullAnalysis), true); // Częściowa odpowiedź
                                    setProgress(80 + (Math.random() * 10));
                                }
                                
                            }
                        } catch (e) {
                            console.error('Błąd parsowania JSON:', e);
                            // W przypadku błędu parsowania, zachowujemy stan ładowania
                        }
                    }
                }
            }
            
            // Przetwórz pozostałe dane w buforze
            if (buffer.trim() && !finalResponseReceived) {
                try {
                    const data = JSON.parse(buffer);
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    if (data.analysis) {
                        fullAnalysis = data.analysis;
                        try {
                            // Najpierw spróbuj potraktować analizę jako JSON
                            const recipeObj = JSON.parse(fullAnalysis);
                            onResponse(recipeObj, false);
                            setProgress(100);
                            setIsProcessing(false);
                            setIsLoading(false);
                        } catch (e) {
                            // Jeśli nie jest JSON, przekaż jako tekst
                            onResponse(formatTextResponse(fullAnalysis), false);
                            setProgress(100);
                            setIsProcessing(false);
                            setIsLoading(false);
                        }
                    }
                } catch (e) {
                    console.error('Błąd parsowania końcowego JSON:', e);
                }
            }

            // Resetujemy stany tylko jeśli otrzymaliśmy ostateczną odpowiedź
            if (finalResponseReceived) {
                setProgress(100);
                setIsProcessing(false);
                setIsLoading(false);
            }
        } catch (error) {
            setIsProcessing(false);
            setIsLoading(false);
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
        }
    };

    // Funkcja formatująca odpowiedź tekstową na strukturę przepisów
    const formatTextResponse = (text: string): { recipes: Recipe[] } => {
        const lines = text.split('\n').filter(line => line.trim());
        const recipes: Recipe[] = [];
        let currentRecipe: Recipe = {
            title: 'Przepis',
            ingredients: [],
            steps: [],
            spice_recommendations: {}
        };
        let currentSection = '';

        lines.forEach((line, index) => {
            const trimmedLine = line.trim().toLowerCase();
            
            // Zakończ aktualny przepis jeśli napotkamy nowy
            if (trimmedLine.includes('przepis') || 
                trimmedLine.startsWith('tytuł:') || 
                (line.length > 0 && 
                 !trimmedLine.includes('składniki:') && 
                 !trimmedLine.includes('przygotowanie:') && 
                 !trimmedLine.includes('kroki:') &&
                 (index === 0 || lines[index - 1].trim() === ''))) {
                
                // Zapisz poprzedni przepis jeśli istnieje i ma składniki
                if (currentRecipe.ingredients.length > 0) {
                    const recommendedSpice = getSpiceRecommendationByIngredients(currentRecipe.ingredients);
                    currentRecipe.spice_recommendations = { recipe_blend: recommendedSpice };
                    recipes.push({ ...currentRecipe });
                }

                // Rozpocznij nowy przepis
                currentRecipe = {
                    title: line.toLowerCase().startsWith('tytuł:') ? 
                           line.substring(6).trim() : 
                           line.replace(/^przepis\s*\d*:\s*/i, '').trim(),
                    ingredients: [],
                    steps: [],
                    spice_recommendations: {}
                };
                currentSection = '';
            }
            // Identyfikacja sekcji
            else if (trimmedLine.includes('składniki:')) {
                if (!currentRecipe) {
                    currentRecipe = {
                        title: 'Przepis',
                        ingredients: [],
                        steps: [],
                        spice_recommendations: {}
                    };
                }
                currentSection = 'ingredients';
            }
            else if (trimmedLine.includes('przygotowanie:') || 
                     trimmedLine.includes('kroki:') || 
                     trimmedLine.includes('sposób wykonania:')) {
                currentSection = 'steps';
            }
            // Dodawanie elementów do odpowiedniej sekcji
            else if (line.length > 0 && currentRecipe) {
                const cleanLine = line.replace(/^[\d.-]+\s*/, '').trim();
                if (cleanLine) {
                    if (currentSection === 'ingredients') {
                        currentRecipe.ingredients.push(cleanLine);
                    } else if (currentSection === 'steps') {
                        currentRecipe.steps.push(cleanLine);
                    }
                }
            }
        });

        // Dodaj ostatni przepis jeśli istnieje i ma składniki
        if (currentRecipe.ingredients.length > 0) {
            const recommendedSpice = getSpiceRecommendationByIngredients(currentRecipe.ingredients);
            currentRecipe.spice_recommendations = { recipe_blend: recommendedSpice };
            recipes.push({ ...currentRecipe });
        }

        // Jeśli nie znaleziono żadnych przepisów, spróbuj utworzyć jeden z analizy obrazu
        if (recipes.length === 0) {
            const ingredients = lines
                .filter(line => 
                    line.toLowerCase().includes('widzę') || 
                    line.toLowerCase().includes('na zdjęciu') || 
                    line.toLowerCase().includes('składnik'))
                .flatMap(line => 
                    line.replace(/^.*?(?:widzę|na zdjęciu|składniki:)/i, '')
                        .split(/[,.]/)
                        .map(i => i.trim())
                        .filter(i => i.length > 0)
                );

            if (ingredients.length > 0) {
                const recommendedSpice = getSpiceRecommendationByIngredients(ingredients);
                recipes.push({
                    title: 'Analiza składników',
                    ingredients: ingredients,
                    steps: ['Wykryte składniki zostały zapisane powyżej. Wybierz jeden z proponowanych przepisów, aby rozpocząć gotowanie.'],
                    spice_recommendations: { recipe_blend: recommendedSpice }
                });
            }
        }

        return { recipes };
    };

    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                data-image-input
            />
            {isProcessing && (
                <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
} 