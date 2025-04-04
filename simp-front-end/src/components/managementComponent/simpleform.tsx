"use client";

import React from "react";
import styles from "./simpleform.module.css"; // Import CSS Module

interface FormField<T> {
  name: keyof T;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
  step?: string | number; // Still informational
}

interface FormProps<T> {
  fields: FormField<T>[];
  state: Partial<T>;
  setState: (state: Partial<T> | ((prevState: Partial<T>) => Partial<T>)) => void;
  onAdd: (e: React.FormEvent) => void;
  onEdit: (e: React.FormEvent) => void;
  addLabel: string;
  editLabel: string;
  isEditMode?: boolean;
}

const SimpleForm = <T extends Record<string, any>>({
  fields,
  state,
  setState,
  onAdd,
  onEdit,
  addLabel,
  editLabel,
  isEditMode = false,
}: FormProps<T>) => {

  const handleInputChange = (
    name: keyof T,
    value: string,
    configuredType: "text" | "number"
  ) => {
    let processedValue = value;

    if (configuredType === "number") {
      // --- CHANGE THE REGEX HERE ---
      // Filter to allow digits, ONE comma (,), and potentially one leading minus sign (-)
      // Remove characters that are NOT digits, comma, or minus
      processedValue = value.replace(/[^0-9,-]/g, "");

      // Optional: More robust filtering (e.g., only one comma, minus only at start)
      // This example ensures only one comma exists
      const commaParts = processedValue.split(',');
      if (commaParts.length > 2) {
         processedValue = commaParts[0] + ',' + commaParts.slice(1).join('');
      }
      // Add similar checks for minus sign if needed

      // ----------------------------

      setState((prevState) => ({ ...prevState, [name]: processedValue }));

    } else {
      setState((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  return (
    <form onSubmit={isEditMode ? onEdit : onAdd} className={styles.form}>
      {fields.map((field) => (
        <input
          key={field.name as string}
          type="text" // Still text
          name={field.name as string}
          placeholder={field.placeholder}
          value={state[field.name] != null ? String(state[field.name]) : ""}
          onChange={(e) => handleInputChange(field.name, e.target.value, field.type)}
          className={styles.input}
          required={field.required ?? false}
          // inputMode="decimal" is often locale-aware or provides comma key
          inputMode={field.type === 'number' ? 'decimal' : 'text'}
        />
      ))}
      <input
        type="submit"
        value={isEditMode ? editLabel : addLabel}
        className={isEditMode ? styles.editButton : styles.addButton}
      />
    </form>
  );
};

export default SimpleForm;