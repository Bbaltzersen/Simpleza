"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchRecipesByAuthorID,
  createRecipe,
  fetchIngredientsByName,
  fetchTagsByName,
  fetchRecipeById,
} from "@/lib/api/recipe/recipe";
import { ListRecipe, RecipeCreate, TagRetrieval } from "@/lib/types/recipe";
import { Ingredient } from "@/lib/types/ingredient";
import { useAuth } from "@/lib/context/authContext";

interface DashboardContextType {
  recipes: ListRecipe[];
  recipe_details?: RecipeCreate;
  fetchMoreRecipes: () => Promise<void>;
  addRecipe: (recipe: RecipeCreate) => Promise<void>;
  retrieveRecipeDetails: (recipe_id: string) => Promise<void>;
  hasMore: boolean;
  ingredientSearchResults: Ingredient[];
  searchIngredients: (query: string) => Promise<void>;
  tags: TagRetrieval[];
  searchTags: (query: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<ListRecipe[]>([]);
  const [recipe_details, setRecipeDetails] = useState<RecipeCreate>();
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const [ingredientSearchResults, setIngredientSearchResults] = useState<Ingredient[]>([]);
  const [tags, setTags] = useState<TagRetrieval[]>([]);

  const fetchMoreRecipes = useCallback(async () => {
    if (!hasMore || !user) return;
    try {
      const { recipes: newRecipes, total } = await fetchRecipesByAuthorID(user.user_id, skip, limit);
      setRecipes((prev) => [...prev, ...newRecipes]);
      setSkip((prev) => prev + limit);
      if (recipes.length + newRecipes.length >= total) setHasMore(false);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [hasMore, skip, recipes.length, user]);

  const addRecipe = async (recipe: RecipeCreate): Promise<void> => {
    try {
      const newRecipe = await createRecipe(recipe);
      if (newRecipe) setRecipes((prev) => [newRecipe, ...prev]);
      else console.error("Recipe creation returned null.");
    } catch (error: any) {
      console.error("Error adding recipe:", error.response?.data || error.message);
    }
  };

  const retrieveRecipeDetails = useCallback(async (recipe_id: string) => {
    const details = await fetchRecipeById(recipe_id);
    if (details) setRecipeDetails(details);
    else console.error("Recipe details not found");
  }, []);

  const searchIngredients = useCallback(async (query: string) => {
    if (query.length < 3) {
      setIngredientSearchResults([]);
      return;
    }
    try {
      const results = await fetchIngredientsByName(query);
      setIngredientSearchResults(results);
    } catch (error) {
      console.error("Ingredient search failed:", error);
      setIngredientSearchResults([]);
    }
  }, []);

  const searchTags = useCallback(async (query: string) => {
    if (query.length < 3) {
      setTags([]);
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
        ingredientSearchResults,
        searchIngredients,
        tags,
        searchTags,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within a DashboardProvider");
  return context;
};
