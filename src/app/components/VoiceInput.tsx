'use client';

import { useState, useRef } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface VoiceInputProps {
    onResponse: (recipe: string) => void;
    onError: (error: string) => void;
}

export default function VoiceInput({ onResponse, onError }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        if (typeof window === 'undefined') return;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
                await handleSubmit(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (_) {
            onError('Nie udało się uzyskać dostępu do mikrofonu');
            handleError();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async (audioBlob: Blob) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.wav');

            const response = await fetch(API_ENDPOINTS.ANALYZE_VOICE, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Nie udało się przetworzyć nagrania');
            }

            const data = await response.json();
            onResponse(data.recipe);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Wystąpił nieznany błąd');
            handleError();
        }
    };

    const handleError = () => {
        setIsLoading(false);
        setIsRecording(false);
    };

    return (
        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={`px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-400 ${
                    isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
            >
                {isLoading ? 'Przetwarzam...' : isRecording ? 'Zatrzymaj nagrywanie' : 'Nagraj głos'}
            </button>
            {isRecording && (
                <span className="text-red-600 animate-pulse">
                    Nagrywanie...
                </span>
            )}
        </div>
    );
} 