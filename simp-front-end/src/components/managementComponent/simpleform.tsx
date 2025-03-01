"use client";

import React from "react";

interface FormField {
  name: string;
  type: "text" | "number"; // Explicitly restricting type
  placeholder: string;
  required?: boolean;
}

interface FormProps<T> {
  title: string;
  fields: FormField[];
  state: Partial<T>;
  setState: (state: Partial<T>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
}

const SimpleForm = <T,>({ title, fields, state, setState, onSubmit, submitLabel = "Submit" }: FormProps<T>) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="mb-4 space-y-2">
        {fields.map((field) => {
          const value = state[field.name as keyof T] ?? ""; // Ensure value is never undefined

          return (
            <input
              key={field.name}
              type={field.type} // Ensuring strict type usage
              placeholder={field.placeholder}
              value={typeof value === "number" || typeof value === "string" ? value : ""}
              onChange={(e) =>
                setState({ ...state, [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value })
              }
              className="border p-2 w-full"
              required={field.required}
            />
          );
        })}
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          {submitLabel}
        </button>
      </form>
    </div>
  );
};

export default SimpleForm;
