"use client";

import React from "react";
import styles from "./recipeModal.module.css";
import { Minus, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps<T extends { id: string; [key: string]: any }> {
  item: T;
  fields: { key: keyof T; type: "text" | "number"; placeholder: string }[];
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof T, value: string | number) => void;
}

export function SortableItem<T extends { id: string; [key: string]: any }>({
  item,
  fields,
  onRemove,
  onChange,
}: SortableItemProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
      {/* Drag handle: only this element gets the drag listeners */}
      <div
        {...listeners}
        className={styles.dragHandle}
        style={{ cursor: "grab", paddingRight: "8px" }}
      >
        <GripVertical size={20} />
      </div>
      {/* Display step number if available */}
      {item.step_number && (
        <span className={styles.stepNumber}>{item.step_number}.</span>
      )}
      {fields.map(({ key, type, placeholder }) => (
        <input
          key={key as string}
          type={type}
          placeholder={placeholder}
          value={item[key] || ""}
          onChange={(e) =>
            onChange(
              item.id,
              key,
              type === "number" ? Number(e.target.value) : e.target.value
            )
          }
          className={styles.draggableInput}
        />
      ))}
      <a
        className={styles.iconButton}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        aria-label="Remove Item"
      >
        <Minus size={18} />
      </a>
    </div>
  );
}
