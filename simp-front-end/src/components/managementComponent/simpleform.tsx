"use client";

import React from "react";

interface FormField<T> {
  name: keyof T;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
}

interface FormProps<T> {
  title: string;
  fields: FormField<T>[];
  state: Partial<T>;
  setState: (state: Partial<T>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

const SimpleForm = <T,>({ title, fields, state, setState, onSubmit, submitLabel }: FormProps<T>) => {
  return (
    <form onSubmit={onSubmit} className="mb-4 space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      {fields.map((field) => (
        <input
          key={field.name as string}
          type={field.type}
          placeholder={field.placeholder}
          value={(state[field.name] as string | number) ?? ""}
          onChange={(e) =>
            setState({
              ...state,
              [field.name]: field.type === "number" ? Number(e.target.value) : e.target.value,
            })
          }
          className="border p-2 w-full"
          required={field.required ?? false}
        />
      ))}
      <button type="submit" className="bg-blue-500 text-white p-2 w-full">
        {submitLabel}
      </button>
    </form>
  );
};

export default SimpleForm;
