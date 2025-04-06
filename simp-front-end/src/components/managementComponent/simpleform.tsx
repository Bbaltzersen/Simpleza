"use client";

import React, { useCallback } from "react"; // Import useCallback
import styles from "./simpleform.module.css";
// Import the new component
import AutosizeTextarea from "./autoSizeTextarea"; // Adjust path if needed

// Interface includes 'textarea' type
export interface FormField<T> {
  name: keyof T;
  type: "text" | "number" | "textarea" | "checkbox";
  placeholder: string; // Used as label for checkbox
  title?: string;      // Optional: Label text for text/textarea/number inputs
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

  // No longer need autoResizeTextarea helper here

  const handleInputChange = ( name: keyof T, value: string, fieldType: FormField<T>['type']) => {
    setState((prevState) => {
      let processedValue: string | boolean | undefined = value;
      if (fieldType === "number" && typeof value === 'string') {
        processedValue = value.replace(/[^0-9.-]/g, "");
      }
      return { ...prevState, [name]: processedValue };
    });
  };

  const handleCheckboxChange = ( name: keyof T, checked: boolean ) => {
      setState((prevState) => ({ ...prevState, [name]: checked }));
  }

  return (
    <fieldset disabled={disabled} className={styles.formWrapper}>
      <form onSubmit={isEditMode ? onEdit : onAdd} className={styles.form}>
        {fields.map((field) => {
          const elementKey = field.name as string;
          const elementId = field.name as string;

          const labelElement = (field.type !== 'checkbox' && field.title) ? (
            <label htmlFor={elementId} className={styles.label}>
              {field.title}
              {field.required && <span className={styles.requiredIndicator}>*</span>}
            </label>
          ) : null;

          if (field.type === "checkbox") {
            // Checkbox rendering (keep as is)
            return (
              <div key={elementKey} className={styles.checkboxWrapper}>
                <input
                  type="checkbox" id={elementId} name={elementKey}
                  checked={Boolean(state[field.name])}
                  onChange={(e) => handleCheckboxChange(field.name, e.target.checked)}
                  className={styles.checkbox} required={field.required ?? false}
                 />
                <label htmlFor={elementId} className={styles.checkboxLabel}>
                  {field.placeholder}
                  {field.required && <span className={styles.requiredIndicator}>*</span>}
                </label>
              </div>
            );
          }

          // Prepare props common to text input and textarea base
          const commonInputProps = {
            name: elementKey,
            id: elementId,
            placeholder: field.placeholder,
            value: state[field.name] != null ? String(state[field.name]) : "",
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              handleInputChange(field.name, e.target.value, field.type),
            className: styles.input,
            required: field.required ?? false,
          };

          // --- UPDATED: Use AutosizeTextarea component ---
          if (field.type === "textarea") {
            return (
              <div key={elementKey} className={styles.fieldWrapper}>
                {labelElement}
                <AutosizeTextarea
                  {...commonInputProps} // Spread common props
                  // Pass specific textarea props if needed, like className override
                  className={`${styles.input} ${styles.textarea}`}
                  minRows={2} // Example: set minimum rows
                />
              </div>
            );
          } else { // Text Input ('text' or 'number' type)
            return (
              <div key={elementKey} className={styles.fieldWrapper}>
                {labelElement}
                <input
                  type="text"
                  inputMode={field.type === 'number' ? 'decimal' : 'text'}
                  {...commonInputProps} // Use the common props here too
                />
              </div>
            );
          }
          // --- END UPDATE ---
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