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
      </div>
      <div className={styles.list}>
        {cauldrons.length === 0 ? (
          <p>No cauldron entries found.</p>
        ) : (
          <ul>
            {cauldrons.map((c) => (
                <div>
                    Hello {c.cauldron_id}
                </div>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
