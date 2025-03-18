"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchRecipes, createRecipe } from "@/lib/api/recipe/recipe"; 
import { fetchIngredientsByName } from "@/lib/api/recipe/recipe" ;
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe"; 
import { Ingredient } from "@/lib/types/ingredient"; 

// ✅ Define the context type with recipes & ingredients
interface DashboardContextType {
    recipes: ListRecipe[];
    fetchMoreRecipes: () => Promise<void>;
    addRecipe: (recipe: RecipeCreate) => Promise<void>;
    hasMore: boolean;
    ingredients: Ingredient[];
    searchIngredients: (query: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<ListRecipe[]>([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; 

    // ✅ Ingredient Search State
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    // ✅ Fetch more recipes (for infinite scrolling)
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

    // ✅ Add a new recipe and update the list
    const addRecipe = async (recipe: RecipeCreate) => {
        // try {
        //     const newRecipe = await createRecipe(recipe);
        //     setRecipes((prev) => [newRecipe, ...prev]); // Add new recipe to top
        // } catch (error) {
        //     console.error("Error adding recipe:", error);
        // }
    };

    // ✅ Search for ingredients with API debounce (prevents excessive calls)
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

    // ✅ Load initial recipes on mount
    useEffect(() => {
        fetchMoreRecipes();
    }, [fetchMoreRecipes]);

    return (
        <DashboardContext.Provider
            value={{
                recipes,
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
