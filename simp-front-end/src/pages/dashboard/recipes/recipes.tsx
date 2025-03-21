"use client";

import React, { useState, useRef, useCallback } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Plus } from "lucide-react";
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";

export default function Recipes() {
  const { recipes, fetchMoreRecipes, addRecipe, hasMore } = useDashboard(); // Use context functions
  const { user } = useAuth(); // Get authenticated user from context
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ListRecipe | null>(null);

  // New state to control the unique key for the modal.
  const [modalKey, setModalKey] = useState<string>("new");

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

  // When adding a new recipe, update the modal key to force a remount.
  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setModalKey(`new-${Date.now()}`);
    setIsModalOpen(true);
  };

  const handleEditRecipe = async (recipe: ListRecipe) => {
    setSelectedRecipe(recipe);
    setModalKey(recipe.recipe_id); // Use the recipe ID as the key when editing.
    setIsModalOpen(true);
  };

  const handleSaveRecipeWrapper = async (recipeData: RecipeCreate) => {
    // Uncomment and update the following code as needed when integrating with your API:
    // if (!user) {
    //   console.error("User is not authenticated");
    //   return;
    // }
    //
    // const newRecipe: RecipeCreate = {
    //   ...recipeData,
    //   author_id: user.user_id,
    //   tags: Array.isArray(recipeData.tags)
    //     ? recipeData.tags.map(tag =>
    //         typeof tag === "string" ? tag : (tag as { tag_id: string }).tag_id
    //       )
    //     : [],
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
    //
    // await addRecipe(newRecipe);
    setIsModalOpen(false);
  };

  // Create a dummy ListRecipe from the dummyRecipe object.
  // Here, we assume ListRecipe requires a unique recipe_id and tags as an array of strings.
  // Combine dummy recipe with recipes from context.
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
              ref={index === allRecipes.length - 1 ? lastRecipeRef : null} // Attach observer to last recipe
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

      {/* Using a dynamic key forces the RecipeModal to remount when switching modes */}
      <RecipeModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecipeWrapper}
        recipe={selectedRecipe}
      />
    </div>
  );
}

export const dummyRecipe: RecipeCreate = {
  title: "Dummy Recipe",
  description: "A simple dummy recipe for testing purposes.",
  front_image: "http://example.com/dummy.jpg",
  author_id: "dummy_author",
  ingredients: [
    {
      ingredient_name: "Flour",
      amount: 200,
      measurement: "grams",
      position: 0,
    },
    {
      ingredient_name: "Sugar",
      amount: 100,
      measurement: "grams",
      position: 1,
    },
    {
      ingredient_name: "Eggs",
      amount: 2,
      measurement: "pcs",
      position: 2,
    },
  ],
  steps: [
    {
      step_number: 1,
      description: "Mix all the ingredients together until smooth.",
    },
    {
      step_number: 2,
      description: "Bake in a preheated oven for 25 minutes.",
    },
  ],
  images: [{ image_url: "http://example.com/dummy-step1.jpg" }],
  tags: [
    { name: "Easy" },
    { name: "Quick" },
  ],
};
