"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { RotateCcw, NotebookPen } from "lucide-react";
import styles from "./ingredientManagement.module.css"; // Import CSS Module

// --- Types ---
import type {
  IngredientBase,
  IngredientCreatePayload,
  IngredientUpdatePayload,
  IngredientOut,
  PaginatedIngredients,
  BatchNutrientUpdatePayload,
  IngredientNutrientOut,
  IngredientNutrientLinkPayload,
} from "@/lib/types/ingredient"; // Adjust path if needed
import type { NutrientOut as FullNutrientDef } from "@/lib/types/nutrient"; // Adjust path if needed
import type { FormField } from "@/components/managementComponent/simpleform"; // Adjust path if needed

// --- API ---
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  getIngredientNutrients,
  updateIngredientNutrients,
} from "@/lib/api/admin/ingredients"; // Adjust path if needed
import { fetchNutrients as fetchAllNutrientDefs } from "@/lib/api/admin/nutrients"; // Adjust path if needed

// --- Components ---
import SimpleTable from "@/components/managementComponent/simpleTable"; // Adjust path if needed
import SimpleForm from "@/components/managementComponent/simpleform"; // Adjust path if needed
import ManagementContainer from "@/components/managementComponent/managementContainer"; // Adjust path if needed

const ITEMS_PER_PAGE = 10;

// Type for the main ingredient form state
type IngredientFormData = {
  [K in keyof IngredientBase]?: IngredientBase[K] | string | undefined | number | boolean;
} & { ingredient_id?: string };

// Type for the nutrient editing state (maps nutrient_id to its string value from input)
type EditableNutrientValues = Record<string, string>;

// --- Initial Form States ---
const initialIngredientFormState: IngredientFormData = {
  name: "",
  description: "",
  density_g_per_ml: "",
  default_unit: "gram", // Default to standard string value expected by backend Enum
  diet_level: 4,       // Default to standard number value expected by backend Enum
  validated: false,
};

const initialNutrientValuesState: EditableNutrientValues = {};

// --- Component ---
const IngredientManagement: React.FC = () => {
  // State variables
  const [ingredients, setIngredients] = useState<IngredientOut[]>([]);
  const [totalIngredients, setTotalIngredients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Loading ingredients list
  const [isNutrientLoading, setIsNutrientLoading] = useState(false); // Loading nutrients for selected ingredient
  const [isSaving, setIsSaving] = useState(false); // Loading state during save operations
  const [error, setError] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);
  const [ingredientFormState, setIngredientFormState] = useState<IngredientFormData>(initialIngredientFormState);
  const [availableNutrients, setAvailableNutrients] = useState<FullNutrientDef[]>([]);
  const [editableNutrientValues, setEditableNutrientValues] = useState<EditableNutrientValues>(initialNutrientValuesState);
  const [isEditingNutrients, setIsEditingNutrients] = useState(false);

  // --- Data Fetching ---
  const loadIngredients = useCallback(async (page: number, limit: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // Service function fetchIngredients expects page, limit
      const data = await fetchIngredients(page, limit);
      setIngredients(data.items ?? []);
      setTotalIngredients(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
      setError("Failed to load ingredients.");
      setIngredients([]);
      setTotalIngredients(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIngredients(currentPage, ITEMS_PER_PAGE);
  }, [currentPage, loadIngredients]);

  useEffect(() => {
    const loadAllNutrients = async () => {
        // Consider adding loading state for this if it takes time
      try {
        const data = await fetchAllNutrientDefs(0, 500); // Use dedicated /all endpoint if created
        setAvailableNutrients(data.items ?? []);
      } catch (err) {
        console.error("Failed to fetch all nutrient definitions:", err);
        setError("Failed to load nutrient definitions for editing form.");
      }
    };
    loadAllNutrients();
  }, []); // Runs once

  const loadIngredientNutrientValues = async (ingredientId: string) => {
    setIsNutrientLoading(true);
    setError(null);
    try {
      const existingValues = await getIngredientNutrients(ingredientId);
      const valuesMap: EditableNutrientValues = {};
      if (existingValues) {
        existingValues.forEach(nv => {
          valuesMap[nv.nutrient_id] = nv.nutrient_value != null ? String(nv.nutrient_value) : "";
        });
      }
      setEditableNutrientValues(valuesMap);
    } catch (err) {
      console.error(`Failed to fetch nutrient values for ingredient ${ingredientId}:`, err);
      setError("Failed to load existing nutrient values.");
      setEditableNutrientValues(initialNutrientValuesState);
    } finally {
      setIsNutrientLoading(false);
    }
  };

  // --- Form State Handling ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setIngredientFormState(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleNutrientValueChange = (nutrientId: string, value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setEditableNutrientValues(prev => ({ ...prev, [nutrientId]: sanitizedValue }));
  };

  const clearSelection = () => {
    setSelectedRowId(null);
    setCurrentIngredientId(null);
    setIngredientFormState(initialIngredientFormState);
    setEditableNutrientValues(initialNutrientValuesState);
    setIsEditingNutrients(false);
    setError(null);
  };

  const handleRowClick = useCallback((ingredient: IngredientOut) => {
    setSelectedRowId(ingredient.ingredient_id);
    setCurrentIngredientId(ingredient.ingredient_id);
    setIsEditingNutrients(false);
    setIngredientFormState({
      ingredient_id: ingredient.ingredient_id,
      name: ingredient.name ?? "",
      description: ingredient.description ?? "",
      density_g_per_ml: ingredient.density_g_per_ml != null ? String(ingredient.density_g_per_ml) : "",
      default_unit: ingredient.default_unit ?? "gram",
      diet_level: ingredient.diet_level ?? 4,
      validated: ingredient.validated ?? false,
    });
    loadIngredientNutrientValues(ingredient.ingredient_id);
    setError(null);
  }, []); // Removed loadIngredientNutrientValues from deps, called manually

  // --- Data Preparation ---
  const prepareIngredientPayload = (formData: IngredientFormData, isUpdate: boolean = false): IngredientCreatePayload | IngredientUpdatePayload => {
    const payload: any = {};
    const processValue = (key: keyof IngredientBase, value: any): string | number | boolean | null | undefined => {
        const processedValue = typeof value === 'string' ? value.trim() : value;
        if (processedValue === '' || processedValue === undefined) {
            if (key === 'validated') return formData.validated ?? false; // Use actual state value
             return null;
        }
        if (key === 'density_g_per_ml') {
            const num = parseFloat(String(processedValue));
            return !isNaN(num) && isFinite(num) ? num : null;
        }
        if (key === 'diet_level') {
            const num = parseInt(String(processedValue), 10);
            return isNaN(num) ? 4 : num; // Default to 4 if invalid? Or null? Let's use 4.
        }
        if (key === 'validated') { return Boolean(processedValue); }
        return String(processedValue);
    };

    for (const key of Object.keys(initialIngredientFormState) as Array<keyof IngredientBase>) {
         // For update, only include fields present in the current form state being submitted
         // For create, process all base fields
         if (!isUpdate || key in formData) {
             const processed = processValue(key, formData[key]);
             if (processed !== undefined) { payload[key] = processed; }
         }
    }
    if(isUpdate && 'validated' in formData){ // Ensure boolean is included even if false
        payload['validated'] = Boolean(formData['validated']);
    }


    if (!isUpdate) {
        if (!payload.name) throw new Error("Ingredient Name is required.");
        if (!payload.default_unit) throw new Error("Default Unit is required.");
        if (payload.diet_level === null || payload.diet_level === undefined) payload.diet_level = 4;
        if (payload.validated === null || payload.validated === undefined) payload.validated = false;
    }

    // Clean payload for update (remove nulls if backend doesn't handle them well for optional fields)
    const finalPayload: any = {};
     for (const key in payload) {
         if (isUpdate){
             // For update (PUT/PATCH), only send non-null values if backend handles partial update based on presence
             // If backend PUT expects all fields (even nulls), send all processed values
             // Assuming our PUT handles partial based on exclude_unset=True, send non-nulls
             if (payload[key] !== null) {
                 finalPayload[key] = payload[key];
             }
         } else {
             // For create, include all processed values (including nulls and defaults)
              finalPayload[key] = payload[key];
         }
     }
    // return payload; // Simpler: send all processed values, backend handles optionality
    return payload as IngredientCreatePayload | IngredientUpdatePayload; // Let's send all processed values
  };

  const prepareNutrientBatchPayload = (values: EditableNutrientValues): BatchNutrientUpdatePayload => {
    const payload: BatchNutrientUpdatePayload = [];
    for (const nutrientId in values) {
      const valueStr = values[nutrientId];
      if (valueStr != null && valueStr.trim() !== "") {
        const valueNum = parseFloat(valueStr);
        if (!isNaN(valueNum) && isFinite(valueNum)) {
           payload.push({ nutrient_id: nutrientId, nutrient_value: valueNum });
        } else { console.warn(`Skipping invalid number format for nutrient ${nutrientId}: ${valueStr}`); }
      }
    }
    return payload;
  };

  // --- API Actions ---
  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true); // Use dedicated saving state
    let ingredientPayload: IngredientCreatePayload | IngredientUpdatePayload;
    let nutrientPayload: BatchNutrientUpdatePayload;

    try {
      ingredientPayload = prepareIngredientPayload(ingredientFormState, !!currentIngredientId);
      nutrientPayload = prepareNutrientBatchPayload(editableNutrientValues);
    } catch (validationError: any) {
      setError(validationError.message); setIsSaving(false); return;
    }

    try {
      let savedIngredient: IngredientOut | null = null;
      if (currentIngredientId) {
        savedIngredient = await updateIngredient(currentIngredientId, ingredientPayload as IngredientUpdatePayload);
      } else {
        savedIngredient = await createIngredient(ingredientPayload as IngredientCreatePayload);
      }
      if (!savedIngredient) throw new Error("Failed to save ingredient details.");

      const finalIngredientId = savedIngredient.ingredient_id;
      const savedNutrients = await updateIngredientNutrients(finalIngredientId, nutrientPayload);
      if (savedNutrients === null) {
        console.error("Ingredient details saved, but failed to save nutrient values.");
        setError("Ingredient saved, but failed to update nutrient values.");
        // Keep going but show error
      } else {
          console.log("Nutrient values saved successfully.");
      }

      // Success
      alert("Ingredient saved successfully!"); // Simple feedback
      loadIngredients(currentPage, ITEMS_PER_PAGE); // Reload list
      handleRowClick(savedIngredient); // Update form to show saved state
      setIsEditingNutrients(false); // Exit nutrient edit mode

    } catch (err: any) {
      console.error("Failed to save ingredient or nutrients:", err);
      setError(`Save failed: ${err.message || 'Unknown API error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Memos ---
  const ingredientFormFields: FormField<IngredientFormData>[] = useMemo(() => [
    { name: "name", title: "Ingredient Name", type: "text", placeholder: "e.g., Raw Apple with Skin", required: true },
    { name: "description", title: "Description", type: "textarea", placeholder: "Optional description..." },
    { name: "density_g_per_ml", title: "Density (g/mL)", type: "number", placeholder: "e.g., 0.95 (Optional)" },
    { name: "default_unit", title: "Default Unit", type: "text", placeholder: "e.g., gram, milliliter", required: true },
    { name: "diet_level", title: "Diet Level", type: "number", placeholder: "1=Vegan, 4=Omnivore" },
    { name: "validated", title: "", type: "checkbox", placeholder: "Validated"},
  ], []);

  const tableColumns: string[] = useMemo(() => ["Name", "Default Unit", "Diet Level", "Validated"], []);

  const tableData = useMemo(() => ingredients.map((ing) => ({
    id: ing.ingredient_id,
    values: [ ing.name, ing.default_unit, ing.diet_level, ing.validated ? "Yes" : "No" ],
  })), [ingredients]);

  // --- Render Nutrient Editor (Conditional) ---
  const renderNutrientEditor = () => {
    if (!currentIngredientId || !isEditingNutrients) return null;
    return (
      <div className={styles.nutrientEditor}>
        <h3 className={styles.nutrientEditorTitle}>Edit Nutrient Values for: {ingredientFormState.name}</h3>
        {isNutrientLoading && <div className={styles.loadingIndicator}>Loading values...</div>}
        {!isNutrientLoading && availableNutrients.length === 0 && <p>No nutrient definitions found.</p>}
        <div className={styles.nutrientGrid}>
          {!isNutrientLoading && availableNutrients.map(nutrientDef => (
            <div key={nutrientDef.nutrient_id} className={styles.nutrientRow}>
              <label htmlFor={`nutrient-${nutrientDef.nutrient_id}`} className={styles.nutrientLabel} title={nutrientDef.nutrient_name}>
                {nutrientDef.nutrient_name} ({nutrientDef.unit ?? 'N/A'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                id={`nutrient-${nutrientDef.nutrient_id}`}
                name={nutrientDef.nutrient_id}
                value={editableNutrientValues[nutrientDef.nutrient_id] || ""}
                onChange={(e) => handleNutrientValueChange(nutrientDef.nutrient_id, e.target.value)}
                placeholder={`Value (${nutrientDef.unit ?? ''})`}
                className={styles.nutrientInput}
                disabled={isSaving} // Disable while saving main form
              />
            </div>
          ))}
        </div>
        <div className={styles.nutrientEditorActions}>
          <button type="button" onClick={() => setIsEditingNutrients(false)} className={`${styles.button} ${styles.secondaryButton}`} disabled={isSaving}>
            Done Editing Nutrients
          </button>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <ManagementContainer
      title="Manage Ingredients"
      actionButton={currentIngredientId ? (
        <button onClick={clearSelection} title="Clear selection / New" className={styles.clearButton} disabled={isSaving}>
          <RotateCcw size={18} />
        </button>
      ) : null}
      isLoading={isLoading && !isNutrientLoading} // Show loading only for ingredient list fetch
      errorMessage={error}
    >
      {/* Display loading indicator for nutrient defs separately */}
      {availableNutrients.length === 0 && !isLoading && !error && <div className={styles.loadingIndicator}>Loading nutrient definitions...</div>}

      {/* Only render forms/table once nutrient defs are loaded */}
      {availableNutrients.length > 0 && (
        <>
          {currentIngredientId && !isEditingNutrients && (
            <button
              type="button"
              onClick={() => setIsEditingNutrients(true)}
              className={`${styles.button} ${styles.editNutrientsButton} mb-4`}
              disabled={isLoading || isNutrientLoading || isSaving} // More comprehensive disable check
            >
              <NotebookPen size={16} />
              Edit Nutrient Values
            </button>
          )}

          {isEditingNutrients ? (
            renderNutrientEditor()
          ) : (
            <SimpleForm
              fields={ingredientFormFields}
              state={ingredientFormState}
              setState={setIngredientFormState}
              onAdd={handleSaveIngredient}
              addLabel="Add New Ingredient & Nutrients"
              isEditMode={!!currentIngredientId}
              onEdit={handleSaveIngredient}
              editLabel="Save Ingredient & Nutrient Changes"
              // Disable form if loading list, loading nutrients, saving, or if nutrient editor is conceptually 'open' but not displayed
              disabled={isLoading || isSaving || isNutrientLoading || isEditingNutrients}
            />
          )}

          <SimpleTable
            title="Ingredient List"
            columns={tableColumns}
            data={tableData}
            totalItems={totalIngredients}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            // Disable pagination while editing nutrients or saving
            onPageChange={(page) => { if (!isEditingNutrients && !isSaving) setCurrentPage(page); }}
            selectedRowId={selectedRowId}
            onRowClick={(item) => {
              // Disable row selection while editing or saving
              if (!isEditingNutrients && !isSaving) {
                const selected = ingredients.find((ing) => ing.ingredient_id === item.id);
                if (selected) { handleRowClick(selected); }
              }
            }}
            // Show loading state specific to the table data
            isLoading={isLoading && !isNutrientLoading}
          />
        </>
      )}
    </ManagementContainer>
  );
};

export default IngredientManagement;