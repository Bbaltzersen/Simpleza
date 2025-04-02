// lib/types/ingredient.ts (or wherever your type is defined)
export type Ingredient = {
  ingredient_id: string; // UUID
  name: string;
  default_unit: string; // Default is "g"
  calories_per_100g?: number; // Optional
  validated: boolean;
  density_g_ml?: number | null; // Add the optional density field (can be number or null if not set)
};

  export type IngredientNutrition = {
    ingredient_id: string; // UUID (ForeignKey)
    nutrition_id: string; // UUID (ForeignKey)
  };

  export type IngredientProduct = {
    ingredient_id: string; // UUID (ForeignKey)
    product_id: string; // UUID (ForeignKey)
  };
  

  export type ingredientCreate = {
    name: string;
    default_unit: string; // Default is "g"
    calories_per_100g?: number; // Optional
  };