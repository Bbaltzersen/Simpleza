"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedIngredient && query.toLowerCase() === selectedIngredient.name.toLowerCase()) {
      return;
    }

    if (query.length < 2) {
      setIngredients([]);
      setSelectedIngredient(null);
      onSelect(null, amount, measurement);
      setIsDropdownOpen(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const results = await fetchIngredientsByName(query);
      setIngredients(results);
      setLoading(false);
      setIsDropdownOpen(results.length > 0);
    };

    const delayDebounce = setTimeout(fetchData, 200);

    return () => clearTimeout(delayDebounce);
  }, [query, selectedIngredient]);

  useEffect(() => {
    onSelect(selectedIngredient, amount, measurement);
  }, [amount, measurement, selectedIngredient]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setQuery(ingredient.name);
    setSelectedIngredient(ingredient);
    setIngredients([]);
    setIsDropdownOpen(false);
    onSelect(ingredient, amount, measurement);
  };

  return (
    <div className={styles.row}>
      <div className={styles.searchField}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ingredient"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
              if (selectedIngredient && e.target.value.toLowerCase() !== selectedIngredient.name.toLowerCase()) {
                setSelectedIngredient(null);
              }
            }}
            onBlur={() => setIsDropdownOpen(false)}
            onFocus={() => setIsDropdownOpen(ingredients.length > 0)}
            className={styles.input}
          />
          {selectedIngredient ? (
            <CheckCircle color="green" size={20} className={styles.icon} />
          ) : query.length > 1 ? (
            <XCircle color="red" size={20} className={styles.icon} />
          ) : null}
          {isDropdownOpen && ingredients.length > 0 && (
            <ul className={styles.dropdown} onMouseDown={(e) => e.preventDefault()}>
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

      {/* Updated Amount Input Field */}
      <div className={styles.valueField}>
        <input
          type="text"
          inputMode="numeric"
          pattern="^(0|[1-9]\\d*)$"
          placeholder="Amount"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            // Allow empty string (to clear) or a sequence of digits only.
            if (val === "" || /^[0-9]+$/.test(val)) {
              setAmount(val);
            }
          }}
          className={styles.input}
        />
      </div>

      <div className={styles.valueField}>
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
