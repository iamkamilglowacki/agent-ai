#!/bin/bash

# Usuń stare środowisko jeśli istnieje
rm -rf venv

# Utwórz nowe środowisko z Python 3.11
/opt/homebrew/bin/python3.11 -m venv venv

# Aktywuj środowisko
source venv/bin/activate

# Zainstaluj zależności
pip install --upgrade pip
pip install -r requirements.txt 