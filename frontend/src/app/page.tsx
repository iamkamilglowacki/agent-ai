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

  const handleResponse = (response: { recipes: Recipe[] } | string | RecipeResponse) => {
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
    } catch (err) {
      console.error('Error parsing recipe:', err);
      setError('Nieprawidłowy format odpowiedzi');
      setRecipes([]);
    }
  };

  const handleError = (error: string) => {
    setError(error);
    setRecipes([]);
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

          {/* Wyświetlanie przepisów */}
          {recipes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
              {recipes.map((recipe, index) => (
                <RecipeCard key={index} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Panel wprowadzania */}
      <div className="border-t bg-white p-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 justify-between items-center">
            <div className="flex-1">
              <ChatInput
                onResponse={handleResponse}
                onError={handleError}
              />
            </div>
            <div className="flex gap-3">
              <button 
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                onClick={() => {
                  const voiceInput = document.querySelector('[data-voice-input]') as HTMLButtonElement;
                  voiceInput?.click();
                }}
              >
                <MicrophoneIcon className="w-6 h-6" />
              </button>
              <button 
                className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                onClick={() => {
                  const imageInput = document.querySelector('[data-image-input]') as HTMLButtonElement;
                  imageInput?.click();
                }}
              >
                <PhotoIcon className="w-6 h-6" />
              </button>
              <VoiceInput
                onResponse={handleResponse}
                onError={handleError}
              />
              <ImageInput
                onResponse={handleResponse}
                onError={handleError}
                onImageUpload={handleImageUpload}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
