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
import TagInput from "./tagSelector";

// dnd-kit imports
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem";
import SortableIngredientRow from "./sortableIngredientRow";

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
        steps: recipe.steps.map((step, index) => ({
          id: step.step_id,
          step_number: index + 1,
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

  // Updated addItem to always use string IDs.
  const addItem = (type: "ingredients" | "steps" | "images", newItem: any) => {
    setFormData((prev) => ({
      ...prev,
      [type]: [
        ...prev[type],
        {
          id: Date.now().toString(),
          ...newItem,
        },
      ],
    }));
  };

  // For images, we keep index-based removal.
  const removeItem = (type: "images", index: number) => {
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

  // Ingredient-specific functions now use id-based updates.
  const handleIngredientSelect = (
    id: string,
    ingredient: any,
    amount: string,
    measurement: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing) =>
        ing.id === id
          ? {
              ...ing,
              // If an ingredient is selected, update its data; otherwise keep current.
              ingredient_name: ingredient ? ingredient.name : "",
              amount: amount ? parseFloat(amount) : 0,
              measurement,
            }
          : ing
      ),
    }));
  };

  const removeIngredient = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((ing) => ing.id !== id),
    }));
  };

  const handleIngredientDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.ingredients.findIndex((ing) => ing.id === active.id);
        const newIndex = prev.ingredients.findIndex((ing) => ing.id === over.id);
        return {
          ...prev,
          ingredients: arrayMove(prev.ingredients, oldIndex, newIndex),
        };
      });
    }
  };

  // Steps-specific functions with step number updates.
  const addStep = () => {
    setFormData((prev) => {
      const newStep: RecipeStepCreate = {
        id: Date.now().toString(),
        step_number: prev.steps.length + 1,
        description: "",
      };
      return { ...prev, steps: [...prev.steps, newStep] };
    });
  };

  const changeStep = (id: string, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === id ? { ...step, [field]: value } : step)),
    }));
  };

  const removeStep = (id: string) => {
    setFormData((prev) => {
      const newSteps = prev.steps.filter((step) => step.id !== id);
      // Reassign step numbers based on new order.
      return { 
        ...prev, 
        steps: newSteps.map((step, index) => ({ ...step, step_number: index + 1 })) 
      };
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.steps.findIndex((step) => step.id === active.id);
        const newIndex = prev.steps.findIndex((step) => step.id === over.id);
        const movedSteps = arrayMove(prev.steps, oldIndex, newIndex);
        return {
          ...prev,
          steps: movedSteps.map((step, index) => ({ ...step, step_number: index + 1 })),
        };
      });
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

          {/* Draggable Ingredients Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label className={styles.labelText}>Ingredients</label>
              <button
                type="button"
                className={styles.addButton}
                onClick={() =>
                  addItem("ingredients", { ingredient_name: "", amount: "", measurement: "" })
                }
              >
                <Plus size={20} />
              </button>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleIngredientDragEnd}>
              <SortableContext items={formData.ingredients.map((ing) => ing.id)} strategy={verticalListSortingStrategy}>
                {formData.ingredients.map((ingredient) => (
                  <SortableIngredientRow
                    key={ingredient.id}
                    ingredient={ingredient}
                    onSelect={handleIngredientSelect}
                    onRemove={removeIngredient}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Steps Section with drag-and-drop reordering and step number display */}
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
