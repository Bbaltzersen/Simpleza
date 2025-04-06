// components/admin/IngredientManagement.tsx

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { RotateCcw, NotebookPen } from "lucide-react"; // Added Edit icon

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
} from "@/lib/types/ingredient";
import type { NutrientOut as FullNutrientDef } from "@/lib/types/nutrient"; // Use alias for clarity
import type { FormField } from "@/components/managementComponent/simpleform";

// --- API ---
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  getIngredientNutrients, // Fetch existing nutrients for an ingredient
  updateIngredientNutrients, // Batch update nutrients for an ingredient
} from "@/lib/api/admin/ingredients"; // Adjust path
import { fetchNutrients as fetchAllNutrientDefs } from "@/lib/api/admin/nutrients"; // Fetch all nutrient definitions

// --- Components ---
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
// Assuming a new component for the nutrient editing form
// import NutrientValueEditor from './NutrientValueEditor';

const ITEMS_PER_PAGE = 10;

// Type for the main ingredient form state
type IngredientFormData = {
  [K in keyof IngredientBase]?: IngredientBase[K] | string | undefined | number; // Allow numbers for parsing state
} & { ingredient_id?: string };

// Type for the nutrient editing state (maps nutrient_id to its string value from input)
type EditableNutrientValues = Record<string, string>; // nutrient_id: string -> value: string

// --- Initial Form States ---
const initialIngredientFormState: IngredientFormData = {
  name: "",
  description: "",
  density_g_per_ml: "", // Keep as string for input binding initially
  default_unit: "", // Default to 'gram' value from Enum/Const
  diet_level: undefined,        // Default to 4 (Omnivore value)
  validated: false,
};

const initialNutrientValuesState: EditableNutrientValues = {};

// --- Component ---
const IngredientManagement: React.FC = () => {
  // Ingredient List State
  const [ingredients, setIngredients] = useState<IngredientOut[]>([]);
  const [totalIngredients, setTotalIngredients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Form & Selection State
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);
  const [ingredientFormState, setIngredientFormState] = useState<IngredientFormData>(initialIngredientFormState);

  // Nutrient Editing State
  const [availableNutrients, setAvailableNutrients] = useState<FullNutrientDef[]>([]); // All possible nutrients
  const [editableNutrientValues, setEditableNutrientValues] = useState<EditableNutrientValues>(initialNutrientValuesState);
  const [isEditingNutrients, setIsEditingNutrients] = useState(false); // Toggle for nutrient view

  // Loading / Error State
  const [isLoading, setIsLoading] = useState(false);
  const [isNutrientLoading, setIsNutrientLoading] = useState(false); // Separate loading for nutrients
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---

  // Fetch Ingredient List
  const loadIngredients = useCallback(async (page: number, limit: number) => {
    setIsLoading(true);
    setError(null);
    const skip = Math.max(0, (page - 1) * limit);
    try {
      const data = await fetchIngredients(skip, limit); // Assuming fetchIngredients takes skip, limit
      setIngredients(data.items ?? []);
      setTotalIngredients(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch ingredients:", err);
      setError("Failed to load ingredients.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIngredients(currentPage, ITEMS_PER_PAGE);
  }, [currentPage, loadIngredients]);

  // Fetch All Nutrient Definitions (once on mount)
  useEffect(() => {
    const loadAllNutrients = async () => {
      try {
        // Assuming fetchAllNutrientDefs can fetch all with a large limit or specific param
        // Adjust limit as needed, or create a dedicated 'get all' endpoint
        const data = await fetchAllNutrientDefs(0, 500); // Fetch up to 500 nutrients
        setAvailableNutrients(data.items ?? []);
      } catch (err) {
        console.error("Failed to fetch all nutrient definitions:", err);
        setError("Failed to load nutrient definitions for editing form.");
      }
    };
    loadAllNutrients();
  }, []); // Runs once

  // Fetch existing nutrient values for the selected ingredient
  const loadIngredientNutrientValues = async (ingredientId: string) => {
    setIsNutrientLoading(true);
    try {
      const existingValues = await getIngredientNutrients(ingredientId);
      const valuesMap: EditableNutrientValues = {};
      if (existingValues) {
        existingValues.forEach(nv => {
          // Store existing values as strings for form consistency
          valuesMap[nv.nutrient_id] = nv.nutrient_value != null ? String(nv.nutrient_value) : "";
        });
      }
      setEditableNutrientValues(valuesMap);
    } catch (err) {
      console.error(`Failed to fetch nutrient values for ingredient ${ingredientId}:`, err);
      setError("Failed to load existing nutrient values.");
      setEditableNutrientValues(initialNutrientValuesState); // Reset on error
    } finally {
      setIsNutrientLoading(false);
    }
  };


  // --- Form State Handling ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox type for 'validated' field
    const processedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setIngredientFormState(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleNutrientValueChange = (nutrientId: string, value: string) => {
    // Basic sanitization (allow numbers, one decimal) - adjust regex as needed
    const sanitizedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setEditableNutrientValues(prev => ({
      ...prev,
      [nutrientId]: sanitizedValue,
    }));
  };

  const clearSelection = () => {
    setSelectedRowId(null);
    setCurrentIngredientId(null);
    setIngredientFormState(initialIngredientFormState);
    setEditableNutrientValues(initialNutrientValuesState);
    setIsEditingNutrients(false); // Close nutrient editor
    setError(null);
  };

  const handleRowClick = useCallback((ingredient: IngredientOut) => {
    setSelectedRowId(ingredient.ingredient_id);
    setCurrentIngredientId(ingredient.ingredient_id);
    setIsEditingNutrients(false); // Start by showing main ingredient form
    // Populate main ingredient form
    setIngredientFormState({
      ingredient_id: ingredient.ingredient_id,
      name: ingredient.name ?? "",
      description: ingredient.description ?? "",
      density_g_per_ml: ingredient.density_g_per_ml != null ? String(ingredient.density_g_per_ml) : "",
      default_unit: ingredient.default_unit ?? "gram", // Use default value if null
      diet_level: ingredient.diet_level ?? 4,
      validated: ingredient.validated ?? false,
    });
    // Load existing nutrient values for this ingredient in the background
    loadIngredientNutrientValues(ingredient.ingredient_id);
    setError(null);
  }, []); // loadIngredientNutrientValues is stable


  // --- Data Preparation ---
  // Prepare Ingredient Payload (Create/Update)
  const prepareIngredientPayload = (
    formData: IngredientFormData,
    isUpdate: boolean = false // Default to false (create)
): IngredientCreatePayload | IngredientUpdatePayload => {
    const payload: any = {}; // Start with an empty object

    // Inner function to process each value from the form state
    const processValue = (key: keyof IngredientBase, value: any): string | number | boolean | null | undefined => {
        // Handle different input types and potentially trim strings
        const processedValue = typeof value === 'string' ? value.trim() : value;

        // Treat empty strings or explicit undefined as null for optional fields
        if (processedValue === '' || processedValue === undefined) {
            // Special case: validated defaults to false, don't set to null if empty
             if (key === 'validated') return false;
             return null;
        }

        // --- Apply Type Conversions ---
        if (key === 'density_g_per_ml') {
            // FIX: Use parseFloat for density
            const num = parseFloat(String(processedValue));
            // Return number if valid and finite, otherwise null (or handle error)
            return !isNaN(num) && isFinite(num) ? num : null;
            // END FIX
        }
        if (key === 'diet_level') {
            const num = parseInt(String(processedValue), 10);
            // Return number or null if parsing fails
            return isNaN(num) ? null : num;
        }
        if (key === 'validated') {
            // Convert checkbox value (already boolean) or potentially string 'true'/'false'
            return Boolean(processedValue);
        }

        // Default: Assume string fields (name, description, default_unit)
        return String(processedValue);
    };

    // Iterate over keys expected by IngredientBase to build payload
    // Using initialIngredientFormState keys approximates IngredientBase keys
    for (const key of Object.keys(initialIngredientFormState) as Array<keyof IngredientBase>) {
        // Process only if the key exists in the current formData (especially for updates)
        // or handle the default 'validated' case
        if (key === 'validated' || key in formData) {
            const processed = processValue(key, formData[key]);
            // Only add non-undefined values to payload (nulls are okay for clearing optional fields)
            if (processed !== undefined) {
                 payload[key] = processed;
            }
        }
    }

    // --- Validate required fields specifically for CREATE payload ---
    if (!isUpdate) {
        if (!payload.name) {
            throw new Error("Ingredient Name is required.");
        }
        // default_unit uses enum string value like "gram"
        if (!payload.default_unit) {
            throw new Error("Default Unit is required.");
        }
        // Apply defaults from model if they became null during processing and are required
        // (Although Pydantic defaults on backend might handle this too)
        if (payload.diet_level === null || payload.diet_level === undefined) {
            payload.diet_level = 4; // Default Omnivore
        }
        if (payload.validated === null || payload.validated === undefined) {
             payload.validated = false; // Default validated
         }
    }

    return payload as IngredientCreatePayload | IngredientUpdatePayload;
};

  // Prepare Nutrient Batch Payload from editable state
  // Prepare Nutrient Batch Payload from editable state
  const prepareNutrientBatchPayload = (values: EditableNutrientValues): BatchNutrientUpdatePayload => {
    const payload: BatchNutrientUpdatePayload = [];
    for (const nutrientId in values) {
      const valueStr = values[nutrientId]; // Value from state is a string

      // Only include if not empty/null string
      if (valueStr != null && valueStr.trim() !== "") {
        // --- FIX: Use parseFloat and standard isFinite ---
        // Try parsing the string value from the form state
        const valueNum = parseFloat(valueStr);

        // Check if the result is a valid, finite number
        if (!isNaN(valueNum) && isFinite(valueNum)) {
           payload.push({
             nutrient_id: nutrientId, // Assuming keys are valid UUID strings
             nutrient_value: valueNum // Assign the parsed number
           });
        } else {
           // Log invalid numbers entered by the user but don't include them
           console.warn(`Skipping invalid number format for nutrient ${nutrientId}: ${valueStr}`);
        }
        // --- END FIX ---
      }
    }
    return payload;
  };

  // --- API Actions ---

  const handleSaveIngredient = async (e: React.FormEvent) => {
      // This function handles both Add (POST ingredient -> PUT nutrients)
      // and Edit (PUT ingredient -> PUT nutrients)
      e.preventDefault();
      setError(null);
      setIsLoading(true); // Overall loading state

      let ingredientPayload: IngredientCreatePayload | IngredientUpdatePayload;
      let nutrientPayload: BatchNutrientUpdatePayload;

      try {
          ingredientPayload = prepareIngredientPayload(ingredientFormState);
          nutrientPayload = prepareNutrientBatchPayload(editableNutrientValues);
      } catch (validationError: any) {
          setError(validationError.message);
          setIsLoading(false);
          return;
      }

      try {
          let savedIngredient: IngredientOut | null = null;
          // --- Step 1: Save Ingredient Details ---
          if (currentIngredientId) { // Editing existing
              savedIngredient = await updateIngredient(currentIngredientId, ingredientPayload as IngredientUpdatePayload);
          } else { // Creating new
              savedIngredient = await createIngredient(ingredientPayload as IngredientCreatePayload);
          }

          if (!savedIngredient) {
              throw new Error("Failed to save ingredient details.");
          }

          const finalIngredientId = savedIngredient.ingredient_id;

          // --- Step 2: Save Nutrient Values (only if ingredient save succeeded) ---
          // Always call, even with empty payload, backend handles empty list
          const savedNutrients = await updateIngredientNutrients(finalIngredientId, nutrientPayload);

          if (savedNutrients === null) {
              // Nutrient update failed, ingredient was saved. How to handle?
              // Option: Keep going, show partial success message.
              // Option: Try to revert ingredient save (difficult without transactions).
              // Option: Just show an error.
              console.error("Ingredient details saved, but failed to save nutrient values.");
              setError("Ingredient saved, but failed to update nutrient values.");
          }

          // --- Success ---
          // Reload table data to reflect changes
          loadIngredients(currentPage, ITEMS_PER_PAGE);
          // Update form state to reflect the saved ingredient and clear nutrient edit mode
          handleRowClick(savedIngredient); // Resets form state to saved data, loads nutrients again
          setIsEditingNutrients(false); // Exit nutrient edit mode
          // Optionally show a success message

      } catch (err: any) {
          console.error("Failed to save ingredient or nutrients:", err);
          setError(`Save failed: ${err.message || 'Unknown API error'}`);
      } finally {
          setIsLoading(false);
      }
  };


  // --- Memos ---
  const ingredientFormFields: FormField<IngredientFormData>[] = useMemo(() => [
      // Fields for the Ingredient model based on IngredientBase
      { title: "Ingredient Name", name: "name", type: "text", placeholder: "Ingredient Name", required: true },
      { title: "Description", name: "description", type: "textarea", placeholder: "Description" },
      { title: "Density", name: "density_g_per_ml", type: "number", placeholder: "Density (g/mL)" },
      { title: "Default Unit", name: "default_unit", type: "text", placeholder: "Default Unit (e.g., gram)", required: true }, // Consider select dropdown using UnitNameOptions
      { title: "Diet Level", name: "diet_level", type: "number", placeholder: "Diet Level (1-4)" }, // Consider select dropdown using DietLevelOptions
      { title: "Validated", name: "validated", type: "checkbox", placeholder: "Validated"}, // Need to handle checkbox type in SimpleForm
  ], []);

  const tableColumns: string[] = useMemo(() => [
      "Name", "Default Unit", "Diet Level", "Validated" // Example columns
  ], []);

  const tableData = useMemo(() => ingredients.map((ing) => ({
    id: ing.ingredient_id,
    values: [
      ing.name,
      ing.default_unit, // Show full name like "gram"
      ing.diet_level, // Show number, or map to label using DietLevelOptions
      ing.validated ? "Yes" : "No",
        ],
  })), [ingredients]);


  // --- Render Nutrient Editor (Conditional) ---
  const renderNutrientEditor = () => {
      if (!currentIngredientId || !isEditingNutrients) return null;

      return (
          <div className="nutrient-editor p-4 border rounded bg-gray-50 mt-4">
              <h3 className="text-lg font-semibold mb-2">Edit Nutrient Values for {ingredientFormState.name}</h3>
              {isNutrientLoading && <p>Loading nutrient values...</p>}
              {!isNutrientLoading && availableNutrients.length === 0 && <p>No nutrient definitions found.</p>}
              {!isNutrientLoading && availableNutrients.map(nutrientDef => (
                  <div key={nutrientDef.nutrient_id} className="nutrient-row flex items-center gap-2 mb-1">
                      <label htmlFor={`nutrient-${nutrientDef.nutrient_id}`} className="w-1/3 truncate" title={nutrientDef.nutrient_name}>
                          {nutrientDef.nutrient_name} ({nutrientDef.unit})
                      </label>
                      <input
                          type="text" // Use text for flexible input
                          inputMode="decimal"
                          id={`nutrient-${nutrientDef.nutrient_id}`}
                          name={nutrientDef.nutrient_id}
                          value={editableNutrientValues[nutrientDef.nutrient_id] || ""}
                          onChange={(e) => handleNutrientValueChange(nutrientDef.nutrient_id, e.target.value)}
                          placeholder={`Value in ${nutrientDef.unit}`}
                          className="border p-1 rounded w-2/3"
                      />
                  </div>
              ))}
              <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsEditingNutrients(false)} className="px-3 py-1 border rounded hover:bg-gray-100">
                      Done Editing Nutrients
                  </button>
                  {/* Removed Save button here - saving happens with main form */}
              </div>
          </div>
      );
  };


  // --- Main Render ---
  return (
    <ManagementContainer
        title="Manage Ingredients"
        actionButton={currentIngredientId ? (
            <button onClick={clearSelection} title="Clear selection / New" className="p-1 text-gray-600 hover:text-black hover:bg-gray-200 rounded">
                <RotateCcw size={18} />
            </button>
        ) : null}
        isLoading={isLoading && !isNutrientLoading} // Show main loading only if not nutrient loading
        errorMessage={error}
    >
      {/* Only show form/table if nutrient definitions loaded */}
      {availableNutrients.length === 0 && !isLoading && !error && <p>Loading nutrient definitions...</p>}
      {availableNutrients.length > 0 && (
          <>
              {/* Show Nutrient Editor Trigger only when editing an ingredient */}
              {currentIngredientId && !isEditingNutrients && (
                  <button
                      type="button"
                      onClick={() => setIsEditingNutrients(true)}
                      className="mb-4 px-3 py-1 border rounded bg-blue-100 hover:bg-blue-200 text-blue-800 flex items-center gap-1"
                      disabled={isLoading || isNutrientLoading}
                  >
                      <NotebookPen size={16} />
                      Edit Nutrient Values
                  </button>
              )}

              {/* Conditionally render Ingredient Form OR Nutrient Editor */}
              {isEditingNutrients ? (
                  renderNutrientEditor()
              ) : (
                  <SimpleForm
                      fields={ingredientFormFields}
                      state={ingredientFormState}
                      setState={setIngredientFormState}
                      onAdd={handleSaveIngredient} // Save handles both add/edit now
                      addLabel="Add New Ingredient & Nutrients"
                      isEditMode={!!currentIngredientId}
                      onEdit={handleSaveIngredient} // Save handles both add/edit now
                      editLabel="Save Ingredient & Nutrient Changes"
                      disabled={isLoading || isEditingNutrients} // Disable if loading or if nutrients are being edited
                  />
              )}

              <SimpleTable
                  title="Ingredient List"
                  columns={tableColumns}
                  data={tableData}
                  totalItems={totalIngredients}
                  itemsPerPage={ITEMS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={(page) => { if (!isEditingNutrients) setCurrentPage(page); }} // Prevent paging while editing nutrients
                  selectedRowId={selectedRowId}
                  onRowClick={(item) => {
                    if (!isEditingNutrients) { // Prevent row click while editing nutrients
                      const selected = ingredients.find((ing) => ing.ingredient_id === item.id);
                      if (selected) { handleRowClick(selected); }
                    }
                  }}
                  isLoading={isLoading && !isNutrientLoading} // Show table loading
              />
          </>
        )}
    </ManagementContainer>
  );
};

export default IngredientManagement;

function Decimal(arg0: string) {
    throw new Error("Function not implemented.");
}
