"use client";

import React from "react";
import styles from "./simpleform.module.css"; // Import CSS Module

interface FormField<T> {
  name: keyof T;
  type: "text" | "number"; // Keep number type in the interface but treat it as text
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
  // ✅ Function to allow only numeric values in text fields
  const handleInputChange = (name: keyof T, value: string, type: "text" | "number") => {
    if (type === "number") {
      // Remove non-numeric characters except decimals
      const numericValue = value.replace(/[^0-9.-]/g, "");
      setState({ ...state, [name]: numericValue });
    } else {
      setState({ ...state, [name]: value });
    }
  };

  return (
    <form onSubmit={isEditMode ? onEdit : onAdd} className={styles.form}>
      {fields.map((field) => (
        <input
          key={field.name as string}
          type="text" // ✅ Always use text type
          placeholder={field.placeholder}
          value={state[field.name] ? String(state[field.name]) : ""}
          onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
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
