"use client";

import React from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import { Plus } from "lucide-react";

export default function Recipes() {
  const { recipes } = useDashboard();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Recipe Library</h2>
      </div>
      <div className={styles.recipeGrid}>
        {/* Add Recipe Button */}
        <div className={styles.addRecipeCard} aria-label="Add Recipe">
          <Plus size={48} />
        </div>

        {/* Recipe Cards */}
        {recipes.length > 0 ? (
          [...Array(12)].flatMap(() => recipes).map((recipe, index) => (
            <div key={`${recipe.recipe_id}-${index}`} className={styles.recipeCard}>
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
    </div>
  );
}
