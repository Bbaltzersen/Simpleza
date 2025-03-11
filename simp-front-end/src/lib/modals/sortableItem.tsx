"use client";

import React from "react";
import styles from "./recipeModal.module.css";
import { Minus } from "lucide-react";
import { RecipeStep } from "@/lib/types/recipe";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  step: RecipeStep;
  onRemove: (id: string) => void;
  onChange: (id: string, value: string) => void;
}

export function SortableItem({ step, onRemove, onChange }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.step_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={styles.stepRow} {...listeners}>
      <textarea
        className={styles.draggableInput}
        placeholder={`Step ${step.step_number}`}
        value={step.description}
        onChange={(e) => onChange(step.step_id, e.target.value)}
      />
      <a className={styles.iconButton} onClick={() => onRemove(step.step_id)} aria-label="Remove Step">
        <Minus size={18} />
      </a>
    </div>
  );
}
