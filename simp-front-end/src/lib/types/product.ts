// src/lib/types/product.ts
import { MeasurementUnitEnum } from "./enums";

// Nested type for company info within Product (matches ProductCompanyInfoOut)
export type ProductCompanyInfo = {
  company_id: string; // UUID
  name: string; // Renamed from company_name
  price?: number | null; // Optional number
};

// Main Product data type (matches ProductOut)
export type Product = {
  product_id: string; // UUID
  retail_id?: string | null; // string
  src_product_id?: string | null; // UUID
  english_name: string;
  spanish_name?: string | null; // Optional
  amount: number; // number (from Decimal)
  weight?: number | null; // Optional number
  measurement?: MeasurementUnitEnum | null; // Enum type
  companies?: ProductCompanyInfo[]; // Use correct nested type
};

// Payload for creating a Product (matches ProductCreate)
export type ProductCreatePayload = {
  retail_id?: string | null; // string
  src_product_id?: string | null;
  english_name: string;
  spanish_name?: string | null;
  amount: number;
  weight?: number | null;
  measurement?: MeasurementUnitEnum | null; // Enum type
};

// Payload for updating Product (matches ProductUpdate)
export type ProductUpdatePayload = {
  retail_id?: string | null;
  src_product_id?: string | null;
  english_name?: string;
  spanish_name?: string | null;
  amount?: number;
  weight?: number | null;
  measurement?: MeasurementUnitEnum | null; // Enum type
};

// Type matching ProductCompanyOut (for fetchProductCompanies & linkProductToCompany response)
export type ProductCompanyLinkDetail = {
    product_id: string; // UUID
    company_id: string; // UUID
    company_name: string; // Matches backend schema field
    price?: number | null; // Optional number
};