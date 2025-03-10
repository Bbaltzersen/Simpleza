import axios from "axios";
import { Recipe, RecipeCreate } from "@/lib/types/recipe"; // Ensure you have a correct Recipe type

const API_BASE_URL = process.env.RECIPES_API_URL || "http://localhost:8020/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/recipes`,
  withCredentials: true, // Ensures cookies (auth_token) and CSRF token are sent
});

/**
 * Fetch paginated recipes
 */
export async function fetchRecipes(): Promise<Recipe[]> {
  try {
    const response = await apiClient.get<Recipe[]>("/");
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

/**
 * Fetch a single recipe by ID
 */
export async function fetchRecipeById(recipe_id: string): Promise<Recipe | null> {
  try {
    const response = await apiClient.get(`/${recipe_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

/**
 * Create a new recipe
 */
export async function createRecipe(recipe: RecipeCreate): Promise<Recipe | null> {
  try {
    const response = await apiClient.post("/", recipe);
    return response.data;
  } catch (error) {
    console.error("Error creating recipe:", error);
    return null;
  }
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(recipe_id: string, recipeUpdate: Partial<Recipe>): Promise<Recipe | null> {
  try {
    const response = await apiClient.put(`/${recipe_id}`, recipeUpdate);
    return response.data;
  } catch (error) {
    console.error("Error updating recipe:", error);
    return null;
  }
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipe_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${recipe_id}`);
    return true;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return false;
  }
}
