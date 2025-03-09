"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Define the shape of the context
interface Recipe {
    recipe_id: string;
    title: string;
    description?: string;
    ingredients: { ingredient_id: string; amount: number; measurement: string }[];
    steps: { step_number: number; description: string; image_url?: string }[];
    images: { image_url: string }[];
    tags: string[];
}

interface DashboardContextType {
    recipes: Recipe[];
    fetchRecipes: () => Promise<void>;
    addRecipe: (recipe: Omit<Recipe, "recipe_id">) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);

    // Fetch recipes from the API
    const fetchRecipes = async () => {
        try {
            const response = await axios.get("/api/recipes");
            setRecipes(response.data);
        } catch (error) {
            console.error("Failed to fetch recipes", error);
        }
    };

    // Add a new recipe
    const addRecipe = async (recipe: Omit<Recipe, "recipe_id">) => {
        try {
            const response = await axios.post("/api/recipes", recipe);
            setRecipes((prevRecipes) => [...prevRecipes, response.data]);
        } catch (error) {
            console.error("Failed to add recipe", error);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    return (
        <DashboardContext.Provider value={{ recipes, fetchRecipes, addRecipe }}>
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