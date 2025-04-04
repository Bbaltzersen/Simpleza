// src/lib/types/company.ts

// Corresponds to CompanyOut schema
export type Company = {
  company_id: string; // UUID
  name: string;
};

// Corresponds to CompanyCreate schema
export type CompanyCreatePayload = {
  name: string;
};

// For paginated responses (matches PaginatedCompanies schema)
export type PaginatedCompanies = {
  companies: Company[];
  total: number;
};