import axios from "axios";
import { Nutrition } from "@/lib/types/nutrition";

const API_BASE_URL = process.env.INGREDIENTS_API_URL || "http://localhost:8010/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/nutritions`,
  withCredentials: true,
});

export async function fetchNutritions(page: number = 1, limit: number = 10): Promise<{ nutritions: Nutrition[], total: number }> {
  try {
    const response = await apiClient.get<{ nutritions: Nutrition[], total: number }>(
      `/?skip=${(page - 1) * limit}&limit=${limit}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching nutritions:", error);
    return { nutritions: [], total: 0 };
  }
}

export async function createNutrition(nutrition: { name: string; measurement: string; recommended?: number }): Promise<Nutrition | null> {
  try {
    const response = await apiClient.post("/", nutrition);
    return response.data;
  } catch (error) {
    console.error("Error creating nutrition:", error);
    return null;
  }
}

export async function updateNutrition(
  nutrition_id: string,
  nutrition: { name: string; measurement: string; recommended?: number }
): Promise<Nutrition | null> {
  try {
    const response = await apiClient.put<Nutrition>(`/${nutrition_id}`, nutrition);
    return response.data;
  } catch (error) {
    console.error(`Error updating nutrition (${nutrition_id}):`, error);
    return null;
  }
}

export async function deleteNutrition(nutrition_id: string): Promise<boolean> {
  try {
    await apiClient.delete(`/${nutrition_id}`);
    return true;
  } catch (error) {
    console.error("Error deleting nutrition:", error);
    return false;
  }
}

export async function getNutritionByName(name: string): Promise<Nutrition | null> {
  try {
    const response = await apiClient.get<Nutrition | null>(`/retrieve/${name}`);
    return response.data || null;
  } catch (error) {
    console.error(`Error fetching nutrition by name (${name}):`, error);
    return null;
  }
}
