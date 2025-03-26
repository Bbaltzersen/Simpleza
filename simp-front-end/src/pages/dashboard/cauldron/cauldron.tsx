"use client";
import React, { useEffect } from "react";
import styles from "./cauldron.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import { useAuth } from "@/lib/context/authContext";

export default function Cauldron() {
  const { cauldronRecipes, fetchUserCauldronRecipes } = useDashboard();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserCauldronRecipes();
    }
  }, [user, fetchUserCauldronRecipes]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Cauldron</h2>
      </div>
      <div className={styles.cauldronGrid}>
        {cauldronRecipes.length === 0 ? (
          <p>No cauldron recipes found.</p>
        ) : (
          cauldronRecipes.map((cr) => (
            <div key={cr.cauldron_id} className={styles.cauldronCard}>
              <div className={styles.imageContainer}>
                {cr.front_image ? (
                  <img
                    src={cr.front_image}
                    alt={cr.title}
                    className={styles.recipeImage}
                  />
                ) : (
                  <div className={styles.noImage}>No Image</div>
                )}
              </div>
              <div className={styles.cardContent}>
                <h4>{cr.title}</h4>
                {cr.tags && cr.tags.length > 0 && (
                  <p>{cr.tags.join(", ")}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
