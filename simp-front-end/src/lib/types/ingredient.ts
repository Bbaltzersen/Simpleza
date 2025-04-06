// lib/types/ingredient.ts (or your preferred path)

// --- Constant Definitions for Enum-like Values ---
// These provide reference values and labels for frontend use (e.g., dropdowns)
// while the API types below use the primitive values (string/number) for JSON compatibility.

export const UnitNameOptions = {
  GRAM: "gram",
  MILLIGRAM: "milligram",
  MICROGRAM: "microgram",
  KILOCALORIE: "kilocalorie",
  KILOJOULE: "kilojoule",
  MILLILITER: "milliliter",
  PERCENT: "percent",
  INTERNATIONAL_UNIT: "international unit",
  // Add other units matching Python Enum values
} as const; // Use 'as const' for stricter typing on values

// Define a type based on the values of the options object
export type UnitNameValue = typeof UnitNameOptions[keyof typeof UnitNameOptions];


export const DietLevelOptions = {
  // Using keys for labels and numeric values matching the backend
  VEGAN: { value: 1, label: 'Vegan' },
  VEGETARIAN: { value: 2, label: 'Vegetarian' },
  PESCATARIAN: { value: 3, label: 'Pescatarian' },
  OMNIVORE: { value: 4, label: 'Omnivore' },
} as const;

// Define a type based on the numeric values
export type DietLevelValue = typeof DietLevelOptions[keyof typeof DietLevelOptions]['value'];


// --- API Data Structure Types ---

/**
 * Base interface for Ingredient core properties.
 * Uses primitive types matching JSON data structure.
 */
export interface IngredientBase {
  name: string;
  description: string | null;
  density_g_per_ml: number | null; // Decimal -> number
  default_unit: string; // Expecting values like "gram", "milliliter", etc. Use UnitNameValue for stricter assignment internally if needed.
  diet_level: number;   // Expecting values like 1, 2, 3, 4. Use DietLevelValue for stricter assignment internally if needed.
  validated: boolean;
}

/**
 * Type for the data payload sent TO the backend when CREATING an ingredient.
 */
export type IngredientCreatePayload = IngredientBase;

/**
 * Type for the data payload sent TO the backend when UPDATING an ingredient.
 * All fields are optional ('?'). Uses primitive types.
 */
export type IngredientUpdatePayload = {
  name?: string;
  description?: string | null;
  density_g_per_ml?: number | null;
  default_unit?: string; // e.g., "gram"
  diet_level?: number;   // e.g., 1, 2, 3, 4
  validated?: boolean;
};

/**
 * Interface for the full Ingredient data received FROM the backend.
 * Includes ID and timestamps. Uses primitive types.
 */
export interface IngredientOut extends IngredientBase {
  ingredient_id: string; // UUID -> string
  created_at: string;    // datetime -> string (ISO format)
  updated_at: string;    // datetime -> string (ISO format)
}

/**
 * Interface for the paginated response when fetching ingredients.
 */
export interface PaginatedIngredients {
  items: IngredientOut[];
  total: number;
  skip: number;
  limit: number;
}

// --- Types/Interfaces for Ingredient Nutrient Linking ---

/**
 * Type for a single item sent TO the backend in the batch nutrient update request.
 */
export type IngredientNutrientLinkPayload = {
  nutrient_id: string; // UUID
  nutrient_value: number; // Decimal -> number
};

/**
 * Type alias for the request body of the batch nutrient update endpoint.
 */
export type BatchNutrientUpdatePayload = IngredientNutrientLinkPayload[];

/**
 * Interface for a single ingredient-nutrient link received FROM the backend.
 * Includes details from the join. Uses primitive type for unit.
 */
export interface IngredientNutrientOut {
  ingredient_nutrient_id: string; // UUID
  ingredient_id: string; // UUID
  nutrient_id: string; // UUID
  nutrient_value: number; // Decimal -> number
  value_basis: string;
  validated: boolean;
  nutrient_name: string | null;
  unit: string | null; // Expecting values like "gram", "milligram", etc. Use UnitNameValue internally if needed.
}