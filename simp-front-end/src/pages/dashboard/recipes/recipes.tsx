"use client";

import React, { useState } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Plus } from "lucide-react";
import { Recipe, RecipeCreate } from "@/lib/types/recipe";

export default function Recipes() {
  const { recipes } = useDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Open modal for adding a recipe
  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing recipe
  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  // Handle saving a new or updated recipe
  const handleSaveRecipe = (recipeData: RecipeCreate) => {
    console.log("Saving Recipe:", recipeData);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Library</h2>
      </div>
      <div className={styles.recipeGrid}>
        {/* Add Recipe Button */}
        <div className={styles.addRecipeCard} onClick={handleAddRecipe} aria-label="Add Recipe">
          <Plus size={48} />
        </div>

        {/* Recipe Cards */}
        {recipes.length > 0 ? (
          [...Array(12)].flatMap(() => recipes).map((recipe, index) => (
            <div key={`${recipe.recipe_id}-${index}`} className={styles.recipeCard} onClick={() => handleEditRecipe(recipe)}>
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

      {/* Modal for Adding/Editing Recipes */}
      <RecipeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveRecipe} recipe={selectedRecipe} />
    </div>
  );
}
