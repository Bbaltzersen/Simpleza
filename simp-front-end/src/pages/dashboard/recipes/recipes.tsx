"use client";
import React, { useState, useRef, useCallback } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Icon, Plus } from "lucide-react";
import { cauldron } from '@lucide/lab';
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";

export default function Recipes() {
  const { recipes, fetchMoreRecipes, addRecipe, updateRecipe, hasMore } = useDashboard();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ListRecipe | null>(null);
  const [modalKey, setModalKey] = useState<string>("new");
  const observer = useRef<IntersectionObserver | null>(null);

  const lastRecipeRef = useCallback(
    (node: HTMLDivElement) => {
      if (!hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) fetchMoreRecipes();
      });
      if (node) observer.current.observe(node);
    },
    [hasMore, fetchMoreRecipes]
  );

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setModalKey(`new-${Date.now()}`);
    setIsModalOpen(true);
  };

  const handleEditRecipe = async (recipe: ListRecipe) => {
    setSelectedRecipe(recipe);
    setModalKey(recipe.recipe_id);
    setIsModalOpen(true);
  };

  const handleSaveRecipeWrapper = async (recipeData: RecipeCreate) => {
    if (!user) {
      console.error("User is not authenticated");
      return;
    }
    recipeData.author_id = user.user_id;
    if (recipeData.images && recipeData.images.length > 0) {
      recipeData.front_image = recipeData.images[0].image_url;
    }
    if (selectedRecipe && selectedRecipe.recipe_id) {
      await updateRecipe(selectedRecipe.recipe_id, recipeData);
    } else {
      await addRecipe(recipeData);
    }
    // Clear the selected recipe and close the modal after save.
    setSelectedRecipe(null);
    setIsModalOpen(false);
  };

  const allRecipes: ListRecipe[] = [...recipes];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Library</h2>
      </div>
      <div className={styles.recipeGrid}>
        <div
          className={styles.addRecipeCard}
          onClick={handleAddRecipe}
          aria-label="Add Recipe"
        >
          <Plus size={48} />
        </div>
        {allRecipes.length > 0 ? (
          allRecipes.map((recipe, index) => (
            <div
              key={recipe.recipe_id}
              className={styles.recipeCard}
              ref={index === allRecipes.length - 1 ? lastRecipeRef : null}
              onClick={() => handleEditRecipe(recipe)}
            >
              <button
                className={styles.cauldronButton}
                onClick={(e) => {
                  e.stopPropagation();
                  // Optional: add any specific functionality for the cauldron icon here.
                }}
              >
                 <Icon className={styles.cauldronButton} iconNode={cauldron} />
              </button>
              <div className={styles.imageContainer}>
                <img
                  src={recipe.front_image || "https://picsum.photos/300/200"}
                  alt={`${recipe.title}`}
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
      {/* Updated onClose: clear selectedRecipe and then close modal */}
      <RecipeModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedRecipe(null);
          setIsModalOpen(false);
        }}
        onSave={handleSaveRecipeWrapper}
        recipe={selectedRecipe}
      />
    </div>
  );
}
