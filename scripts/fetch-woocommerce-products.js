/**
 * Skrypt do pobierania produktów z WooCommerce API i zapisywania ich do lokalnego pliku
 * 
 * Przed uruchomieniem, utwórz plik .env z następującymi zmiennymi:
 * WOOCOMMERCE_STORE_URL=https://twojsklep.com
 * WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * 
 * Następnie uruchom:
 * node scripts/fetch-woocommerce-products.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Konfiguracja WooCommerce
const storeUrl = process.env.WOOCOMMERCE_STORE_URL;
const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

// Ścieżka do pliku danych
const outputFilePath = path.join(__dirname, '../frontend/src/data/spices.ts');

// Mapowania kategorii do słów kluczowych
const categoryKeywordMapping = {
  // ID kategorii WooCommerce do słów kluczowych
  'kurczak': ['kurczak', 'drób', 'indyk', 'kura'],
  'jajka': ['jajka', 'jajeczne', 'jajo', 'omlet'],
  'warzywa': ['warzywa', 'wegetariańskie', 'wegańskie', 'vege'],
  'włoskie': ['włoskie', 'makaron', 'pizza', 'spaghetti', 'pasta', 'włochy']
};

/**
 * Pobiera produkty z WooCommerce API
 */
async function fetchProducts() {
  try {
    const url = `${storeUrl}/wp-json/wc/v3/products`;
    
    const response = await axios.get(url, {
      params: {
        per_page: 100,  // Maksymalna liczba produktów na stronę
        status: 'publish'  // Tylko opublikowane produkty
      },
      auth: {
        username: consumerKey,
        password: consumerSecret
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania produktów:', error.message);
    throw error;
  }
}

/**
 * Generuje mapowanie słów kluczowych do ID produktów
 */
function generateKeywordMapping(products) {
  const mapping = {};

  products.forEach(product => {
    // Sprawdź kategorie produktu
    const categories = product.categories || [];
    
    // Dla każdej kategorii, dodaj słowa kluczowe
    categories.forEach(category => {
      const categoryName = category.name.toLowerCase();
      
      // Sprawdź czy mamy mapowanie dla tej kategorii
      Object.keys(categoryKeywordMapping).forEach(key => {
        if (categoryName.includes(key)) {
          // Dodaj wszystkie słowa kluczowe dla tej kategorii
          categoryKeywordMapping[key].forEach(keyword => {
            mapping[keyword] = product.id;
          });
        }
      });
    });
  });

  return mapping;
}

/**
 * Generuje zawartość pliku TypeScript z produktami
 */
function generateTypeScriptFile(products, keywordMapping) {
  const formattedProducts = products.map(product => {
    return `  {
    id: ${product.id},
    name: "${product.name.replace(/"/g, '\\"')}",
    description: "${(product.short_description || "").replace(/"/g, '\\"').replace(/<\/?[^>]+(>|$)/g, "")}",
    price: "${product.price} zł",
    image_url: "${product.images && product.images.length > 0 ? product.images[0].src : ''}",
    product_url: "/product/${product.slug}",
    add_to_cart_url: "/?add-to-cart=${product.id}"
  }`;
  }).join(',\n');

  // Generuj mapowanie słów kluczowych jako kod JS
  const formattedKeywordMapping = Object.entries(keywordMapping)
    .map(([keyword, id]) => `    "${keyword}": ${id}`)
    .join(',\n');

  return `import { Spice } from '../types/spices';

// Produkty z WooCommerce - automatycznie wygenerowane
export const AVAILABLE_SPICES: Spice[] = [
${formattedProducts}
];

/**
 * Zwraca losową przyprawę z dostępnych
 * @returns Losowa przyprawa
 */
export function getRandomSpice(): Spice {
  const index = Math.floor(Math.random() * AVAILABLE_SPICES.length);
  return AVAILABLE_SPICES[index];
}

/**
 * Dopasowuje przyprawę na podstawie składników
 * @param ingredients - Lista składników
 * @returns Najlepiej pasująca przyprawa
 */
export function getSpiceRecommendation(ingredients: string[]): Spice | null {
  if (!ingredients || ingredients.length === 0) {
    return getRandomSpice();
  }

  // Słowa kluczowe do dopasowywania przypraw
  const keywordMapping = {
${formattedKeywordMapping}
  };

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
}`;
}

/**
 * Główna funkcja
 */
async function main() {
  try {
    console.log('Pobieranie produktów z WooCommerce API...');
    const products = await fetchProducts();
    console.log(`Pobrano ${products.length} produktów.`);
    
    console.log('Generowanie mapowania słów kluczowych...');
    const keywordMapping = generateKeywordMapping(products);
    
    console.log('Generowanie pliku TypeScript...');
    const fileContent = generateTypeScriptFile(products, keywordMapping);
    
    console.log(`Zapisywanie do pliku: ${outputFilePath}`);
    fs.writeFileSync(outputFilePath, fileContent);
    
    console.log('Zakończono pomyślnie!');
  } catch (error) {
    console.error('Błąd:', error);
    process.exit(1);
  }
}

// Uruchom skrypt
main(); 