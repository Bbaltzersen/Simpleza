"use client";

import React from "react";
import styles from "./simpleform.module.css"; // Import CSS Module

// Interface includes 'checkbox' type
export interface FormField<T> {
  name: keyof T;
  type: "text" | "number" | "textarea" | "checkbox";
  placeholder: string; // Used as label for checkbox
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

  // General handler (can accept boolean from checkbox handler indirectly)
  const handleInputChange = (
    name: keyof T,
    value: string | boolean, // Accepts boolean
    fieldType: FormField<T>['type']
  ) => {
    setState((prevState) => {
      let processedValue: string | boolean | undefined = value; // Keep boolean

      // Sanitize if it's a number-hinted text field and value is string
      if (fieldType === "number" && typeof value === 'string') {
        processedValue = value.replace(/[^0-9.-]/g, "");
      }
      // Checkbox value is passed directly as boolean

      return { ...prevState, [name]: processedValue };
    });
  };

  // Specific handler for checkbox changes
  const handleCheckboxChange = (
      name: keyof T,
      checked: boolean
  ) => {
      // Directly set the boolean value in the state
      setState((prevState) => ({ ...prevState, [name]: checked }));
  }

  return (
    <fieldset disabled={disabled} className={styles.formWrapper}>
      <form onSubmit={isEditMode ? onEdit : onAdd} className={styles.form}>
        {fields.map((field) => {
          const elementKey = field.name as string;

          // --- Conditional Rendering for Checkbox ---
          if (field.type === "checkbox") {
            return (
              <div key={elementKey} className={styles.checkboxWrapper}> {/* Add styling */}
                <input
                  type="checkbox"
                  id={elementKey}
                  name={elementKey}
                  checked={Boolean(state[field.name])} // Bind to boolean state value
                  onChange={(e) => handleCheckboxChange(field.name, e.target.checked)} // Use specific handler
                  className={styles.checkbox}
                  required={field.required ?? false} // Checkbox can be required
                />
                {/* Use placeholder as the visible label */}
                <label htmlFor={elementKey} className={styles.checkboxLabel}>
                  {field.placeholder}
                </label>
              </div>
            );
          }

          // --- Props for other input types ---
          const elementProps = {
            name: field.name as string,
            id: elementKey,
            placeholder: field.placeholder,
            value: state[field.name] != null ? String(state[field.name]) : "",
            // Use general handler for text/textarea/number(as text)
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              handleInputChange(field.name, e.target.value, field.type),
            className: styles.input,
            required: field.required ?? false,
          };

          // --- Conditional Rendering for Textarea ---
          if (field.type === "textarea") {
            return (
              <textarea
                key={elementKey} // Pass key directly
                {...elementProps}
                rows={3}
                className={`${styles.input} ${styles.textarea}`}
              />
            );
          } else {
            // --- Render Text Input (for 'text' and 'number') ---
            return (
              <input
                key={elementKey} // Pass key directly
                type="text"
                inputMode={field.type === 'number' ? 'decimal' : 'text'}
                {...elementProps}
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