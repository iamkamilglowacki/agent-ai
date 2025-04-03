'use client';

import { useState } from 'react';
import ChatInput from './components/ChatInput';
import VoiceInput from './components/VoiceInput';
import ImageInput from './components/ImageInput';
import RecipeCard from './components/RecipeCard';

export default function Home() {
  const [recipe, setRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResponse = (response: string) => {
    setRecipe(response);
    setError(null);
  };

  const handleError = (error: string) => {
    setError(error);
    setRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Asystent Kulinarny AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Opisz, co chcesz ugotować, a ja pomogę Ci znaleźć idealny przepis
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
              Wpisz tekst
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
              Nagraj głos
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-600 rounded-full"></span>
              Prześlij zdjęcie składników
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <ChatInput
              onResponse={handleResponse}
              onError={handleError}
            />
            <VoiceInput
              onResponse={handleResponse}
              onError={handleError}
            />
            <ImageInput
              onResponse={handleResponse}
              onError={handleError}
            />
          </div>

          {error && (
            <div className="w-full max-w-2xl bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {recipe && <RecipeCard recipe={recipe} />}
        </div>
      </div>
    </div>
  );
}
