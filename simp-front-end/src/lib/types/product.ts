export type Product = {
  product_id: string; // UUID
  retail_id?: number | null; // Optional
  src_product_id?: string | null; // UUID, Optional
  english_name: string;
  spanish_name: string;
  amount: number; // Default 1
  weight: number;
  measurement: string;
  companies?: ProductCompanyDetail[]; // Optional list of linked companies with names
};

export type ProductCompany = {
  product_id: string; // UUID (ForeignKey)
  company_id: string; // UUID (ForeignKey)
  price: number;
};

export type ProductCompanyDetail = {
  company_id: string;
  company_name: string;
  price: number;
};

export type ProductCreate = {
  retail_id?: number | null;
  src_product_id?: string | null; // Optional
  english_name: string;
  spanish_name: string;
  amount: number;
  weight: number;
  measurement: string;
  company_prices: Record<string, number>; // { "Company A": 10.5, "Company B": 12.0 }
};
