"use client";

import React, { useState } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Plus } from "lucide-react";
import { Recipe, RecipeCreate } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";
import { handleSaveRecipe } from "@/lib/api/recipe/recipe";

export default function Recipes() {
  const { recipes } = useDashboard();
  const { user } = useAuth(); // ✅ Get authenticated user from context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setIsModalOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleSaveRecipeWrapper = async (recipeData: RecipeCreate) => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }
  
    const newRecipe: RecipeCreate = {
      ...recipeData,
      author_id: user.user_id,
      tags: Array.isArray(recipeData.tags) ? recipeData.tags.map(tag => (typeof tag === "string" ? tag : (tag as { tag_id: string }).tag_id)) : [], // ✅ Fix `tag_id` issue
      ingredients: recipeData.ingredients.map(ing => ({
        ingredient_name: ing.ingredient_name,
        amount: ing.amount,
        measurement: ing.measurement,
      })),
      steps: recipeData.steps.map(step => ({
        id: step.id || `${Date.now()}`,
        step_number: step.step_number,
        description: step.description,
      })),
      images: recipeData.images.map(img => ({
        id: img.id || `${Date.now()}`,
        image_url: img.image_url,
      })),
    };
  
    console.log("Saving Recipe:", newRecipe);
    await handleSaveRecipe(newRecipe);
    setIsModalOpen(false);
  };
  
  
  

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Library</h2>
      </div>
      <div className={styles.recipeGrid}>
        <div className={styles.addRecipeCard} onClick={handleAddRecipe} aria-label="Add Recipe">
          <Plus size={48} />
        </div>

        {recipes.length > 0 ? (
          recipes.map((recipe) => (
            <div key={recipe.recipe_id} className={styles.recipeCard} onClick={() => handleEditRecipe(recipe)}>
              <div className={styles.imageContainer}>
                <img
                  src="https://picsum.photos/300/200"
                  alt={`Image of ${recipe.title}`}
                  className={styles.recipeImage}
                />
              </div>
              <div className={styles.recipeContent}>
                <div className={styles.recipeHeader}>
                  <h4>{recipe.title}</h4>
                </div>
                <div className={styles.metadataRow}>
                  <p>Tags</p>
                  <a className={styles.deleteButton} aria-label="Delete Recipe">X</a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No recipes available.</p>
        )}
      </div>

      <RecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecipeWrapper} // ✅ Use wrapper function
        recipe={selectedRecipe}
      />
    </div>
  );
}
