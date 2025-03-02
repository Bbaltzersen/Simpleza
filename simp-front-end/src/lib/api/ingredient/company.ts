import axios from "axios";
import { Company } from "@/lib/types/company";

const API_BASE_URL = process.env.INGREDIENTS_API_URL || "http://localhost:8010/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/companies`,
  withCredentials: true,
});

/**
 * Fetch paginated companies
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page
 * @returns {Promise<{ companies: Company[]; total: number }>}
 */
export async function fetchCompanies(page: number = 1, limit: number = 10): Promise<{ companies: Company[], total: number }> {
  try {
    const response = await apiClient.get<{ companies: Company[], total: number }>(
      `/?skip=${(page - 1) * limit}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    return { companies: [], total: 0 };
  }
}

/**
 * Fetch a single company by ID
 */
export async function fetchCompanyById(company_id: string): Promise<Company | null> {
  try {
    const response = await apiClient.get(`/${company_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching company:", error);
    return null;
  }
}

/**
 * Create a new company
 */
export async function createCompany(company: { name: string }): Promise<Company | null> {
  try {
    const response = await apiClient.post("/", company);
    return response.data;
  } catch (error) {
    console.error("Error creating company:", error);
    return null;
  }
}

/**
 * Update an existing company
 */
export async function updateCompany(company_id: string, companyUpdate: { name: string }): Promise<Company | null> {
  try {
    const response = await apiClient.put(`/${company_id}`, companyUpdate);
    return response.data;
  } catch (error) {
    console.error("Error updating company:", error);
    return null;
  }
}

/**
 * Delete a company
 */
export async function deleteCompany(company_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${company_id}`);
    return true;
  } catch (error) {
    console.error("Error deleting company:", error);
    return false;
  }
}
