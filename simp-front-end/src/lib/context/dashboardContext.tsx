"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchRecipes,
  createRecipe,
  fetchIngredientsByName,
  fetchTagsByName,
} from "@/lib/api/recipe/recipe";
import { ListRecipe, RecipeCreate, TagRetrieval } from "@/lib/types/recipe";

interface DashboardContextType {
  recipes: ListRecipe[];
  recipe_details?: RecipeCreate;
  fetchMoreRecipes: () => Promise<void>;
  addRecipe: (recipe: RecipeCreate) => Promise<void>;
  retrieveRecipeDetails: (recipe_id: string) => Promise<void>;
  hasMore: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<ListRecipe[]>([]);
  const [recipe_details, setRecipeDetails] = useState<RecipeCreate>();
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  
  const fetchMoreRecipes = useCallback(async () => {
    if (!hasMore) return;
    try {
      const { recipes: newRecipes, total } = await fetchRecipes(skip, limit);
      setRecipes((prev) => [...prev, ...newRecipes]);
      setSkip((prev) => prev + limit);
      if (recipes.length + newRecipes.length >= total) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [hasMore, skip, recipes.length]);

  const addRecipe = async (recipe: RecipeCreate): Promise<void> => {
    try {
      const newRecipe = await createRecipe(recipe);
      if (newRecipe) {
        setRecipes((prev) => [newRecipe, ...prev]);
      } else {
        console.error("Recipe creation returned null.");
      }
    } catch (error: any) {
      console.error("Error adding recipe:", error.response?.data || error.message);
    }
  };

  const retrieveRecipeDetails = async (recipe_id: string) => {
    // Replace with an actual API call if needed.
    // setRecipeDetails(dummyRecipe);
  };


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
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
