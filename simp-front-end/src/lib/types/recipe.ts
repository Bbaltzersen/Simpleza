import exp from "constants";
import { UUID } from "crypto";

// export type Recipe = {
//   recipe_id: string;
//   title: string;
//   description?: string;
//   author_id?: string;
//   created_at: string;  // ❌ Not needed in `RecipeCreate`
//   ingredients: RecipeIngredient[];
//   steps: RecipeStep[];
//   images: RecipeImage[];
//   tags: Tag[];  // Backend expects UUID[], so we must transform this
//   favorited_by: RecipeFavorite[];  // ❌ Not needed in `RecipeCreate`
// };

// ✅ Define `RecipeCreate` correctly to match `RecipeCreateSchema`
// export type RecipeCreate = {
//   title: string;
//   description?: string;
//   author_id?: string;
//   ingredients: RecipeIngredientCreate[];
//   steps: RecipeStepCreate[];
//   images: RecipeImageCreate[];
//   tags: string[];
// };


export type RecipeLoad = {
  recipe_id: string;
  title: string;
};



export type RecipeUpdate = Partial<RecipeCreate>;

export type RecipeIngredient = {
  ingredient_id: string;
  ingredient_name: string;
  recipe_id: string;
  amount: number;
  measurement: string;
  created_at: string;
};

export type RecipeStep = {
  step_id: string;
  recipe_id: string;
  step_number: number;
  description: string;
  image_url?: string;
  created_at: string;
};

export type RecipeImage = {
  image_id: string;
  recipe_id: string;
  image_url: string;
  created_at: string;
};

export type Tag = {
  tag_id: string;
  name: string;
};

export type RecipeFavorite = {
  user_id: string;
  recipe_id: string;
  favorited_at: string;
};


// export type RecipeIngredientCreate = {
//   id: string; // Temporary ID for frontend sorting
//   ingredient_name: string;
//   amount: number;
//   measurement: string;
// };


// export type RecipeStepCreate = {
//   id: string; // Temporary ID for frontend sorting
//   step_number: number;
//   description: string;
// };

// export type RecipeImageCreate = {
//   id: string; // Temporary ID for frontend sorting
//   image_url: string;
// };



export type RecipeIngredientModify = {
  ingredient_id: string;
  ingredient_name: string;
  amount: number;
  measurement: string;
};


// export interface RecipeRetrieve {
//   title: string;
//   description?: string;
//   author_id?: string;
//   ingredients: RecipeIngredient[];
//   steps: RecipeStep[];
//   images: RecipeImage[];
//   tags: Tag[];
// }


// -------------------------------- New types.

// Retrieval Recipe

export type ListRecipe = {
  recipe_id: string;
  title: string;
  tags: string[];
  front_image: string;
  in_cauldron: boolean;
}

export type TagRetrieval = {
  tag_id: string;
  name: string;
}

// Create Recipes

export type RecipeCreate = {
  recipe_id?: string; 
  title: string;
  description: string;
  front_image: string;
  author_id: string;
  ingredients: RecipeIngredientCreate[];
  steps: RecipeStepCreate[]; 
  images: RecipeImageCreate[];
  tags: RecipeTagCreate[];
};


export type RecipeIngredientCreate = {
  ingredient_id?: string;
  ingredient_name: string;
  amount: number;
  measurement: string;
  position: number;
};

export type RecipeStepCreate = {
  step_number: number;
  description: string;
  image_url?: string;
};

export type RecipeImageCreate = {
  image_url: string;
}

export type RecipeTagCreate = {
  tag_id?: string;
  name: string;
}


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