import axios from "axios";
import { ListRecipe, RecipeCreate, TagRetrieval } from "@/lib/types/recipe";
import { Ingredient } from "@/lib/types/ingredient";

const API_BASE_URL = process.env.RECIPES_API_URL || "http://localhost:8020/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Fetch a recipe by its ID.
export async function fetchRecipeById(recipe_id: string): Promise<RecipeCreate | null> {
  try {
    const response = await apiClient.get<RecipeCreate>(`/recipes/recipe-id/${recipe_id}/`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching recipe:", error.response?.data || error.message);
    return null;
  }
}

// Fetch recipes by author. The returned recipe objects now include an "in_cauldron" boolean.
export async function fetchRecipesByAuthorID(
  author_id: string,
  skip: number = 0,
  limit: number = 10
): Promise<{ recipes: ListRecipe[]; total: number }> {
  try {
    const response = await apiClient.get<{ recipes: ListRecipe[]; total: number }>(
      `/recipes/author-id/${author_id}/?skip=${skip}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return { recipes: [], total: 0 };
  }
}

// Create a new recipe. The response returns a ListRecipe which now includes in_cauldron.
export async function createRecipe(recipe: RecipeCreate): Promise<ListRecipe | null> {
  try {
    const response = await apiClient.post("/recipes/", recipe);
    return response.data as ListRecipe;
  } catch (error: any) {
    console.error("Error creating recipe:", error.response?.data || error.message);
    return null;
  }
}

// Update an existing recipe. The updated recipe object includes in_cauldron.
export async function updateRecipe(recipe_id: string, recipe: RecipeCreate): Promise<ListRecipe | null> {
  try {
    const response = await apiClient.put(`/recipes/update/${recipe_id}/`, recipe);
    return response.data as ListRecipe;
  } catch (error: any) {
    console.error("Error updating recipe:", error.response?.data || error.message);
    return null;
  }
}

// Delete a recipe.
export async function deleteRecipe(recipe_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/recipes/delete/${recipe_id}/`);
    return true;
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return false;
  }
}

// Fetch a single ingredient by ID.
export async function fetchIngredientById(ingredient_id: string): Promise<Ingredient | null> {
  try {
    const response = await apiClient.get<Ingredient>(`/ingredients/${ingredient_id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    return null;
  }
}

// Fetch ingredients by name.
export async function fetchIngredientsByName(query: string): Promise<Ingredient[]> {
  if (query.length < 3) return [];
  try {
    const response = await apiClient.get<Ingredient[]>(`/ingredients/by-name/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    return [];
  }
}

// Fetch tags by name.
export async function fetchTagsByName(query: string): Promise<TagRetrieval[]> {
  if (query.length < 3) return [];
  try {
    const response = await apiClient.get<TagRetrieval[]>(`/tags/by-name/?search=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}
