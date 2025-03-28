"use client";
import React, { useState, useEffect, JSX } from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Icon, Plus } from "lucide-react";
import { cauldron } from "@lucide/lab";
import { ListRecipe, RecipeCreate } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";

export default function Recipes(): JSX.Element {
  const {
    recipes,
    fetchRecipesForPage, // New page-based function for recipes
    totalRecipes,         // Total number of recipes available
    currentRecipePage,    // Current page number
    addRecipe,
    updateRecipe,
    cauldronRecipes,
    fetchUserCauldronRecipes,
    addCauldron,
    deleteCauldron,
  } = useDashboard();
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedRecipe, setSelectedRecipe] = useState<ListRecipe | null>(null);
  const [modalKey, setModalKey] = useState<string>("new");

  // On initial load, fetch the first page.
  useEffect(() => {
    if (user) {
      fetchRecipesForPage(1);
    }
  }, [user, fetchRecipesForPage]);

  const pageSize = 10;
  const totalPages = Math.ceil(totalRecipes / pageSize);

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const page = Number(e.target.value);
    if (page !== currentRecipePage) {
      fetchRecipesForPage(page);
    }
  };

  const handleAddRecipe = (): void => {
    setSelectedRecipe(null);
    setModalKey(`new-${Date.now()}`);
    setIsModalOpen(true);
  };

  const handleEditRecipe = (recipe: ListRecipe): void => {
    setSelectedRecipe(recipe);
    setModalKey(recipe.recipe_id);
    setIsModalOpen(true);
  };

  const handleToggleCauldron = async (
    recipe: ListRecipe,
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.stopPropagation();
    if (!user) return;

    const effectiveInCauldron = cauldronRecipes.some(
      (cr) => cr.recipe_id === recipe.recipe_id && cr.is_active
    );

    if (effectiveInCauldron) {
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
    await fetchUserCauldronRecipes();
  };

  const handleSaveRecipeWrapper = async (recipeData: RecipeCreate): Promise<void> => {
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
          recipes.map((recipe: ListRecipe) => {
            const effectiveInCauldron = cauldronRecipes.some(
              (cr) => cr.recipe_id === recipe.recipe_id && cr.is_active
            );
            return (
              <div key={recipe.recipe_id} className={styles.recipeCard}>
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
                <a
                  href="#"
                  className={styles.recipeContent}
                  onClick={(e) => {
                    e.preventDefault();
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
      <div className={styles.paginationDropdown}>
        <select value={currentRecipePage} onChange={handlePageChange}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              Page {page}
            </option>
          ))}
        </select>
      </div>
      <RecipeModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={() => {
          setSelectedRecipe(null);
          setIsModalOpen(false);
        }}
        onSave={handleSaveRecipeWrapper}
        recipe={selectedRecipe || undefined}
      />
    </div>
  );
}
