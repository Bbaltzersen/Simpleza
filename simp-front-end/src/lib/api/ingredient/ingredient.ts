import axios from "axios";
import { Ingredient } from "@/lib/types/ingredient";

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
