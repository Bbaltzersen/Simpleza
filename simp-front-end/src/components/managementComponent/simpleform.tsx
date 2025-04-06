"use client";

import React, { useCallback } from "react"; // Import useCallback
import styles from "./simpleform.module.css";

export interface FormField<T> {
  name: keyof T;
  type: "text" | "number" | "textarea" | "checkbox";
  placeholder: string;
  title?: string;
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

  // --- Helper function to auto-resize textarea ---
  const autoResizeTextarea = useCallback((element: HTMLTextAreaElement) => {
    // Temporarily shrink height to get accurate scrollHeight
    element.style.height = 'auto';
    // Set height to scrollHeight to fit content
    element.style.height = `${element.scrollHeight}px`;
  }, []);

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
            return (
              <div key={elementKey} className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id={elementId}
                  name={elementKey}
                  checked={Boolean(state[field.name])}
                  onChange={(e) => handleCheckboxChange(field.name, e.target.checked)}
                  className={styles.checkbox}
                  required={field.required ?? false}
                />
                <label htmlFor={elementId} className={styles.checkboxLabel}>
                  {field.placeholder}
                  {field.required && <span className={styles.requiredIndicator}>*</span>}
                </label>
              </div>
            );
          }

          // --- Props specifically for text/textarea ---
          const elementProps = {
            name: elementKey,
            id: elementId,
            placeholder: field.placeholder,
            value: state[field.name] != null ? String(state[field.name]) : "",
            className: styles.input,
            required: field.required ?? false,
          };

          if (field.type === "textarea") {
            return (
              <div key={elementKey} className={styles.fieldWrapper}>
                {labelElement}
                <textarea
                  {...elementProps}
                  rows={1} // Start with minimum rows (optional)
                  className={`${styles.input} ${styles.textarea}`}
                  // Updated onChange for textarea
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                      handleInputChange(field.name, e.target.value, field.type);
                      autoResizeTextarea(e.target); // Resize on change
                  }}
                  // Optional: Resize on initial render if needed via ref/useEffect,
                  // but onChange often covers most use cases.
                  // ref={el => el && autoResizeTextarea(el)} // Example using ref callback
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
                  {...elementProps}
                  // Use standard handler for text/number inputs
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(field.name, e.target.value, field.type)
                  }
                />
              </div>
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