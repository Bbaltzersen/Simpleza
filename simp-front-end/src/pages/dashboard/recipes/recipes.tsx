"use client";

import React, { useState, useRef, useCallback } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Plus } from "lucide-react";
import { ListRecipe, RecipeCreate, RecipeRetrieve } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";
import { fetchRecipeById } from "@/lib/api/recipe/recipe";

export default function Recipes() {
  const { recipes, fetchMoreRecipes, addRecipe, hasMore } = useDashboard(); // ✅ Use context functions
  const { user } = useAuth(); // ✅ Get authenticated user from context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRetrieve | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastRecipeRef = useCallback(
    (node: HTMLDivElement) => {
      if (!hasMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreRecipes();
        }
      });

      if (node) observer.current.observe(node);
    },
    [hasMore, fetchMoreRecipes]
  );

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setIsModalOpen(true);
  };

  const handleEditRecipe = async (recipe: ListRecipe) => {
    const retRecipe = await fetchRecipeById(recipe.recipe_id);
    setSelectedRecipe(retRecipe);
    setIsModalOpen(true);
  };

  const handleSaveRecipeWrapper = async (recipeData: RecipeCreate) => {
    // if (!user) {
    //   console.error("User is not authenticated");
    //   return;
    // }

    // const newRecipe: RecipeCreate = {
    //   ...recipeData,
    //   author_id: user.user_id,
    //   tags: Array.isArray(recipeData.tags) ? recipeData.tags.map(tag => (typeof tag === "string" ? tag : (tag as { tag_id: string }).tag_id)) : [],
    //   ingredients: recipeData.ingredients.map(ing => ({
    //     id: ing.id || `${Date.now()}`,
    //     ingredient_name: ing.ingredient_name,
    //     amount: ing.amount,
    //     measurement: ing.measurement,
    //   })),
    //   steps: recipeData.steps.map(step => ({
    //     id: step.id || `${Date.now()}`,
    //     step_number: step.step_number,
    //     description: step.description,
    //   })),
    //   images: recipeData.images.map(img => ({
    //     id: img.id || `${Date.now()}`,
    //     image_url: img.image_url,
    //   })),
    // };

    // await addRecipe(newRecipe);
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
          recipes.map((recipe, index) => (
            <div
              key={recipe.recipe_id}
              className={styles.recipeCard}
              ref={index === recipes.length - 1 ? lastRecipeRef : null} // Attach observer to last recipe
              onClick={() => handleEditRecipe(recipe)}
            >
              <div className={styles.imageContainer}>
                <img
                  src={recipe.front_image || "https://picsum.photos/300/200"}
                  alt={`Image of ${recipe.title}`}
                  className={styles.recipeImage}
                />
              </div>
              <div className={styles.recipeContent}>
                <div className={styles.recipeHeader}>
                  <h4>{recipe.title}</h4>
                </div>
                <div className={styles.metadataRow}>
                  <p>Tags: {recipe.tags.join(", ")}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No recipes available.</p>
        )}
      </div>

      {hasMore && <p>Loading more recipes...</p>}

      <RecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecipeWrapper}
        recipe={selectedRecipe}
      />
    </div>
  );
}
