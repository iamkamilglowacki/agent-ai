import { Spice } from '../types/spices';

// Produkty z WooCommerce - automatycznie wygenerowane
export const AVAILABLE_SPICES: Spice[] = [
  {
    id: 7313,
    name: "Karta podarunkowa",
    description: "",
    price: "100 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2024/02/pw-gift-card.png",
    product_url: "/product/karta-podarunkowa",
    add_to_cart_url: "/?add-to-cart=7313"
  },
  {
    id: 16,
    name: "Kura Lover",
    description: "30g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2023/12/Kura-Lover-1-3.jpg",
    product_url: "/product/kura-lover",
    add_to_cart_url: "/?add-to-cart=16"
  },
  {
    id: 166,
    name: "Jajo Mania",
    description: "45g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/Untitled-1-1-2.jpg",
    product_url: "/product/jajomania",
    add_to_cart_url: "/?add-to-cart=166"
  },
  {
    id: 163,
    name: "VegeLife",
    description: "70g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/vegelifejpg-1.jpg",
    product_url: "/product/vege-life",
    add_to_cart_url: "/?add-to-cart=163"
  },
  {
    id: 160,
    name: "Italiana",
    description: "50g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/italianajpg-1.jpg",
    product_url: "/product/italiana",
    add_to_cart_url: "/?add-to-cart=160"
  },
  {
    id: 157,
    name: "Ziemniak Rulezzz",
    description: "55g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/Ziemniak-rulez-3-2.jpg",
    product_url: "/product/ziemniak-rulez",
    add_to_cart_url: "/?add-to-cart=157"
  },
  {
    id: 154,
    name: "Pizza Time",
    description: "30g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/Pizza-Time-1-4.jpg",
    product_url: "/product/pizza-time",
    add_to_cart_url: "/?add-to-cart=154"
  },
  {
    id: 148,
    name: "Fryta is here",
    description: "55g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/frytaisherejpg-1.jpg",
    product_url: "/product/fryta-is-here",
    add_to_cart_url: "/?add-to-cart=148"
  },
  {
    id: 145,
    name: "Arabic Magic",
    description: "50g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/arabic-magicjpg-1.jpg",
    product_url: "/product/arabic-magic",
    add_to_cart_url: "/?add-to-cart=145"
  },
  {
    id: 133,
    name: "CynamonoweLove",
    description: "45g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/cynamonowe-love-1.jpg",
    product_url: "/product/cynamonowe-love",
    add_to_cart_url: "/?add-to-cart=133"
  },
  {
    id: 130,
    name: "Panini",
    description: "50g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/paninijpg-1-1.jpg",
    product_url: "/product/panini",
    add_to_cart_url: "/?add-to-cart=130"
  },
  {
    id: 127,
    name: "BBQ",
    description: "55g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/BBQ-1-2.jpg",
    product_url: "/product/bbq",
    add_to_cart_url: "/?add-to-cart=127"
  },
  {
    id: 124,
    name: "Pomidor Bazylia Czosnek",
    description: "30g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/pomidor-bazylia-czosnek-3.jpg",
    product_url: "/product/bazylia-i-czosnek",
    add_to_cart_url: "/?add-to-cart=124"
  },
  {
    id: 121,
    name: "Pieprz i czosnek",
    description: "55g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/pieprzczosnekjg-1.jpg",
    product_url: "/product/pieprz-czosnek",
    add_to_cart_url: "/?add-to-cart=121"
  },
  {
    id: 118,
    name: "Turecki Kebab",
    description: "50g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/turecki-kebabjpg-1.jpg",
    product_url: "/product/turecki-kebab",
    add_to_cart_url: "/?add-to-cart=118"
  },
  {
    id: 115,
    name: "Owsiankowe WOW",
    description: "50g",
    price: "9.90 zł",
    image_url: "https://flavorinthejar.com/wp-content/uploads/2020/08/owsiankowewow-1.jpg",
    product_url: "/product/owsiankowe-wow",
    add_to_cart_url: "/?add-to-cart=115"
  }
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
}