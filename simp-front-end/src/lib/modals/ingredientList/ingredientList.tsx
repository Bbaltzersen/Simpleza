import React, { memo, useEffect, useRef, useState, useCallback } from "react";
import { Plus, Minus, Check, X } from "lucide-react";  // Import Check and X icons
import { fetchIngredientsByName } from "@/lib/api/recipe/recipe";
import { Ingredient } from "@/lib/types/ingredient";
import { RecipeIngredientCreate } from "@/lib/types/recipe";
import styles from "./ingredientList.module.css";

export const IngredientList = memo(
  ({
    ingredients,
    onAdd,
    onChange,
    onRemove,
    lastInputRef,
  }: {
    ingredients: (RecipeIngredientCreate & { ingredient_error?: string })[];
    onAdd: () => void;
    onChange: (
      index: number,
      field: keyof RecipeIngredientCreate,
      value: string | number
    ) => void;
    onRemove: (index: number) => void;
    lastInputRef: React.RefObject<HTMLInputElement | null>;
  }) => {
    const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(
      null
    );
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);

    const fetchSearchResults = useCallback(async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await fetchIngredientsByName(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Ingredient search failed:", error);
        setSearchResults([]);
      }
    }, []);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          !wrapperRefs.current.some(
            (ref) => ref && ref.contains(event.target as Node)
          )
        ) {
          setActiveDropdownIndex(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (query: string, index: number) => {
      if (query.length > 2) {
        fetchSearchResults(query);
        setActiveDropdownIndex(index);
      } else {
        setActiveDropdownIndex(null);
      }
    };

    const handleSelect = (index: number, selectedIngredient: string) => {
      onChange(index, "ingredient_name", selectedIngredient);
      // If an ingredient is selected from the dropdown, mark it as valid
      setSelectedIndices((prev) => new Set(prev).add(index));
      // Optionally, keep the dropdown open by not clearing activeDropdownIndex
    };

    const formatValue = (raw: string | number) => {
      const str = typeof raw === "number" ? raw.toString() : raw;
      if (!str) return "";
      const hasTrailingComma = str.endsWith(",");
      const parts = str.split(",");
      let integerPart = parts[0];
      const decimalPart = parts[1] || "";
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      let result = decimalPart ? `${integerPart},${decimalPart}` : integerPart;
      if (hasTrailingComma && !decimalPart) {
        result += ",";
      }
      return result;
    };

    const filteredResults = searchResults.filter((result) =>
      !ingredients.some(
        (ing) =>
          ing.ingredient_name.trim().toLowerCase() ===
          result.name.trim().toLowerCase()
      )
    );

    return (
      <div className={styles.inputContainer}>
        <div className={styles.inputHeader}>
          <label>Ingredients:</label>
          <a type="button" onClick={onAdd} className={styles.addButton}>
            <Plus size={20} />
          </a>
        </div>
        {ingredients.map((ingredient, index) => (
          <div key={index} className={styles.ingredientRow}>
            <div
              ref={(el) => {
                wrapperRefs.current[index] = el;
              }}
              className={`${styles.inputWrapper} ${
                activeDropdownIndex === index ? styles.active : ""
              }`}
            >
              {/* Wrap the input and icon in a flex container */}
              <div className={styles.inputWithIcon}>
                <input
                  type="text"
                  className={styles.ingredientInput}
                  placeholder="Ingredient Name"
                  value={ingredient.ingredient_name}
                  onChange={(e) => {
                    onChange(index, "ingredient_name", e.target.value);
                    if (selectedIndices.has(index)) {
                      setSelectedIndices((prev) => {
                        const newSet = new Set(prev);
                        newSet.delete(index);
                        return newSet;
                      });
                    }
                    handleSearch(e.target.value, index);
                  }}
                  onFocus={() => {
                    if (
                      !selectedIndices.has(index) &&
                      ingredient.ingredient_name.length > 2
                    ) {
                      handleSearch(ingredient.ingredient_name, index);
                    }
                  }}
                  ref={lastInputRef}
                  style={
                    ingredient.ingredient_error
                      ? { backgroundColor: "#ffe6e6" }
                      : {}
                  }
                />
                {/* Conditionally render validation icon if 3 or more characters */}
                {ingredient.ingredient_name.length >= 3 && (
                  selectedIndices.has(index) ? (
                    <Check
                      size={20}
                      className={styles.validationIcon}
                      color="green"
                    />
                  ) : (
                    <X
                      size={20}
                      className={styles.validationIcon}
                      color="red"
                    />
                  )
                )}
              </div>
              {activeDropdownIndex === index &&
                ingredient.ingredient_name.length > 2 &&
                filteredResults.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredResults.map((result, i) => (
                      <div
                        key={i}
                        className={styles.dropdownItem}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(index, result.name)}
                      >
                        {result.name}
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9,]*"
              className={styles.amountInput}
              placeholder="Amount"
              value={formatValue(ingredient.amount)}
              onChange={(e) => {
                const rawInput = e.target.value.replace(/\./g, "");
                const sanitized = rawInput.replace(/[^0-9,]/g, "");
                onChange(index, "amount", sanitized);
              }}
            />
            <input
              type="text"
              className={styles.measurementInput}
              placeholder="Measurement"
              value={ingredient.measurement}
              onChange={(e) =>
                onChange(index, "measurement", e.target.value)
              }
            />
            <a onClick={() => onRemove(index)} className={styles.removeButton}>
              <Minus size={20} />
            </a>
          </div>
        ))}
      </div>
    );
  }
);
