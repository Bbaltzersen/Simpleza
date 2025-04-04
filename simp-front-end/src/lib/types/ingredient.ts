// src/lib/types/ingredient.ts

import { MeasurementUnitEnum } from "@/lib/enums"; // Import required enum type

// Main Ingredient data type (matches IngredientOut)
export type Ingredient = {
  ingredient_id: string; // UUID
  name: string;
  default_unit: MeasurementUnitEnum; // Use Enum Type HERE for received data
  calories_per_100g?: number | null;
  validated: boolean;
  diet_level: number;
  density_g_ml?: number | null;
};

// Payload for creating an Ingredient (matches IngredientCreate)
export type IngredientCreatePayload = {
  name: string;
  default_unit: string; // CHANGED: Accept string here for sending
  calories_per_100g?: number | null;
  density_g_ml?: number | null;
  validated?: boolean;
  diet_level?: number;
};

// Payload for updating an Ingredient (matches IngredientUpdate)
export type IngredientUpdatePayload = {
  name?: string;
  default_unit?: string | null; // CHANGED: Accept string | null here for sending
  calories_per_100g?: number | null;
  density_g_ml?: number | null;
  validated?: boolean;
  diet_level?: number;
};

// Type for linking nutrition (matches NutritionLink)
export type NutritionLinkPayload = {
    ingredient_id: string; // UUID
    nutrition_id: string; // UUID
};