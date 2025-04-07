'use client';

import { useState } from 'react';
import ChatInput from './components/ChatInput';
import VoiceInput from './components/VoiceInput';
import ImageInput from './components/ImageInput';
import RecipeCard from './components/RecipeCard';
import { MicrophoneIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { Recipe, RecipeResponse } from '../types/recipe';

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResponse = (response: { recipes: Recipe[] } | string | RecipeResponse, isPartial: boolean = false) => {
    try {
      if (typeof response === 'string') {
        // Jeśli odpowiedź jest tekstem, podziel ją na sekcje
        const lines = response.split('\n').filter(line => line.trim());
        
        // Znajdź sekcje
        let currentSection = '';
        const ingredients: string[] = [];
        const steps: string[] = [];
        
        lines.forEach(line => {
          if (line.toLowerCase().includes('składniki:')) {
            currentSection = 'ingredients';
          } else if (line.toLowerCase().includes('przygotowanie:')) {
            currentSection = 'steps';
          } else if (line.trim()) {
            if (currentSection === 'ingredients') {
              // Usuń punktory i białe znaki
              const ingredient = line.replace(/^[-•*]\s*/, '').trim();
              if (ingredient) ingredients.push(ingredient);
            } else if (currentSection === 'steps') {
              // Usuń numerację i białe znaki
              const step = line.replace(/^\d+\.\s*/, '').trim();
              if (step) steps.push(step);
            }
          }
        });

        setRecipes([{
          title: "Analiza składników",
          ingredients: ingredients,
          steps: steps.length > 0 ? steps : [response],
          spice_recommendations: {}
        }]);
      } else if (response && typeof response === 'object') {
        // Sprawdź format odpowiedzi
        if ('recipes' in response && Array.isArray(response.recipes)) {
          // Nowy format z wieloma przepisami
          setRecipes(response.recipes);
        } else if ('recipe' in response && response.recipe) {
          // Stary format z jednym przepisem
          setRecipes([response.recipe]);
        } else if ('title' in response && Array.isArray(response.ingredients) && Array.isArray(response.steps)) {
          // Pojedynczy przepis jako obiekt
          setRecipes([{
            title: response.title || "Przepis",
            ingredients: response.ingredients || [],
            steps: response.steps || [],
            spice_recommendations: response.spice_recommendations || {}
          }]);
        } else {
          throw new Error('Nieprawidłowa struktura przepisu');
        }
      } else {
        throw new Error('Nieoczekiwany format odpowiedzi');
      }
      setError(null);
      
      // Resetujemy stan ładowania tylko dla finalnych odpowiedzi
      if (!isPartial) {
        setTimeout(() => setIsLoading(false), 500);
      }
    } catch (err) {
      console.error('Error parsing recipe:', err);
      setError('Nieprawidłowy format odpowiedzi');
      setRecipes([]);
      if (!isPartial) {
        setIsLoading(false);
      }
    }
  };

  const handleError = (error: string) => {
    console.error('Received error:', error);
    setError(error);
    setRecipes([]);
    // W przypadku błędu również dodajemy małe opóźnienie
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8">
          {/* Nagłówek */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-700">
              Twój Osobisty Asystent Kulinarny
            </h1>
            <p className="text-gray-600 mt-2">
              Opisz, co chcesz przygotować lub prześlij zdjęcie składników
            </p>
          </div>

          {/* Stan ładowania */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-white/50 rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-700 border-t-transparent mb-4"></div>
              <p className="text-xl text-gray-700 font-medium">Szukam najlepszego przepisu dla Ciebie...</p>
              <p className="text-gray-500 mt-2">To może potrwać kilka sekund</p>
            </div>
          ) : (
            /* Wyświetlanie przepisów */
            recipes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
                {recipes.map((recipe, index) => (
                  <RecipeCard key={index} recipe={recipe} />
                ))}
              </div>
            )
          )}

          {/* Wyświetlanie błędu */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>
      </main>

      {/* Panel wprowadzania */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ChatInput 
                onResponse={handleResponse} 
                onError={handleError}
                setIsLoading={setIsLoading}
              />
            </div>
            <div className="flex gap-2">
              <VoiceInput 
                onResponse={handleResponse} 
                onError={handleError}
                setIsLoading={setIsLoading}
              />
              <button 
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                onClick={() => {
                  const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  imageInput?.click();
                }}
              >
                <PhotoIcon className="w-6 h-6" />
              </button>
              <ImageInput 
                onResponse={handleResponse} 
                onError={handleError} 
                onImageUpload={handleImageUpload}
                setIsLoading={setIsLoading}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
