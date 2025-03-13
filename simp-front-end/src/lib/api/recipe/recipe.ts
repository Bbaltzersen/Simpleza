import axios from "axios";
import { Recipe, RecipeCreate } from "@/lib/types/recipe"; // Ensure you have a correct Recipe type
import { Ingredient } from "@/lib/types/ingredient";
import { RecipeRetrieve } from "@/lib/types/recipe"

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

export async function handleSaveRecipe(recipe: RecipeCreate): Promise<Recipe | null> {
  const formattedRecipe: RecipeCreate = {
    ...recipe,
    tags: Array.isArray(recipe.tags) ? recipe.tags.map(tag => (typeof tag === "string" ? tag : (tag as { tag_id: string }).tag_id)) : [], // ✅ Explicitly type `tags`
    ingredients: recipe.ingredients.map(ing => ({
      id: ing.id || `${Date.now()}`,
      ingredient_name: ing.ingredient_name,
      amount: ing.amount,
      measurement: ing.measurement,
    })),
    steps: recipe.steps.map(step => ({
      id: step.id || `${Date.now()}`,
      step_number: step.step_number,
      description: step.description,
    })),
    images: recipe.images.map(img => ({
      id: img.id || `${Date.now()}`,
      image_url: img.image_url,
    })),
  };

  return createRecipe(formattedRecipe);
}

export async function fetchRecipeById(recipeId: string): Promise<RecipeRetrieve | null> {
  try {
    const response = await apiClient.get<RecipeRetrieve>(`/${recipeId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}