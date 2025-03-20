"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import {
  RecipeCreate,
  RecipeStepCreate,
  RecipeImageCreate,
  RecipeIngredientCreate,
  ListRecipe,
  RecipeTagCreate,
} from "@/lib/types/recipe";
import { useDashboard } from "../context/dashboardContext";
import { IngredientList } from "./ingredientForm/ingredientForm";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: RecipeCreate) => void;
  recipe?: ListRecipe | null;
}

export default function RecipeModal({
  isOpen,
  onClose,
  onSave,
  recipe,
}: RecipeModalProps) {
  // 1. Recipe Metadata State
  const [recipeMetadata, setRecipeMetadata] = useState({
    title: "",
    description: "",
    front_image: "",
    author_id: "",
  });
  const { recipe_details, retrieveRecipeDetails } = useDashboard();

  // Create a stable version of retrieveRecipeDetails to ensure a constant dependency array.
  const safeRetrieveRecipeDetails = useCallback(
    retrieveRecipeDetails || (() => {}),
    [retrieveRecipeDetails]
  );

  // 2. Ingredients State
  const [ingredients, setIngredients] = useState<RecipeIngredientCreate[]>([]);

  // 3. Other Recipe Components States (for future expansion)
  const [steps, setSteps] = useState<RecipeStepCreate[]>([]);
  const [images, setImages] = useState<RecipeImageCreate[]>([]);
  const [tags, setTags] = useState<RecipeTagCreate[]>([]);

  // Reference for focusing new ingredient rows.
  const lastInputRef = useRef<HTMLInputElement | null>(null);

  // This effect runs every time the modal is opened or the recipe prop changes.
  useEffect(() => {
    if (recipe) {
      // Retrieve recipe details when a recipe is provided.
      safeRetrieveRecipeDetails(recipe.recipe_id);
    } else {
      // Reset state if no recipe is provided.
      setRecipeMetadata({
        title: "",
        description: "",
        front_image: "",
        author_id: "",
      });
      setIngredients([]);
      setSteps([]);
      setImages([]);
      setTags([]);
    }
    // Note: The dependency array now always has the same size.
  }, [recipe, isOpen, safeRetrieveRecipeDetails]);

  // Only update the form state from recipe_details if we're in edit mode.
  useEffect(() => {
    if (recipe && recipe_details) {
      setRecipeMetadata({
        title: recipe_details.title || "",
        description: recipe_details.description || "",
        front_image: recipe_details.front_image || "",
        author_id: recipe_details.author_id || "",
      });
      setIngredients(recipe_details.ingredients || []);
      setSteps(recipe_details.steps || []);
      setImages(recipe_details.images || []);
      setTags(recipe_details.tags || []);
    }
  }, [recipe_details, recipe]);

  // Handler for recipe metadata (title, description, etc.)
  const handleMetadataChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRecipeMetadata((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Helper to recalc duplicate errors on ingredients.
  const recalcErrors = (
    updatedIngredients: RecipeIngredientCreate[]
  ): RecipeIngredientCreate[] => {
    const names = updatedIngredients.map((ing) =>
      ing.ingredient_name.trim().toLowerCase()
    );
    return updatedIngredients.map((ing) => {
      if (
        ing.ingredient_name &&
        names.filter(
          (name) => name === ing.ingredient_name.trim().toLowerCase()
        ).length > 1
      ) {
        return {
          ...ing,
          ingredient_error: "Duplicate ingredient not allowed.",
        } as RecipeIngredientCreate & { ingredient_error: string };
      }
      return { ...ing, ingredient_error: "" } as RecipeIngredientCreate & {
        ingredient_error: string;
      };
    });
  };

  // Add a new ingredient row.
  const handleAddRow = useCallback(() => {
    setIngredients((prev) => {
      const newIngredients = [
        ...prev,
        {
          ingredient_name: "",
          amount: 0,
          measurement: "",
          position: prev.length,
          ingredient_error: "",
        } as RecipeIngredientCreate & { ingredient_error: string },
      ];
      return newIngredients;
    });

    setTimeout(() => {
      lastInputRef.current?.focus();
    }, 0);
  }, []);

  // Update an ingredient and recalc errors.
  const handleIngredientChange = useCallback(
    (index: number, field: keyof RecipeIngredientCreate, value: string | number) => {
      setIngredients((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value } as
          | RecipeIngredientCreate
          & { ingredient_error: string };
        if (field === "ingredient_name") {
          return recalcErrors(updated);
        }
        return updated;
      });
    },
    []
  );

  // Remove an ingredient and recalc errors.
  const handleRemoveRow = useCallback((index: number) => {
    setIngredients((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return recalcErrors(
        filtered.map((ing, newIndex) => ({ ...ing, position: newIndex }))
      );
    });
  }, []);

  // Handle form submission by merging the states.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({
      ...recipeMetadata,
      ingredients,
      steps,
      images,
      tags,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.recipeModalContainer}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formContainer}>
            {/* Recipe Metadata Inputs */}
            <div className={styles.inputContainer}>
              <label htmlFor="title">Title:</label>
              <input
                id="title"
                type="text"
                name="title"
                value={recipeMetadata.title}
                onChange={handleMetadataChange}
                required
              />
            </div>
            <div className={styles.inputContainer}>
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={recipeMetadata.description}
                onChange={handleMetadataChange}
                required
              />
            </div>

            {/* Ingredient Section */}
            <IngredientList
              ingredients={ingredients}
              onAdd={handleAddRow}
              onChange={handleIngredientChange}
              onRemove={handleRemoveRow}
              lastInputRef={lastInputRef}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}

export { RecipeModal };
