// types/recipe.ts

export type Recipe = {
    recipe_id: string;
    title: string;
    description?: string;
    author_id?: string;
    created_at: string;
    ingredients: RecipeIngredient[];
    steps: RecipeStep[];
    images: RecipeImage[];
    tags: Tag[];
    favorited_by: RecipeFavorite[];
  };
  
  export type RecipeIngredient = {
    ingredient_id: string;
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
  