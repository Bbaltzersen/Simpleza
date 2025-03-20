"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchRecipes, createRecipe, fetchIngredientsByName, fetchTagsByName } from "@/lib/api/recipe/recipe";
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe";
import { Ingredient } from "@/lib/types/ingredient";
import { TagRetrieval } from "@/lib/types/recipe"; // Adjust the import path and type name as needed

// ✅ Define the context type with recipes, ingredients, and tags
interface DashboardContextType {
  recipes: ListRecipe[];
  recipe_details?: RecipeCreate; // For selected recipe details
  fetchMoreRecipes: () => Promise<void>;
  addRecipe: (recipe: RecipeCreate) => Promise<void>;
  retrieveRecipeDetails: (recipe_id: string) => Promise<void>;
  hasMore: boolean;
  ingredients: Ingredient[];
  searchIngredients: (query: string) => Promise<void>;
  tags: TagRetrieval[];
  searchTags: (query: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<ListRecipe[]>([]);
  const [recipe_details, setRecipeDetails] = useState<RecipeCreate>();
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10; 

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tags, setTags] = useState<TagRetrieval[]>([]);

  const fetchMoreRecipes = useCallback(async () => {
    if (!hasMore) return;

    try {
      const { recipes: newRecipes, total } = await fetchRecipes(skip, limit);
      setRecipes((prev) => [...prev, ...newRecipes]);
      setSkip((prevSkip) => prevSkip + limit);
      if (recipes.length + newRecipes.length >= total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [hasMore, skip, recipes.length]);

  const addRecipe = async (recipe: RecipeCreate) => {
    // Implement recipe creation logic here.
  };

  const retrieveRecipeDetails = async (recipe_id: string) => {
    // Replace this with an actual API call as needed.
    setRecipeDetails(dummyRecipe);
  };

  const searchIngredients = useCallback(async (query: string) => {
    if (query.length < 3) {
      setIngredients([]); // Clear results if query is too short
      return;
    }

    try {
      const results = await fetchIngredientsByName(query);
      setIngredients(results);
    } catch (error) {
      console.error("Ingredient search failed:", error);
      setIngredients([]);
    }
  }, []);

  const searchTags = useCallback(async (query: string) => {
    if (query.length < 3) {
      setTags([]); // Clear results if query is too short
      return;
    }

    try {
      const results = await fetchTagsByName(query);
      setTags(results);
    } catch (error) {
      console.error("Tag search failed:", error);
      setTags([]);
    }
  }, []);

  useEffect(() => {
    fetchMoreRecipes();
  }, [fetchMoreRecipes]);

  return (
    <DashboardContext.Provider
      value={{
        recipes,
        recipe_details,
        retrieveRecipeDetails,
        fetchMoreRecipes,
        addRecipe,
        hasMore,
        ingredients,         // Ingredient search results
        searchIngredients,   // Ingredient search function
        tags,                // Tag search results
        searchTags,          // Tag search function
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// ✅ Export `useDashboard` hook for easy access
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

export const dummyRecipe: RecipeCreate = {
  title: "Dummy Recipe",
  description: "A simple dummy recipe for testing purposes.",
  front_image: "http://example.com/dummy.jpg",
  author_id: "dummy_author",
  ingredients: [
    {
      ingredient_name: "Flour",
      amount: 200,
      measurement: "grams",
      position: 0,
    },
    {
      ingredient_name: "Sugar",
      amount: 100,
      measurement: "grams",
      position: 1,
    },
    {
      ingredient_name: "Eggs",
      amount: 2,
      measurement: "pcs",
      position: 2,
    },
  ],
  steps: [
    {
      step_number: 1,
      description: "Mix all the ingredients together until smooth.",
    },
    {
      step_number: 2,
      description: "Bake in a preheated oven for 25 minutes.",
    },
  ],
  images: [{ image_url: "http://example.com/dummy-step1.jpg" }],
  tags: [
    { name: "Easy" },
    { name: "Quick" },
  ],
};
