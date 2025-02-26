import re
from unidecode import unidecode
from nltk.corpus import words
from rapidfuzz import process

# Load Spanish words from NLTK (This contains mostly English, so we may need a better Spanish source)
VALID_WORDS = set(words.words())

# List of measurement units to remove
MEASUREMENT_UNITS = ["g", "kg", "ml", "l", "litro", "gramo", "cl", "mg"]

# List of quantity words to extract
QUANTITY_WORDS = ["uds", "unidades", "latas", "packs", "botellas"]

def preprocess_product_name(product_name):
    """Cleans a product name by removing unnecessary words and extracting useful data."""

    # Convert to lowercase and remove accents
    product_name = unidecode(product_name.lower())

    # Extract quantity (e.g., "6 uds.")
    quantity = None
    quantity_match = re.search(r"(\d+)\s*(" + "|".join(QUANTITY_WORDS) + r")\b", product_name)
    if quantity_match:
        quantity = int(quantity_match.group(1))  # Extract numeric value
        product_name = product_name.replace(quantity_match.group(0), "")  # Remove from string

    # Remove measurement units (e.g., "250 g")
    product_name = re.sub(r"\b\d+\s*(" + "|".join(MEASUREMENT_UNITS) + r")\b", "", product_name)

    # Tokenize words
    tokens = re.findall(r"\b[a-zA-Z]+\b", product_name)

    # Keep only words that exist in the dictionary (using fuzzy matching for minor variations)
    cleaned_tokens = [
        word for word in tokens if word in VALID_WORDS or process.extractOne(word, VALID_WORDS, score_cutoff=80)
    ]

    # Join cleaned words back into a product name
    cleaned_name = " ".join(cleaned_tokens)

    return {"cleaned_name": cleaned_name, "quantity": quantity}