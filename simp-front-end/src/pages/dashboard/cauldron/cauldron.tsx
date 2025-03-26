"use client";
import React, { useEffect } from "react";
import styles from "./cauldron.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
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
      </div>
      <div className={styles.cauldronGrid}>
        {cauldrons.length === 0 ? (
          <p>No cauldron entries found.</p>
        ) : (
          cauldrons.map((c) => (
            <div key={c.cauldron_id} className={styles.cauldronCard}>
              <div className={styles.cardContent}>
                <h4>Cauldron {c.cauldron_id}</h4>
                {/* You can add more details about each cauldron here */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
