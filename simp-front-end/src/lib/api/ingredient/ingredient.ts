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

export async function updateIngredient(ingredient_id: string, ingredient: { name: string; default_unit: string; calories_per_100g?: number }): Promise<Ingredient | null> {
  try {
    const response = await apiClient.put(`/${ingredient_id}`, ingredient);
    return response.data;
  } catch (error) {
    console.error("Error updating ingredient:", error);
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
export async function linkIngredientToNutrition(ingredient_id: string, name: string): Promise<boolean> {
  try {
    await apiClient.post(`/${ingredient_id}/link-nutrition/${name}`);
    return true;
  } catch (error) {
    console.error("Error linking ingredient to nutrition:", error);
    return false;
  }
}

export async function detachNutrition(ingredient_id: string, nutrition_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${ingredient_id}/detach-nutrition/${nutrition_id}`);
    return true;
  } catch (error) {
    console.error("Error detaching nutrition:", error);
    return false;
  }
}

export async function detachProduct(ingredient_id: string, product_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${ingredient_id}/detach-product/${product_id}`);
    return true;
  } catch (error) {
    console.error("Error detaching product:", error);
    return false;
  }
}
