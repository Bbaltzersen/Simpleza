// src/lib/api/product.ts
import axios from "axios";
import {
    Product,
    ProductCreatePayload,
    ProductUpdatePayload,
    ProductCompanyLinkDetail // Use the specific type for company links
} from "@/lib/types/product"; // Adjust path as needed

// --- Configuration ---
// Base URL part before the specific resource path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";
// Full path prefix for the admin products endpoint
const RESOURCE_PREFIX = "/v1/admin/products";

// Axios instance configured for Product Admin API
const productApiClient = axios.create({
  baseURL: `${API_BASE_URL}${RESOURCE_PREFIX}`, // e.g., http://localhost:8010/v1/admin/products
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Functions ---

/**
 * Fetch products with pagination.
 * GET /v1/admin/products/
 */
export const fetchProducts = async (
  page: number = 1,
  limit: number = 10
): Promise<{ products: Product[]; total: number }> => {
  try {
    const skip = Math.max(0, (page - 1) * limit);
    // Rely on Axios to parse JSON and Pydantic model on backend for structure
    const response = await productApiClient.get<{ products: Product[]; total: number }>(
      `/?skip=${skip}&limit=${limit}`
    );
    // Basic validation of response structure
    if (!response.data || typeof response.data.total !== 'number' || !Array.isArray(response.data.products)) {
         console.error("fetchProducts: Invalid response data structure", response.data);
         return { products: [], total: 0 };
    }
    return response.data;
  } catch (error) {
    console.error("API Error fetching products:", error);
    return { products: [], total: 0 };
  }
};

/**
 * Fetch a single product by its primary ID (UUID).
 * GET /v1/admin/products/{product_id}
 */
export const fetchProductById = async (productId: string): Promise<Product | null> => {
  if (!productId) return null;
  try {
    const response = await productApiClient.get<Product>(`/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`API Error fetching product ${productId}:`, error);
    // Optionally check for 404 status: if (axios.isAxiosError(error) && error.response?.status === 404) ...
    return null;
  }
};

/**
 * Fetch companies linked to a specific product.
 * GET /v1/admin/products/{product_id}/companies
 */
export async function fetchProductCompanies(product_id: string): Promise<ProductCompanyLinkDetail[]> {
  if (!product_id) return [];
  try {
      // Expects backend to return List[ProductCompanyOut] matching ProductCompanyLinkDetail
      const response = await productApiClient.get<ProductCompanyLinkDetail[]>(`/${product_id}/companies`);
      return response.data || [];
  } catch (error: any) {
      console.error(`API Error fetching companies for product ${product_id}:`, error.response?.data || error.message);
      return []; // Return empty array on error
  }
}

/**
 * Create a new product.
 * POST /v1/admin/products/
 */
export const createProduct = async (payload: ProductCreatePayload): Promise<Product | null> => {
  try {
    // Payload matches ProductCreate schema
    const response = await productApiClient.post<Product>("/", payload);
    // Expects ProductOut structure back
    return response.data;
  } catch (error) {
    console.error("API Error creating product:", error);
     // TODO: Handle specific errors (e.g., 409 Conflict)
    return null;
  }
};

/**
 * Update an existing product.
 * PUT /v1/admin/products/{product_id}
 */
export async function updateProduct(productId: string, payload: ProductUpdatePayload): Promise<Product | null> {
  if (!productId) return null;
  try {
    // Use ProductUpdatePayload for partial updates
    const response = await productApiClient.put<Product>(`/${productId}`, payload);
    // Expects ProductOut structure back
    return response.data;
  } catch (error) {
    console.error(`API Error updating product ${productId}:`, error);
     // TODO: Handle specific errors (e.g., 404)
    return null;
  }
}

/**
 * Delete a product by ID.
 * DELETE /v1/admin/products/{product_id}
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  if (!productId) return false;
  try {
    await productApiClient.delete(`/${productId}`); // Expects 204 No Content
    return true;
  } catch (error) {
    console.error(`API Error deleting product ${productId}:`, error);
    return false;
  }
};

/**
 * Link a company to a product by company name, optionally setting a price.
 * POST /v1/admin/products/{product_id}/link-company/{company_name}?price=...
 */
export async function linkProductToCompany(
    product_id: string,
    companyName: string,
    price?: number | null // Price is optional
): Promise<ProductCompanyLinkDetail | null> { // Return details of the created link
  if (!product_id || !companyName) return null;
  try {
    const params = new URLSearchParams();
    if (price !== undefined && price !== null) {
      params.append('price', price.toString());
    }
    const queryString = params.toString();
    const url = `/${product_id}/link-company/${encodeURIComponent(companyName)}${queryString ? `?${queryString}` : ''}`;

    // Expects ProductCompanyOut structure back
    const response = await productApiClient.post<ProductCompanyLinkDetail>(url);
    return response.data;
  } catch (error) {
    console.error(`API Error linking company ${companyName} to product ${product_id}:`, error);
     // TODO: Handle specific errors (e.g., 404, 409)
    return null;
  }
}

/**
 * Detach a company from a product.
 * DELETE /v1/admin/products/{product_id}/detach-company/{company_id}
 */
export async function detachProductFromCompany(product_id: string, company_id: string): Promise<boolean> {
    if (!product_id || !company_id) return false;
    try {
        await productApiClient.delete(`/${product_id}/detach-company/${company_id}`); // Expects 204 No Content
        return true;
    } catch (error) {
        console.error(`API Error detaching company ${company_id} from product ${product_id}:`, error);
        // TODO: Handle specific errors (e.g., 404)
        return false;
    }
}


/**
 * Fetch a product by its Retail ID.
 * GET /v1/admin/products/by-retail-id/{retail_id}
 */
export async function getProductByRetailId(retailId: string): Promise<Product | null> {
  if (!retailId?.trim()) { // Added check for empty/whitespace string
    console.warn("getProductByRetailId: Retail ID cannot be empty.");
    return null;
  }
  try {
    // Use updated path
    const response = await productApiClient.get<Product>(`/by-retail-id/${encodeURIComponent(retailId)}`);
    return response.data || null;
  } catch (error: any) {
    // More specific 404 check
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`Product with retail ID "${retailId}" not found.`);
    } else {
      console.error(`API Error fetching product by retail ID (${retailId}):`, error);
    }
    return null;
  }
}