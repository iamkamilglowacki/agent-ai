from woocommerce import API
import os
from dotenv import load_dotenv
import logging
from typing import Dict, List, Optional
from functools import lru_cache
import time
import random

logger = logging.getLogger(__name__)

load_dotenv()

class WooCommerceService:
    _instance = None
    _categories = None
    _categories_timestamp = 0
    _spices = None
    _spices_timestamp = 0
    _cache_timeout = 3600  # 1 godzina

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WooCommerceService, cls).__new__(cls)
            cls._instance.wcapi = API(
                url=os.getenv('WOOCOMMERCE_STORE_URL'),
                consumer_key=os.getenv('WOOCOMMERCE_CONSUMER_KEY'),
                consumer_secret=os.getenv('WOOCOMMERCE_CONSUMER_SECRET'),
                version="wc/v3"
            )
            logger.info("WooCommerce API initialized")
        return cls._instance

    @lru_cache(maxsize=100)
    async def get_spice_by_id(self, spice_id: int):
        """
        Pobiera konkretną przyprawę po ID z cache
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

    async def get_categories(self):
        """
        Pobiera kategorie z cache
        """
        current_time = time.time()
        
        # Jeśli cache jest aktualny, zwróć zapisane dane
        if WooCommerceService._categories and (current_time - WooCommerceService._categories_timestamp) < WooCommerceService._cache_timeout:
            logger.info("Zwracam kategorie z cache")
            return WooCommerceService._categories
            
        try:
            categories = self.wcapi.get("products/categories").json()
            
            # Wypisz dostępne kategorie dla debugowania
            logger.info("Dostępne kategorie:")
            for cat in categories:
                logger.info(f"- ID: {cat['id']}, Nazwa: {cat['name']}")
                
            # Zaktualizuj cache
            WooCommerceService._categories = categories
            WooCommerceService._categories_timestamp = current_time
            
            return categories
        except Exception as e:
            logger.error(f"Error fetching categories from WooCommerce: {str(e)}")
            raise

    async def get_all_spices(self):
        """
        Pobiera wszystkie produkty z kategorii przypraw z cache (asynchroniczna)
        """
        current_time = time.time()
        
        # Jeśli cache jest aktualny, zwróć zapisane dane
        if WooCommerceService._spices and (current_time - WooCommerceService._spices_timestamp) < WooCommerceService._cache_timeout:
            logger.info("Zwracam przyprawy z cache")
            return WooCommerceService._spices

        try:
            # Pobierz wszystkie kategorie
            categories = await self.get_categories()
            
            # Znajdź kategorię przypraw
            spice_categories = [
                cat['id'] for cat in categories 
                if any(keyword in cat['name'].lower() 
                      for keyword in ['przypraw', 'spice', 'seasoning', 'blend', 'blendy'])
            ]
            
            # Wypisz znalezioną kategorię dla debugowania
            if spice_categories:
                cat_name = next((cat['name'] for cat in categories if cat['id'] == spice_categories[0]), "Unknown")
                logger.info(f"Znaleziono kategorię przypraw: {cat_name} (ID: {spice_categories[0]})")
            else:
                logger.warning("Nie znaleziono kategorii przypraw!")
                return []

            # Pobierz produkty
            if spice_categories:
                products = self.wcapi.get("products", params={
                    'category': spice_categories[0],
                    'per_page': 100
                }).json()
            else:
                products = self.wcapi.get("products", params={'per_page': 100}).json()
            
            logger.info(f"Liczba znalezionych produktów: {len(products)}")
            
            # Formatuj dane
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
            
            # Debug info
            spice_names = [s['name'] for s in spices]
            logger.info(f"Przetworzone przyprawy: {spice_names}")
            
            # Zaktualizuj cache
            WooCommerceService._spices = spices
            WooCommerceService._spices_timestamp = current_time
            
            return spices
        except Exception as e:
            logger.error(f"Error fetching spices from WooCommerce: {str(e)}")
            logger.exception(e)  # Wyświetl pełny stack trace
            return []

    def get_spices(self) -> List[Dict]:
        """
        Pobiera wszystkie przyprawy ze sklepu WooCommerce (synchroniczna)
        Używa cache jeśli dostępne
        """
        current_time = time.time()
        
        # Jeśli cache jest aktualny, zwróć zapisane dane
        if WooCommerceService._spices and (current_time - WooCommerceService._spices_timestamp) < WooCommerceService._cache_timeout:
            logger.info("Zwracam przyprawy z cache (sync)")
            return WooCommerceService._spices
            
        try:
            # Jeśli nie ma cache, wykonaj pełne zapytanie
            if not WooCommerceService._categories or (current_time - WooCommerceService._categories_timestamp) >= WooCommerceService._cache_timeout:
                categories = self.wcapi.get("products/categories").json()
                WooCommerceService._categories = categories
                WooCommerceService._categories_timestamp = current_time
            else:
                categories = WooCommerceService._categories
            
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
            
            # Zaktualizuj cache
            WooCommerceService._spices = spices
            WooCommerceService._spices_timestamp = current_time
            
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
        if spices:
            selected_spice = random.choice(spices)
            return {"recipe_blend": selected_spice}
        
        return {}

# Singleton instance
woocommerce_service = WooCommerceService() 