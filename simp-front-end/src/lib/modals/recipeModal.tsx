"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import { Plus, Minus } from "lucide-react";
import { Recipe, RecipeCreate, RecipeIngredient, RecipeStep, RecipeImage } from "@/lib/types/recipe";

// ✅ Import Drag-and-Drop from `@dnd-kit`
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem"; // Component for sortable steps

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

  // ✅ Drag-and-Drop Sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // ✅ Handle Drag End
  const onDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = formData.steps.findIndex(step => step.step_id === active.id);
    const newIndex = formData.steps.findIndex(step => step.step_id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updatedSteps = arrayMove(formData.steps, oldIndex, newIndex).map((step, index) => ({
        ...step,
        step_number: index + 1, // Keep step numbers ordered
      }));

      setFormData({ ...formData, steps: updatedSteps });
    }
  };

  // ✅ Ingredients Handling
  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredient_id: "", amount: 0, measurement: "", recipe_id: "", created_at: new Date().toISOString() }],
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updatedIngredients = [...formData.ingredients];
    updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: updatedIngredients });
  };

  // ✅ Steps Handling
  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { step_id: `${Date.now()}`, recipe_id: "", step_number: formData.steps.length + 1, description: "", created_at: new Date().toISOString() }],
    });
  };

  const handleRemoveStep = (stepId: string) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(step => step.step_id !== stepId),
    });
  };

  const handleStepChange = (stepId: string, value: string) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(step => (step.step_id === stepId ? { ...step, description: value } : step)),
    });
  };

  // ✅ Image Handling
  const handleAddImage = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { image_id: "", recipe_id: "", image_url: "", created_at: new Date().toISOString() }],
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

  // ✅ Handle Submit
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
            <a className={styles.addButton} onClick={handleAddIngredient}><Plus size={20} /></a>
          </div>
          {formData.ingredients.map((ingredient, index) => (
            <div key={index} className={styles.ingredientRow}>
              <input type="text" placeholder="Ingredient ID" value={ingredient.ingredient_id} onChange={(e) => handleIngredientChange(index, "ingredient_id", e.target.value)} />
              <input type="number" placeholder="Amount" value={ingredient.amount} onChange={(e) => handleIngredientChange(index, "amount", Number(e.target.value))} />
              <input type="text" placeholder="Measurement" value={ingredient.measurement} onChange={(e) => handleIngredientChange(index, "measurement", e.target.value)} />
              <a className={styles.iconButton} onClick={() => handleRemoveIngredient(index)}><Minus size={18} /></a>
            </div>
          ))}

          {/* Steps */}
          <div className={styles.sectionHeader}>
            <label>Steps</label>
            <a className={styles.addButton} onClick={handleAddStep}><Plus size={20} /></a>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
            <SortableContext items={formData.steps.map(step => step.step_id)} strategy={verticalListSortingStrategy}>
              {formData.steps.map(step => (
                <SortableItem key={step.step_id} step={step} onRemove={handleRemoveStep} onChange={handleStepChange} />
              ))}
            </SortableContext>
          </DndContext>

          {/* Images */}
          <div className={styles.sectionHeader}>
            <label>Images</label>
            <a className={styles.addButton} onClick={handleAddImage}><Plus size={20} /></a>
          </div>
          {formData.images.map((image, index) => (
            <div key={index} className={styles.imageRow}>
              <input type="text" placeholder="Image URL" value={image.image_url} onChange={(e) => handleImageChange(index, e.target.value)} />
              <a className={styles.iconButton} onClick={() => handleRemoveImage(index)}><Minus size={18} /></a>
            </div>
          ))}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Save Recipe</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
