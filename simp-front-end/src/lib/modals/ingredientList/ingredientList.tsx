import { useDashboard } from "@/lib/context/dashboardContext";
import { RecipeIngredientCreate } from "@/lib/types/recipe";
import { memo, useEffect, useRef, useState } from "react";
import styles from "./ingredientList.module.css"

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
      const { searchIngredients, ingredients: searchResults } = useDashboard();
      const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(
        null
      );
      const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
        new Set()
      );
      const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  
      // Close dropdown when clicking outside.
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (
            !dropdownRefs.current.some(
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
          searchIngredients(query);
          setActiveDropdownIndex(index);
        } else {
          setActiveDropdownIndex(null);
        }
      };
  
      const handleSelect = (index: number, selectedIngredient: string) => {
        onChange(index, "ingredient_name", selectedIngredient);
        setActiveDropdownIndex(null);
        setSelectedIndices((prev) => new Set(prev).add(index));
      };
  
      // Filter search results to exclude ingredients already in the list (case-insensitive).
      const filteredResults = searchResults.filter((result) =>
        !ingredients.some(
          (ing) =>
            ing.ingredient_name.trim().toLowerCase() ===
            result.name.trim().toLowerCase()
        )
      );
  
      return (
        <div className={styles.inputContainer}>
          <label>Ingredients:</label>
          <button type="button" onClick={onAdd}>
            Add Ingredient
          </button>
  
          {ingredients.map((ingredient, index) => (
            <div key={index} className="ingredient-row" style={{ position: "relative" }}>
              <input
                type="text"
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
                onBlur={() => setTimeout(() => setActiveDropdownIndex(null), 150)}
                ref={lastInputRef}
                style={
                  ingredient.ingredient_error
                    ? { backgroundColor: "#ffe6e6" }
                    : {}
                }
              />
  
              {activeDropdownIndex === index &&
                ingredient.ingredient_name.length > 2 &&
                filteredResults.length > 0 && (
                  <div
                    ref={(el) => {
                      dropdownRefs.current[index] = el;
                    }}
                    className={styles.dropdown}
                  >
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
  
              <input
                type="number"
                placeholder="Amount"
                value={ingredient.amount}
                onChange={(e) =>
                  onChange(index, "amount", Number(e.target.value))
                }
              />
              <input
                type="text"
                placeholder="Measurement"
                value={ingredient.measurement}
                onChange={(e) =>
                  onChange(index, "measurement", e.target.value)
                }
              />
              <span>Position: {ingredient.position}</span>
              <button type="button" onClick={() => onRemove(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      );
    }
  );