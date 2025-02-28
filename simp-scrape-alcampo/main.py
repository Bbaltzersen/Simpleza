import sys
from information_retrieval.fetch_product_ids import fetch_and_store_product_ids
from information_retrieval.fetch_product_details import fetch_product_details

def main():
    if len(sys.argv) < 4:
        print("Usage: python main.py <company_name> <scrape_new_ids (true/false)> <fetch_products (true/false)>")
        return

    company_name = sys.argv[1].lower()
    scrape_new_ids = sys.argv[2].lower() == "true"
    fetch_products = sys.argv[3].lower() == "true"

    print(f"Running for company: {company_name}")

    if company_name == "alcampo":
        if scrape_new_ids:
            print("Scraping new product IDs...")
            fetch_and_store_product_ids()

        if fetch_products:
            print("Fetching product details from stored IDs...")
            fetch_product_details()

        if not scrape_new_ids and not fetch_products:
            print("Nothing to do. Both scraping and fetching are disabled.")
    else:
        print(f"Company {company_name} not supported.")

if __name__ == "__main__":
    main()
