"use client";
import React, { useEffect } from "react";
import styles from "./cauldron.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/context/authContext";

export default function Cauldron() {
  const { cauldrons, fetchUserCauldrons } = useDashboard();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserCauldrons();
    }
  }, [user, fetchUserCauldrons]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Cauldron</h2>
        <button className={styles.addButton}>
          <Plus />
        </button>
      </div>
      <div className={styles.list}>
        {cauldrons.length === 0 ? (
          <p>No cauldron entries found.</p>
        ) : (
          <ul>
            {cauldrons.map((c) => (
              <li key={c.cauldron_id} className={styles.listItem}>
                <p>
                  <strong>Recipe ID:</strong> {c.recipe_id}
                </p>
                <p>
                  <strong>Status:</strong> {c.is_active ? "Active" : "Inactive"}
                </p>
                <p>
                  <strong>Added:</strong>{" "}
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
