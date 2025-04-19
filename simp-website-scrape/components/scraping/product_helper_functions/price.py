# components/scraping/product_helper_functions/price.py

import re
import sys
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

# Selenium Imports needed for extraction logic
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# --- Selectors Specific to Price/Unit Extraction ---
# This container often holds both size and price-per-unit info
SIZE_UNIT_CONTAINER_SELECTOR = "div[data-test='size-container']"
# Specific selector if price-per-unit has its own element (inspect needed)
# Example: PRICE_PER_UNIT_SELECTOR = "span[class*='price-per-unit']" # Needs verification

# --- Helper Function ---
def _parse_price_string(price_str: str | None) -> Decimal | None:
    """
    Cleans and parses a string containing a price into a Decimal.
    Handles Spanish number format (',' as decimal separator).
    """
    if not price_str:
        return None
    # Remove currency symbols, whitespace, thousand separators (.) and keep decimal comma
    cleaned_price = re.sub(r'[^\d,]', '', price_str).replace(',', '.')
    # Basic validation: should contain digits and at most one decimal point
    if not cleaned_price or cleaned_price.count('.') > 1:
        return None
    try:
        # Convert to Decimal, rounding to 2 decimal places
        price_decimal = Decimal(cleaned_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return price_decimal
    except InvalidOperation:
        return None

# --- Main Extraction Function ---
def extract_price_per_unit(driver: WebDriver, worker_id: int = 0) -> tuple[Decimal | None, str | None]:
    """
    Extracts the explicitly stated price per unit (e.g., €/kg, €/L, €/Unit)
    from the product page using the provided driver.

    Args:
        driver: The Selenium WebDriver instance positioned on the product page.
        worker_id: An optional ID for logging purposes.

    Returns:
        A tuple containing:
            - The extracted price per unit as a Decimal, or None if not found/parsed.
            - The associated unit ('kg', 'l', 'unit') as a string, or None if not found.
    """
    extracted_ppu = None
    extracted_unit = None
    log_prefix = f"[PriceExtractor Worker {worker_id:02d}]" # Logging prefix

    try:
        # Locate the container likely holding the PPU info
        # Wait specifically for this container
        ppu_container_wait = WebDriverWait(driver, 10) # Wait up to 10 seconds
        ppu_container = ppu_container_wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, SIZE_UNIT_CONTAINER_SELECTOR))
        )

        if ppu_container:
            container_text = ppu_container.text
            # print(f"{log_prefix} Found PPU container text: '{container_text}'") # Debug

            # Regex to find patterns like "1,75 € / kg" or "0,80 €/Litro" or "2.50 € / Ud."
            # Allows for variations in spacing and unit spelling (case-insensitive)
            # Captures: 1=Price, 2=Unit
            ppu_pattern = r'(\d{1,3}(?:[.,]\d{1,2})?)\s*€\s*(?:/|por)\s*(kg|kilogramo|l|litro|unidad|ud)\b'
            match = re.search(ppu_pattern, container_text, re.IGNORECASE)

            if match:
                price_str = match.group(1)
                unit_str = match.group(2).lower()
                # print(f"{log_prefix} Matched PPU pattern: Price='{price_str}', Unit='{unit_str}'") # Debug

                # Parse the extracted price string
                extracted_ppu = _parse_price_string(price_str)

                # Normalize the unit
                if unit_str in ['kg', 'kilogramo']:
                    extracted_unit = 'kg'
                elif unit_str in ['l', 'litro']:
                    extracted_unit = 'l'
                elif unit_str in ['ud', 'unidad']:
                    extracted_unit = 'unit'
                else:
                    extracted_unit = None # Should not happen with the regex, but safety first

                if extracted_ppu is not None and extracted_unit is not None:
                    print(f"{log_prefix} Successfully extracted PPU: {extracted_ppu} €/{extracted_unit}")
                else:
                     print(f"{log_prefix} WARN: Matched PPU pattern but failed to parse price or normalize unit.", file=sys.stderr)
                     extracted_ppu = None # Ensure consistency on failure
                     extracted_unit = None

            else:
                print(f"{log_prefix} Explicit PPU pattern not found in container text.")
                # Optional: Add fallback searches if PPU is sometimes in a different element/format

        else: # Should not happen if WebDriverWait succeeds, but defensive check
             print(f"{log_prefix} WARN: PPU container found by selector but element is falsy?", file=sys.stderr)

    except TimeoutException:
        print(f"{log_prefix} WARN: PPU container ({SIZE_UNIT_CONTAINER_SELECTOR}) not found within timeout.", file=sys.stderr)
    except Exception as e:
        print(f"{log_prefix} ERROR during PPU extraction: {type(e).__name__} - {e}", file=sys.stderr)

    return extracted_ppu, extracted_unit

# --- Example Test (requires manual driver setup if run directly) ---
# if __name__ == '__main__':
#     print("This module provides price extraction functions.")
#     # Example usage would require setting up a Selenium driver instance first.
#     # price, unit = extract_price_per_unit(driver_instance)
#     # print(f"Extracted: {price} € / {unit}")