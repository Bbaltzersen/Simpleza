import deepl
import os
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
DEEPL_API_KEY = "72bc0f62-b5b5-d9aa-eded-722b1968b7c4:fx"

def translate_text(text, target_language="EN-GB"):
    """Translates text using DeepL API."""
    try:
        translator = deepl.DeepLClient(api_key=DEEPL_API_KEY)
        return translator.translate_text(text, target_lang=target_language)
    except Exception as e:
        print(f"DeepL translation error: {e}")
        return text  # Return original text if translation fails
