"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchRecipes, createRecipe } from "@/lib/api/recipe/recipe"; 
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe"; 

// ✅ Define the context type properly with pagination
interface DashboardContextType {
    recipes: ListRecipe[];
    fetchMoreRecipes: () => Promise<void>;
    addRecipe: (recipe: RecipeCreate) => Promise<void>;
    hasMore: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<ListRecipe[]>([]);
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const limit = 10; // Recipes per page

    // ✅ Load more recipes (for infinite scrolling)
    const fetchMoreRecipes = async () => {
        if (!hasMore) return;

        const { recipes: newRecipes, total } = await fetchRecipes(skip, limit);
        setRecipes((prev) => [...prev, ...newRecipes]);

        setSkip((prevSkip) => prevSkip + limit);
        if (recipes.length + newRecipes.length >= total) {
            setHasMore(false);
        }
    };

    // ✅ Add a new recipe and update the list
    const addRecipe = async (recipe: RecipeCreate) => {
        // const newRecipe = await createRecipe(recipe);
        // setRecipes((prev) => [newRecipe, ...prev]); // Add the new recipe to the top
    };

    // Load initial recipes on mount
    useEffect(() => {
        fetchMoreRecipes();
    }, []);

    return (
        <DashboardContext.Provider value={{ recipes, fetchMoreRecipes, addRecipe, hasMore }}>
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
