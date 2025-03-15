"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./recipeModal.module.css";
import { Minus, GripVertical } from "lucide-react";
import IngredientSearch from "./ingredientSearch";
import { RecipeIngredientCreate } from "@/lib/types/recipe";

interface SortableIngredientRowProps {
  ingredient: RecipeIngredientCreate;
  onSelect: (id: string, ingredient: any, amount: string, measurement: string) => void;
  onRemove: (id: string) => void;
}

const SortableIngredientRow: React.FC<SortableIngredientRowProps> = ({
  ingredient,
  onSelect,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ingredient.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`${styles.sortableRow} ${isDragging ? styles.dragging : ""}`}
    >
      {/* Drag handle: Only this element has the drag listeners */}
      <div {...listeners} className={styles.dragHandle} style={{ cursor: "grab", paddingRight: "8px" }}>
        <GripVertical size={20} />
      </div>
      {/* IngredientSearch remains fully clickable */}
      <div style={{ flexGrow: 1 }}>
        <IngredientSearch
          onSelect={(selectedIngredient, amount, measurement) =>
            onSelect(ingredient.id, selectedIngredient, amount, measurement)
          }
        />
      </div>
      <a
        type="button"
        className={styles.iconButton}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(ingredient.id);
        }}
      >
        <Minus size={20} />
      </a>
    </div>
  );
};

export default SortableIngredientRow;
