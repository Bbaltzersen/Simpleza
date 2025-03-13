"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import { Plus } from "lucide-react";
import {
  Recipe,
  RecipeCreate,
  RecipeIngredientCreate,
  RecipeStepCreate,
  RecipeImageCreate,
  RecipeRetrieve,
} from "@/lib/types/recipe";
import { SortableItem } from "./sortableItem";

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

  const sensors = useSensors(useSensor(PointerSensor));

  const onDragEnd = (event: any, type: "steps" | "ingredients" | "images") => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const updatedItems = arrayMove(
      [...formData[type]],
      formData[type].findIndex((item) => item.id === active.id),
      formData[type].findIndex((item) => item.id === over.id)
    );

    // For steps, you might want to reindex the step_number here if needed.
    setFormData({ ...formData, [type]: updatedItems });
  };

  const addItem = (type: "steps" | "ingredients" | "images", newItem: any) => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], { id: `${Date.now()}`, ...newItem }],
    }));
  };

  const removeItem = (type: "steps" | "ingredients" | "images", id: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== id),
    }));
  };

  const changeItem = (type: "steps" | "ingredients" | "images", id: string, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map(item => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Ensure all fields contain the necessary properties before submission
    const cleanedData: RecipeCreate = {
        ...formData,
        ingredients: formData.ingredients.map(({ id, ingredient_name, amount, measurement }) => ({
            id, // ✅ Ensure `id` is included
            ingredient_name,
            amount,
            measurement,
        })),
        steps: formData.steps.map(({ id, step_number, description }) => ({
            id, // ✅ Ensure `id` is included
            step_number,
            description,
        })),
        images: formData.images.map(({ id, image_url }) => ({
            id, // ✅ Ensure `id` is included
            image_url,
        })),
    };

    onSave(cleanedData);
    onClose();
};

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.modalContent}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.titleContainer}>
            <label className={styles.labelText}>Title</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>
          <div className={styles.descriptionContainer}>
            <label className={styles.labelText}>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </div>

          {/* Ingredients Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Ingredients</label>
              <a className={styles.addButton} onClick={() => addItem("ingredients", { ingredient_id: "", amount: 0, measurement: "" })}>
                <Plus size={20} />
              </a>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={(event) => onDragEnd(event, "ingredients")} sensors={sensors}>
              <SortableContext items={formData.ingredients.map(ing => ing.id)} strategy={verticalListSortingStrategy}>
                {formData.ingredients.map(ingredient => (
                  <SortableItem
                    key={ingredient.id}
                    item={ingredient}
                    onRemove={() => removeItem("ingredients", ingredient.id)}
                    onChange={(id, field, value) => changeItem("ingredients", id, field, value)}
                    fields={[
                      { key: "ingredient_name", type: "text", placeholder: "Ingredient Name" },
                      { key: "amount", type: "number", placeholder: "Amount" },
                      { key: "measurement", type: "text", placeholder: "Measurement" },
                    ]}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Steps Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Steps</label>
              <a className={styles.addButton} onClick={() => addItem("steps", { step_number: formData.steps.length + 1, description: "" })}>
                <Plus size={20} />
              </a>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={(event) => onDragEnd(event, "steps")} sensors={sensors}>
              <SortableContext items={formData.steps.map(step => step.id)} strategy={verticalListSortingStrategy}>
                {formData.steps.map(step => (
                  <SortableItem
                    key={step.id}
                    item={step}
                    onRemove={() => removeItem("steps", step.id)}
                    onChange={(id, field, value) => changeItem("steps", id, field, value)}
                    fields={[
                      { key: "description", type: "text", placeholder: "Step Description" },
                    ]}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          {/* Images Section */}
          <div>
            <div className={styles.sectionHeader}>
              <label>Images</label>
              <a className={styles.addButton} onClick={() => addItem("images", { image_url: "" })}>
                <Plus size={20} />
              </a>
            </div>
            <DndContext collisionDetection={closestCenter} onDragEnd={(event) => onDragEnd(event, "images")} sensors={sensors}>
              <SortableContext items={formData.images.map(image => image.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.imageRow}>
                  {formData.images.map(image => (
                    <SortableItem
                      key={image.id}
                      item={image}
                      onRemove={() => removeItem("images", image.id)}
                      onChange={(id, field, value) => changeItem("images", id, field, value)}
                      fields={[
                        { key: "image_url", type: "text", placeholder: "Image URL" },
                      ]}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

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
