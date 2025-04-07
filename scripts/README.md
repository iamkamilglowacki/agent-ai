# Skrypt pobierający produkty z WooCommerce

Ten skrypt pozwala na automatyczne pobranie wszystkich produktów z WooCommerce API i zapisanie ich do pliku TypeScript, który może być używany w aplikacji frontendowej.

## Wymagania

- Node.js
- Dostęp do API WooCommerce (klucze konsumenckie)

## Instalacja

1. Sklonuj to repozytorium
2. Przejdź do katalogu `scripts`
3. Zainstaluj zależności:

```bash
cd scripts
npm install
```

4. Skopiuj plik `.env.example` do `.env` i uzupełnij go swoimi danymi:

```bash
cp .env.example .env
```

5. Edytuj plik `.env` i uzupełnij pola:
   - `WOOCOMMERCE_STORE_URL`: URL twojego sklepu WooCommerce
   - `WOOCOMMERCE_CONSUMER_KEY`: Klucz konsumencki API WooCommerce
   - `WOOCOMMERCE_CONSUMER_SECRET`: Sekret konsumencki API WooCommerce

## Użycie

Aby pobrać produkty z WooCommerce i wygenerować plik `spices.ts`:

```bash
npm run fetch
```

## Jak to działa

1. Skrypt łączy się z API WooCommerce i pobiera wszystkie opublikowane produkty
2. Generuje mapowanie słów kluczowych do produktów na podstawie kategorii
3. Tworzy plik TypeScript z tablicą produktów i funkcjami pomocniczymi
4. Zapisuje ten plik do `frontend/src/data/spices.ts`

## Dostosowanie

Jeśli chcesz dostosować mapowanie kategorii do słów kluczowych, edytuj obiekt `categoryKeywordMapping` w pliku `fetch-woocommerce-products.js`. 