"use client";
import React, { useState, useRef, useCallback } from "react";
import styles from "./cauldron.module.css";
import { useDashboard } from "@/lib/context/dashboardContext";
import RecipeModal from "@/lib/modals/recipeModal";
import { Plus } from "lucide-react";
import { ListRecipe } from "@/lib/types/recipe";
import { useAuth } from "@/lib/context/authContext";

export default function Cauldron() {

  return (
    <div className={styles.container}>
        <div className={styles.header}>
        <h2>Cauldron</h2>
      </div>
    </div>
  );
}
