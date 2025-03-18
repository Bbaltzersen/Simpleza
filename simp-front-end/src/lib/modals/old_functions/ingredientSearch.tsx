"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchIngredientsByName } from "@/lib/api/user/ingredient";
import { Ingredient } from "@/lib/types/ingredient";
import { CheckCircle, Handshake, XCircle } from "lucide-react";
import styles from "./ingredientSearch.module.css";

interface IngredientSearchProps {
  onChange: (
    ingredient: Ingredient | null,
    amount: string,
    measurement: string
  ) => void;
  initialQuery?: string;
  initialAmount?: string;
  initialMeasurement?: string;
}

const IngredientSearch: React.FC<IngredientSearchProps> = ({
  onChange,
  initialQuery = "",
  initialAmount = "",
  initialMeasurement = ""
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [amount, setAmount] = useState(initialAmount);
  const [measurement, setMeasurement] = useState(initialMeasurement);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Use a ref to hold onChange so it doesn't trigger effect re-runs.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Update local query state when the initial query changes.
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Fetch ingredients when query or selectedIngredient changes.
  useEffect(() => {
    if (selectedIngredient && query.toLowerCase() === selectedIngredient.name.toLowerCase()) {
      return;
    }

    if (query.length < 2) {
      setIngredients([]);
      setSelectedIngredient(null);
      onChangeRef.current(null, amount, measurement);
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
  }, [query, selectedIngredient, amount, measurement]);

  // Notify parent when selected ingredient, amount, or measurement changes.
  useEffect(() => {
    onChangeRef.current(selectedIngredient, amount, measurement);
  }, [selectedIngredient, amount, measurement]);

  const handleSelectIngredient = (ingredient: Ingredient) => {
    setQuery(ingredient.name);
    setSelectedIngredient(ingredient);
    setIngredients([]);
    setIsDropdownOpen(false);
    onChangeRef.current(ingredient, amount, measurement);
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

      {/* Amount Input Field */}
      <div className={styles.valueField}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="Amount"
          value={amount}
          onChange={(e) => {
            const val = e.target.value;
            setAmount(val)
          }}
          className={styles.input}
        />
      </div>

      {/* Measurement Input Field */}
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
