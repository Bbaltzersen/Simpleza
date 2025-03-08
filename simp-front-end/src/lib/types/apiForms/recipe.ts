// types/forms.ts

import { Recipe } from "../recipe";

export type RecipeFormInput = {
    title: string;
    description?: string;
    ingredients: { ingredient_id: string; amount: number; measurement: string }[];
    steps: { step_number: number; description: string; image_url?: string }[];
    images: { image_url: string }[];
  };

export type CreateRecipeRequest = {
    title: string;
    description?: string;
    author_id?: string;
    ingredients: { ingredient_id: string; amount: number; measurement: string }[];
    steps: { step_number: number; description: string; image_url?: string }[];
    images: { image_url: string }[];
    tags: string[];
  };
  
  export type CreateRecipeResponse = {
    success: boolean;
    message: string;
    recipe?: Recipe;
  };
  