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
import { Minus, Plus } from "lucide-react";
import IngredientList from "./ingredientList";
import TagInput from "./tagSelector";

// dnd-kit imports
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem";

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
        ingredients: recipe.ingredients.map((ing) => ({
          id: ing.ingredient_id,
          ingredient_name: ing.ingredient_name,
          amount: ing.amount,
          measurement: ing.measurement,
        })),
        steps: recipe.steps.map((step) => ({
          id: step.step_id,
          step_number: step.step_number,
          description: step.description,
        })),
        images: recipe.images.map((image) => ({
          id: image.image_id,
          image_url: image.image_url,
        })),
        tags: recipe.tags.map((tag) => tag.tag_id),
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

  // For ingredients and images we continue using index-based removal
  const addItem = (type: "ingredients" | "steps" | "images", newItem: any) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [
        ...prev[type],
        {
          // For steps, use a string ID to match the SortableItem interface
          id: type === "steps" ? Date.now().toString() : Date.now(),
          ...newItem,
        },
      ],
    }));
  };

  const removeItem = (type: "ingredients" | "images", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const changeItem = (type: "images", index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updatedItems = [...prev[type]];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, [type]: updatedItems };
    });
  };

  const handleIngredientSelect = (
    index: number,
    ingredient: any,
    amount: string,
    measurement: string
  ) => {
    setFormData((prev) => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = {
        id: ingredient ? ingredient.ingredient_id : Date.now(),
        ingredient_name: ingredient ? ingredient.name : "",
        amount: amount ? parseFloat(amount) : 0,
        measurement,
      };
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  // Steps-specific functions using id-based updates/removal
  const addStep = () => {
    const newStep: RecipeStepCreate = {
      id: Date.now().toString(),
      step_number: formData.steps.length + 1,
      description: "",
    };
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const changeStep = (id: string, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === id ? { ...step, [field]: value } : step)),
    }));
  };

  const removeStep = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== id),
    }));
  };

  // Drag end handler for steps reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = formData.steps.findIndex((step) => step.id === active.id);
      const newIndex = formData.steps.findIndex((step) => step.id === over.id);
      setFormData((prev) => ({
        ...prev,
        steps: arrayMove(prev.steps, oldIndex, newIndex),
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(formData);
            onClose();
          }}
        >
          <div className={styles.titleContainer}>
            <label className={styles.labelText}>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className={styles.descriptionContainer}>
            <label className={styles.labelText}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </div>

          {/* Ingredients Section */}
          <IngredientList
            ingredients={formData.ingredients}
            onAdd={() =>
              addItem("ingredients", { ingredient_name: "", amount: "", measurement: "" })
            }
            onRemove={(index) => removeItem("ingredients", index)}
            onSelect={handleIngredientSelect}
          />

          {/* Steps Section with drag-and-drop reordering using SortableItem */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Steps</label>
              <button type="button" className={styles.addButton} onClick={addStep}>
                <Plus size={20} />
              </button>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={formData.steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
                {formData.steps.map((step) => (
                  <SortableItem
                    key={step.id}
                    item={step}
                    fields={[{ key: "description", type: "text", placeholder: "Step Description" }]}
                    onChange={(id, field, value) => changeStep(id, field, value)}
                    onRemove={(id) => removeStep(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Images Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Images</label>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => addItem("images", { image_url: "" })}
              >
                <Plus size={20} />
              </button>
            </div>
            {formData.images.map((image, index) => (
              <div key={image.id} className={styles.sortableRow}>
                <input
                  type="text"
                  placeholder="Image URL"
                  value={image.image_url}
                  onChange={(e) => changeItem("images", index, "image_url", e.target.value)}
                  className={styles.input}
                />
                <button type="button" className={styles.iconButton} onClick={() => removeItem("images", index)}>
                  <Minus size={20} />
                </button>
              </div>
            ))}
          </div>

          {/* Tags Section */}
          <div>
            <label className={styles.labelText}>Tags</label>
            <TagInput selectedTags={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit">Save Recipe</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
