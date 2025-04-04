"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from 'axios'; // Import axios for error type checking if needed

// --- Types ---
import {
    Ingredient,
    IngredientCreatePayload,
    IngredientUpdatePayload,
    NutritionLinkPayload
} from "@/lib/types/ingredient"; // Assuming path is correct
import { Nutrition } from "@/lib/types/nutrition"; // Assuming path is correct
import { Product } from "@/lib/types/product"; // Assuming path is correct

// --- API Functions ---
// Corrected paths assuming api functions are directly under lib/api/*
import {
    fetchIngredients, createIngredient, updateIngredient,
    fetchIngredientProducts, fetchIngredientNutritions,
    linkIngredientToProduct, linkIngredientToNutrition,
    detachProduct, detachNutrition,
    // deleteIngredient // Not used in current handlers, but available
} from "@/lib/api/admin/ingredients"; // Ensure correct path
import { getProductByRetailId } from "@/lib/api/admin/product"; // Ensure correct path
import { getNutritionByName } from "@/lib/api/admin/nutrition"; // Ensure correct path

// --- Components ---
import SimpleTable from "@/components/managementComponent/simpleTable"; // Assuming path is correct
import EntityLinkForm from "@/components/managementComponent/entityLinkForm"; // Assuming path is correct
import ManagementContainer from "@/components/managementComponent/managementContainer"; // Assuming path is correct
import SimpleForm from "@/components/managementComponent/simpleform"; // Assuming path is correct

// --- Enums & Icons ---
import { MeasurementUnit, MeasurementUnitEnum, getEnumValues } from "@/lib/enums"; // Assuming path is correct
import { Plus, Circle, CheckCircle2 } from "lucide-react";

// --- Constants ---
const ITEMS_PER_PAGE = 10;

// --- Type Definitions for Component State ---
type IngredientFormState = {
    name?: string;
    default_unit?: string; // Stays string from form input
    calories_per_100g?: string;
    density_g_ml?: string;
    diet_level?: string;
};

// --- Component ---
const IngredientManagement: React.FC = () => {
    // --- State Hooks ---
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedNutritions, setSelectedNutritions] = useState<{ id: string; name: string }[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);
    const [isLoadingToggle, setIsLoadingToggle] = useState(false);

    // Initial form state
    const initialFormState: IngredientFormState = {
        name: "",
        default_unit: MeasurementUnit.GRAM, // Default 'g' from Enum object
        calories_per_100g: "",
        density_g_ml: "",
        diet_level: "4", // Default diet_level string
    };
    const [ingredientForm, setIngredientForm] = useState<IngredientFormState>(initialFormState);

    // --- Utility Functions ---
    const parseEuropeanNumber = useCallback((str: string | undefined): number | undefined | null => { // Allow null return
        if (!str?.trim()) { return null; } // Return null for empty/whitespace to clear optional fields
        const normalizedStr = str.replace(',', '.');
        const num = parseFloat(normalizedStr);
        return isNaN(num) ? undefined : num; // Return undefined if parsing fails after normalization
    }, []);

    const parseIntNumber = useCallback((str: string | undefined): number | undefined => {
        if (!str?.trim()) { return undefined; } // Undefined for empty/whitespace ok for required fields (let backend validate)
        const digitsOnly = str.replace(/[^0-9]/g, '');
        if (digitsOnly === '') return undefined;
        const num = parseInt(digitsOnly, 10);
        return isNaN(num) ? undefined : num;
    }, []);

    const formatNumberToEuropeanString = useCallback((num: number | null | undefined): string => {
        if (num === undefined || num === null) { return ""; }
         // Replace period with comma for display
        return num.toString().replace('.', ',');
    }, []);

     const formatIntToString = useCallback((num: number | null | undefined): string => {
        if (num === undefined || num === null) { return ""; }
        return num.toString();
    }, []);

    // Prepare data for API call (matches Create/Update Payloads)
    const prepareApiPayload = useCallback((): Partial<IngredientCreatePayload | IngredientUpdatePayload> => { // Use Partial<> if fields are optional for update
        const caloriesNum = parseEuropeanNumber(ingredientForm.calories_per_100g);
        const densityNum = parseEuropeanNumber(ingredientForm.density_g_ml);
        const dietLevelNum = parseIntNumber(ingredientForm.diet_level);

        // Build the payload object conditionally, only including defined values
        const payload: Partial<IngredientCreatePayload | IngredientUpdatePayload> = {};
        if (ingredientForm.name?.trim()) payload.name = ingredientForm.name.trim();
        // Ensure default_unit is always sent, fallback to GRAM if empty string (adjust if backend treats empty differently)
        payload.default_unit = ingredientForm.default_unit?.trim() || MeasurementUnit.GRAM as MeasurementUnitEnum;

        // Handle numeric fields: send number if valid, null if explicitly cleared, undefined otherwise (won't be sent)
        if (caloriesNum !== undefined) payload.calories_per_100g = caloriesNum;
        if (densityNum !== undefined) payload.density_g_ml = densityNum;
        if (dietLevelNum !== undefined) payload.diet_level = dietLevelNum;

        // 'validated' field is handled separately in toggle function

        return payload;
    }, [ingredientForm, parseEuropeanNumber, parseIntNumber]);

    // Format API data (Ingredient) back to Form State (strings)
    const formatApiDataToFormState = useCallback((ingData: Ingredient): IngredientFormState => {
        return {
            name: ingData.name ?? "",
            default_unit: ingData.default_unit ?? "", // Backend sends string enum value
            calories_per_100g: formatNumberToEuropeanString(ingData.calories_per_100g),
            density_g_ml: formatNumberToEuropeanString(ingData.density_g_ml),
            diet_level: formatIntToString(ingData.diet_level),
        };
    }, [formatNumberToEuropeanString, formatIntToString]);

    // --- Effects ---
    // Fetch ingredients list when page changes
    useEffect(() => {
        const loadIngredients = async () => {
            try {
                // *** Fix: Calculate skip based on currentPage (1-based) and ITEMS_PER_PAGE ***
                const skip = (currentPage - 1) * ITEMS_PER_PAGE;

                // Pass the calculated skip and the limit
                const { ingredients: fetchedIngredients, total } = await fetchIngredients(skip, ITEMS_PER_PAGE);

                // Optional: Enhanced logging for clarity during development
                console.log(`Workspaceed ingredients (page ${currentPage}, skip ${skip}, limit ${ITEMS_PER_PAGE}):`, fetchedIngredients);

                setIngredients(fetchedIngredients);
                setTotalIngredients(total);
            } catch (error) {
                 console.error("Failed to fetch ingredients:", error);
                 // Optionally set state to indicate error to the user
                 setIngredients([]);
                 setTotalIngredients(0);
            }
        };
        loadIngredients();
    }, [currentPage]); // Dependency array remains correct

    // Fetch linked products/nutritions when an ingredient is selected
    useEffect(() => {
        if (!currentIngredientId) {
            setSelectedProducts([]);
            setSelectedNutritions([]);
            return;
        }
        const loadIngredientDetails = async () => {
            try {
                // Use Promise.allSettled to handle potential errors in one fetch without failing both
                const results = await Promise.allSettled([
                    fetchIngredientProducts(currentIngredientId),
                    fetchIngredientNutritions(currentIngredientId)
                ]);

                // Process products result
                if (results[0].status === 'fulfilled') {
                     // Assuming Product type has product_id and english_name
                    setSelectedProducts(results[0].value.map((p: Product) => ({
                        id: p.product_id,
                        name: p.english_name
                    })) || []);
                } else {
                    console.error("Failed to fetch linked products:", results[0].reason);
                    setSelectedProducts([]); // Clear on error
                }

                // Process nutritions result
                if (results[1].status === 'fulfilled') {
                    // Assuming Nutrition type has nutrient_id and name
                    setSelectedNutritions(results[1].value.map((n: Nutrition) => ({
                        id: n.nutrient_id,
                        name: n.name
                    })) || []);
                } else {
                    console.error("Failed to fetch linked nutritions:", results[1].reason);
                    setSelectedNutritions([]); // Clear on error
                }

            } catch (error) { // Catch unexpected errors from Promise.allSettled itself (unlikely)
                console.error("Unexpected error fetching ingredient details:", error);
                setSelectedProducts([]);
                setSelectedNutritions([]);
            }
        };
        loadIngredientDetails();
    }, [currentIngredientId]);


    // --- Event Handlers ---
    // Add new ingredient
    const handleAdd = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = prepareApiPayload() as IngredientCreatePayload; // Assume all fields needed for create
        payload.validated = false; // Set default validation state for new items

        if (!payload.name || !payload.default_unit) {
            console.warn("Name and Default Unit are required.");
            // TODO: Show user feedback (e.g., set an error state, highlight fields)
            return;
        }
        try {
            const newIngredient = await createIngredient(payload);
            if (newIngredient) {
                // Re-fetch the current page to ensure data consistency, or update optimistically
                // Optimistic update shown below:
                setIngredients((prev) => [newIngredient, ...prev].slice(0, ITEMS_PER_PAGE));
                setTotalIngredients((prev) => prev + 1); // Increment total
                setSelectedRowId(newIngredient.ingredient_id);
                setCurrentIngredientId(newIngredient.ingredient_id);
                setIngredientForm(formatApiDataToFormState(newIngredient));
                setSelectedProducts([]); // Clear linked items display for new entry
                setSelectedNutritions([]);
                console.log("Ingredient created successfully:", newIngredient);
                // Optionally reset to first page if desired:
                // if (currentPage !== 1) setCurrentPage(1);
            } else {
                console.error("Failed to create ingredient (API returned null).");
                // TODO: Show user feedback
            }
        } catch (error) {
            console.error("Error during ingredient creation:", error);
             // TODO: Show user feedback based on error (e.g., duplicate name?)
        }
    }, [prepareApiPayload, formatApiDataToFormState, currentPage]); // Added currentPage dependency if resetting page

    // Edit existing ingredient
    const handleEdit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentIngredientId) return;

        // Prepare payload - could be partial for update
        const payload = prepareApiPayload() as IngredientUpdatePayload;

        // Basic validation example (adjust as needed)
         if (!payload.name || !payload.default_unit) {
              console.warn("Name and Default Unit are required for update.");
               // TODO: Show user feedback
              return;
         }

        try {
            const updatedIngredient = await updateIngredient(currentIngredientId, payload);
            if (updatedIngredient) {
                 setIngredients((prev) => prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing)) );
                 setIngredientForm(formatApiDataToFormState(updatedIngredient)); // Reflect saved data in form
                console.log("Ingredient updated successfully:", updatedIngredient);
                 // TODO: Show success feedback to user
            } else {
                console.error(`Failed to update ingredient ${currentIngredientId} (API returned null).`);
                 // TODO: Show user feedback
            }
        } catch (error) {
            console.error(`Error during ingredient update ${currentIngredientId}:`, error);
             // TODO: Show user feedback based on error
        }
    }, [currentIngredientId, prepareApiPayload, formatApiDataToFormState]); // Dependencies

    // Handle clicking table row
    const handleRowClick = useCallback((ing: Ingredient) => {
        setSelectedRowId(ing.ingredient_id);
        setCurrentIngredientId(ing.ingredient_id);
        setIngredientForm(formatApiDataToFormState(ing));
        // Linked details load via useEffect triggered by currentIngredientId change
    }, [formatApiDataToFormState]); // Dependency

    // Clear form and selection
    const clearSelection = useCallback(() => {
        setSelectedRowId(null);
        setCurrentIngredientId(null);
        setIngredientForm(initialFormState);
        // Linked details clear via useEffect triggered by currentIngredientId change
    }, [initialFormState]); // Dependency

    // Toggle validation status
      const handleToggleValidated = useCallback(async () => {
          if (!currentIngredientId || isLoadingToggle) return;
          const currentIngredient = ingredients.find(ing => ing.ingredient_id === currentIngredientId);
          if (!currentIngredient) { console.error("Selected ingredient not found in state."); return; }

          const newValidatedStatus = !currentIngredient.validated;
          setIsLoadingToggle(true);

          try {
               // Send ONLY the validated field change using IngredientUpdatePayload structure
              const updatedIngredient = await updateIngredient(currentIngredientId, { validated: newValidatedStatus });
              if (updatedIngredient) {
                   // Update the single ingredient in the list state using the returned data
                   setIngredients((prev) => prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing)) );
                  console.log("Validation status updated successfully");
                  // Update form if it needs to reflect the potentially changed object (e.g., if backend modifies other fields on validation)
                  // setIngredientForm(formatApiDataToFormState(updatedIngredient));
              } else {
                   // Fallback: Update local state manually ONLY if API doesn't return the full object on success
                   // setIngredients((prev) => prev.map((ing) => ing.ingredient_id === currentIngredientId ? { ...ing, validated: newValidatedStatus } : ing ));
                   // console.warn("Validation status updated, but API did not return updated object.");
                  console.error("Failed to update validation status (API returned null or unexpected data)");
                   // TODO: Show user feedback
              }
          } catch (error) {
              console.error("Failed to update validation status:", error);
               // TODO: Show user feedback
          } finally {
              setIsLoadingToggle(false);
          }
      }, [currentIngredientId, isLoadingToggle, ingredients/*, formatApiDataToFormState*/]); // Dependencies, add format if needed

    // --- Render Logic ---
    const selectedIngredientData = ingredients.find(ing => ing.ingredient_id === currentIngredientId);

    // JSX for the validation toggle button (only rendered if an item is selected)
    const validationToggleContent = currentIngredientId && selectedIngredientData ? (
        <div style={{ textAlign: 'center' }}>
            <button
                type="button" // Important: Prevent form submission if button is inside <form>
                onClick={handleToggleValidated}
                disabled={isLoadingToggle}
                title={selectedIngredientData.validated ? "Mark as Not Validated" : "Mark as Validated"}
                // Basic styling - consider using CSS classes
                style={{ background: 'none', border: 'none', padding: '0 5px', cursor: 'pointer', opacity: isLoadingToggle ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
            >
                {selectedIngredientData.validated ? (<CheckCircle2 size={24} style={{ color: 'green' }} />) : (<Circle size={24} style={{ color: 'orange' }} />)}
            </button>
        </div>
      ) : null;

       // Options for the measurement unit dropdown
       const measurementUnitOptions = getEnumValues(MeasurementUnit).map(unitValue => ({
        value: unitValue,
        label: unitValue // Use the value itself as the label
    }));

    return (
        <ManagementContainer
            title="Manage Ingredients"
            actionButton={currentIngredientId ? (
                // Ensure button type is "button" to prevent accidental form submission
                <button type="button" onClick={clearSelection} aria-label="Add New Ingredient" className="your-button-styles"> {/* Add your button styling class */}
                    <Plus size={20} /> New
                </button>
            ) : null}
            headerContent={validationToggleContent}
        >
            {/* SimpleForm handles its own optional <form> tag and submit */}
            <SimpleForm
                key={currentIngredientId || 'new-ingredient-form'} // Helps reset SimpleForm state if needed
                fields={[
                    { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
                    {
                        name: "default_unit",
                        type: "select", // Use the 'select' type handled by SimpleForm
                        placeholder: "Default Unit",
                        required: true,
                        options: measurementUnitOptions // Pass generated options
                    },
                    { name: "calories_per_100g", type: "text", placeholder: "Calories per 100g (e.g. 123,45)" }, // Use text for flexible input, parse later
                    { name: "density_g_ml", type: "text", placeholder: "Density (g/mL) (e.g. 1,05)" }, // Use text for flexible input
                    { name: "diet_level", type: "number", placeholder: "Diet Level (e.g. 4)" }, // Use number for integer input
                ]}
                state={ingredientForm}
                // Pass the state setter directly
                setState={setIngredientForm}
                // Pass handlers for SimpleForm's internal form/button
                onAdd={handleAdd}
                onEdit={handleEdit}
                addLabel="Add Ingredient"
                editLabel="Update Ingredient"
                isEditMode={!!currentIngredientId}
             />

            {/* Link Forms - Render only when an ingredient is selected */}
            {currentIngredientId && (
                <>
                    <EntityLinkForm
                        title="Link Product to Ingredient"
                        placeholder="Enter Product Retail ID"
                        selectedEntities={selectedProducts}
                        setSelectedEntities={setSelectedProducts} // Allow direct state update
                        disabled={!currentIngredientId}
                        onEntityAdd={async (retail_id) => { // Make async for easier handling
                            try {
                                const matchedProduct = await getProductByRetailId(retail_id);
                                if (matchedProduct && currentIngredientId) {
                                    const linkSuccess = await linkIngredientToProduct(currentIngredientId, matchedProduct.product_id);
                                    if (linkSuccess) {
                                        console.log(`Linked product ${matchedProduct.product_id}`);
                                        // Return data for EntityLinkForm to optimistically update its internal list
                                        return { id: matchedProduct.product_id, name: matchedProduct.english_name };
                                    } else {
                                        console.warn(`Failed to link product ${matchedProduct.product_id} via API.`);
                                        // TODO: Show user feedback
                                        return null;
                                    }
                                }
                                if (!matchedProduct) console.log(`Product with retail ID ${retail_id} not found.`);
                                return null;
                            } catch (err) {
                                console.error("Error processing product link:", err);
                                // TODO: Show user feedback
                                return null;
                            }
                        }}
                        onEntityRemove={async (product) => { // Make async
                             if (!currentIngredientId) return;
                            try {
                                const success = await detachProduct(currentIngredientId, product.id);
                                if (success) {
                                    // Update local state on success - EntityLinkForm might do this internally too via setSelectedEntities
                                    setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
                                    console.log(`Detached product ${product.id}`);
                                } else {
                                    console.warn(`Failed to detach product ${product.id} via API.`);
                                    // TODO: Show user feedback
                                }
                            } catch (err) {
                                console.error("Error detaching product:", err);
                                // TODO: Show user feedback
                            }
                        }}
                     />
                    <EntityLinkForm
                        title="Link Nutrition to Ingredient"
                        placeholder="Enter Nutrition Name"
                        selectedEntities={selectedNutritions}
                        setSelectedEntities={setSelectedNutritions} // Allow direct state update
                        disabled={!currentIngredientId}
                        onEntityAdd={async (nutritionName) => { // Make async
                            try {
                                const matchedNutrition = await getNutritionByName(nutritionName);
                                if (matchedNutrition && currentIngredientId) {
                                    const linkPayload: NutritionLinkPayload = { ingredient_id: currentIngredientId, nutrition_id: matchedNutrition.nutrient_id };
                                    const linkSuccess = await linkIngredientToNutrition(linkPayload);
                                    if (linkSuccess) {
                                        console.log(`Linked nutrition ${matchedNutrition.nutrient_id}`);
                                        return { id: matchedNutrition.nutrient_id, name: matchedNutrition.name };
                                    } else {
                                        console.warn(`Failed to link nutrition ${matchedNutrition.nutrient_id} via API.`);
                                        // TODO: Show user feedback
                                        return null;
                                    }
                                }
                                if (!matchedNutrition) console.log(`Nutrition with name "${nutritionName}" not found.`);
                                return null;
                            } catch (err) {
                                console.error("Error processing nutrition link:", err);
                                // TODO: Show user feedback
                                return null;
                            }
                        }}
                        onEntityRemove={async (nutrition) => { // Make async
                             if (!currentIngredientId) return;
                            try {
                                const success = await detachNutrition(currentIngredientId, nutrition.id);
                                if (success) {
                                    setSelectedNutritions(prev => prev.filter(n => n.id !== nutrition.id));
                                    console.log(`Detached nutrition ${nutrition.id}`);
                                } else {
                                    console.warn(`Failed to detach nutrition ${nutrition.id} via API.`);
                                    // TODO: Show user feedback
                                }
                            } catch (err) {
                                console.error("Error detaching nutrition:", err);
                                // TODO: Show user feedback
                            }
                        }}
                     />
                </>
            )}

            {/* Ingredients Table */}
            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Validated", "Diet Lvl"]} // Added Diet Level column header
                data={ingredients.map((ing) => ({
                    id: ing.ingredient_id,
                    values: [
                        ing.name,
                        ing.validated ? 'Yes' : 'No', // Display text for boolean
                        ing.diet_level ?? '-' // Display diet_level or fallback
                    ],
                }))}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage} // SimpleTable component handles page changes
                selectedRowId={selectedRowId}
                onRowClick={(item) => {
                    const selectedIngredient = ingredients.find((ing) => ing.ingredient_id === item.id);
                    if (selectedIngredient) { handleRowClick(selectedIngredient); }
                }}
             />
        </ManagementContainer>
    );
};

export default IngredientManagement;