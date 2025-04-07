from typing import Dict, List, Optional
from app.services.woocommerce_service import woocommerce_service

class SpiceMappingService:
    def __init__(self):
        # Słownik kategorii składników i odpowiadających im słów kluczowych
        self.ingredient_categories: Dict[str, List[str]] = {
            "mięso": ["mięso", "wołowina", "wieprzowina", "kurczak", "indyk", "kaczka", "jagnięcina"],
            "ryby": ["ryba", "łosoś", "dorsz", "tuńczyk", "makrela", "pstrąg"],
            "warzywa": ["warzywa", "marchew", "ziemniaki", "cebula", "czosnek", "pomidor"],
            "sałatki": ["sałata", "rukola", "szpinak", "sałatka"],
            "zupy": ["zupa", "bulion", "rosół", "krem"],
            "ryż": ["ryż", "kasza", "quinoa"],
            "makaron": ["makaron", "spaghetti", "penne", "tagliatelle"],
            "grillowane": ["grill", "grillowany", "grillowana", "barbecue", "bbq"]
        }

    def _categorize_ingredient(self, ingredient: str) -> Optional[str]:
        """Kategoryzuje składnik na podstawie słów kluczowych"""
        ingredient_lower = ingredient.lower()
        for category, keywords in self.ingredient_categories.items():
            if any(keyword in ingredient_lower for keyword in keywords):
                return category
        return None

    async def get_spice_recommendation(self, ingredient: str) -> Optional[Dict]:
        """
        Zwraca rekomendowaną przyprawę dla danego składnika.
        Używa kategoryzacji składnika i dostępnych przypraw z WooCommerce.
        """
        category = self._categorize_ingredient(ingredient)
        if not category:
            return None

        # Pobierz wszystkie przyprawy
        spices = await woocommerce_service.get_all_spices()
        if not spices:
            return None

        # Mapowanie kategorii na frazy do wyszukiwania w nazwach przypraw
        category_spice_mapping = {
            "mięso": ["do mięs", "prowansalskie", "grillowa"],
            "ryby": ["do ryb", "cytrynow", "morskie"],
            "warzywa": ["do warzyw", "sałatk", "ziołow"],
            "sałatki": ["sałatk", "ziołow", "vinegret"],
            "zupy": ["do zup", "bulion", "rosół"],
            "ryż": ["orientaln", "curry", "ziołow"],
            "makaron": ["włosk", "ziołow", "do makaronu"],
            "grillowane": ["grillowa", "bbq", "do mięs"]
        }

        # Znajdź odpowiednią przyprawę
        search_phrases = category_spice_mapping.get(category, [])
        for spice in spices:
            spice_name_lower = spice["name"].lower()
            if any(phrase in spice_name_lower for phrase in search_phrases):
                return spice

        # Jeśli nie znaleziono dokładnego dopasowania, zwróć pierwszą przyprawę z kategorii
        return spices[0] if spices else None

# Singleton instance
spice_mapping_service = SpiceMappingService() 