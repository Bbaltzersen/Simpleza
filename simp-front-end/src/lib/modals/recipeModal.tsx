"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import {
  RecipeCreate,
  RecipeStepCreate,
  RecipeImageCreate,
  RecipeIngredientCreate,
  RecipeTagCreate,
  ListRecipe,
} from "@/lib/types/recipe";
import { useDashboard } from "../context/dashboardContext";
import { IngredientList } from "./ingredientList/ingredientList";
import { TagList } from "./tagList/tagList";
import { ImageList } from "./imageList/imageList";
import { StepList } from "./stepList/stepList";

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

  // Create a stable version of retrieveRecipeDetails.
  const safeRetrieveRecipeDetails = useCallback(
    retrieveRecipeDetails || (() => {}),
    [retrieveRecipeDetails]
  );

  // 2. Ingredients State
  const [ingredients, setIngredients] = useState<RecipeIngredientCreate[]>([]);

  // 3. Steps State
  const [steps, setSteps] = useState<RecipeStepCreate[]>([]);

  // 4. Other Recipe Components States (Images, Tags)
  const [images, setImages] = useState<RecipeImageCreate[]>([]);
  const [tags, setTags] = useState<RecipeTagCreate[]>([]);

  // References for focusing new inputs.
  const lastInputRef = useRef<HTMLInputElement | null>(null);
  const lastTagInputRef = useRef<HTMLInputElement | null>(null);
  const lastImageInputRef = useRef<HTMLInputElement | null>(null);
  const lastStepInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset or load recipe details when modal opens or recipe changes.
  useEffect(() => {
    if (recipe) {
      safeRetrieveRecipeDetails(recipe.recipe_id);
    } else {
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
  }, [recipe, isOpen, safeRetrieveRecipeDetails]);

  // When in edit mode, update state with recipe details.
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

  // Handler for metadata changes.
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

  // --- Ingredient handlers ---
  const handleAddRow = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredient_name: "",
        amount: 0,
        measurement: "",
        position: prev.length,
        ingredient_error: "",
      } as RecipeIngredientCreate & { ingredient_error: string },
    ]);
    setTimeout(() => {
      lastInputRef.current?.focus();
    }, 0);
  }, []);

  const handleIngredientChange = useCallback(
    (index: number, field: keyof RecipeIngredientCreate, value: string | number) => {
      setIngredients((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value } as
          RecipeIngredientCreate & { ingredient_error: string };
        if (field === "ingredient_name") {
          return recalcErrors(updated);
        }
        return updated;
      });
    },
    []
  );

  const handleRemoveRow = useCallback((index: number) => {
    setIngredients((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return recalcErrors(
        filtered.map((ing, newIndex) => ({ ...ing, position: newIndex }))
      );
    });
  }, []);

  // --- Tag handlers ---
  const handleAddTagRow = useCallback(() => {
    setTags((prev) => [
      ...prev,
      { name: "", tag_error: "" } as RecipeTagCreate & { tag_error?: string },
    ]);
    setTimeout(() => {
      lastTagInputRef.current?.focus();
    }, 0);
  }, []);

  const handleTagChange = useCallback(
    (index: number, field: keyof RecipeTagCreate, value: string | number) => {
      setTags((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value } as RecipeTagCreate & { tag_error?: string };
        return updated;
      });
    },
    []
  );

  const handleRemoveTagRow = useCallback((index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Image handlers ---
  const handleAddImageRow = useCallback(() => {
    setImages((prev) => [
      ...prev,
      { image_url: "" } as RecipeImageCreate,
    ]);
    setTimeout(() => {
      lastImageInputRef.current?.focus();
    }, 0);
  }, []);

  const handleImageChange = useCallback(
    (index: number, field: keyof RecipeImageCreate, value: string) => {
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value } as RecipeImageCreate;
        return updated;
      });
    },
    []
  );

  const handleRemoveImageRow = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Step handlers ---
  const handleAddStepRow = useCallback(() => {
    setSteps((prev) => [
      ...prev,
      {
        step_number: prev.length + 1,
        description: "",
      } as RecipeStepCreate,
    ]);
    setTimeout(() => {
      lastStepInputRef.current?.focus();
    }, 0);
  }, []);

  const handleStepChange = useCallback(
    (index: number, field: keyof RecipeStepCreate, value: string | number) => {
      setSteps((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value } as RecipeStepCreate;
        return updated;
      });
    },
    []
  );

  const handleRemoveStepRow = useCallback((index: number) => {
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Reassign step numbers
      return filtered.map((step, idx) => ({
        ...step,
        step_number: idx + 1,
      }));
    });
  }, []);

  // Handle form submission by merging all state values.
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
        {/* Modal Header with Close Button */}
        <div className={styles.modalHeader}>
          <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.formContainer}>
            {/* Recipe Metadata */}
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

            {/* Step Section */}
            <StepList
              steps={steps}
              onAdd={handleAddStepRow}
              onChange={handleStepChange}
              onRemove={handleRemoveStepRow}
              lastInputRef={lastStepInputRef}
            />

            {/* Image Section */}
            <ImageList
              images={images}
              onAdd={handleAddImageRow}
              onChange={handleImageChange}
              onRemove={handleRemoveImageRow}
              lastInputRef={lastImageInputRef}
            />

            {/* Tag Section */}
            <TagList
              tags={tags}
              onAdd={handleAddTagRow}
              onChange={handleTagChange}
              onRemove={handleRemoveTagRow}
              lastInputRef={lastTagInputRef}
            />

            {/* Submit Button */}
            <div className={styles.submitContainer}>
              <button type="submit">Submit Recipe</button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export { RecipeModal };
