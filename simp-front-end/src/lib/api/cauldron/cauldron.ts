import axios from "axios";
import {
  Cauldron,
  CauldronCreate,
  CauldronUpdate,
  CauldronData,
  CauldronDataCreate,
  CauldronDataUpdate,
  CauldronRecipe,
} from "@/lib/types/cauldron";

const API_BASE_URL = process.env.RECIPES_API_URL || "http://localhost:8020/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Create a new cauldron record (to add a recipe to the user's cauldron)
export async function createCauldron(
  data: CauldronCreate
): Promise<Cauldron> {
  const response = await apiClient.post<Cauldron>("/cauldrons", data);
  return response.data;
}

// Update an existing cauldron record
export async function updateCauldron(
  cauldronId: string,
  data: CauldronUpdate
): Promise<Cauldron> {
  const response = await apiClient.put<Cauldron>(`/cauldrons/${cauldronId}`, data);
  return response.data;
}

// Delete a cauldron record by its ID (to remove a recipe from the user's cauldron)
export async function deleteCauldron(
  cauldronId: string
): Promise<{ detail: string }> {
  const response = await apiClient.delete<{ detail: string }>(`/cauldrons/${cauldronId}`);
  return response.data;
}

// Retrieve paginated cauldron records for a specific user
export async function getCauldronsByUser(
  userId: string,
  skip = 0,
  limit = 10
): Promise<{ cauldrons: Cauldron[]; total: number }> {
  const response = await apiClient.get<{ cauldrons: Cauldron[]; total: number }>(`/cauldrons/user/${userId}`, {
    params: { skip, limit },
  });
  return response.data;
}

// Retrieve paginated cauldron recipes (combined cauldron and recipe data) for a specific user
export async function getCauldronRecipes(
  userId: string,
  skip = 0,
  limit = 10
): Promise<{ cauldron_recipes: CauldronRecipe[]; total_cauldron_recipes: number }> {
  const response = await apiClient.get<{
    cauldron_recipes: CauldronRecipe[];
    total_cauldron_recipes: number;
  }>(`/cauldrons/recipes`, {
    params: { user_id: userId, skip, limit },
  });
  return response.data;
}

// Delete a cauldron record by user id and recipe id.
// This endpoint finds the cauldron entry based on the user and recipe IDs.
export async function deleteCauldronByUserAndRecipe(
  userId: string,
  recipeId: string
): Promise<{ detail: string }> {
  const response = await apiClient.delete<{ detail: string }>(`/cauldrons/user/${userId}/recipe/${recipeId}`);
  return response.data;
}

// Optionally, you can add similar API calls for CauldronData if needed.
