from woocommerce import API
import os
from dotenv import load_dotenv
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

load_dotenv()

class WooCommerceService:
    def __init__(self):
        self.wcapi = API(
            url=os.getenv('WOOCOMMERCE_STORE_URL'),
            consumer_key=os.getenv('WOOCOMMERCE_CONSUMER_KEY'),
            consumer_secret=os.getenv('WOOCOMMERCE_CONSUMER_SECRET'),
            version="wc/v3"
        )
        logger.info("WooCommerce API initialized")

    async def get_categories(self):
        """
        Pobiera wszystkie kategorie produktów
        """
        try:
            categories = self.wcapi.get("products/categories").json()
            return categories
        except Exception as e:
            logger.error(f"Error fetching categories from WooCommerce: {str(e)}")
            raise

    async def get_all_spices(self):
        """
        Pobiera wszystkie produkty z kategorii przypraw
        """
        try:
            # Pobierz wszystkie kategorie
            categories = await self.get_categories()
            
            # Znajdź kategorię przypraw (zakładamy, że nazwa zawiera "przypraw" lub "spice")
            spice_categories = [
                cat['id'] for cat in categories 
                if any(keyword in cat['name'].lower() 
                      for keyword in ['przypraw', 'spice', 'seasoning'])
            ]

            # Jeśli znaleziono kategorie przypraw, użyj ich do filtrowania
            if spice_categories:
                products = self.wcapi.get("products", params={
                    'category': spice_categories[0],  # Użyj pierwszej znalezionej kategorii
                    'per_page': 100  # Zwiększ limit produktów na stronie
                }).json()
            else:
                # Jeśli nie znaleziono kategorii przypraw, pobierz wszystkie produkty
                products = self.wcapi.get("products", params={'per_page': 100}).json()
            
            # Formatujemy dane do naszej struktury
            spices = []
            for product in products:
                spice = {
                    'id': product['id'],
                    'name': product['name'],
                    'description': product['short_description'],
                    'price': product['price'],
                    'image_url': product['images'][0]['src'] if product['images'] else None,
                    'product_url': product['permalink'],
                    'add_to_cart_url': f"{os.getenv('WOOCOMMERCE_STORE_URL')}?add-to-cart={product['id']}"
                }
                spices.append(spice)
            
            return spices
        except Exception as e:
            logger.error(f"Error fetching spices from WooCommerce: {str(e)}")
            raise

    async def get_spice_by_id(self, spice_id: int):
        """
        Pobiera konkretną przyprawę po ID
        """
        try:
            product = self.wcapi.get(f"products/{spice_id}").json()
            return {
                'id': product['id'],
                'name': product['name'],
                'description': product['short_description'],
                'price': product['price'],
                'image_url': product['images'][0]['src'] if product['images'] else None,
                'product_url': product['permalink'],
                'add_to_cart_url': f"{os.getenv('WOOCOMMERCE_STORE_URL')}?add-to-cart={product['id']}"
            }
        except Exception as e:
            logger.error(f"Error fetching spice {spice_id} from WooCommerce: {str(e)}")
            raise

    def get_spices(self) -> List[Dict]:
        """Pobiera wszystkie przyprawy ze sklepu WooCommerce."""
        try:
            # Najpierw pobierz wszystkie kategorie
            categories = self.wcapi.get("products/categories").json()
            
            # Wyświetl wszystkie kategorie dla celów diagnostycznych
            logger.info("Dostępne kategorie:")
            for cat in categories:
                logger.info(f"- ID: {cat['id']}, Nazwa: {cat['name']}")
            
            # Znajdź kategorię przypraw
            spice_category = None
            for category in categories:
                if any(keyword in category['name'].lower() for keyword in ['przypraw', 'spice', 'seasoning', 'blend', 'blendy']):
                    spice_category = category['id']
                    logger.info(f"Znaleziono kategorię przypraw: {category['name']} (ID: {category['id']})")
                    break
            
            if not spice_category:
                logger.warning("Nie znaleziono kategorii przypraw!")
                return []
            
            # Pobierz produkty z kategorii przypraw
            products = self.wcapi.get("products", params={
                "category": spice_category,
                "per_page": 100
            }).json()
            
            logger.info(f"Liczba znalezionych produktów: {len(products)}")
            
            spices = [{
                "id": product["id"],
                "name": product["name"],
                "description": product["short_description"],
                "price": product["price_html"],
                "image_url": product["images"][0]["src"] if product["images"] else None,
                "add_to_cart_url": f"{os.getenv('WOOCOMMERCE_STORE_URL')}/cart/?add-to-cart={product['id']}"
            } for product in products]
            
            logger.info(f"Przetworzone przyprawy: {[spice['name'] for spice in spices]}")
            return spices
            
        except Exception as e:
            logger.error(f"Błąd podczas pobierania przypraw: {str(e)}")
            logger.exception(e)  # To wyświetli pełny stack trace
            return []
    
    def get_spice_recommendations(self, ingredients: List[str]) -> Dict[str, Dict]:
        """
        Zwraca jedną rekomendowaną przyprawę dla całego przepisu.
        """
        spices = self.get_spices()
        if not spices:
            return {}
        
        # Wybierz losową przyprawę dla całego przepisu
        import random
        if spices:
            selected_spice = random.choice(spices)
            return {"recipe_blend": selected_spice}
        
        return {}

# Singleton instance
woocommerce_service = WooCommerceService() 