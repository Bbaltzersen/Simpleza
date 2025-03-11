"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import { Plus, Minus } from "lucide-react";
import { Recipe, RecipeCreate, RecipeIngredient, RecipeStep, RecipeImage } from "@/lib/types/recipe";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: RecipeCreate) => void;
  recipe?: Recipe | null;
}

export default function RecipeModal({ isOpen, onClose, onSave, recipe }: RecipeModalProps) {
  const [formData, setFormData] = useState<RecipeCreate>({
    title: "",
    description: "",
    ingredients: [],
    steps: [],
    images: [],
    tags: [],
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title,
        description: recipe.description || "",
        ingredients: recipe.ingredients || [],
        steps: recipe.steps || [],
        images: recipe.images || [],
        tags: recipe.tags.map(tag => tag.tag_id),
      });
    } else {
      setFormData({
        title: "",
        description: "",
        ingredients: [],
        steps: [],
        images: [],
        tags: [],
      });
    }
  }, [recipe, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Ingredients Handling
  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { ingredient_id: "", recipe_id: "", amount: 0, measurement: "", created_at: new Date().toISOString() },
      ],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  // Steps Handling
  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        { step_id: "", recipe_id: "", step_number: formData.steps.length + 1, description: "", created_at: new Date().toISOString() },
      ],
    });
  };

  const handleRemoveStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const handleStepChange = (index: number, value: string) => {
    const updatedSteps = [...formData.steps];
    updatedSteps[index] = { ...updatedSteps[index], description: value };
    setFormData({ ...formData, steps: updatedSteps });
  };

  // Image Handling
  const handleAddImage = () => {
    setFormData({
      ...formData,
      images: [
        ...formData.images,
        { image_id: "", recipe_id: "", image_url: "", created_at: new Date().toISOString() },
      ],
    });
  };

  const handleImageChange = (index: number, value: string) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = { ...updatedImages[index], image_url: value };
    setFormData({ ...formData, images: updatedImages });
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required />

          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} />

          {/* Ingredients */}
          <div className={styles.sectionHeader}>
            <label>Ingredients</label>
            <a className={styles.addButton} onClick={handleAddIngredient} aria-label="Add Ingredient"><Plus size={20} /></a>
          </div>
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className={styles.ingredientRow}>
              <input type="text" placeholder="Ingredient ID" value={ingredient.ingredient_id} onChange={(e) => handleIngredientChange(index, "ingredient_id", e.target.value)} />
              <input type="number" placeholder="Amount" value={ingredient.amount} onChange={(e) => handleIngredientChange(index, "amount", Number(e.target.value))} />
              <input type="text" placeholder="Measurement" value={ingredient.measurement} onChange={(e) => handleIngredientChange(index, "measurement", e.target.value)} />
              <a className={styles.iconButton} onClick={() => handleRemoveIngredient(index)} aria-label="Remove Ingredient"><Minus size={18} /></a>
            </div>
          ))}

          {/* Steps */}
          <div className={styles.sectionHeader}>
            <label>Steps</label>
            <a className={styles.addButton} onClick={handleAddStep} aria-label="Add Step"><Plus size={20} /></a>
          </div>
          {formData.steps.map((step, index) => (
            <div key={index} className={styles.stepRow}>
              <textarea placeholder={`Step ${step.step_number}`} value={step.description} onChange={(e) => handleStepChange(index, e.target.value)} />
              <a className={styles.iconButton} onClick={() => handleRemoveStep(index)} aria-label="Remove Step"><Minus size={18} /></a>
            </div>
          ))}

          {/* Images */}
          <div className={styles.sectionHeader}>
            <label>Images</label>
            <a className={styles.addButton} onClick={handleAddImage} aria-label="Add Image"><Plus size={20} /></a>
          </div>
          {formData.images.map((image, index) => (
            <div key={index} className={styles.imageRow}>
              <input type="text" placeholder="Image URL" value={image.image_url} onChange={(e) => handleImageChange(index, e.target.value)} />
              <a className={styles.iconButton} onClick={() => handleRemoveImage(index)} aria-label="Remove Image"><Minus size={18} /></a>
            </div>
          ))}

          {/* Tags */}
          <label>Tags</label>
          <input type="text" placeholder="Comma-separated tags" value={formData.tags.join(", ")} onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(tag => tag.trim()) })} />

          <div className={styles.modalFooter}>
            <a onClick={onClose} className={styles.cancelButton} aria-label="Cancel">Cancel</a>
            <button type="submit">Save Recipe</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
