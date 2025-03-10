"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchRecipes, createRecipe } from "@/lib/api/recipe/recipe"; 
import { Recipe, RecipeCreate, RecipeLoad, Tag } from "@/lib/types/recipe"; // ✅ Import correct types

// ✅ Define the context type properly
interface DashboardContextType {
    recipes: Recipe[];
    fetchRecipes: () => Promise<void>;
    addRecipe: (recipe: RecipeCreate) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    const loadRecipes = async () => {
        const data = await fetchRecipes();
    
        const formattedData: Recipe[] = data.map(recipe => ({
            ...recipe,
            description: recipe.description || "", // Ensure missing fields are added
            ingredients: recipe.ingredients || [],
            steps: recipe.steps || [],
            images: recipe.images || [],
            tags: recipe.tags || [],
            favorited_by: recipe.favorited_by || [],
        }));
    
        setRecipes(formattedData);
    };

    const addRecipe = async (recipe: RecipeCreate) => {
        const newRecipe = await createRecipe(recipe);
        if (newRecipe) {
            setRecipes(prev => [
                ...prev,
                {
                    ...newRecipe,
                    tags: newRecipe.tags.map(tag => ({ tag_id: tag.tag_id, name: tag.name })), // ✅ Ensure tags are stored as `Tag[]`
                }
            ]);
        }
    };
    

    useEffect(() => {
        loadRecipes();
    }, []);

    return (
        <DashboardContext.Provider value={{ recipes, fetchRecipes: loadRecipes, addRecipe }}>
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
