"use client";
import React, { useEffect } from "react";
import styles from "./cauldron.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import { useAuth } from "@/lib/context/authContext";

export default function Cauldron() {
  const {
    cauldronRecipes,
    fetchUserCauldronRecipes,
    totalCauldronRecipes,
    cauldronRecipesPage,
  } = useDashboard();
  const { user } = useAuth();

  // On initial load, fetch the first page.
  useEffect(() => {
    if (user) {
      fetchUserCauldronRecipes(1);
    }
  }, [user, fetchUserCauldronRecipes]);

  const pageSize = 10;
  const totalPages = Math.ceil(totalCauldronRecipes / pageSize);

  const handlePageChange = (page: number | undefined) => {
    if (!page) return;
    if (page >= 1 && page <= totalPages && page !== cauldronRecipesPage) {
      fetchUserCauldronRecipes(page);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Cauldron</h2>
      </div>
      <div className={styles.content}>
        <div className={styles.cauldronGrid}>
          {cauldronRecipes.length === 0 ? (
            <p>No cauldron recipes found.</p>
          ) : (
            cauldronRecipes.map((cr) => (
              <div key={cr.cauldron_id} className={styles.cauldronCard}>
                <div className={styles.imageContainer}>
                  <img
                    src={cr.front_image || "https://picsum.photos/300/200"}
                    alt={cr.title}
                    className={styles.recipeImage}
                  />
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHeader}>
                    <h4>{cr.title}</h4>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className={styles.pagination}>
        <ul>
          <li>
            <button
              type="button"
              onClick={() => handlePageChange(cauldronRecipesPage - 1)}
              disabled={cauldronRecipesPage === 1}
            >
              Prev
            </button>
          </li>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <li key={page} className={page === cauldronRecipesPage ? "active" : ""}>
              <button
                type="button"
                onClick={() => handlePageChange(page)}
                disabled={page === cauldronRecipesPage}
              >
                {page}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => handlePageChange(cauldronRecipesPage + 1)}
              disabled={cauldronRecipesPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
