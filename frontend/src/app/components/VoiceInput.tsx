'use client';

import { useState, useRef, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { getSpiceRecommendationByIngredients } from '@/services/spiceRecommendations';
import { Recipe } from '@/types/recipe';

interface VoiceInputProps {
    onResponse: (data: { recipes: Recipe[] }) => void;
    onError: (error: string) => void;
}

export default function VoiceInput({ onResponse, onError }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState<boolean | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        let isMounted = true;
        
        // Sprawdź dostępność mikrofonu przy montowaniu komponentu
        const checkMicrophoneAvailability = async () => {
            if (!isMounted) return;
            
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const hasAudioInput = devices.some(device => device.kind === 'audioinput');
                
                if (!isMounted) return;
                
                setIsMicrophoneAvailable(hasAudioInput);
                
                if (!hasAudioInput) {
                    onError('Nie znaleziono mikrofonu w systemie');
                }
            } catch (error) {
                if (!isMounted) return;
                
                console.error('Błąd podczas sprawdzania dostępności mikrofonu:', error);
                setIsMicrophoneAvailable(false);
                onError('Nie można sprawdzić dostępności mikrofonu');
            }
        };

        // Wykonaj sprawdzenie tylko raz przy montowaniu
        checkMicrophoneAvailability();

        // Nasłuchuj zmian urządzeń
        const handleDeviceChange = () => {
            if (isMounted) {
                checkMicrophoneAvailability();
            }
        };

        if (navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
        }

        // Cleanup function
        return () => {
            isMounted = false;
            if (navigator.mediaDevices) {
                navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
            }
        };
    }, []); // Pusta tablica zależności - wykonaj tylko przy montowaniu

    const startRecording = async () => {
        if (typeof window === 'undefined') {
            console.error('Komponent uruchomiony poza przeglądarką');
            return;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('API MediaDevices nie jest dostępne');
            onError('Twoja przeglądarka nie obsługuje nagrywania dźwięku');
            return;
        }
        
        try {
            console.log('Próba uzyskania dostępu do mikrofonu...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            console.log('Dostęp do mikrofonu uzyskany, konfiguracja MediaRecorder...');
            
            // Sprawdź dostępne typy MIME
            const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
            const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
            console.log('Używany format audio:', supportedMimeType);

            const mediaRecorder = new MediaRecorder(stream, { 
                mimeType: supportedMimeType,
                audioBitsPerSecond: 128000
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    console.log('Otrzymano dane audio, rozmiar:', e.data.size);
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('Zakończono nagrywanie, przygotowanie do wysłania...');
                const audioBlob = new Blob(chunksRef.current, { type: supportedMimeType });
                console.log('Utworzono Blob, rozmiar:', audioBlob.size);
                await handleSubmit(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onerror = (event) => {
                console.error('Błąd MediaRecorder:', event);
                onError('Wystąpił błąd podczas nagrywania');
                handleError();
            };

            console.log('Rozpoczynanie nagrywania...');
            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Szczegółowy błąd podczas rozpoczynania nagrywania:', error);
            onError('Nie udało się uzyskać dostępu do mikrofonu. Upewnij się, że masz podłączony mikrofon i udzieliłeś zgody na jego użycie.');
            handleError();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            try {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            } catch (error) {
                console.error('Błąd podczas zatrzymywania nagrywania:', error);
                onError('Wystąpił błąd podczas zatrzymywania nagrywania');
                handleError();
            }
        }
    };

    const handleSubmit = async (audioBlob: Blob) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            
            // Konwertuj do WAV jeśli to możliwe
            let finalBlob = audioBlob;
            if (audioBlob.type !== 'audio/wav') {
                try {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Konwertuj AudioBuffer do WAV
                    const wavBlob = await new Promise<Blob>((resolve) => {
                        const numberOfChannels = audioBuffer.numberOfChannels;
                        const length = audioBuffer.length;
                        const sampleRate = audioBuffer.sampleRate;
                        const wavBuffer = new ArrayBuffer(44 + length * 2);
                        const view = new DataView(wavBuffer);
                        
                        // WAV header
                        writeString(view, 0, 'RIFF');
                        view.setUint32(4, 36 + length * 2, true);
                        writeString(view, 8, 'WAVE');
                        writeString(view, 12, 'fmt ');
                        view.setUint32(16, 16, true);
                        view.setUint16(20, 1, true);
                        view.setUint16(22, numberOfChannels, true);
                        view.setUint32(24, sampleRate, true);
                        view.setUint32(28, sampleRate * 2, true);
                        view.setUint16(32, numberOfChannels * 2, true);
                        view.setUint16(34, 16, true);
                        writeString(view, 36, 'data');
                        view.setUint32(40, length * 2, true);
                        
                        // Write audio data
                        const channel = audioBuffer.getChannelData(0);
                        let offset = 44;
                        for (let i = 0; i < length; i++) {
                            const sample = Math.max(-1, Math.min(1, channel[i]));
                            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                            offset += 2;
                        }
                        
                        resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
                    });
                    
                    finalBlob = wavBlob;
                } catch (error) {
                    console.warn('Nie udało się przekonwertować do WAV:', error);
                }
            }
            
            formData.append('file', finalBlob, `recording.wav`);

            const response = await fetch(API_ENDPOINTS.ANALYZE_VOICE, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Nieznany błąd' }));
                throw new Error(errorData.detail || 'Nie udało się przetworzyć nagrania');
            }

            const data = await response.json();
            
            // Sprawdź czy mamy transkrypcję
            if (data.transcript) {
                // Pokaż transkrypcję jako tymczasową odpowiedź
                const recommendedSpice = getSpiceRecommendationByIngredients([data.transcript]);
                onResponse({
                    recipes: [{
                        title: "Transkrypcja nagrania",
                        ingredients: [],
                        steps: ["Przetwarzam nagranie: " + data.transcript],
                        spice_recommendations: { recipe_blend: recommendedSpice }
                    }]
                });
            }
            
            // Jeśli mamy przepisy, zaktualizuj odpowiedź
            if (data.recipes && data.recipes.length > 0) {
                // Upewnij się, że każdy przepis ma wszystkie wymagane pola
                const validatedRecipes = data.recipes.map((recipe: Recipe) => {
                    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
                    const recommendedSpice = getSpiceRecommendationByIngredients(ingredients);
                    
                    return {
                        title: recipe.title || "Przepis",
                        ingredients: ingredients,
                        steps: Array.isArray(recipe.steps) ? recipe.steps : [],
                        spice_recommendations: { recipe_blend: recommendedSpice },
                        alternative_dishes: Array.isArray(recipe.alternative_dishes) ? recipe.alternative_dishes : []
                    };
                });
                
                onResponse({ recipes: validatedRecipes });
            }
            
            setIsLoading(false);
        } catch (error) {
            console.error('Błąd podczas przetwarzania nagrania:', error);
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
            handleError();
        }
    };

    // Pomocnicza funkcja do zapisywania stringów w DataView
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    const handleError = () => {
        setIsLoading(false);
        setIsRecording(false);
        if (mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                console.error('Błąd podczas czyszczenia strumienia:', error);
            }
        }
    };

    return (
        <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            data-voice-input
            className="p-2 text-gray-600 hover:text-green-600 transition-colors"
            aria-label={isLoading ? 'Przetwarzanie...' : isRecording ? 'Zatrzymaj nagrywanie' : 'Nagraj głos'}
        >
            {isRecording && (
                <span className="absolute -top-1 -right-1 w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
        </button>
    );
} 