"use client";

import React from "react";
import styles from "./simpleform.module.css"; // Import CSS Module

// FormField interface (assuming it's defined correctly as before)
export interface FormField<T> {
  name: keyof T;
  type: "text" | "number" | "textarea";
  placeholder: string;
  required?: boolean;
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
  disabled?: boolean;
}

// Added T extends object constraint
const SimpleForm = <T extends object>({
  fields,
  state,
  setState,
  onAdd,
  onEdit,
  addLabel,
  editLabel,
  isEditMode = false,
  disabled = false,
}: FormProps<T>) => {

  const handleInputChange = (
    name: keyof T,
    value: string,
    fieldType: FormField<T>['type']
  ) => {
    setState((prevState) => {
      let processedValue = value;
      if (fieldType === "number") {
        processedValue = value.replace(/[^0-9.-]/g, "");
      }
      return { ...prevState, [name]: processedValue };
    });
  };

  return (
    <fieldset disabled={disabled} className={styles.formWrapper}>
      <form onSubmit={isEditMode ? onEdit : onAdd} className={styles.form}>
        {fields.map((field) => {
          // --- FIX START ---
          // 1. Define the key separately
          const elementKey = field.name as string;

          // 2. Prepare other props *without* the key
          const elementProps = {
            name: field.name as string,
            id: field.name as string, // Use name for id as well
            placeholder: field.placeholder,
            value: state[field.name] != null ? String(state[field.name]) : "",
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              handleInputChange(field.name, e.target.value, field.type),
            className: styles.input, // Base style
            required: field.required ?? false,
          };
          // --- FIX END ---

          // Conditional Rendering based on field type
          if (field.type === "textarea") {
            return (
              <textarea
                key={elementKey} // 3. Pass key directly
                {...elementProps} // 4. Spread the rest of the props
                rows={3}
                className={`${styles.input} ${styles.textarea}`}
              />
            );
          } else {
            // Render input type="text" for both 'text' and 'number' types
            return (
              <input
                key={elementKey} // 3. Pass key directly
                type="text"
                inputMode={field.type === 'number' ? 'decimal' : 'text'}
                {...elementProps} // 4. Spread the rest of the props
              />
            );
          }
        })}
        <input
          type="submit"
          value={isEditMode ? editLabel : addLabel}
          className={isEditMode ? styles.editButton : styles.addButton}
        />
      </form>
    </fieldset>
  );
};

export default SimpleForm;