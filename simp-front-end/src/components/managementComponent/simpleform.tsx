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
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

const SimpleForm = <T,>({ fields, state, setState, onSubmit, submitLabel }: FormProps<T>) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
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
      <input type="submit" value={submitLabel} className={styles.submit} />
    </form>
  );
};

export default SimpleForm;
