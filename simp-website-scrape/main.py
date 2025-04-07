# test_chromedriver_path.py

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
import time

print("--- Selenium ChromeDriver PATH Test ---")
print("Attempting to start Chrome using ChromeDriver found in system PATH...")

driver = None  # Initialize driver variable outside try block

try:
    # If ChromeDriver is correctly in the PATH, Selenium will find it automatically.
    # We do NOT need to specify executable_path or use a Service object here.
    driver = webdriver.Chrome()

    print("\nSUCCESS: ChromeDriver launched successfully!")
    print("Chrome Browser should have opened.")

    # Perform a simple action to confirm control
    test_url = "https://www.google.com" # Using Google as a reliable test site
    # test_url = "https://www.compraonline.alcampo.es" # Or use Alcampo
    print(f"Navigating to: {test_url}")
    driver.get(test_url)

    # Wait a few seconds to see the page load
    time.sleep(5)

    page_title = driver.title
    print(f"Page title is: '{page_title}'")
    print("\nTest appears successful! Browser opened and navigated.")


except WebDriverException as e:
    # This exception is often raised if the driver isn't found or can't start
    print("\n--- TEST FAILED ---")
    print("Could not start ChromeDriver. Error message:")
    print(f"-> {e}")
    print("\nPlease double-check the following:")
    print("1. Is the *directory* containing 'chromedriver.exe' (Windows) or 'chromedriver' (Mac/Linux) correctly added to your system's PATH environment variable?")
    print("2. Did you restart your terminal/command prompt/IDE or computer after modifying the PATH?")
    print("3. Does the downloaded ChromeDriver version match your installed Google Chrome browser version?")
    print("4. (Mac/Linux) Does the 'chromedriver' file have execute permissions? (You might need to run 'chmod +x /path/to/your/chromedriver')")
    print("5. Is security software (antivirus/firewall) potentially blocking chromedriver?")

except Exception as e:
    # Catch any other unexpected errors
    print("\n--- TEST FAILED ---")
    print("An unexpected error occurred:")
    print(f"-> {e}")

finally:
    # Ensure the browser is closed even if errors occurred
    if driver:
        print("\nClosing the browser...")
        driver.quit()
        print("Browser closed.")
    else:
        print("\nWebDriver was not successfully initialized.")

print("\n--- Test script finished ---")