"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import {
  RecipeCreate,
  RecipeStepCreate,
  RecipeImageCreate,
  RecipeRetrieve,
  RecipeIngredientCreate,
} from "@/lib/types/recipe";
import { Minus, Plus, Trash } from "lucide-react";
import IngredientList from "./ingredientList";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import TagInput from "./tagSelector";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: RecipeCreate) => void;
  recipe?: RecipeRetrieve | null;
}

export default function RecipeModal({ isOpen, onClose, onSave, recipe }: RecipeModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    ingredients: RecipeIngredientCreate[];
    steps: RecipeStepCreate[];
    images: RecipeImageCreate[];
    tags: string[];
  }>({
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
        ingredients: recipe.ingredients.map(ing => ({
          id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          amount: ing.amount,
          measurement: ing.measurement,
        })),
        steps: recipe.steps.map(step => ({
          id: step.step_id,
          step_number: step.step_number,
          description: step.description,
        })),
        images: recipe.images.map(image => ({
          id: image.image_id,
          image_url: image.image_url,
        })),
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

  const addItem = (type: "ingredients" | "steps" | "images", newItem: any) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { id: `${Date.now()}`, ...newItem }],
    }));
  };

  const removeItem = (type: "ingredients" | "steps" | "images", index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const changeItem = (type: "steps" | "images", index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedItems = [...prev[type]];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, [type]: updatedItems };
    });
  };

  const handleIngredientSelect = (index: number, ingredient: any, amount: string, measurement: string) => {
    setFormData(prev => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = {
        id: ingredient ? ingredient.ingredient_id : `${Date.now()}`,
        ingredient_name: ingredient ? ingredient.name : "",
        amount: amount ? parseFloat(amount) : 0,
        measurement,
      };
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
          <div className={styles.titleContainer}>
            <label className={styles.labelText}>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className={styles.descriptionContainer}>
            <label className={styles.labelText}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </div>

          {/* ✅ Use IngredientList */}
          <IngredientList
            ingredients={formData.ingredients}
            onAdd={() => addItem("ingredients", { ingredient_name: "", amount: "", measurement: "" })}
            onRemove={(index) => removeItem("ingredients", index)}
            onSelect={handleIngredientSelect}
          />

          {/* ✅ Steps Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Steps</label>
              <a type="button" className={styles.addButton} onClick={() => addItem("steps", { step_number: formData.steps.length + 1, description: "" })}>
                <Plus size={20} />
              </a>
            </div>
            {formData.steps.map((step, index) => (
              <div key={index} className={styles.sortableRow}>
                <input
                  type="text"
                  placeholder="Step Description"
                  value={step.description}
                  onChange={(e) => changeItem("steps", index, "description", e.target.value)}
                  className={styles.input}
                />
                <a className={styles.iconButton} onClick={() => removeItem("steps", index)}>
                  <Minus size={20} />
                </a>
              </div>
            ))}
          </div>

          {/* ✅ Images Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Images</label>
              <a type="button" className={styles.addButton} onClick={() => addItem("images", { image_url: "" })}>
                <Plus size={20} />
              </a>
            </div>
            {formData.images.map((image, index) => (
              <div key={index} className={styles.sortableRow}>
                <input
                  type="text"
                  placeholder="Image URL"
                  value={image.image_url}
                  onChange={(e) => changeItem("images", index, "image_url", e.target.value)}
                  className={styles.input}
                />
                <a className={styles.iconButton} onClick={() => removeItem("images", index)}>
                  <Minus size={20} />
                </a>
              </div>
            ))}
          </div>

          {/* Tags Section */}
          <div>
            <label className={styles.labelText}>Tags</label>
            <TagInput selectedTags={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save Recipe</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
