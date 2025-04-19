# components/scraping/product_helper_functions/size_info.py

import re
import sys
import json
from decimal import Decimal, InvalidOperation

# Selenium Imports needed for extraction logic
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# --- Selectors Specific to Size Info Extraction ---
SIZE_UNIT_CONTAINER_SELECTOR = "div[data-test='size-container']"
JSON_LD_SELECTOR = '//script[@type="application/ld+json"]'

# --- Internal Helper Function for Parsing Size Strings ---
# Updated return signature and logic
def _parse_size_string(size_str: str | None) -> tuple[Decimal | None, Decimal | None, str | None]:
    """
    Parses a string potentially containing size/weight/volume/pack information.
    Handles formats like: '500 g', '1.5L', 'approx 1kg', 'pack 6 x 33cl', '6 uds'.

    Returns:
        A tuple containing:
            - quantity (Decimal | None): Number of items (e.g., 1, 6, 4).
            - item_size_value (Decimal | None): Size of one item (e.g., 500, 1.5, 120, 1).
            - item_measurement (str | None): Unit for item size ('g', 'kg', 'ml', 'cl', 'l', 'unit').
        Returns (None, None, None) if parsing fails.
    """
    if not size_str:
        return None, None, None

    size_str_lower = size_str.lower()
    quantity: Decimal | None = None
    item_size_value: Decimal | None = None
    item_measurement: str | None = None

    # Priority 1: Pack information
    # Regex captures: 1=Pack count, 2=Optional item amount, 3=Optional item unit, 4=Optional 'uds'/'unidades'
    pack_pattern = r'(?:pack|paquete)?\s*(\d+)\s*(?:x\s*(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b|(uds?|unidades?)\b)'
    pack_match = re.search(pack_pattern, size_str_lower)

    if pack_match:
        try:
            pack_count_val = Decimal(pack_match.group(1))
            if pack_match.group(4): # Matched 'X uds' or 'X unidades'
                quantity = pack_count_val
                item_size_value = Decimal(1) # Assume size 1 for unit items
                item_measurement = 'unit'
            elif pack_match.group(2) and pack_match.group(3): # Matched 'X x Y unit'
                quantity = pack_count_val
                item_size_value = Decimal(pack_match.group(2)) # Size of one item
                item_unit_str = pack_match.group(3).lower()
                item_measurement = 'g' if item_unit_str == 'gr' else item_unit_str # Unit of one item
            # else: # Case like "pack 6" without further spec - treat as 6 units?
            #    quantity = pack_count_val
            #    item_size_value = Decimal(1)
            #    item_measurement = 'unit'
            #    print(f"WARN _parse_size_string (pack): Ambiguous pack format '{size_str}', assuming units.")

        except (InvalidOperation, ValueError, TypeError) as e:
            print(f"WARN _parse_size_string (pack): Error parsing components: {e}", file=sys.stderr)
            return None, None, None # Return None on error

    # Priority 2: Simple amount + unit (interpret as quantity=1)
    if quantity is None: # Only proceed if pack match didn't succeed
        simple_amount_pattern = r'(?:^|\s|aprox|approx\.?)\s*(\d+\.?\d*)\s*(g|gr|kg|ml|cl|l)\b'
        simple_match = re.search(simple_amount_pattern, size_str_lower)
        if simple_match:
            try:
                quantity = Decimal(1) # Default quantity is 1 for single items
                item_size_value = Decimal(simple_match.group(1)) # The size value found
                unit_str = simple_match.group(2).lower()
                item_measurement = 'g' if unit_str == 'gr' else unit_str # The unit found
            except (InvalidOperation, ValueError, TypeError) as e:
                 print(f"WARN _parse_size_string (simple): Error parsing components: {e}", file=sys.stderr)
                 return None, None, None

    # Fallback: Check for just "unidad" or "ud" -> quantity=1, item_size=1, item_measurement='unit'
    if quantity is None and item_size_value is None and item_measurement is None:
        if re.search(r'\b(unidad|ud)\b', size_str_lower):
            quantity = Decimal(1)
            item_size_value = Decimal(1)
            item_measurement = 'unit'

    # Final validation
    valid_units = ['g', 'kg', 'ml', 'cl', 'l', 'unit']
    if item_measurement not in valid_units: # Check if a unit was determined and is valid
        return None, None, None

    # Check if essential parts were found
    if quantity is None or item_size_value is None or item_measurement is None:
         return None, None, None

    # Return the quantity, item size, and item measurement
    return quantity, item_size_value, item_measurement

# --- Main Extraction Function ---
# Updated return signature and docstring
def extract_size_info(driver: WebDriver, worker_id: int = 0) -> tuple[Decimal | None, Decimal | None, str | None]:
    """
    Extracts the product's quantity, individual item size, and item measurement.
    Handles weight (g, kg), volume (ml, cl, l), and unit counts (unit, uds).
    Prioritizes JSON-LD 'size' field, then falls back to the HTML size container text.

    Args:
        driver: The Selenium WebDriver instance positioned on the product page.
        worker_id: An optional ID for logging purposes.

    Returns:
        A tuple containing:
            - quantity (Decimal | None): Number of items (e.g., 1, 6, 4).
            - item_size_value (Decimal | None): Size of one item (e.g., 500, 1.5, 120, 1).
            - item_measurement (str | None): Unit for item size ('g', 'kg', 'ml', 'cl', 'l', 'unit').
        Returns (None, None, None) if extraction fails.
    """
    quantity: Decimal | None = None
    item_size: Decimal | None = None
    item_unit: str | None = None
    log_prefix = f"[SizeInfoExtractor Worker {worker_id:02d}]"

    # 1. Attempt JSON-LD First
    json_ld_size_str = None
    try:
        WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, JSON_LD_SELECTOR)))
        script_elements = driver.find_elements(By.XPATH, JSON_LD_SELECTOR)
        for script in script_elements:
            script_html = script.get_attribute('innerHTML')
            if script_html:
                try:
                    data = json.loads(script_html)
                    potential_product = None
                    # Find product data (same logic as before)
                    if isinstance(data, dict) and data.get('@type') == 'Product': potential_product = data
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get('@type') == 'Product': potential_product = item; break
                    elif isinstance(data, dict) and data.get('@type') == 'ItemPage':
                         main_entity = data.get('mainEntity')
                         if isinstance(main_entity, dict) and main_entity.get('@type') == 'Product': potential_product = main_entity

                    if potential_product:
                        json_ld_size_str = potential_product.get('size')
                        if json_ld_size_str and isinstance(json_ld_size_str, str):
                            # Call updated parser to get 3 values
                            quantity, item_size, item_unit = _parse_size_string(json_ld_size_str)
                            if quantity is not None and item_size is not None and item_unit is not None:
                                print(f"{log_prefix} Extracted size info from JSON-LD: Qty={quantity}, ItemSize={item_size} {item_unit}")
                                return quantity, item_size, item_unit # Return all 3 values

                except (json.JSONDecodeError, TypeError):
                    continue # Ignore errors in non-product JSON-LD

    except TimeoutException:
         print(f"{log_prefix} WARN: No JSON-LD scripts found within timeout.", file=sys.stderr)
    except Exception as e:
         print(f"{log_prefix} WARN: Error processing JSON-LD for size: {type(e).__name__}", file=sys.stderr)

    # 2. Fallback: HTML Size Container Text (Only if JSON-LD failed)
    if quantity is None or item_size is None or item_unit is None:
        print(f"{log_prefix} Attempting HTML container fallback for size info...")
        try:
            size_container_wait = WebDriverWait(driver, 10)
            size_container = size_container_wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, SIZE_UNIT_CONTAINER_SELECTOR))
            )
            if size_container:
                container_text = size_container.text
                # Call updated parser to get 3 values
                quantity, item_size, item_unit = _parse_size_string(container_text)
                if quantity is not None and item_size is not None and item_unit is not None:
                    print(f"{log_prefix} Extracted size info from HTML container: Qty={quantity}, ItemSize={item_size} {item_unit}")
                    return quantity, item_size, item_unit # Return all 3 values

        except TimeoutException:
            print(f"{log_prefix} WARN: HTML size container ({SIZE_UNIT_CONTAINER_SELECTOR}) not found.", file=sys.stderr)
        except Exception as e:
            print(f"{log_prefix} ERROR during HTML size container extraction: {type(e).__name__} - {e}", file=sys.stderr)

    # 3. Final Result
    if quantity is None or item_size is None or item_unit is None:
         print(f"{log_prefix} Failed to extract complete size info (Qty/ItemSize/Unit).")

    # Return whatever was found (might be partially None)
    return quantity, item_size, item_unit