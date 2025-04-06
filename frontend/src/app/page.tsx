'use client';

import { useState } from 'react';
import ChatInput from './components/ChatInput';
import VoiceInput from './components/VoiceInput';
import ImageInput from './components/ImageInput';
import RecipeCard from './components/RecipeCard';
import { MicrophoneIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [recipe, setRecipe] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleResponse = (response: string) => {
    setRecipe(response);
    setError(null);
  };

  const handleError = (error: string) => {
    setError(error);
    setRecipe(null);
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nagłówek */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-2xl font-medium text-gray-900 text-center">
            Łasuch
          </h1>
        </div>
      </div>

      {/* Główny kontener czatu */}
      <div className="max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        {/* Obszar wiadomości */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Powitalna wiadomość */}
          <div className="flex items-start max-w-4xl mx-auto">
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <p className="text-gray-700 leading-relaxed">
                  Cześć! Jestem Łasuch, Twój osobisty ekspert kulinarny. Opisz, co chcesz przygotować lub prześlij zdjęcie składników, 
                  a ja zaproponuję Ci idealne przepisy.
                </p>
              </div>
            </div>
          </div>

          {/* Wyświetlanie wgranego zdjęcia */}
          {uploadedImage && (
            <div className="flex items-start max-w-4xl mx-auto">
              <div className="flex-1">
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <img 
                    src={uploadedImage} 
                    alt="Wgrane składniki" 
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wyświetlanie błędu */}
          {error && (
            <div className="flex items-start max-w-4xl mx-auto">
              <div className="flex-1">
                <div className="bg-red-50 rounded-2xl p-6">
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Wyświetlanie przepisu */}
          {recipe && (
            <div className="flex items-start w-full">
              <div className="flex-1">
                <RecipeCard recipe={recipe} />
              </div>
            </div>
          )}
        </div>

        {/* Panel wprowadzania */}
        <div className="border-t bg-white p-6">
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
                <div className="hidden">
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
      </div>
    </div>
  );
}
