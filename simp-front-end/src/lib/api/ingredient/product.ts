import axios from "axios";
import { Product, ProductCreate } from "@/lib/types/product";

const API_BASE_URL = process.env.INGREDIENTS_API_URL || "http://localhost:8010/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/products`, // Corrected base URL for products
  withCredentials: true,
});

export type ProductCompanyDetail = {
    company_name: string; // The name of the company
    price: number; // The price of the product in this company
  };
  
/**
 * Fetch all products with pagination
 */
export const fetchProducts = async (page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get<{ products: Product[]; total: number }>(
      `?skip=${(page - 1) * limit}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return { products: [], total: 0 };
  }
};

/**
 * Fetch a single product by ID
 */
export const fetchProductById = async (productId: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get<Product>(`/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    return null;
  }
};


export async function fetchProductCompanies(product_id: string): Promise<ProductCompanyDetail[]> {
    try {
      const response = await apiClient.get<ProductCompanyDetail[]>(`/${product_id}/companies`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching companies for product ${product_id}:`, error);
      return [];
    }
  }

/**
 * Create a new product
 */
export const createProduct = async (product: ProductCreate): Promise<Product | null> => {
  try {
    const response = await apiClient.post<Product>("", product);
    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId: string, product: ProductCreate): Promise<Product | null> => {
  try {
    const response = await apiClient.put<Product>(`/${productId}`, product);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    return null;
  }
};

/**
 * Delete a product by ID
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/${productId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    return false;
  }
};
