// src/components/managementComponent/simpleform.tsx (Modified for Optional Form Wrapping)

import React from "react";
import styles from "./simpleform.module.css"; // Adjust path as needed

// --- Define the structure for select options ---
interface SelectOption {
  value: string;
  label: string;
}

// --- Update FormField interface ---
interface FormField<T> {
  name: keyof T;
  type: "text" | "number" | "select" | "textarea";
  placeholder?: string;
  label?: string;
  required?: boolean;
  options?: SelectOption[];
}

// --- Update SimpleFormProps ---
interface SimpleFormProps<T> {
  fields: FormField<T>[];
  state: Partial<T>;
  setState: (update: Partial<T> | ((prevState: Partial<T>) => Partial<T>)) => void;

  // --- Re-add form handling props as OPTIONAL ---
  onAdd?: (e: React.FormEvent) => void; // Optional add handler
  onEdit?: (e: React.FormEvent) => void; // Optional edit handler
  addLabel?: string; // Optional label for add button
  editLabel?: string; // Optional label for edit button
  isEditMode?: boolean; // Optional flag for edit mode
}

// --- Modified SimpleForm Component ---
const SimpleForm = <T extends Record<string, any>>({
  fields,
  state,
  setState,
  // Destructure optional props with defaults
  onAdd,
  onEdit,
  addLabel = "Add", // Default label
  editLabel = "Update", // Default label
  isEditMode = false,
}: SimpleFormProps<T>) => {

  // Determine if the component should render its own form wrapper and submit button
  const needsFormWrapper = !!(onAdd || onEdit); // Render form only if onAdd or onEdit is provided

  // Internal input change handler (works for text, select, textarea)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
   ) => {
        const { name, value, type } = e.target;
        const key = name as keyof T;
        const fieldConfig = fields.find(f => f.name === key);
        const configuredType = fieldConfig?.type || 'text';
        let processedValue: string | number | undefined = value;

        if (configuredType === "number") {
             processedValue = value.replace(/[^0-9,-]/g, ""); // Example filter
        }
        setState((prevState) => ({ ...prevState, [name]: processedValue }));
   };

   // Internal submit handler (only used if needsFormWrapper is true)
   const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        if (isEditMode && onEdit) {
            onEdit(e);
        } else if (!isEditMode && onAdd) {
            onAdd(e);
        }
   };

  // --- Render Fields ---
  const renderFields = () => (
    <>
      {fields.map((field) => (
        <div key={String(field.name)} className={styles.formFieldWrapper}>
           <label htmlFor={String(field.name)} className={styles.label}>
             {field.label || field.placeholder || String(field.name)}{field.required ? '*' : ''}
           </label>
          {field.type === 'select' ? (
            <select id={String(field.name)} name={String(field.name)} value={state[field.name] != null ? String(state[field.name]) : ""} onChange={handleInputChange} required={field.required ?? false} className={styles.select} >
              <option value="" disabled={field.required ?? false}> {`Select ${field.placeholder || field.label || String(field.name)}...`} </option>
              {(field.options || []).map(option => ( <option key={option.value} value={option.value}> {option.label} </option> ))}
            </select>
          ) : field.type === 'textarea' ? (
             <textarea id={String(field.name)} name={String(field.name)} className={styles.textarea} placeholder={field.placeholder} value={state[field.name] != null ? String(state[field.name]) : ""} onChange={handleInputChange} required={field.required ?? false} rows={3} />
          ) : (
            <input id={String(field.name)} name={String(field.name)} type={"text"} className={styles.input} placeholder={field.placeholder} value={state[field.name] != null ? String(state[field.name]) : ""} onChange={handleInputChange} required={field.required ?? false} inputMode={field.type === 'number' ? 'decimal' : 'text'} />
          )}
        </div>
      ))}
    </>
  );

  // --- Conditional Rendering ---
  // If onAdd or onEdit provided, wrap fields and add submit button
  if (needsFormWrapper) {
    return (
      <form onSubmit={handleSubmit} className={styles.form}>
        {renderFields()}
        <button type="submit" className={isEditMode ? styles.editButton : styles.addButton}>
             {isEditMode ? editLabel : addLabel}
        </button>
      </form>
    );
  } else {
    // Otherwise, just render the fields (for parent form to handle submit)
    return renderFields();
  }
};

export default SimpleForm;