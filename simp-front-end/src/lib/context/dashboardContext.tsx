"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  fetchRecipesByAuthorID,
  createRecipe,
  fetchIngredientsByName,
  fetchTagsByName,
  fetchRecipeById,
  updateRecipe,
  deleteRecipe,
} from "@/lib/api/recipe/recipe";
import { ListRecipe, RecipeCreate, TagRetrieval } from "@/lib/types/recipe";
import { Ingredient } from "@/lib/types/ingredient";
import { useAuth } from "@/lib/context/authContext";

import {
  createCauldron,
  getCauldronsByUser,
  updateCauldron,
  deleteCauldron,
} from "@/lib/api/cauldron/cauldron";
import {
  Cauldron,
  CauldronCreate,
  CauldronUpdate,
} from "@/lib/types/cauldron";

interface DashboardContextType {
  recipes: ListRecipe[];
  recipe_details?: RecipeCreate;
  fetchMoreRecipes: () => Promise<void>;
  addRecipe: (recipe: RecipeCreate) => Promise<void>;
  updateRecipe: (recipe_id: string, recipe: RecipeCreate) => Promise<void>;
  deleteRecipe: (recipe_id: string) => Promise<void>;
  retrieveRecipeDetails: (recipe_id: string) => Promise<void>;
  hasMore: boolean;
  ingredientSearchResults: Ingredient[];
  searchIngredients: (query: string) => Promise<void>;
  tags: TagRetrieval[];
  searchTags: (query: string) => Promise<void>;
  // Cauldron functions
  cauldrons: Cauldron[];
  fetchUserCauldrons: () => Promise<void>;
  addCauldron: (data: CauldronCreate) => Promise<void>;
  updateCauldron: (cauldronId: string, data: CauldronUpdate) => Promise<void>;
  deleteCauldron: (cauldronId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<ListRecipe[]>([]);
  const [recipe_details, setRecipeDetails] = useState<RecipeCreate>();
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const [ingredientSearchResults, setIngredientSearchResults] = useState<Ingredient[]>(
    []
  );
  const [tags, setTags] = useState<TagRetrieval[]>([]);

  // CAULDRON STATE
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([]);

  const fetchMoreRecipes = useCallback(async () => {
    if (!hasMore || !user) return;
    try {
      const { recipes: newRecipes, total } = await fetchRecipesByAuthorID(
        user.user_id,
        skip,
        limit
      );
      setRecipes((prev) => [...prev, ...newRecipes]);
      setSkip((prev) => prev + limit);
      if (recipes.length + newRecipes.length >= total) setHasMore(false);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [hasMore, skip, recipes.length, user]);

  const addRecipeFn = async (recipe: RecipeCreate): Promise<void> => {
    try {
      const newRecipe = await createRecipe(recipe);
      if (newRecipe) setRecipes((prev) => [newRecipe, ...prev]);
      else console.error("Recipe creation returned null.");
    } catch (error: any) {
      console.error("Error adding recipe:", error.response?.data || error.message);
    }
  };

  const updateRecipeFn = async (recipe_id: string, recipe: RecipeCreate): Promise<void> => {
    try {
      const updatedRecipe = await updateRecipe(recipe_id, recipe);
      if (updatedRecipe) {
        setRecipes((prev) =>
          prev.map((r) => (r.recipe_id === recipe_id ? updatedRecipe : r))
        );
      } else {
        console.error("Recipe update returned null.");
      }
    } catch (error: any) {
      console.error("Error updating recipe:", error.response?.data || error.message);
    }
  };

  const deleteRecipeFn = async (recipe_id: string): Promise<void> => {
    try {
      const success = await deleteRecipe(recipe_id);
      if (success) {
        setRecipes((prev) => prev.filter((r) => r.recipe_id !== recipe_id));
      } else {
        console.error("Failed to delete recipe");
      }
    } catch (error: any) {
      console.error("Error deleting recipe:", error.response?.data || error.message);
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

  // CAULDRON FUNCTIONS
  const fetchUserCauldrons = useCallback(async () => {
    if (!user) return;
    try {
      // Adjust pagination if needed
      const { cauldrons: userCauldrons } = await getCauldronsByUser(
        user.user_id,
        0,
        100
      );
      setCauldrons(userCauldrons);
    } catch (error) {
      console.error("Error fetching cauldrons:", error);
    }
  }, [user]);

  const addCauldronFn = async (data: CauldronCreate): Promise<void> => {
    try {
      const newCauldron = await createCauldron(data);
      setCauldrons((prev) => [newCauldron, ...prev]);
    } catch (error) {
      console.error("Error creating cauldron:", error);
    }
  };

  const updateCauldronFn = async (cauldronId: string, data: CauldronUpdate): Promise<void> => {
    try {
      const updated = await updateCauldron(cauldronId, data);
      setCauldrons((prev) =>
        prev.map((c) => (c.cauldron_id === cauldronId ? updated : c))
      );
    } catch (error) {
      console.error("Error updating cauldron:", error);
    }
  };

  const deleteCauldronFn = async (cauldronId: string): Promise<void> => {
    try {
      await deleteCauldron(cauldronId);
      setCauldrons((prev) => prev.filter((c) => c.cauldron_id !== cauldronId));
    } catch (error) {
      console.error("Error deleting cauldron:", error);
    }
  };

  useEffect(() => {
    fetchMoreRecipes();
  }, [fetchMoreRecipes]);

  // Optionally, fetch cauldrons when the user logs in or changes.
  useEffect(() => {
    if (user) {
      fetchUserCauldrons();
    }
  }, [user, fetchUserCauldrons]);

  return (
    <DashboardContext.Provider
      value={{
        recipes,
        recipe_details,
        fetchMoreRecipes,
        addRecipe: addRecipeFn,
        updateRecipe: updateRecipeFn,
        deleteRecipe: deleteRecipeFn,
        retrieveRecipeDetails,
        hasMore,
        ingredientSearchResults,
        searchIngredients,
        tags,
        searchTags,
        cauldrons,
        fetchUserCauldrons,
        addCauldron: addCauldronFn,
        updateCauldron: updateCauldronFn,
        deleteCauldron: deleteCauldronFn,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within a DashboardProvider");
  return context;
};
