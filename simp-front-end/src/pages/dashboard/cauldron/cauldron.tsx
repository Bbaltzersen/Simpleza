"use client";
import React, { useEffect } from "react";
import styles from "./cauldron.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import { useAuth } from "@/lib/context/authContext";
import { cauldron } from "@lucide/lab";
import { Icon } from "lucide-react";

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
      {cauldronRecipes.length === 0 ? (
  <div className={styles.gridCenter}>
    <div className={styles.cauldronGrid}>
      <div className={styles.emptyCauldron}>
        <Icon
          className={styles.emptyCauldronIcon}
          size={100}
          iconNode={cauldron}
        />
        <p className={styles.emptyCauldronText}>Start by adding recipes in the Cauldron!</p>
      </div>
    </div>
  </div>
) : (
  <div className={styles.gridCenter}>
    <div className={styles.cauldronGrid}>
      {cauldronRecipes.map((cr) => (
        <div key={cr.cauldron_id} className={styles.cauldronCard}>
          <div className={styles.imageContainer}>
            <img
              src={cr.front_image || "https://placehold.co/100x100"}
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
      ))}
    </div>
  </div>
)}

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
              disabled={cauldronRecipesPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
