"use client";

import React from "react";
import styles from "./simpleform.module.css"; // Import CSS Module

interface FormField<T> {
  name: keyof T;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
}

interface FormProps<T> {
  fields: FormField<T>[];
  state: Partial<T>;
  setState: (state: Partial<T>) => void;
  onAdd: (e: React.FormEvent) => void;
  onEdit: (e: React.FormEvent) => void;
  addLabel: string;
  editLabel: string;
  isEditMode?: boolean;
}

const SimpleForm = <T,>({
  fields,
  state,
  setState,
  onAdd,
  onEdit,
  addLabel,
  editLabel,
  isEditMode = false,
}: FormProps<T>) => {
  return (
    <form onSubmit={isEditMode ? onEdit : onAdd} className={styles.form}>
      {fields.map((field) => (
        <input
          key={field.name as string}
          type={field.type}
          placeholder={field.placeholder}
          value={state[field.name] ? String(state[field.name]) : ""}
          onChange={(e) =>
            setState({
              ...state,
              [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
          className={styles.input}
          required={field.required ?? false}
        />
      ))}
      <input
        type="submit"
        value={isEditMode ? editLabel : addLabel}
        className={isEditMode ? styles.editButton : styles.addButton} // Dynamic class assignment
      />
    </form>
  );
};

export default SimpleForm;
