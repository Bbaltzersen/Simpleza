import axios from "axios";
import { Ingredient } from "@/lib/types/ingredient";
import { RecipeIngredient } from "@/lib/types/recipe";

const API_BASE_URL = process.env.RECIPES_API_URL || "http://localhost:8020/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/ingredients`,
  withCredentials: true, // Ensures cookies (auth_token) and CSRF token are sent
});


/**
 * Fetch an ingredient by ID
 */
export async function fetchIngredientById(ingredient_id: string): Promise<Ingredient | null> {
  try {
    const response = await apiClient.get<Ingredient>(`/ingredients/${ingredient_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    return null;
  }
}

/**
 * Fetch ingredients based on name (search query)
 */
export async function fetchIngredientsByName(query: string): Promise<Ingredient[]> {
  if (query.length < 3) return []; // Avoid unnecessary API calls for short queries

  try {
    const response = await apiClient.get<Ingredient[]>(`/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
}

export async function fetchRecipeIngredientByName(query: string): Promise<RecipeIngredient[]> {
  if (query.length < 3) return []; // Avoid unnecessary API calls for short queries

  try {
    const response = await apiClient.get<RecipeIngredient[]>(`/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
}
