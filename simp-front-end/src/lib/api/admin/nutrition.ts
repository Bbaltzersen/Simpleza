// src/lib/api/nutrition.ts
import axios from "axios";
import {
    Nutrition,
    NutritionCreatePayload, // Use the detailed payload type
    NutritionUpdatePayload  // Use the detailed payload type
} from "@/lib/types/nutrition"; // Adjust path as needed

// --- Configuration ---
// Base URL part before the specific resource path
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010";
// Full path prefix for the admin nutritions endpoint
const RESOURCE_PREFIX = "/v1/admin/nutritions";

// Axios instance configured for Nutrition Admin API
const nutritionApiClient = axios.create({
  baseURL: `${API_BASE_URL}${RESOURCE_PREFIX}`, // e.g., http://localhost:8010/v1/admin/nutritions
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- API Functions ---

/**
 * Fetch nutritions with pagination.
 * GET /v1/admin/nutritions/
 */
export async function fetchNutritions(page: number = 1, limit: number = 10): Promise<{ nutritions: Nutrition[], total: number }> {
  try {
    const skip = Math.max(0, (page - 1) * limit);
    // Backend returns { nutritions: NutritionOut[], total: number }
    const response = await nutritionApiClient.get<{ nutritions: Nutrition[], total: number }>(
      `/?skip=${skip}&limit=${limit}`
    );
     // Basic validation of response structure
     if (!response.data || typeof response.data.total !== 'number' || !Array.isArray(response.data.nutritions)) {
        console.error("fetchNutritions: Invalid response data structure", response.data);
        return { nutritions: [], total: 0 };
   }
    // Frontend Nutrition type should match NutritionOut
    return response.data;
  } catch (error) {
    console.error("API Error fetching nutritions:", error);
    return { nutritions: [], total: 0 };
  }
}

/**
 * Fetch a single nutrition by its ID (UUID).
 * GET /v1/admin/nutritions/{nutrient_id}
 */
export async function getNutritionById(nutrient_id: string): Promise<Nutrition | null> {
    if (!nutrient_id) return null;
    try {
        // Use nutrient_id in the path as expected by backend
        const response = await nutritionApiClient.get<Nutrition>(`/${nutrient_id}`);
        return response.data;
    } catch (error) {
        console.error(`API Error fetching nutrition ${nutrient_id}:`, error);
        return null;
    }
}


/**
 * Fetch a single nutrition by its Name.
 * GET /v1/admin/nutritions/by-name/{name}
 */
export async function getNutritionByName(name: string): Promise<Nutrition | null> {
  if (!name?.trim()) {
      console.warn("getNutritionByName: Name cannot be empty.");
      return null;
  }
  try {
    // Use the correct path and encode the name
    const response = await nutritionApiClient.get<Nutrition>(`/by-name/${encodeURIComponent(name)}`);
    return response.data || null; // API might return empty body on 404 depending on framework
  } catch (error: any) {
     if (axios.isAxiosError(error) && error.response?.status === 404) {
         console.log(`Nutrition with name "${name}" not found.`);
     } else {
         console.error(`API Error fetching nutrition by name (${name}):`, error);
     }
    return null;
  }
}


/**
 * Create a new nutrition.
 * POST /v1/admin/nutritions/
 */
export async function createNutrition(payload: NutritionCreatePayload): Promise<Nutrition | null> {
  try {
    // Use the detailed NutritionCreatePayload type
    // Ensure payload includes required fields: name, storage_unit, category
    const response = await nutritionApiClient.post<Nutrition>("/", payload);
    // Expects NutritionOut structure back
    return response.data;
  } catch (error) {
    console.error("API Error creating nutrition:", error);
     // TODO: Handle specific errors (e.g., 409 Conflict)
    return null;
  }
}

/**
 * Update an existing nutrition (partial updates).
 * PUT /v1/admin/nutritions/{nutrient_id}
 */
export async function updateNutrition(
  nutrient_id: string, // Use nutrient_id to match backend param
  payload: NutritionUpdatePayload // Use the detailed NutritionUpdatePayload type
): Promise<Nutrition | null> {
  if (!nutrient_id) return null;
  try {
    // Payload allows optional fields for partial update
    const response = await nutritionApiClient.put<Nutrition>(`/${nutrient_id}`, payload);
     // Expects NutritionOut structure back
    return response.data;
  } catch (error) {
    console.error(`API Error updating nutrition (${nutrient_id}):`, error);
     // TODO: Handle specific errors (e.g., 404)
    return null;
  }
}

/**
 * Delete a nutrition by ID.
 * DELETE /v1/admin/nutritions/{nutrient_id}
 */
export async function deleteNutrition(nutrient_id: string): Promise<boolean> {
  if (!nutrient_id) return false;
  try {
     // Use nutrient_id in the path
    await nutritionApiClient.delete(`/${nutrient_id}`); // Expects 204 No Content
    return true;
  } catch (error) {
    console.error(`API Error deleting nutrition ${nutrient_id}:`, error);
    return false;
  }
}