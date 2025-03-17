import axios from "axios";
import { Ingredient } from "@/lib/types/ingredient";
import { Nutrition } from "@/lib/types/nutrition";
import { Product } from "@/lib/types/product";

const API_BASE_URL = process.env.INGREDIENTS_API_URL || "http://localhost:8010/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/ingredients`,
  withCredentials: true,
});

/** 
 * Fetch ingredients with pagination 
 */
export async function fetchIngredients(skip: number = 0, limit: number = 10): Promise<{ ingredients: Ingredient[], total: number }> {
  try {
    const response = await apiClient.get<{ ingredients: Ingredient[], total: number }>(
      `/?skip=${skip}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return { ingredients: [], total: 0 };
  }
}

/** 
 * Create a new ingredient 
 */
export async function createIngredient({
  name,
  default_unit = "g",
  calories_per_100g,
  validated = false, 
  diet_level = 4, // ✅ Ensure default value
}: {
  name: string;
  default_unit?: string;
  calories_per_100g?: number;
  validated?: boolean;
  diet_level?: number;
}): Promise<Ingredient | null> {
  try {
    const response = await apiClient.post("/", {
      name,
      default_unit,
      calories_per_100g,
      validated,
      diet_level,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return null;
  }
}

/** 
 * Update an ingredient (supports partial updates)
 */
export async function updateIngredient(ingredient_id: string, ingredient: Partial<Ingredient>): Promise<Ingredient | null> {
  try {
    const response = await apiClient.put(`/${ingredient_id}`, ingredient);
    return response.data;
  } catch (error) {
    console.error("Error updating ingredient:", error);
    return null;
  }
}

/** 
 * Delete an ingredient by ID
 */
export async function deleteIngredient(ingredient_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${ingredient_id}`);
    return true;
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return false;
  }
}

/** 
 * Fetch products linked to a specific ingredient 
 */
export async function fetchIngredientProducts(ingredient_id: string): Promise<Product[]> {
  try {
    const response = await apiClient.get<Product[]>(`/${ingredient_id}/products`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredient products:", error);
    return [];
  }
}

/** 
 * Fetch nutrition linked to a specific ingredient 
 */
export async function fetchIngredientNutritions(ingredient_id: string): Promise<Nutrition[]> {
  try {
    const response = await apiClient.get<Nutrition[]>(`/${ingredient_id}/nutritions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredient nutritions:", error);
    return [];
  }
}

/** 
 * Link a single product to an ingredient 
 */
export async function linkIngredientToProduct(ingredientId: string, productId: string): Promise<boolean> {
  try {
    await apiClient.post(`/${ingredientId}/link-product/${productId}`);
    return true;
  } catch (error) {
    console.error("Error linking ingredient to product:", error);
    return false;
  }
}

/** 
 * Link a single nutrition to an ingredient 
 */
export async function linkIngredientToNutrition(ingredient_id: string, nutrition_id: string): Promise<boolean> {
  try {
    await apiClient.post("/link-nutrition", { ingredient_id, nutrition_id });
    return true;
  } catch (error) {
    console.error("Error linking ingredient to nutrition:", error);
    return false;
  }
}

/** 
 * Detach a nutrition from an ingredient 
 */
export async function detachNutrition(ingredient_id: string, nutrition_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${ingredient_id}/detach-nutrition/${nutrition_id}`);
    return true;
  } catch (error) {
    console.error("Error detaching nutrition:", error);
    return false;
  }
}

/** 
 * Detach a product from an ingredient 
 */
export async function detachProduct(ingredient_id: string, product_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${ingredient_id}/detach-product/${product_id}`);
    return true;
  } catch (error) {
    console.error("Error detaching product:", error);
    return false;
  }
}
