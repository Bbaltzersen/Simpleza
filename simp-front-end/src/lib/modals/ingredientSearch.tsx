"use client";

import React, { useState, useEffect } from "react";
import { fetchIngredientsByName } from "@/lib/api/user/ingredient";
import { Ingredient } from "@/lib/types/ingredient";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "./ingredientSearch.module.css";

interface IngredientSearchProps {
  onSelect: (
    ingredient: Ingredient | null,
    amount: string,
    measurement: string
  ) => void;
}

const IngredientSearch: React.FC<IngredientSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If an ingredient is selected and query matches it exactly, do not search again.
    if (
      selectedIngredient &&
      query.toLowerCase() === selectedIngredient.name.toLowerCase()
    ) {
      return;
    }

    if (query.length < 2) {
      setIngredients([]);
      setSelectedIngredient(null);
      onSelect(null, amount, measurement);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      const results = await fetchIngredientsByName(query);
      setIngredients(results);
      setLoading(false);

      // Find an exact match (case-insensitive)
      const match = results.find(
        (ing) => ing.name.toLowerCase() === query.toLowerCase()
      );
      setSelectedIngredient(match || null);
      onSelect(match || null, amount, measurement);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, selectedIngredient]);

  useEffect(() => {
    // Whenever amount, measurement, or the selected ingredient changes, update the parent
    onSelect(selectedIngredient, amount, measurement);
  }, [amount, measurement, selectedIngredient]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setQuery(ingredient.name);
    setSelectedIngredient(ingredient);
    setIngredients([]); // Close dropdown after selection
    onSelect(ingredient, amount, measurement);
  };

  return (
    <div className={styles.row}>
      {/* Ingredient Input Field */}
      <div className={styles.field}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="Ingredient"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Reset selection if the user types something different
              if (
                selectedIngredient &&
                e.target.value.toLowerCase() !== selectedIngredient.name.toLowerCase()
              ) {
                setSelectedIngredient(null);
              }
            }}
            className={styles.input}
          />
          {selectedIngredient ? (
            <CheckCircle color="green" size={20} className={styles.icon} />
          ) : query.length > 1 ? (
            <XCircle color="red" size={20} className={styles.icon} />
          ) : null}
          {ingredients.length > 0 && (
            <ul className={styles.dropdown}>
              {ingredients.map((ingredient) => (
                <li
                  key={ingredient.ingredient_id}
                  onClick={() => handleSelectIngredient(ingredient)}
                  className={styles.dropdownItem}
                >
                  {ingredient.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Amount Input Field */}
      <div className={styles.field}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
        />
      </div>

      {/* Measurement Input Field */}
      <div className={styles.field}>
        <input
          type="text"
          placeholder="Measurement"
          value={measurement}
          onChange={(e) => setMeasurement(e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  );
};

export default IngredientSearch;
