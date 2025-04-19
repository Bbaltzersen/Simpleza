# components/scraping/product_helper_functions/title.py

import re
import json
import sys
from html import unescape

# Selenium Imports needed for extraction logic
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

# --- Selectors Specific to Title Extraction ---
# Define selectors here if they are tightly coupled with title logic
PRODUCT_INFO_CONTAINER_SELECTOR = "div[class*='_grid-item-12_tilop_45']" # For fallback name using container text/H1

# --- Helper Function ---
def _clean_html_text(raw_html: str) -> str:
    """Removes HTML tags and decodes HTML entities. (Internal helper)"""
    if not raw_html: return ""
    # Remove script/style blocks first
    text = re.sub(r'<(script|style).*?>.*?</\1>', '', raw_html, flags=re.IGNORECASE | re.DOTALL)
    # Remove remaining HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode HTML entities
    text = unescape(text)
    # Normalize whitespace
    return ' '.join(text.split())

# --- Main Extraction Function ---
def extract_title(driver: WebDriver, worker_id: int = 0) -> str | None:
    """
    Extracts the product title (Spanish name) from the current page using the provided driver.
    Assumes the driver has already navigated to the product page and handled cookies if necessary.

    Args:
        driver: The Selenium WebDriver instance positioned on the product page.
        worker_id: An optional ID for logging purposes.

    Returns:
        The extracted product title as a string, or None if extraction fails.
    """
    extracted_title = None
    log_prefix = f"[TitleExtractor Worker {worker_id:02d}]" # For clearer logs

    # 1. Attempt JSON-LD First (Most reliable)
    product_json = None
    try:
        # Wait briefly for scripts to be present if needed, though they usually are after page load
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, '//script[@type="application/ld+json"]'))
        )
        script_elements = driver.find_elements(By.XPATH, '//script[@type="application/ld+json"]')
        # print(f"{log_prefix} Found {len(script_elements)} JSON-LD scripts.") # Debug
        for script in script_elements:
            script_html = script.get_attribute('innerHTML')
            if script_html:
                try:
                    data = json.loads(script_html)
                    potential_product = None
                    # Handle different JSON-LD structures
                    if isinstance(data, dict) and data.get('@type') == 'Product':
                        potential_product = data
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get('@type') == 'Product':
                                potential_product = item
                                break # Take the first product found in a list
                    elif isinstance(data, dict) and data.get('@type') == 'ItemPage':
                            main_entity = data.get('mainEntity')
                            if isinstance(main_entity, dict) and main_entity.get('@type') == 'Product':
                                potential_product = main_entity

                    if potential_product and potential_product.get('name'):
                        product_json = potential_product # Store the whole JSON for potential future use?
                        title_candidate = potential_product.get('name')
                        if isinstance(title_candidate, str) and title_candidate.strip():
                             extracted_title = title_candidate.strip()
                             # print(f"{log_prefix} Extracted title from JSON-LD: '{extracted_title}'") # Debug
                             break # Stop searching once a valid product name is found
                except (json.JSONDecodeError, TypeError) as json_e:
                    # print(f"{log_prefix} WARN: Minor error parsing one JSON-LD script: {json_e}", file=sys.stderr) # Debug
                    continue # Try the next script
    except TimeoutException:
        print(f"{log_prefix} WARN: No JSON-LD script elements found within timeout.", file=sys.stderr)
    except Exception as e:
        # Catch other potential errors during JSON-LD search/parsing
        print(f"{log_prefix} WARN: Error processing JSON-LD: {type(e).__name__} - {e}", file=sys.stderr)


    # 2. Fallback: Extract from HTML structure if JSON-LD failed
    if not extracted_title:
        # print(f"{log_prefix} JSON-LD title not found or invalid, attempting HTML fallback.") # Debug
        try:
            # Wait for the container that usually holds the title
            # Increased wait slightly as this is a fallback
            container_wait = WebDriverWait(driver, 10)
            info_container = container_wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, PRODUCT_INFO_CONTAINER_SELECTOR))
            )

            # Try finding H1 within the container first (common practice)
            try:
                h1_element = info_container.find_element(By.TAG_NAME, "h1")
                # Use get_attribute('textContent') for potentially cleaner text than .text
                title_text = h1_element.get_attribute('textContent')
                if title_text and title_text.strip():
                    extracted_title = _clean_html_text(title_text) # Clean H1 text
                    # print(f"{log_prefix} Extracted title from H1: '{extracted_title}'") # Debug

            except NoSuchElementException:
                # print(f"{log_prefix} No H1 found in container, trying container text.") # Debug
                # If H1 isn't found, try the container's text content as a broader fallback
                # Use get_attribute('textContent') here too for consistency
                container_text = info_container.get_attribute('textContent')
                if container_text and container_text.strip():
                    # Often the title is the first meaningful line
                    lines = container_text.split('\n')
                    for line in lines:
                        cleaned_line = line.strip()
                        if cleaned_line: # Take the first non-empty line
                            extracted_title = cleaned_line # Already reasonably clean from textContent
                            # print(f"{log_prefix} Extracted title from container text line: '{extracted_title}'") # Debug
                            break

        except TimeoutException:
            print(f"{log_prefix} WARN: Fallback container ({PRODUCT_INFO_CONTAINER_SELECTOR}) not found.", file=sys.stderr)
        except Exception as e:
            print(f"{log_prefix} WARN: Error during HTML fallback title extraction: {type(e).__name__} - {e}", file=sys.stderr)

    # --- Final Check and Return ---
    if not extracted_title:
        print(f"{log_prefix} ERROR: Failed to extract title using JSON-LD and HTML fallbacks.", file=sys.stderr)
        return None
    else:
        # Final clean just in case (e.g., excessive internal whitespace)
        extracted_title = ' '.join(extracted_title.split())
        print(f"{log_prefix} Successfully extracted title: '{extracted_title}'")
        return extracted_title

# You could add a simple test block here, but it's harder without
# setting up a driver instance directly within this file.
# It's better tested by the script that calls it.
# if __name__ == '__main__':
#     print("This module provides title extraction functions and is meant to be imported.")