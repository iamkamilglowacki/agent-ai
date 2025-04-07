import { API_ENDPOINTS } from '../app/config/api';
import { Spice, SpicesResponse } from '../types/spices';

export async function getSpices(): Promise<Spice[]> {
    try {
        const response = await fetch(API_ENDPOINTS.GET_SPICES);
        
        if (!response.ok) {
            throw new Error('Błąd podczas pobierania przypraw');
        }
        
        const data: SpicesResponse = await response.json();
        return data.spices;
    } catch (error) {
        console.error('Błąd podczas pobierania przypraw:', error);
        return [];
    }
}

export async function getSpiceById(id: number): Promise<Spice | null> {
    try {
        const response = await fetch(`${API_ENDPOINTS.GET_SPICES}/${id}`);
        
        if (!response.ok) {
            throw new Error('Błąd podczas pobierania przyprawy');
        }
        
        const data: Spice = await response.json();
        return data;
    } catch (error) {
        console.error(`Błąd podczas pobierania przyprawy o ID ${id}:`, error);
        return null;
    }
} 