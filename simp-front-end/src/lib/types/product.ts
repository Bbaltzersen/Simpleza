export type Product = {
    product_id: string; // UUID
    retail_id?: number | null; // Optional
    src_product_id?: string | null; // UUID, Optional
    english_name: string;
    spanish_name: string;
    amount: number; // Default 1
    weight: number;
    measurement: string;
  };

  export type ProductCompany = {
    product_id: string; // UUID (ForeignKey)
    company_id: string; // UUID (ForeignKey)
    price: number;
  };
  