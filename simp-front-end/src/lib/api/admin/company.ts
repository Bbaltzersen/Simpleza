// src/lib/api/company.ts
import axios from "axios";
import {
    Company,
    CompanyCreatePayload,
    PaginatedCompanies // Import the paginated type
} from "@/lib/types/company"; // Adjust path as needed

// --- Configuration ---
// Base URL part before the specific resource path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";
// Full path prefix for the admin companies endpoint
const RESOURCE_PREFIX = "/v1/admin/companies";

// Axios instance configured for Company Admin API
const companyApiClient = axios.create({
  baseURL: `${API_BASE_URL}${RESOURCE_PREFIX}`, // e.g., http://localhost:8010/v1/admin/companies
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Functions ---

/**
 * Fetch paginated companies.
 * GET /v1/admin/companies/
 */
export async function fetchCompanies(page: number = 1, limit: number = 10): Promise<PaginatedCompanies> {
  try {
    const skip = Math.max(0, (page - 1) * limit);
    // Use PaginatedCompanies as the expected response type
    const response = await companyApiClient.get<PaginatedCompanies>(
      `/?skip=${skip}&limit=${limit}`
    );
     // Basic validation
     if (!response.data || typeof response.data.total !== 'number' || !Array.isArray(response.data.companies)) {
        console.error("fetchCompanies: Invalid response data structure", response.data);
        return { companies: [], total: 0 };
   }
    return response.data;
  } catch (error) {
    console.error("API Error fetching companies:", error);
    return { companies: [], total: 0 }; // Return default error state
  }
}

/**
 * Fetch a single company by ID.
 * GET /v1/admin/companies/{company_id}
 */
export async function fetchCompanyById(company_id: string): Promise<Company | null> {
  if (!company_id) return null;
  try {
    // Expect Company type (matches CompanyOut)
    const response = await companyApiClient.get<Company>(`/${company_id}`);
    return response.data;
  } catch (error) {
    console.error(`API Error fetching company ${company_id}:`, error);
    // TODO: Check for 404
    return null;
  }
}

/**
 * Create a new company.
 * POST /v1/admin/companies/
 */
export async function createCompany(payload: CompanyCreatePayload): Promise<Company | null> {
  try {
    // Use CompanyCreatePayload type for input
    const response = await companyApiClient.post<Company>("/", payload);
    // Expect Company type (matches CompanyOut) back
    return response.data;
  } catch (error) {
    console.error("API Error creating company:", error);
    // TODO: Check for 409 Conflict
    return null;
  }
}

/**
 * Update an existing company.
 * PUT /v1/admin/companies/{company_id}
 */
 // Backend expects CompanyCreate schema ({ name: string }) for update
export async function updateCompany(company_id: string, payload: CompanyCreatePayload): Promise<Company | null> {
  if (!company_id) return null;
  try {
    // Use CompanyCreatePayload type as required by the current backend endpoint
    const response = await companyApiClient.put<Company>(`/${company_id}`, payload);
     // Expect Company type (matches CompanyOut) back
    return response.data;
  } catch (error) {
    console.error(`API Error updating company ${company_id}:`, error);
     // TODO: Check for 404, 409
    return null;
  }
}

/**
 * Delete a company.
 * DELETE /v1/admin/companies/{company_id}
 */
export async function deleteCompany(company_id: string): Promise<boolean> {
  if (!company_id) return false;
  try {
    await companyApiClient.delete(`/${company_id}`); // Expects 204 No Content
    return true;
  } catch (error) {
    console.error(`API Error deleting company ${company_id}:`, error);
    // TODO: Check for 409 Conflict (if linked to products)
    return false;
  }
}