import axios from "axios";
import { Ingredient } from "@/lib/types/ingredient";
import { Nutrition } from "@/lib/types/nutrition";
import { Product } from "@/lib/types/product";

const API_BASE_URL = process.env.INGREDIENTS_API_URL || "http://localhost:8010/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/ingredients`,
  withCredentials: true,
});

export async function fetchIngredients(page: number = 1, limit: number = 10): Promise<{ ingredients: Ingredient[], total: number }> {
  try {
    const response = await apiClient.get<{ ingredients: Ingredient[], total: number }>(
      `/?skip=${(page - 1) * limit}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return { ingredients: [], total: 0 };
  }
}

export async function createIngredient(ingredient: { name: string; default_unit: string; calories_per_100g?: number }): Promise<Ingredient | null> {
  try {
    const response = await apiClient.post("/", ingredient);
    return response.data;
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return null;
  }
}

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
  } catch (error: any) {
      if (error.response) {
          // Server responded with a status code other than 2xx
          console.error(`API Error (${error.response.status}) fetching nutrition for ingredient ${ingredient_id}:`, error.response.data);
      } else if (error.request) {
          // Request was made but no response received
          console.error(`Network Error: No response received while fetching nutrition for ingredient ${ingredient_id}.`);
      } else {
          // Something else happened
          console.error(`Unexpected Error fetching nutrition for ingredient ${ingredient_id}:`, error.message);
      }
      return []; // ✅ Always return an empty array to prevent frontend crashes
  }
}


/** 
 * Link a single product to an ingredient when "Add" is clicked 
 */
export async function linkIngredientToProduct(
  ingredientId: string,
  name: string
): Promise<boolean> {
  try {
    await apiClient.post(
      `/${ingredientId}/link-product/${name}`
    );
    return true
  } catch (error) {
    console.error("Error linking ingredient to product:", error);
    return false;
  }
}

/** 
 * Link a single nutrition to an ingredient when "Add" is clicked 
 */
export async function linkIngredientToNutrition(ingredient_id: string, name: string): Promise<boolean> {
  try {
      await apiClient.post(`/${ingredient_id}/link-nutrition/${name}`); // ✅ Send name
      return true;
  } catch (error) {
      console.error("Error linking ingredient to nutrition:", error);
      return false;
  }
}


export async function getNutritionsLinked(ingredient_id: string): Promise<string[]> {
  try {
    const response = await apiClient.get<string[]>(`/${ingredient_id}/linked-nutritions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching linked nutritions:", error);
    return [];
  }
}