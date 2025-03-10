"use client";

import React from "react";
import styles from "./recipes.module.css";
import { useDashboard } from "@/lib/context/dashboardContext"; // Import the DashboardProvider hook

export default function Recipes() {
  const { recipes } = useDashboard(); // ✅ Fetch recipes from context

  return (
      <div className={styles.container}>
          <h2>Recipes</h2>

          {/* ✅ Recipe Grid */}
          <div className={styles.recipeGrid}>
              {recipes.length > 0 ? (
                  recipes.map((recipe) => (
                      <div key={recipe.recipe_id} className={styles.recipeCard}>
                          {/* Placeholder Image */}
                          <img
                              src="https://picsum.photos/300/200"
                              alt="Recipe Placeholder"
                              className={styles.recipeImage}
                          />
                          <div className={styles.recipeContent}>
                              <h4>{recipe.title}</h4>
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