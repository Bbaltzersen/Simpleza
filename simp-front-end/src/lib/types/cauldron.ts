// types/cauldron.ts

// Main Cauldron type: associates a user with a recipe and marks if it's active in the user's rotation.
export type Cauldron = {
    cauldron_id: string;
    user_id: string;
    recipe_id: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  
  // For creating a new cauldron record.
  export type CauldronCreate = {
    user_id: string;
    recipe_id: string;
    is_active?: boolean;  // Optional; defaults to true on the backend.
  };
  
  // For updating an existing cauldron record.
  export type CauldronUpdate = Partial<CauldronCreate>;
  
  
  // CauldronData holds dynamic, user-specific usage metrics.
  export type CauldronData = {
    cauldron_data_id: string;
    cauldron_id: string;
    usage_count: number;
    last_used?: string;
    overall_rating?: number;
    taste_rating?: number;
    ease_rating?: number;
    updated_at: string;
  };
  
  // For creating a new cauldron data record.
  export type CauldronDataCreate = {
    cauldron_id: string;
    usage_count?: number;
    last_used?: string;
    overall_rating?: number;
    taste_rating?: number;
    ease_rating?: number;
  };
  
  // For updating an existing cauldron data record.
  export type CauldronDataUpdate = Partial<CauldronDataCreate>;
  
  
  // RecipeAnalytics aggregates global analytics for a recipe (independent of a specific user).
  export type RecipeAnalytics = {
    recipe_analytics_id: string;
    recipe_id: string;
    minimum_price: number;
    total_calories?: number;
    updated_at: string;
    created_at: string;
  };
  
  // For creating a new recipe analytics record.
  export type RecipeAnalyticsCreate = {
    recipe_id: string;
    minimum_price: number;
    total_calories?: number;
  };
  
  // For updating an existing recipe analytics record.
  export type RecipeAnalyticsUpdate = Partial<RecipeAnalyticsCreate>;
  