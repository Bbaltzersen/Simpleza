"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import Modal from "@/components/ui/modal";
import styles from "./recipeModal.module.css";
import {
  RecipeCreate,
  RecipeStepCreate,
  RecipeImageCreate,
  RecipeIngredientCreate,
  ListRecipe,
  RecipeTagCreate,
} from "@/lib/types/recipe";
import { useDashboard } from "../context/dashboardContext";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: RecipeCreate) => void;
  recipe?: ListRecipe | null;
}

export default function RecipeModal({ isOpen, onClose, onSave, recipe }: RecipeModalProps) {
  const [RecipeData, setRecipeData] = useState<{
    title: string;
    description: string;
    front_image: string;
    author_id: string;
    ingredients: RecipeIngredientCreate[];
    steps: RecipeStepCreate[];
    images: RecipeImageCreate[];
    tags: RecipeTagCreate[];
  }>({
    title: "",
    description: "",
    front_image: "",
    author_id: "",
    ingredients: [],
    steps: [],
    images: [],
    tags: [],
  });

  // Ingredients state will hold your original RecipeIngredientCreate objects,
  // with an extra property "ingredient_error" attached when needed.
  const [ingredients, setIngredients] = useState<RecipeIngredientCreate[]>([]);

  // Reference for focusing new rows.
  const lastInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (recipe) {
      // TODO: Load existing recipe data here
    } else {
      setRecipeData({
        title: "",
        description: "",
        front_image: "",
        author_id: "",
        ingredients: [],
        steps: [],
        images: [],
        tags: [],
      });
    }
  }, [recipe, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRecipeData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  // Helper to recalc duplicate errors. We attach an extra property "ingredient_error"
  // to each ingredient if its (trimmed, lowercased) name appears more than once.
  const recalcErrors = (updatedIngredients: RecipeIngredientCreate[]): RecipeIngredientCreate[] => {
    const names = updatedIngredients.map((ing) => ing.ingredient_name.trim().toLowerCase());
    return updatedIngredients.map((ing) => {
      if (
        ing.ingredient_name &&
        names.filter((name) => name === ing.ingredient_name.trim().toLowerCase()).length > 1
      ) {
        return { ...ing, ingredient_error: "Duplicate ingredient not allowed." } as any;
      }
      return { ...ing, ingredient_error: "" } as any;
    });
  };

  // Add a new ingredient row with an empty error.
  const handleAddRow = useCallback(() => {
    setIngredients((prev) => {
      const newIngredients = [
        ...prev,
        {
          ingredient_name: "",
          amount: 0,
          measurement: "",
          position: prev.length,
          ingredient_error: "",
        } as any,
      ];
      return newIngredients;
    });

    setTimeout(() => {
      lastInputRef.current?.focus();
    }, 0);
  }, []);

  // Update an ingredient and recalc errors when the name is changed.
  const handleIngredientChange = useCallback(
    (index: number, field: keyof RecipeIngredientCreate, value: string | number) => {
      setIngredients((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value } as any;
        if (field === "ingredient_name") {
          return recalcErrors(updated);
        }
        return updated;
      });
    },
    []
  );

  // Remove an ingredient and recalc errors.
  const handleRemoveRow = useCallback((index: number) => {
    setIngredients((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return recalcErrors(filtered.map((ing, newIndex) => ({ ...ing, position: newIndex })));
    });
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.recipeModalContainer}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // The ingredients (with potential errors attached) are passed up here.
            onSave({ ...RecipeData, ingredients });
            onClose();
          }}
        >
          <div className={styles.formContainer}>
            <div className={styles.inputContainer}>
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={RecipeData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className={styles.inputContainer}>
              <label>Description:</label>
              <input
                type="textarea"
                name="description"
                value={RecipeData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Ingredient Section */}
            <IngredientList
              ingredients={ingredients}
              onAdd={handleAddRow}
              onChange={handleIngredientChange}
              onRemove={handleRemoveRow}
              lastInputRef={lastInputRef}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}

const IngredientList = memo(
  ({
    ingredients,
    onAdd,
    onChange,
    onRemove,
    lastInputRef,
  }: {
    ingredients: RecipeIngredientCreate[];
    onAdd: () => void;
    onChange: (index: number, field: keyof RecipeIngredientCreate, value: string | number) => void;
    onRemove: (index: number) => void;
    lastInputRef: React.RefObject<HTMLInputElement | null>;
  }) => {
    const { searchIngredients, ingredients: searchResults } = useDashboard();
    const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

    // Track which rows had a suggestion selected.
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    // Refs for dropdown elements.
    const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Close dropdown when clicking outside.
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (!dropdownRefs.current.some((ref) => ref && ref.contains(event.target as Node))) {
          setActiveDropdownIndex(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
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
          ing.ingredient_name.trim().toLowerCase() === result.name.trim().toLowerCase()
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
                if (!selectedIndices.has(index) && ingredient.ingredient_name.length > 2) {
                  handleSearch(ingredient.ingredient_name, index);
                }
              }}
              onBlur={() => setTimeout(() => setActiveDropdownIndex(null), 150)}
              ref={lastInputRef}
              style={
                (ingredient as any).ingredient_error
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

export { RecipeModal, IngredientList };
