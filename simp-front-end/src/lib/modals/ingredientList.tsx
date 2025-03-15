"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import IngredientSearch from "./ingredientSearch";
import { RecipeIngredientCreate } from "@/lib/types/recipe";
import styles from "./ingredientList.module.css";

interface IngredientListProps {
  ingredients: RecipeIngredientCreate[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSelect: (index: number, ingredient: any, amount: string, measurement: string) => void;
}

const IngredientList: React.FC<IngredientListProps> = ({ ingredients, onAdd, onRemove, onSelect }) => {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <label className={styles.test}>Ingredients</label>
        <button type="button" className={styles.addButton} onClick={onAdd}>
          <Plus size={20} />
        </button>
      </div>
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className={styles.ingredientRow}>
          <IngredientSearch
            onSelect={(ingredient, amount, measurement) =>
              onSelect(ingredients.findIndex((ing) => ing.id === ingredient?.ingredient_id || ing.id === ingredient?.ingredient_id), ingredient, amount, measurement)
            }
          />
          <button type="button" className={styles.iconButton} onClick={() => onRemove(ingredients.findIndex((ing) => ing.id === ingredient.id))}>
            <Minus size={20} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default IngredientList;
