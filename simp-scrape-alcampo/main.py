import sys
from scrape.scrape_alcampo_product_id import scrape_alcampo_products
from scrape.fetch_products import fetch_product_details

def main():
    if len(sys.argv) < 3:
        print("Usage: python main.py <company_name> <scrape_new_ids (true/false)>")
        return

    company_name = sys.argv[1].lower()
    scrape_new_ids = sys.argv[2].lower() == "true"

    print(f"Running for company: {company_name}")

    if company_name == "alcampo":
        if scrape_new_ids:
            print("Scraping new product IDs...")
            scrape_alcampo_products()

        print("Fetching product details from stored IDs...")
        fetch_product_details()
    else:
        print(f"Company {company_name} not supported.")

if __name__ == "__main__":
    main()
