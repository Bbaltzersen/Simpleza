"use client";

import React, { useState } from "react";
import IngredientSearch from "./ingredientSearch";
import { Ingredient } from "@/lib/types/ingredient";

interface IngredientData {
  ingredient: Ingredient | null;
  amount: string;
  measurement: string;
}

const IngredientList: React.FC = () => {
  const [ingredientRows, setIngredientRows] = useState<IngredientData[]>([
    { ingredient: null, amount: "", measurement: "" },
  ]);

  // Callback to update a specific row
  const handleSelect = (
    index: number,
    ingredient: Ingredient | null,
    amount: string,
    measurement: string
  ) => {
    const newRows = [...ingredientRows];
    newRows[index] = { ingredient, amount, measurement };
    setIngredientRows(newRows);
  };

  // Add a new row
  const addRow = () => {
    setIngredientRows([
      ...ingredientRows,
      { ingredient: null, amount: "", measurement: "" },
    ]);
  };

  // Remove an existing row (if more than one row exists)
  const removeRow = (index: number) => {
    if (ingredientRows.length > 1) {
      setIngredientRows(ingredientRows.filter((_, i) => i !== index));
    }
  };

  return (
    <div>
      {ingredientRows.map((row, index) => (
        <div
          key={index}
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <IngredientSearch
            onSelect={(ingredient, amount, measurement) =>
              handleSelect(index, ingredient, amount, measurement)
            }
          />
          <button onClick={() => removeRow(index)} disabled={ingredientRows.length === 1}>
            Remove
          </button>
        </div>
      ))}
      <button onClick={addRow}>Add Ingredient</button>
    </div>
  );
};

export default IngredientList;
