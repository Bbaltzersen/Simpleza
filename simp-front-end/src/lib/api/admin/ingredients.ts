// api/ingredientService.ts (or similar file path)

import axios, { AxiosError } from "axios";
// Import the new TypeScript types for Ingredients and Nutrient linking
import {
  IngredientCreatePayload,
  IngredientUpdatePayload,
  IngredientOut,
  PaginatedIngredients,
  BatchNutrientUpdatePayload, // For updating nutrients linked to ingredient
  IngredientNutrientOut,      // For getting nutrients linked to ingredient
} from "@/lib/types/ingredient"; // Adjust this path based on your project structure

// Use environment variable for API base URL, default for local development
// Make sure this points to your backend root URL
const API_BASE_URL = process.env.NEXT_PUBLIC_INGREDIENTS_API_URL || "http://localhost:8010/v1"; // Ensure variable name matches your setup

// Create an Axios instance configured for the ingredients endpoint
// Assuming '/admin' prefix is handled globally or needed here
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin/ingredients`, // Base URL for ingredient endpoints
  withCredentials: true, // Keep if needed for authentication
});

/**
 * Fetches a paginated list of ingredients from the API.
 * @param page - The page number to fetch (1-based).
 * @param limit - The number of items per page.
 * * @param sortBy - Field to sort by (e.g., name, default_unit, diet_level, validated, created_at). Optional.
 * @param sortOrder - Sort order ('asc' or 'desc'). Optional.
 * @param validated - Filter by validation status. Optional.
 * @returns A promise resolving to the paginated ingredient data or a default structure on error.
 */
export async function fetchIngredients(
  page: number = 1, // Use 1-based page for function input
  limit: number = 10,
  sortBy: string = "name", // Default sort field for ingredients
  sortOrder: "asc" | "desc" = "asc",
  validated?: boolean // Optional filter param
): Promise<PaginatedIngredients> {
  // Calculate skip based on 1-based page
  const skip = Math.max(0, (page - 1) * limit);
  console.log(`>>> Ingredient API Service requesting - Page: ${page}, Skip: ${skip}, Limit: ${limit}`);

  // Build query parameters, only include 'validated' if it's defined
  const params: Record<string, any> = {
      skip: skip,
      limit: limit,
      sort_by: sortBy,
      sort_order: sortOrder,
  };
  if (validated !== undefined) {
      params.validated = validated;
  }

  try {
    // Use the PaginatedIngredients type for the response
    const response = await apiClient.get<PaginatedIngredients>("/", { params });
    // Ensure the response matches the expected structure
    return response.data ?? { items: [], total: 0, skip: skip, limit: limit }; // Provide default on empty response
  } catch (error) {
     console.error("Error fetching ingredients:", error);
     // Return a default structure matching PaginatedIngredients on error
     return { items: [], total: 0, skip: skip, limit: limit };
  }
}

/**
 * Fetches a single ingredient by its ID.
 * @param ingredientId - The UUID of the ingredient to fetch.
 * @returns A promise resolving to the ingredient data or null if not found or on error.
 */
export async function getIngredientById(ingredientId: string): Promise<IngredientOut | null> {
    try {
        const response = await apiClient.get<IngredientOut>(`/${ingredientId}`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response && axiosError.response.status === 404) {
            console.log(`Ingredient with ID ${ingredientId} not found.`);
        } else {
            console.error(`Error fetching ingredient by ID (${ingredientId}):`, error);
        }
        return null;
    }
}

/**
 * Creates a new ingredient definition.
 * @param ingredientPayload - The data for the new ingredient, matching IngredientCreatePayload.
 * @returns A promise resolving to the created ingredient data or null on error.
 */
export async function createIngredient(
  ingredientPayload: IngredientCreatePayload
): Promise<IngredientOut | null> {
  try {
    const response = await apiClient.post<IngredientOut>("/", ingredientPayload);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const detail = axiosError.response?.data?.detail;
    console.error(`Error creating ingredient: ${detail || axiosError.message}`, error);
    // You might want to throw the error or return the detail message here
    // throw new Error(`Failed to create ingredient: ${detail || 'Unknown error'}`);
    return null; // Or return null as before
  }
}

/**
 * Updates an existing ingredient.
 * @param ingredientId - The UUID of the ingredient to update.
 * @param ingredientUpdatePayload - An object containing the fields to update, matching IngredientUpdatePayload.
 * @returns A promise resolving to the updated ingredient data or null on error.
 */
export async function updateIngredient(
  ingredientId: string,
  ingredientUpdatePayload: IngredientUpdatePayload
): Promise<IngredientOut | null> {
  try {
    const response = await apiClient.put<IngredientOut>(
      `/${ingredientId}`,
      ingredientUpdatePayload
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const detail = axiosError.response?.data?.detail;
    console.error(`Error updating ingredient (${ingredientId}): ${detail || axiosError.message}`, error);
    // throw new Error(`Failed to update ingredient: ${detail || 'Unknown error'}`);
    return null;
  }
}

/**
 * Fetches a single ingredient by its name (case-insensitive lookup).
 * @param name - The name of the ingredient to fetch.
 * @returns A promise resolving to the ingredient data or null if not found or on error.
 */
export async function getIngredientByName(name: string): Promise<IngredientOut | null> {
  try {
    // Assuming backend has a lookup endpoint like nutrients did
    // If not, this needs to be implemented or removed.
    // Let's assume '/lookup/by-name/' exists for ingredients too
    const response = await apiClient.get<IngredientOut>(`/lookup/by-name/${encodeURIComponent(name)}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.status === 404) {
      console.log(`Ingredient with name "${name}" not found.`);
    } else {
      console.error(`Error fetching ingredient by name (${name}):`, error);
    }
    return null;
  }
}


// --- Ingredient Nutrient Linking API Functions ---

/**
 * Fetches all nutrient values associated with a specific ingredient.
 * @param ingredientId - The UUID of the ingredient.
 * @returns A promise resolving to an array of nutrient link data or null on error.
 */
export async function getIngredientNutrients(ingredientId: string): Promise<IngredientNutrientOut[] | null> {
    try {
        const response = await apiClient.get<IngredientNutrientOut[]>(`/${ingredientId}/nutrients`);
        
        return response.data ?? []; // Return empty array if data is null/undefined
    } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        const detail = axiosError.response?.data?.detail;
        console.error(`Error fetching nutrients for ingredient (${ingredientId}): ${detail || axiosError.message}`, error);
         // Distinguish 404 for the ingredient itself if possible (backend should return 404)
        if (axiosError.response && axiosError.response.status === 404) {
             console.log(`Ingredient with ID ${ingredientId} not found when fetching nutrients.`);
        }
        return null;
    }
}

/**
 * Batch updates (Upserts) nutrient values for a specific ingredient.
 * @param ingredientId - The UUID of the ingredient.
 * @param payload - An array of nutrient links to update/create, matching BatchNutrientUpdatePayload.
 * @returns A promise resolving to the array of updated/created nutrient link data or null on error.
 */
export async function updateIngredientNutrients(
    ingredientId: string,
    payload: BatchNutrientUpdatePayload
): Promise<IngredientNutrientOut[] | null> {
    try {
        const response = await apiClient.put<IngredientNutrientOut[]>(
            `/${ingredientId}/nutrients`,
            payload // Send the array as the request body
        );
        return response.data ?? []; // Return empty array if data is null/undefined
    } catch (error) {
        const axiosError = error as AxiosError<{ detail?: string }>;
        const detail = axiosError.response?.data?.detail;
        console.error(`Error batch updating nutrients for ingredient (${ingredientId}): ${detail || axiosError.message}`, error);
         if (axiosError.response && axiosError.response.status === 404) {
             console.log(`Ingredient with ID ${ingredientId} not found during nutrient update.`);
        }
        // Consider returning specific error info if backend provides partial success/failure details
        return null;
    }
}