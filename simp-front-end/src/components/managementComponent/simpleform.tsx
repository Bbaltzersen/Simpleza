"use client";

import React from "react";

interface FormField {
  name: string;
  type: "text" | "number";
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

const Form = <T,>({ title, fields, state, setState, onSubmit, submitLabel = "Submit" }: FormProps<T>) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <form onSubmit={onSubmit} className="mb-4 space-y-2">
        {fields.map((field) => (
          <input
            key={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={state[field.name as keyof T] as string | number | readonly string[] | undefined || ""}
            onChange={(e) => setState({ ...state, [field.name]: e.target.value })}
            className="border p-2 w-full"
            required={field.required}
          />
        ))}
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          {submitLabel}
        </button>
      </form>
    </div>
  );
};

export default Form;
