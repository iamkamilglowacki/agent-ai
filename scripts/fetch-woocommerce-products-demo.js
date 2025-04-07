/**
 * Wersja demonstracyjna skryptu, która używa próbki danych zamiast pobierania ich z API
 */

const fs = require('fs');
const path = require('path');

// Ścieżka do pliku danych
const outputFilePath = path.join(__dirname, '../frontend/src/data/spices.ts');

// Przykładowe produkty
const sampleProducts = [
  {
    id: 101,
    name: "Kura Lover",
    short_description: "Idealna mieszanka przypraw do dań z kurczaka.",
    price: "9,90",
    images: [{ src: "https://example.com/images/kura_lover.jpg" }],
    slug: "kura-lover",
    categories: [{ id: 1, name: "Kurczak" }, { id: 2, name: "Blendy" }]
  },
  {
    id: 102,
    name: "Jajo Mania",
    short_description: "Wyjątkowa mieszanka przypraw do jajek i potraw jajecznych.",
    price: "9,90",
    images: [{ src: "https://example.com/images/jajo_mania.jpg" }],
    slug: "jajo-mania",
    categories: [{ id: 3, name: "Jajka" }, { id: 2, name: "Blendy" }]
  },
  {
    id: 103,
    name: "VegeLife",
    short_description: "Aromatyczna mieszanka idealnie podkreślająca smak warzyw i potraw wegetariańskich.",
    price: "9,90",
    images: [{ src: "https://example.com/images/vegelife.jpg" }],
    slug: "vegelife",
    categories: [{ id: 4, name: "Warzywa" }, { id: 2, name: "Blendy" }]
  },
  {
    id: 104,
    name: "Italiana",
    short_description: "Klasyczna włoska mieszanka ziół i przypraw do dań kuchni włoskiej.",
    price: "9,90",
    images: [{ src: "https://example.com/images/italiana.jpg" }],
    slug: "italiana",
    categories: [{ id: 5, name: "Włoskie" }, { id: 2, name: "Blendy" }]
  }
];

// Mapowania kategorii do słów kluczowych
const categoryKeywordMapping = {
  'Kurczak': ['kurczak', 'drób', 'indyk', 'kura'],
  'Jajka': ['jajka', 'jajeczne', 'jajo', 'omlet'],
  'Warzywa': ['warzywa', 'wegetariańskie', 'wegańskie', 'vege'],
  'Włoskie': ['włoskie', 'makaron', 'pizza', 'spaghetti', 'pasta', 'włochy']
};

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
      const categoryName = category.name;
      
      // Sprawdź czy mamy mapowanie dla tej kategorii
      if (categoryKeywordMapping[categoryName]) {
        // Dodaj wszystkie słowa kluczowe dla tej kategorii
        categoryKeywordMapping[categoryName].forEach(keyword => {
          mapping[keyword] = product.id;
        });
      }
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
function main() {
  try {
    console.log('Używam przykładowych danych produktów...');
    
    console.log('Generowanie mapowania słów kluczowych...');
    const keywordMapping = generateKeywordMapping(sampleProducts);
    
    console.log('Generowanie pliku TypeScript...');
    const fileContent = generateTypeScriptFile(sampleProducts, keywordMapping);
    
    // Upewnij się, że katalog docelowy istnieje
    const targetDir = path.dirname(outputFilePath);
    if (!fs.existsSync(targetDir)) {
      console.log(`Tworzenie katalogu: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
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