"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Modal from "@/components/ui/modal";
import { RecipeCreate, RecipeStepCreate, RecipeImageCreate, RecipeIngredientCreate, RecipeTagCreate, ListRecipe } from "@/lib/types/recipe";
import { useDashboard } from "../context/dashboardContext";
import { IngredientList } from "./ingredientList/ingredientList";
import { TagList } from "./tagList/tagList";
import { ImageList } from "./imageList/imageList";
import { StepList } from "./stepList/stepList";
import styles from "./recipeModal.module.css"
import { Cross, TrashIcon, X } from "lucide-react";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: RecipeCreate) => void;
  recipe?: ListRecipe | null;
}

export default function RecipeModal({ isOpen, onClose, onSave, recipe }: RecipeModalProps) {
  const [recipeMetadata, setRecipeMetadata] = useState({
    title: "",
    description: "",
    front_image: "",
    author_id: "",
  });
  const { recipe_details, retrieveRecipeDetails } = useDashboard();
  const safeRetrieveRecipeDetails = useCallback(retrieveRecipeDetails || (() => { }), [retrieveRecipeDetails]);
  const [ingredients, setIngredients] = useState<RecipeIngredientCreate[]>([]);
  const [steps, setSteps] = useState<RecipeStepCreate[]>([]);
  const [images, setImages] = useState<RecipeImageCreate[]>([]);
  const [tags, setTags] = useState<RecipeTagCreate[]>([]);
  const lastInputRef = useRef<HTMLInputElement | null>(null);
  const lastTagInputRef = useRef<HTMLInputElement | null>(null);
  const lastImageInputRef = useRef<HTMLInputElement | null>(null);
  const lastStepInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (recipe) {
      safeRetrieveRecipeDetails(recipe.recipe_id);
    } else {
      setRecipeMetadata({ title: "", description: "", front_image: "", author_id: "" });
      setIngredients([]);
      setSteps([]);
      setImages([]);
      setTags([]);
    }
  }, [recipe, isOpen, safeRetrieveRecipeDetails]);

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

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRecipeMetadata((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const recalcErrors = (updatedIngredients: RecipeIngredientCreate[]): RecipeIngredientCreate[] => {
    const names = updatedIngredients.map((ing) => ing.ingredient_name.trim().toLowerCase());
    return updatedIngredients.map((ing) => {
      if (ing.ingredient_name && names.filter((name) => name === ing.ingredient_name.trim().toLowerCase()).length > 1) {
        return { ...ing, ingredient_error: "Duplicate ingredient not allowed." } as RecipeIngredientCreate & { ingredient_error: string };
      }
      return { ...ing, ingredient_error: "" } as RecipeIngredientCreate & { ingredient_error: string };
    });
  };

  const handleAddRow = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      { ingredient_name: "", amount: undefined, measurement: "", position: prev.length, ingredient_error: "" } as unknown as RecipeIngredientCreate & { ingredient_error: string },
    ]);
    setTimeout(() => { lastInputRef.current?.focus(); }, 0);
  }, []);

  const handleIngredientChange = useCallback((index: number, field: keyof RecipeIngredientCreate, value: string | number) => {
    setIngredients((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as RecipeIngredientCreate & { ingredient_error: string };
      if (field === "ingredient_name") return recalcErrors(updated);
      return updated;
    });
  }, []);

  const handleRemoveRow = useCallback((index: number) => {
    setIngredients((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return recalcErrors(filtered.map((ing, newIndex) => ({ ...ing, position: newIndex })));
    });
  }, []);

  const handleAddTagRow = useCallback(() => {
    setTags((prev) => [...prev, { name: "", tag_error: "" } as RecipeTagCreate & { tag_error?: string }]);
    setTimeout(() => { lastTagInputRef.current?.focus(); }, 0);
  }, []);

  const handleTagChange = useCallback((index: number, field: keyof RecipeTagCreate, value: string | number) => {
    setTags((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as RecipeTagCreate & { tag_error?: string };
      return updated;
    });
  }, []);

  const handleRemoveTagRow = useCallback((index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddImageRow = useCallback(() => {
    setImages((prev) => [...prev, { image_url: "" } as RecipeImageCreate]);
    setTimeout(() => { lastImageInputRef.current?.focus(); }, 0);
  }, []);

  const handleImageChange = useCallback((index: number, field: keyof RecipeImageCreate, value: string) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as RecipeImageCreate;
      return updated;
    });
  }, []);

  const handleRemoveImageRow = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddStepRow = useCallback(() => {
    setSteps((prev) => [...prev, { step_number: prev.length + 1, description: "" } as RecipeStepCreate]);
    setTimeout(() => { lastStepInputRef.current?.focus(); }, 0);
  }, []);

  const handleStepChange = useCallback((index: number, field: keyof RecipeStepCreate, value: string | number) => {
    setSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as RecipeStepCreate;
      return updated;
    });
  }, []);

  const handleRemoveStepRow = useCallback((index: number) => {
    setSteps((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((step, idx) => ({ ...step, step_number: idx + 1 }));
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ ...recipeMetadata, ingredients, steps, images, tags });
    onClose();
  };

  // New helper to handle click on the <a> submit button
  const handleLinkSubmit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Create a fake event object with preventDefault so that handleSubmit can be called.
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    handleSubmit(fakeEvent);
  };

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.recipeModalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.mainTitle}>
            <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
            {recipe ? <TrashIcon size={16} color="red"/> : ""}
          </div>
          <a type="button" className={styles.closeButton} onClick={onClose}><X size={20} /></a>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formContainer}>
            <div className={styles.inputContainer}>
              <div className={styles.inputTitle}>
                <label htmlFor="title">Title:</label>
                <input className={styles.titleInput} id="title" type="text" name="title" value={recipeMetadata.title} onChange={handleMetadataChange} required />
              </div>
            </div>
            <div className={styles.descriptionContainer}>
              <div className={styles.inputTitle}>
                <label htmlFor="description">Description:</label>
              </div>
              <textarea
                id="description"
                name="description"
                value={recipeMetadata.description}
                onChange={(e) => {
                  handleMetadataChange(e); // your existing state update
                  autoResize(e);
                }}
                required
              />
            </div>
            <IngredientList ingredients={ingredients} onAdd={handleAddRow} onChange={handleIngredientChange} onRemove={handleRemoveRow} lastInputRef={lastInputRef} />
            <StepList steps={steps} onAdd={handleAddStepRow} onChange={handleStepChange} onRemove={handleRemoveStepRow} lastInputRef={lastStepInputRef} />
            <ImageList images={images} onAdd={handleAddImageRow} onChange={handleImageChange} onRemove={handleRemoveImageRow} lastInputRef={lastImageInputRef} />
            {/* <TagList tags={tags} onAdd={handleAddTagRow} onChange={handleTagChange} onRemove={handleRemoveTagRow} lastInputRef={lastTagInputRef} /> */}
            <div className={styles.submitContainer}>
              <a href="#" onClick={handleLinkSubmit} className={styles.submitButton}>Submit</a>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export { RecipeModal };
