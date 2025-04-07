import { Spice } from '../types/spices';
import { AVAILABLE_SPICES, getRandomSpice } from '../data/spices';

/**
 * Mapowanie słów kluczowych do ID przypraw
 */
export const keywordMapping: Record<string, number> = {
  // Kura Lover
  "kurczak": 16,
  "kura": 16,
  "drob": 16,
  "indyk": 16,
  
  // Jajo Mania
  "jajka": 166,
  "jajeczne": 166,
  "jajo": 166,
  "omlet": 166,
  
  // VegeLife
  "warzywa": 163,
  "wegetarianskie": 163,
  "weganskie": 163,
  "vege": 163,
  "vegetarian": 163,
  
  // Italiana
  "wloskie": 160,
  "wlochy": 160,
  "makaron": 160,
  
  // Pizza Time
  "pizza": 154,
  
  // Ziemniak Rulezzz
  "ziemniak": 157,
  "kartofle": 157,
  "pyry": 157,
  
  // Fryta is here
  "frytki": 148,
  "ziemniaki": 148,
  
  // Arabic Magic
  "arabskie": 145,
  "bliskowschodnie": 145,
  "hummus": 145,
  
  // BBQ
  "grill": 127,
  "barbecue": 127,
  "bbq": 127,
  
  // Pomidor Bazylia Czosnek
  "pomidor": 124,
  "bazylia": 124,
  "czosnek": 124,
  "sos": 124,
  
  // Turecki Kebab
  "kebab": 118,
  "turecki": 118,
  "gyros": 118,
  
  // Owsiankowe WOW
  "owsianka": 115,
  "platki": 115,
  "sniadanie": 115,
  "owsiane": 115
};

/**
 * Dopasowuje przyprawę na podstawie składników
 * @param ingredients - Lista składników
 * @returns Najlepiej pasująca przyprawa
 */
export function getSpiceRecommendationByIngredients(ingredients: string[]): Spice {
  if (!ingredients || ingredients.length === 0) {
    return getRandomSpice();
  }

  // Sprawdź czy jakiś składnik pasuje do słów kluczowych
  const ingredientsText = ingredients.join(' ').toLowerCase();
  
  for (const [keyword, spiceId] of Object.entries(keywordMapping)) {
    if (ingredientsText.includes(keyword.toLowerCase())) {
      const spice = AVAILABLE_SPICES.find(s => s.id === spiceId);
      if (spice) return spice;
    }
  }

  // Jeśli nie znaleziono dopasowania, zwróć losową przyprawę
  return getRandomSpice();
} 