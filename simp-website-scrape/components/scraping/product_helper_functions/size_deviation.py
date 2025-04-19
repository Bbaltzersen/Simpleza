# components/scraping/product_helper_functions/size_deviation.py

import re
import sys
from typing import Tuple, Optional

# Selenium Imports needed for extraction logic
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# --- Selectors Specific to Size Deviation Extraction ---
# Using XPath to find the element containing the specific text is more reliable
XPATH_SELECTOR_FOR_DEVIATION_TEXT = "//*[contains(text(), 'Rango de peso:')]"

# Fallback container selector (less preferred)
PRODUCT_INFO_CONTAINER_SELECTOR = "div[class*='_grid-item-12_tilop_45']"

# --- Main Extraction Function ---
def extract_size_deviation(driver: WebDriver, worker_id: int = 0) -> Tuple[Optional[int], Optional[int]]:
    """
    Extracts the minimum and maximum weight deviation (in grams) if specified
    on the product page (e.g., "Rango de peso: 400 g - 600 g").
    Prioritizes finding the element directly containing the text via XPath.

    Args:
        driver: The Selenium WebDriver instance positioned on the product page.
        worker_id: An optional ID for logging purposes.

    Returns:
        A tuple containing:
            - min_weight_g (int | None): Minimum weight in grams, or None if not found.
            - max_weight_g (int | None): Maximum weight in grams, or None if not found.
    """
    min_weight_g: Optional[int] = None
    max_weight_g: Optional[int] = None
    log_prefix = f"[SizeDeviationExtractor Worker {worker_id:02d}]"
    text_to_search: Optional[str] = None

    # --- Attempt 1: Find specific element using XPath contains() ---
    try:
        wait_time = 7 # seconds
        deviation_element_wait = WebDriverWait(driver, wait_time)
        # Find the element that CONTAINS the text "Rango de peso:"
        deviation_element = deviation_element_wait.until(
            EC.presence_of_element_located((By.XPATH, XPATH_SELECTOR_FOR_DEVIATION_TEXT))
        )
        # Get text directly from the found element
        text_to_search = deviation_element.text
        print(f"{log_prefix} Found potential deviation text via XPath: '{text_to_search}'")

    except TimeoutException:
        print(f"{log_prefix} INFO: Element containing 'Rango de peso:' not found via XPath within {wait_time}s.")
        # Optionally add fallback here if needed, but XPath is usually sufficient if text exists
        # print(f"{log_prefix} INFO: Trying fallback container search...")
        # try:
        #      container = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR)))
        #      text_to_search = container.text
        # except TimeoutException:
        #      print(f"{log_prefix} INFO: Fallback container not found either.")
        # except Exception as e_fb:
        #      print(f"{log_prefix} WARN: Error during fallback container search: {type(e_fb).__name__}", file=sys.stderr)

    except Exception as e:
        print(f"{log_prefix} WARN: Error locating deviation element via XPath: {type(e).__name__}", file=sys.stderr)


    # --- Process the extracted text (if any) ---
    if text_to_search:
        # Regex to find "Rango de peso: XXX g - YYY g" (case-insensitive)
        # Ensure regex correctly handles potential variations if needed
        range_pattern = r'Rango de peso:\s*(\d+)\s*g\s*-\s*(\d+)\s*g'
        match = re.search(range_pattern, text_to_search, re.IGNORECASE)

        if match:
            try:
                min_val_str = match.group(1)
                max_val_str = match.group(2)
                min_weight_g = int(min_val_str)
                max_weight_g = int(max_val_str)
                print(f"{log_prefix} Successfully parsed size deviation: Min={min_weight_g}g, Max={max_weight_g}g")
            except (ValueError, TypeError) as e:
                print(f"{log_prefix} WARN: Found pattern but failed to parse numbers: {match.groups()} | Error: {e}", file=sys.stderr)
                min_weight_g, max_weight_g = None, None # Reset on error
        else:
            print(f"{log_prefix} INFO: 'Rango de peso' pattern not found within the located text '{text_to_search[:100]}...'.") # Log part of text searched
    else:
        print(f"{log_prefix} INFO: No text content found to search for size deviation.")


    return min_weight_g, max_weight_g