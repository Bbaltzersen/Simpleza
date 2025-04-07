# component/scraping/scr_alcampo_product_links_incremental.py

import time
import sys
import datetime

# Selenium Imports
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
# from selenium.webdriver.chrome.service import Service # If needed

# --- Configuration ---
TARGET_URL = "https://www.compraonline.alcampo.es/categories/frescos/OC2112?source=navigation"
BASE_URL = "https://www.compraonline.alcampo.es"

# --- Main Scraping Function (Incremental Scan Strategy) ---
def scrape_alcampo_incrementally(url: str) -> int:
    """
    Scrapes product names and links from an Alcampo category page that potentially
    uses virtual scrolling (unloading off-screen elements).

    It scrolls down incrementally, processing only the cards currently rendered
    in the DOM, storing unique links found. Stops when scrolling down no longer
    reveals new unique product links after several attempts.

    Args:
        url: The URL of the Alcampo category page.

    Returns:
        The total number of unique items found and printed.
    """
    found_links = set() # Store unique absolute links found
    found_count = 0 # Count items successfully found and printed
    driver = None

    # Selectors remain the same for the final product card
    product_card_selector = "div[data-retailer-anchor='fop']"
    name_selector_within_card = "h3[data-test='fop-title']"
    link_selector_within_card = "a[data-test='fop-product-link']"

    try:
        print("Initializing WebDriver (expecting ChromeDriver in system PATH)...")
        # Add options or service path if needed
        driver = webdriver.Chrome()
        print("WebDriver initialized successfully.")
        driver.maximize_window()

        print(f"Navigating to: {url}")
        driver.get(url)

        # --- Handle Cookie Banner ---
        try:
            print("Waiting for cookie consent banner...")
            cookie_button_selector = "#onetrust-accept-btn-handler"
            cookie_button = WebDriverWait(driver, 15).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, cookie_button_selector))
            )
            cookie_button.click()
            print("Cookie banner accepted.")
            time.sleep(2)
        except TimeoutException:
            print("Cookie consent banner not found or timed out.")
        except Exception as e:
            print(f"An error occurred while handling the cookie banner: {e}")


        # --- Incremental Scroll and Scan ---
        print("Starting incremental scroll and scan...")
        scroll_attempts = 0
        max_scroll_attempts = 100 # Safety limit for total scrolls
        no_new_links_streak = 0
        max_no_new_links_streak = 5 # Stop after this many scrolls with no new finds
        wait_after_scroll = 3 # Seconds to wait for content to render after scroll (TUNABLE)

        print("\n--- Found Products (Incremental Scan) ---")
        while scroll_attempts < max_scroll_attempts:
            scroll_attempts += 1
            print(f"\nScroll Attempt {scroll_attempts}:")

            links_found_before_scan = len(found_links)

            # Find *currently rendered* product cards
            # It's crucial this happens *after* any potential wait for rendering
            try:
                current_cards = driver.find_elements(By.CSS_SELECTOR, product_card_selector)
                print(f"  Found {len(current_cards)} potential cards currently in DOM.")
            except Exception as e:
                 print(f"  Error finding cards in attempt {scroll_attempts}: {e}")
                 current_cards = []

            if not current_cards:
                 print("  No product cards found in current view/DOM state.")
                 # Optional: Check if skeletons are present? Could indicate loading stall.
                 # skeletons = driver.find_elements(By.CSS_SELECTOR, 'div[data-retailer-anchor="fop-skeleton"]')
                 # if skeletons: print(f"  ({len(skeletons)} skeletons present)")

            # Process the cards found in this view
            cards_processed_this_scan = 0
            for card in current_cards:
                product_name = "N/A"
                absolute_link = "N/A"
                relative_link = "N/A"
                try:
                    # Extract link first to check if it's new
                    link_element = card.find_element(By.CSS_SELECTOR, link_selector_within_card)
                    relative_link = link_element.get_attribute('href')

                    # Construct absolute link
                    if relative_link:
                        if relative_link.startswith('/'):
                            absolute_link = BASE_URL + relative_link
                        elif relative_link.startswith('http'):
                            absolute_link = relative_link
                        else:
                            absolute_link = "Invalid Link Format" # Skip if format is weird

                    # --- Process only if the link is new ---
                    if absolute_link != "N/A" and "Invalid Link Format" not in absolute_link and absolute_link not in found_links:
                        cards_processed_this_scan += 1
                        # Now extract name since it's a new item
                        name_element = card.find_element(By.CSS_SELECTOR, name_selector_within_card)
                        product_name = name_element.text.strip()

                        if product_name and product_name != "N/A":
                            print(f"  Name: {product_name}")
                            print(f"  Link: {absolute_link}")
                            print("  ---")
                            found_links.add(absolute_link)
                            found_count += 1
                        else:
                            print(f"  Warning: Found new link {absolute_link} but failed to get name. Adding link to set.")
                            found_links.add(absolute_link) # Add link anyway to avoid re-processing

                except NoSuchElementException:
                     # This card might be partially rendered or have unexpected structure
                     # print(f"  Warning: Card in view missing expected sub-element (name or link). Link was '{relative_link}'.")
                     pass # Silently ignore cards missing elements in this view
                except Exception as e:
                    print(f"  ERROR processing a card: {e}. Skipping card.", file=sys.stderr)

            print(f"  Processed {cards_processed_this_scan} new unique cards in this scan.")
            print(f"  Total unique items found so far: {len(found_links)}")

            # --- Scroll Down ---
            last_scroll_y = driver.execute_script("return window.scrollY")
            # Scroll down by 90% of viewport height to ensure overlap
            driver.execute_script("window.scrollBy(0, window.innerHeight * 0.9);")
            print(f"  Scrolling down...")
            time.sleep(wait_after_scroll) # CRUCIAL: Wait for new items to render
            new_scroll_y = driver.execute_script("return window.scrollY")

            # --- Check Stop Conditions ---
            # 1. Did we actually scroll down?
            if new_scroll_y <= last_scroll_y:
                # We might be stuck at the bottom or something prevented scroll
                print("\nScroll position did not increase. Assuming end of page or issue.")
                break

            # 2. Did we find any new links in the last scan?
            if len(found_links) == links_found_before_scan:
                no_new_links_streak += 1
                print(f"\nNo new unique links found in this scroll ({no_new_links_streak}/{max_no_new_links_streak}).")
                if no_new_links_streak >= max_no_new_links_streak:
                    print("\nReached max streak of scrolls with no new links. Stopping.")
                    break
            else:
                no_new_links_streak = 0 # Reset streak if new links were found

        # End of while loop
        if scroll_attempts == max_scroll_attempts:
            print(f"\nWARNING: Reached maximum scroll attempts ({max_scroll_attempts}). May not have all products.")

        print(f"\n--- End of Products (Incremental Scan) ---")


    except WebDriverException as e:
        print(f"\nA WebDriver error occurred: {e}", file=sys.stderr)
        # ... (rest of WebDriverException handling) ...
    except Exception as e:
        print(f"\nAn unexpected error occurred during scraping: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()

    finally:
        if driver:
            print("Closing WebDriver...")
            driver.quit()
            print("WebDriver closed.")

    # Return total unique count
    return len(found_links)

# --- Execution ---
if __name__ == "__main__":
    start_time = time.time()
    print(f"--- Starting Alcampo Incremental Scraper at {datetime.datetime.now()} ---")
    print(f"Target URL: {TARGET_URL}")

    total_found = scrape_alcampo_incrementally(TARGET_URL)

    end_time = time.time()
    duration = end_time - start_time
    print("\n--- Scraping Summary ---")
    print(f"Total unique products found and printed: {total_found}")
    print(f"Script execution duration: {duration:.2f} seconds")
    print(f"--- Scraper finished at {datetime.datetime.now()} ---")