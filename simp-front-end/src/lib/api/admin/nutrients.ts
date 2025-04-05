// api/nutrientService.ts (or similar file path)

import axios, { AxiosError } from "axios";
// Import the new TypeScript types
import {
  NutrientCreatePayload,
  NutrientUpdatePayload,
  NutrientOut,
  PaginatedNutrients,
} from "@/lib/types/nutrient"; // Adjust this path based on your project structure

// Use environment variable for API base URL, default for local development
const API_BASE_URL = process.env.NEXT_PUBLIC_INGREDIENTS_API_URL || "http://localhost:8010/v1"; // Ensure variable name matches your setup

// Create an Axios instance configured for the nutrients endpoint
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin/nutrients`, // Updated base URL to match backend router prefix
  withCredentials: true, // Keep if needed for authentication
});

/**
 * Fetches a paginated list of nutrients from the API.
 * @param page - The page number to fetch (1-based).
 * @param limit - The number of items per page.
 * @param sortBy - Field to sort by (optional).
 * @param sortOrder - Sort order ('asc' or 'desc', optional).
 * @returns A promise resolving to the paginated nutrient data or a default structure on error.
 */
export async function fetchNutrients(
  skip: number, // Should receive the non-negative skip
  limit: number,
  sortBy: string = "nutrient_name",
  sortOrder: "asc" | "desc" = "asc"
): Promise<PaginatedNutrients> {
  // Log the values RECEIVED by this function
  console.log(`>>> API Service received - Skip: ${skip}, Limit: ${limit}`);

  // Ensure skip >= 0 before making the call (extra safety)
  const safeSkip = Math.max(0, skip);
  if (safeSkip !== skip) {
      console.warn(`API Service corrected skip from ${skip} to ${safeSkip}`);
  }

  const response = await apiClient.get<PaginatedNutrients>( "/", {
      params: { // Pass as query parameters
          skip: safeSkip, // Use the safe value
          limit: limit,
          sort_by: sortBy,
          sort_order: sortOrder
      }
  });
  return response.data; // Assuming backend returns the PaginatedNutrients structure
}

/**
 * Fetches a single nutrient by its ID.
 * @param nutrientId - The UUID of the nutrient to fetch.
 * @returns A promise resolving to the nutrient data or null if not found or on error.
 */
export async function getNutrientById(nutrientId: string): Promise<NutrientOut | null> {
    try {
        const response = await apiClient.get<NutrientOut>(`/${nutrientId}`);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response && axiosError.response.status === 404) {
            console.log(`Nutrient with ID ${nutrientId} not found.`);
        } else {
            console.error(`Error fetching nutrient by ID (${nutrientId}):`, error);
        }
        return null;
    }
}


/**
 * Creates a new nutrient definition.
 * @param nutrientPayload - The data for the new nutrient, matching NutrientCreatePayload.
 * @returns A promise resolving to the created nutrient data or null on error.
 */
export async function createNutrient(
  nutrientPayload: NutrientCreatePayload
): Promise<NutrientOut | null> {
  try {
    // Use NutrientOut as the expected response type
    const response = await apiClient.post<NutrientOut>("/", nutrientPayload);
    return response.data;
  } catch (error) {
    // Log specific API errors if available
    const axiosError = error as AxiosError<{ detail?: string }>;
    const detail = axiosError.response?.data?.detail;
    console.error(`Error creating nutrient: ${detail || axiosError.message}`, error);
    return null;
  }
}

/**
 * Updates an existing nutrient. Uses PUT but sends only changed fields if possible (like PATCH).
 * @param nutrientId - The UUID of the nutrient to update.
 * @param nutrientUpdatePayload - An object containing the fields to update, matching NutrientUpdatePayload.
 * @returns A promise resolving to the updated nutrient data or null on error.
 */
export async function updateNutrient(
  nutrientId: string,
  nutrientUpdatePayload: NutrientUpdatePayload
): Promise<NutrientOut | null> {
  try {
    // Use NutrientOut as the expected response type
    // Note: Backend PUT handles partial updates like PATCH in our updated route
    const response = await apiClient.put<NutrientOut>(
      `/${nutrientId}`,
      nutrientUpdatePayload
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    const detail = axiosError.response?.data?.detail;
    console.error(`Error updating nutrient (${nutrientId}): ${detail || axiosError.message}`, error);
    return null;
  }
}

// Removed the deleteNutrition function as the endpoint is no longer available.

/**
 * Fetches a single nutrient by its name (case-insensitive lookup).
 * @param name - The name of the nutrient to fetch.
 * @returns A promise resolving to the nutrient data or null if not found or on error.
 */
export async function getNutrientByName(name: string): Promise<NutrientOut | null> {
  try {
    // Use the updated backend path and expect NutrientOut or potentially 404
    const response = await apiClient.get<NutrientOut>(`/lookup/by-name/${encodeURIComponent(name)}`);
    return response.data; // Axios throws for 4xx/5xx, so if we get here, data exists
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.status === 404) {
      console.log(`Nutrient with name "${name}" not found.`);
    } else {
      console.error(`Error fetching nutrient by name (${name}):`, error);
    }
    return null;
  }
}