export type Ingredient = {
    ingredient_id: string; // UUID
    name: string;
    default_unit: string; // Default is "g"
    calories_per_100g?: number; // Optional
    validated: boolean;
  };

  export type IngredientNutrition = {
    ingredient_id: string; // UUID (ForeignKey)
    nutrition_id: string; // UUID (ForeignKey)
  };

  export type IngredientProduct = {
    ingredient_id: string; // UUID (ForeignKey)
    product_id: string; // UUID (ForeignKey)
  };
  