import axios from "axios";
import { Product, ProductCreate } from "@/lib/types/product";
import { Company } from "@/lib/types/company";

const API_BASE_URL = process.env.INGREDIENTS_API_URL || "http://localhost:8010/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/products`, // Corrected base URL for products
  withCredentials: true,
});

export type ProductCompanyDetail = {
    company_id: any;
    company_name: string; // The name of the company
    price: number; // The price of the product in this company
  };
  
/**
 * Fetch all products with pagination
 */
export const fetchProducts = async (
  page: number = 1, 
  limit: number = 10
): Promise<{ products: Product[]; total: number }> => {
  try {
    const safePage = Math.max(1, page); // ✅ Ensure `page` is at least 1
    const skip = (safePage - 1) * limit; // ✅ Correct pagination calculation

    const response = await apiClient.get(`/?skip=${skip}&limit=${limit}`);

    if (!response.data || typeof response.data !== "object") {
      console.error("Unexpected response structure:", response);
      return { products: [], total: 0 };
    }

    const productsArray = Array.isArray(response.data.products)
      ? response.data.products.map((product: any) => ({
          product_id: product.product_id,
          retail_id: product.retail_id ?? null,
          src_product_id: product.src_product_id ?? null,
          english_name: product.english_name,
          spanish_name: product.spanish_name,
          amount: product.amount ?? 1,
          weight: product.weight ?? 0,
          measurement: product.measurement || "",
          companies: Array.isArray(product.companies)
            ? product.companies.map((company: any) => ({
                company_id: company.company_id,
                company_name: company.company_name,
                price: company.price ?? 0,
              }))
            : [],
        }))
      : [];

    return {
      products: productsArray,
      total: typeof response.data.total === "number" ? response.data.total : 0,
    };
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
  } catch (error: any) {
      if (error.response) {
          // Server responded with a status code other than 2xx
          console.error(`API Error (${error.response.status}) fetching companies for product ${product_id}:`, error.response.data);
      } else if (error.request) {
          // Request was made but no response received
          console.error(`Network Error: No response received while fetching companies for product ${product_id}.`);
      } else {
          // Something else happened
          console.error(`Unexpected Error fetching companies for product ${product_id}:`, error.message);
      }
      return []; // ✅ Always return an empty array to prevent frontend crashes
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
export async function updateProduct(productId: string, productData: Partial<Product>): Promise<Product | null> {
  try {
    const response = await apiClient.put(`/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    return null;
  }
}

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


///v1/products/{product_id}/link-company
export async function linkProductToCompany(product_id: string, companyName: string): Promise<boolean> {
  try {
    // Note the corrected endpoint path: "link-company" instead of "link-nutrition"
    await apiClient.post(`/${product_id}/link-company/${encodeURIComponent(companyName)}`);
    return true;
  } catch (error) {
    console.error("Error linking product to company:", error);
    return false;
  }
}

export async function getProductByRetailId(retailId: string): Promise<Product | null> {
  if (!retailId.trim()) {
    console.error("Retail ID cannot be empty.");
    return null;
  }

  try {
    const response = await apiClient.get<Product>(`/retail/${encodeURIComponent(retailId)}`);
    return response.data || null;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log(`Product with retail ID "${retailId}" not found.`);
    } else {
      console.error(`Error fetching product by retail ID (${retailId}):`, error);
    }
    return null;
  }
}

