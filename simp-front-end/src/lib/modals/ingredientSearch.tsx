"use client";

import React, { useState, useEffect } from "react";
import { fetchIngredientsByName } from "@/lib/api/user/ingredient";
import { Ingredient } from "@/lib/types/ingredient";
import styles from "./ingredientSearch.module.css"; // Create this file for styling

interface IngredientSearchProps {
  onSelect: (ingredient: Ingredient) => void;
}

const IngredientSearch: React.FC<IngredientSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setIngredients([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      const results = await fetchIngredientsByName(query);
      setIngredients(results);
      setLoading(false);
    }, 500); // Debounce input by 300ms

    return () => clearTimeout(delayDebounce);
  }, [query]);

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Search ingredients..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      {loading && <p className={styles.loading}>Loading...</p>}
      <ul className={styles.list}>
        {ingredients.map((ingredient) => (
          <li
            key={ingredient.ingredient_id}
            onClick={() => {
              onSelect(ingredient);
              setQuery(""); // Reset input after selection
              setIngredients([]); // Clear results
            }}
            className={styles.listItem}
          >
            {ingredient.name} ({ingredient.default_unit})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IngredientSearch;
