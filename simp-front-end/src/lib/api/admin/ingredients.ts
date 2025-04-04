// src/lib/api/ingredient.ts
import axios from "axios"; // Import axios
import {
    Ingredient,
    IngredientCreatePayload,
    IngredientUpdatePayload,
    NutritionLinkPayload // Make sure this is imported
} from "@/lib/types/ingredient"; // Adjust path as needed
import { Nutrition } from "@/lib/types/nutrition"; // Adjust path as needed
import { Product } from "@/lib/types/product"; // Adjust path as needed

// --- Configuration based on user's pattern ---

// 1. Define API_BASE_URL ending with /v1 (or get from env var)
//    Use NEXT_PUBLIC_ prefix if using Next.js for browser access
const API_BASE_URL = process.env.NEXT_PUBLIC_API_V1_URL || "http://localhost:8010/v1";

// 2. Create Axios instance specific to the admin ingredients endpoint
//    Append the correct path part '/admin/ingredients'
const ingredientApiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin/ingredients`, // Correct full path prefix
  withCredentials: true, // Send cookies if needed for authentication
  headers: {
    'Content-Type': 'application/json',
     // Auth headers would typically be added via interceptors on a base client
     // or passed dynamically if using a different auth method.
  },
});

// --- API Functions ---

/**
 * Fetch ingredients with pagination.
 * GET /v1/admin/ingredients/
 */
export async function fetchIngredients(skip: number = 0, limit: number = 10): Promise<{ ingredients: Ingredient[], total: number }> {
  try {
    // Use relative path from the baseURL defined above
    const response = await ingredientApiClient.get<{ ingredients: Ingredient[], total: number }>(
      `/?skip=${skip}&limit=${limit}`
    );
    console.log("Response data:", response.data); // Debugging line
    return response.data;
  } catch (error) {
    console.error("API Error fetching ingredients:", error);
    return { ingredients: [], total: 0 };
  }
}

/**
 * Create a new ingredient.
 * POST /v1/admin/ingredients/
 */
export async function createIngredient(payload: IngredientCreatePayload): Promise<Ingredient | null> {
  try {
    // Use relative path "/"
    const response = await ingredientApiClient.post<Ingredient>("/", payload);
    return response.data;
  } catch (error) {
    console.error("API Error creating ingredient:", error);
    return null;
  }
}

/**
 * Update an ingredient (supports partial updates).
 * PUT /v1/admin/ingredients/{ingredient_id}
 * IMPORTANT: Assumes backend endpoint handles partial updates via IngredientUpdatePayload.
 */
export async function updateIngredient(ingredient_id: string, payload: IngredientUpdatePayload): Promise<Ingredient | null> {
  try {
     // Use relative path "/{id}"
    const response = await ingredientApiClient.put<Ingredient>(`/${ingredient_id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`API Error updating ingredient ${ingredient_id}:`, error);
    return null;
  }
}

/**
 * Delete an ingredient by ID.
 * DELETE /v1/admin/ingredients/{ingredient_id}
 */
export async function deleteIngredient(ingredient_id: string): Promise<boolean> {
  try {
    // Use relative path "/{id}"
    await ingredientApiClient.delete(`/${ingredient_id}`);
    return true;
  } catch (error) {
    console.error(`API Error deleting ingredient ${ingredient_id}:`, error);
    return false;
  }
}

/**
 * Fetch products linked to a specific ingredient.
 * GET /v1/admin/ingredients/{ingredient_id}/products
 */
export async function fetchIngredientProducts(ingredient_id: string): Promise<Product[]> {
  try {
    // Use relative path "/{id}/products"
    const response = await ingredientApiClient.get<Product[]>(`/${ingredient_id}/products`);
    return response.data;
  } catch (error) {
    console.error(`API Error fetching products for ingredient ${ingredient_id}:`, error);
    return [];
  }
}

/**
 * Fetch nutrition information linked to a specific ingredient.
 * GET /v1/admin/ingredients/{ingredient_id}/nutritions
 */
export async function fetchIngredientNutritions(ingredient_id: string): Promise<Nutrition[]> {
  try {
    // Use relative path "/{id}/nutritions"
    const response = await ingredientApiClient.get<Nutrition[]>(`/${ingredient_id}/nutritions`);
    return response.data;
  } catch (error) {
    console.error(`API Error fetching nutritions for ingredient ${ingredient_id}:`, error);
    return [];
  }
}

/**
 * Link a single product to an ingredient.
 * POST /v1/admin/ingredients/{ingredient_id}/link-product/{product_id}
 */
export async function linkIngredientToProduct(ingredientId: string, productId: string): Promise<boolean> {
  try {
     // Use relative path "/{id}/link-product/{id}"
    await ingredientApiClient.post(`/${ingredientId}/link-product/${productId}`);
    return true;
  } catch (error) {
    console.error(`API Error linking product ${productId} to ingredient ${ingredientId}:`, error);
    return false;
  }
}

/**
 * Link a single nutrition to an ingredient.
 * POST /v1/admin/ingredients/link-nutrition
 * NOTE: The corresponding backend endpoint logic needs review regarding IngredientNutritionValue requiring an amount.
 */
export async function linkIngredientToNutrition(payload: NutritionLinkPayload): Promise<boolean> {
  try {
     // Use relative path "/link-nutrition"
    await ingredientApiClient.post(`/link-nutrition`, payload);
    return true;
  } catch (error) {
    console.error(`API Error linking nutrition ${payload.nutrition_id} to ingredient ${payload.ingredient_id}:`, error);
    return false;
  }
}

/**
 * Detach a nutrition value from an ingredient.
 * DELETE /v1/admin/ingredients/{ingredient_id}/detach-nutrition/{nutrition_id}
 */
export async function detachNutrition(ingredient_id: string, nutrition_id: string): Promise<boolean> {
  try {
    // Use relative path "/{id}/detach-nutrition/{id}"
    await ingredientApiClient.delete(`/${ingredient_id}/detach-nutrition/${nutrition_id}`);
    return true;
  } catch (error) {
    console.error(`API Error detaching nutrition ${nutrition_id} from ingredient ${ingredient_id}:`, error);
    return false;
  }
}

/**
 * Detach a product from an ingredient.
 * DELETE /v1/admin/ingredients/{ingredient_id}/detach-product/{product_id}
 */
export async function detachProduct(ingredient_id: string, product_id: string): Promise<boolean> {
  try {
     // Use relative path "/{id}/detach-product/{id}"
    await ingredientApiClient.delete(`/${ingredient_id}/detach-product/${product_id}`);
    return true;
  } catch (error) {
    console.error(`API Error detaching product ${product_id} from ingredient ${ingredient_id}:`, error);
    return false;
  }
}