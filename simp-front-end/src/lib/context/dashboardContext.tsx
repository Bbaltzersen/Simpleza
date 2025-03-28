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
  updateRecipe as updateRecipeApi,
  deleteRecipe,
} from "@/lib/api/recipe/recipe";
import { ListRecipe, RecipeCreate, TagRetrieval } from "@/lib/types/recipe";
import { Ingredient } from "@/lib/types/ingredient";
import { useAuth } from "@/lib/context/authContext";

import {
  createCauldron,
  getCauldronsByUser,
  getCauldronRecipes, // Retrieves combined cauldron and recipe data
  updateCauldron as updateCauldronApi,
  deleteCauldron,
} from "@/lib/api/cauldron/cauldron";
import { Cauldron, CauldronCreate, CauldronUpdate } from "@/lib/types/cauldron";
import { CauldronRecipe } from "@/lib/types/cauldron";

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
  fetchUserCauldrons: (page?: number) => Promise<void>;
  addCauldron: (data: CauldronCreate) => Promise<void>;
  updateCauldron: (cauldronId: string, data: CauldronUpdate) => Promise<void>;
  deleteCauldron: (cauldronId: string) => Promise<void>;
  totalCauldrons: number;
  cauldronPage: number;
  // Combined cauldron recipes (cauldron entry + recipe details)
  cauldronRecipes: CauldronRecipe[];
  fetchUserCauldronRecipes: (page?: number) => Promise<void>;
  totalCauldronRecipes: number;
  cauldronRecipesPage: number;
  // Recipes pagination for dropdown pagination
  totalRecipes: number;
  currentRecipePage: number;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<ListRecipe[]>([]);
  const [recipe_details, setRecipeDetails] = useState<RecipeCreate | undefined>(undefined);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const [ingredientSearchResults, setIngredientSearchResults] = useState<Ingredient[]>([]);
  const [tags, setTags] = useState<TagRetrieval[]>([]);

  // Recipes pagination state for dropdown pagination
  const [recipePage, setRecipePage] = useState<number>(1);
  const [totalRecipes, setTotalRecipes] = useState<number>(0);

  // CAULDRON STATE
  const pageSize = 10;
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([]);
  const [cauldronPage, setCauldronPage] = useState(1);
  const [totalCauldrons, setTotalCauldrons] = useState(0);
  // Combined cauldron recipes
  const [cauldronRecipes, setCauldronRecipes] = useState<CauldronRecipe[]>([]);
  const [cauldronRecipesPage, setCauldronRecipesPage] = useState(1);
  const [totalCauldronRecipes, setTotalCauldronRecipes] = useState(0);

  const fetchMoreRecipes = useCallback(async () => {
    if (!hasMore || !user) return;
    try {
      const { recipes: newRecipes, total } = await fetchRecipesByAuthorID(
        user.user_id,
        skip,
        limit
      );
      // Use a functional update to avoid stale closures.
      setRecipes((prevRecipes) => {
        const updatedRecipes = [...prevRecipes, ...newRecipes];
        if (updatedRecipes.length >= total) {
          setHasMore(false);
        }
        return updatedRecipes;
      });
      setSkip((prevSkip) => prevSkip + limit);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    }
  }, [hasMore, user, skip, limit]);
  

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
      const updatedRecipe = await updateRecipeApi(recipe_id, recipe);
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
  const fetchUserCauldrons = useCallback(async (page: number = 1) => {
    if (!user) return;
    try {
      const offset = (page - 1) * pageSize;
      const { cauldrons: userCauldrons, total } = await getCauldronsByUser(
        user.user_id,
        offset,
        pageSize
      );
      setCauldrons(userCauldrons);
      setTotalCauldrons(total);
      setCauldronPage(page);
    } catch (error) {
      console.error("Error fetching cauldrons:", error);
    }
  }, [user]);

  const addCauldronFn = async (data: CauldronCreate): Promise<void> => {
    try {
      const newCauldron = await createCauldron(data);
      setCauldrons((prev) => [newCauldron, ...prev]);
      setTotalCauldrons((prevTotal) => prevTotal + 1);
    } catch (error) {
      console.error("Error creating cauldron:", error);
    }
  };

  const updateCauldronFn = async (cauldronId: string, data: CauldronUpdate): Promise<void> => {
    try {
      const updated = await updateCauldronApi(cauldronId, data);
      setCauldrons((prev) => prev.map((c) => (c.cauldron_id === cauldronId ? updated : c)));
    } catch (error) {
      console.error("Error updating cauldron:", error);
    }
  };

  const deleteCauldronFn = async (cauldronId: string): Promise<void> => {
    try {
      await deleteCauldron(cauldronId);
      setCauldrons((prev) => prev.filter((c) => c.cauldron_id !== cauldronId));
      setTotalCauldrons((prevTotal) => prevTotal - 1);
    } catch (error) {
      console.error("Error deleting cauldron:", error);
    }
  };

  // Combined cauldron recipes
  const fetchUserCauldronRecipes = useCallback(async (page: number = 1) => {
    if (!user) return;
    try {
      const offset = (page - 1) * pageSize;
      const { cauldron_recipes, total_cauldron_recipes } = await getCauldronRecipes(
        user.user_id,
        offset,
        pageSize
      );
      setCauldronRecipes(cauldron_recipes);
      setTotalCauldronRecipes(total_cauldron_recipes);
      setCauldronRecipesPage(page);
    } catch (error) {
      console.error("Error fetching cauldron recipes:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchMoreRecipes();
  }, [fetchMoreRecipes]);

  useEffect(() => {
    if (user) {
      fetchUserCauldrons();
      fetchUserCauldronRecipes();
    }
  }, [user, fetchUserCauldrons, fetchUserCauldronRecipes]);

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
        totalCauldrons,
        cauldronPage,
        cauldronRecipes,
        fetchUserCauldronRecipes,
        totalCauldronRecipes,
        cauldronRecipesPage,
        totalRecipes,
        currentRecipePage: recipePage,
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
