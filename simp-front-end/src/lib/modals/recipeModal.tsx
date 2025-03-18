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

  // ✅ Separate state for ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredientCreate[]>([]);

  // ✅ Track the last added input
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

  // ✅ Memoized function to add a new row
  const handleAddRow = useCallback(() => {
    setIngredients((prev) => {
      const newIngredients = [
        ...prev,
        {
          ingredient_name: "",
          amount: 0,
          measurement: "",
          position: prev.length,
        },
      ];

      return newIngredients;
    });

    // Focus the last added input
    setTimeout(() => {
      lastInputRef.current?.focus();
    }, 0);
  }, []);

  const handleIngredientChange = useCallback(
    (index: number, field: keyof RecipeIngredientCreate, value: string | number) => {
      setIngredients((prev) => {
        const updatedIngredients = [...prev];
        updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
        return updatedIngredients;
      });
    },
    []
  );

  const handleRemoveRow = useCallback((index: number) => {
    setIngredients((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((ingredient, newIndex) => ({ ...ingredient, position: newIndex }))
    );
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.recipeModalContainer}>
        <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ ...RecipeData, ingredients });
            onClose();
          }}
        >
          <div className={styles.formContainer}>
            <div className={styles.inputContainer}>
              <label>Title:</label>
              <input type="text" name="title" value={RecipeData.title} onChange={handleChange} required />
            </div>
            <div className={styles.inputContainer}>
              <label>Description:</label>
              <input type="textarea" name="description" value={RecipeData.description} onChange={handleChange} required />
            </div>

            {/* ✅ Optimized Ingredient Section */}
            <IngredientList
              ingredients={ingredients}
              onAdd={handleAddRow}
              onChange={handleIngredientChange}
              onRemove={handleRemoveRow}
              lastInputRef={lastInputRef} // ✅ Pass ref to the last input
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
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle ingredient search
    const handleSearch = (query: string, index: number) => {
      if (query.length > 2) {
        searchIngredients(query);
        setActiveDropdownIndex(index); // Show dropdown for this input
      } else {
        setActiveDropdownIndex(null); // Hide dropdown if query is too short
      }
    };

    // Handle selecting a suggestion
    const handleSelect = (index: number, selectedIngredient: string) => {
      onChange(index, "ingredient_name", selectedIngredient);
      setActiveDropdownIndex(null); // Hide dropdown after selection
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setActiveDropdownIndex(null);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className={styles.inputContainer}>
        <label>Ingredients:</label>
        <button type="button" onClick={onAdd}>Add Ingredient</button>

        {ingredients.map((ingredient, index) => (
          <div key={index} className="ingredient-row" style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Ingredient Name"
              value={ingredient.ingredient_name}
              onChange={(e) => {
                onChange(index, "ingredient_name", e.target.value);
                handleSearch(e.target.value, index);
              }}
              ref={index === ingredients.length - 1 ? lastInputRef : null}
            />

            {/* ✅ Dropdown menu */}
            {activeDropdownIndex === index && searchResults.length > 0 && (
              <div ref={dropdownRef} className={styles.dropdown}>
                {searchResults.map((result, i) => (
                  <div
                    key={i}
                    className={styles.dropdownItem}
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
              onChange={(e) => onChange(index, "amount", Number(e.target.value))}
            />
            <input
              type="text"
              placeholder="Measurement"
              value={ingredient.measurement}
              onChange={(e) => onChange(index, "measurement", e.target.value)}
            />
            <span>Position: {ingredient.position}</span>
            <button type="button" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
    );
  }
);