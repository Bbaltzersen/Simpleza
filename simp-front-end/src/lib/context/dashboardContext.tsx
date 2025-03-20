"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchRecipes, createRecipe } from "@/lib/api/recipe/recipe"; 
import { fetchIngredientsByName } from "@/lib/api/recipe/recipe" ;
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe"; 
import { Ingredient } from "@/lib/types/ingredient"; 

// ✅ Define the context type with recipes & ingredients
interface DashboardContextType {
    recipes: ListRecipe[];
    recipe_details?: RecipeCreate; // Add the recipe property
    fetchMoreRecipes: () => Promise<void>;
    addRecipe: (recipe: RecipeCreate) => Promise<void>;
    retrieveRecipeDetails: (recipe_id: string) => Promise<void>;
    hasMore: boolean;
    ingredients: Ingredient[];
    searchIngredients: (query: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<ListRecipe[]>([]);
    const [recipe_details, setRecipeDetails] = useState<RecipeCreate>();
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; 

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

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
    };

    const retrieveRecipeDetails = async(recipe_id: string) => {
        setRecipeDetails(dummyRecipe);
    }

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
                ingredients, // ✅ Provide ingredient search results
                searchIngredients, // ✅ Provide ingredient search function
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