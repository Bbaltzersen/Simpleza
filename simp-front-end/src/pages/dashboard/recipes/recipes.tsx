"use client";
import React, { useState, useRef, useCallback } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Icon, Plus } from "lucide-react";
import { cauldron } from "@lucide/lab";
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";

export default function Recipes() {
  const {
    recipes,
    fetchMoreRecipes,
    addRecipe,
    updateRecipe,
    hasMore,
    cauldronRecipes,
    fetchUserCauldronRecipes,
    addCauldron,
    deleteCauldron,
  } = useDashboard();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ListRecipe | null>(null);
  const [modalKey, setModalKey] = useState<string>("new");
  const observer = useRef<IntersectionObserver | null>(null);

  const lastRecipeRef = useCallback(
    (node: HTMLDivElement) => {
      if (observer.current) observer.current.disconnect();
      if (!hasMore) return;
      // Set observer options to trigger slightly before the element fully enters view.
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            fetchMoreRecipes();
          }
        },
        { threshold: 0.5, rootMargin: "100px" }
      );
      if (node) observer.current.observe(node);
    },
    [hasMore, fetchMoreRecipes]
  );

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setModalKey(`new-${Date.now()}`);
    setIsModalOpen(true);
  };

  const handleEditRecipe = (recipe: ListRecipe) => {
    setSelectedRecipe(recipe);
    setModalKey(recipe.recipe_id);
    setIsModalOpen(true);
  };

  // Toggle the recipe's cauldron status.
  const handleToggleCauldron = async (
    recipe: ListRecipe,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    if (!user) return;

    // Check if the recipe is already active in the cauldron.
    const effectiveInCauldron = cauldronRecipes.some(
      (cr) => cr.recipe_id === recipe.recipe_id && cr.is_active
    );

    if (effectiveInCauldron) {
      // Find the cauldron record for this recipe.
      const record = cauldronRecipes.find(
        (cr) => cr.recipe_id === recipe.recipe_id && cr.is_active
      );
      if (record) {
        await deleteCauldron(record.cauldron_id);
      }
    } else {
      await addCauldron({
        user_id: user.user_id,
        recipe_id: recipe.recipe_id,
        is_active: true,
      });
    }
    // Refresh the cauldron recipes to update the UI.
    await fetchUserCauldronRecipes();
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
    setSelectedRecipe(null);
    setIsModalOpen(false);
  };

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
        {recipes.length > 0 ? (
          recipes.map((recipe, index) => {
            // Determine if the recipe is effectively in the cauldron.
            const effectiveInCauldron = cauldronRecipes.some(
              (cr) => cr.recipe_id === recipe.recipe_id && cr.is_active
            );
            return (
              <div
                key={recipe.recipe_id}
                className={styles.recipeCard}
                ref={index === recipes.length - 1 ? lastRecipeRef : null}
              >
                {/* Cauldron Icon Button */}
                <button
                  className={styles.cauldronWrapper}
                  onClick={(e) => handleToggleCauldron(recipe, e)}
                >
                  <Icon
                    className={
                      effectiveInCauldron
                        ? styles.cauldronAdded
                        : styles.cauldronButton
                    }
                    iconNode={cauldron}
                  />
                </button>
                <div className={styles.imageContainer}>
                  <img
                    src={recipe.front_image || "https://picsum.photos/300/200"}
                    alt={recipe.title}
                    className={styles.recipeImage}
                  />
                </div>
                {/* Recipe Content area as an anchor tag */}
                <a
                  href="#"
                  className={styles.recipeContent}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditRecipe(recipe);
                  }}
                >
                  <div className={styles.recipeHeader}>
                    <h4>{recipe.title}</h4>
                  </div>
                  <div className={styles.metadataRow}>
                    <p>{recipe.tags.join(", ")}</p>
                  </div>
                </a>
              </div>
            );
          })
        ) : (
          <p>No recipes available.</p>
        )}
      </div>
      {hasMore && <p>Loading more recipes...</p>}
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
