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
import { Plus, Circle, CheckCircle2, Edit } from "lucide-react"; // Added Edit icon for nutrients button

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

    // ** NEW STATE FOR NUTRIENT EDIT MODE **
    const [isNutrientEditModeOpen, setIsNutrientEditModeOpen] = useState<boolean>(false);
    const [ingredientForNutrientEdit, setIngredientForNutrientEdit] = useState<Ingredient | null>(null);
     // State to hold nutrients during editing (initialized when mode opens)
     const [editingNutrientsList, setEditingNutrientsList] = useState<{ id: string; name: string }[]>([]);


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

    // Fetch linked products/nutritions when an ingredient is selected (and not in nutrient edit mode)
    useEffect(() => {
        // If nutrient edit mode is open, don't re-fetch here, let the edit mode handle its data
        if (!currentIngredientId || isNutrientEditModeOpen) {
             if (!isNutrientEditModeOpen) { // Clear only if not opening edit mode
                 setSelectedProducts([]);
                 setSelectedNutritions([]);
             }
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
    }, [currentIngredientId, isNutrientEditModeOpen]); // Added isNutrientEditModeOpen dependency


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
                 setIsNutrientEditModeOpen(false); // Ensure edit mode is closed
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
                 // If the edited ingredient was the one being edited for nutrients, update that state too
                 if (ingredientForNutrientEdit?.ingredient_id === currentIngredientId) {
                     setIngredientForNutrientEdit(updatedIngredient);
                 }
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
    }, [currentIngredientId, prepareApiPayload, formatApiDataToFormState, ingredientForNutrientEdit]); // Dependencies

    // Handle clicking table row
    const handleRowClick = useCallback((ing: Ingredient) => {
        // If nutrient edit mode is open, close it first
        if (isNutrientEditModeOpen) {
            // Consider adding a check here if there are unsaved changes
             handleCloseNutrientEdit(); // Close nutrient edit mode
        }
        setSelectedRowId(ing.ingredient_id);
        setCurrentIngredientId(ing.ingredient_id);
        setIngredientForm(formatApiDataToFormState(ing));
        // Linked details load via useEffect triggered by currentIngredientId change
    }, [formatApiDataToFormState, isNutrientEditModeOpen, handleCloseNutrientEdit]); // Dependency

    // Clear form and selection
    const clearSelection = useCallback(() => {
         // Also close nutrient edit mode if open
         if (isNutrientEditModeOpen) {
            handleCloseNutrientEdit();
        }
        setSelectedRowId(null);
        setCurrentIngredientId(null);
        setIngredientForm(initialFormState);
        // Linked details clear via useEffect triggered by currentIngredientId change
    }, [initialFormState, isNutrientEditModeOpen, handleCloseNutrientEdit]); // Dependency

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
                  // Update the ingredient being edited for nutrients if it's the same one
                  if (ingredientForNutrientEdit?.ingredient_id === currentIngredientId) {
                      setIngredientForNutrientEdit(updatedIngredient);
                  }
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
     }, [currentIngredientId, isLoadingToggle, ingredients, ingredientForNutrientEdit/*, formatApiDataToFormState*/]); // Dependencies, add format if needed


     // --- NUTRIENT EDIT MODE HANDLERS ---
     const handleOpenNutrientEdit = useCallback((ingredient: Ingredient) => {
         setIngredientForNutrientEdit(ingredient); // Store the ingredient being edited
         setCurrentIngredientId(ingredient.ingredient_id); // Ensure main context knows the ID
         setSelectedRowId(ingredient.ingredient_id); // Keep row selected visually
         setIngredientForm(formatApiDataToFormState(ingredient)); // Keep main form in sync
         // Initialize the editing list with currently selected nutrients
         // Note: selectedNutritions should be up-to-date from useEffect
         setEditingNutrientsList([...selectedNutritions]);
         setIsNutrientEditModeOpen(true); // Open the edit mode UI
     }, [formatApiDataToFormState, selectedNutritions]); // Dependencies

     const handleCloseNutrientEdit = useCallback(() => {
         setIsNutrientEditModeOpen(false);
         setIngredientForNutrientEdit(null);
         setEditingNutrientsList([]); // Clear the temporary list
         // Re-selecting the row might be needed if the user expects the main form
         // to still show the ingredient after closing. The current handleRowClick handles this.
         // If currentIngredientId is still set, useEffect will fetch details again.
     }, []);

     // Handler for saving nutrient changes
     const handleSaveNutrients = useCallback(async () => {
         if (!ingredientForNutrientEdit) return;

         const originalNutrientIds = selectedNutritions.map(n => n.id);
         const updatedNutrientIds = editingNutrientsList.map(n => n.id); // Use the temp list

         const nutrientsToAdd = editingNutrientsList.filter(n => !originalNutrientIds.includes(n.id));
         const nutrientsToRemove = selectedNutritions.filter(n => !updatedNutrientIds.includes(n.id));

         console.log("Nutrients to Add:", nutrientsToAdd);
         console.log("Nutrients to Remove:", nutrientsToRemove);
         console.log("Target Ingredient ID:", ingredientForNutrientEdit.ingredient_id);


         // Show loading state?
         try {
             const addPromises = nutrientsToAdd.map(nutrient => {
                 const linkPayload: NutritionLinkPayload = {
                     ingredient_id: ingredientForNutrientEdit.ingredient_id,
                     nutrition_id: nutrient.id // Assuming nutrient object has 'id' which is the nutrition_id
                 };
                 console.log("Attempting to link:", linkPayload);
                 return linkIngredientToNutrition(linkPayload);
             });

             const removePromises = nutrientsToRemove.map(nutrient => {
                console.log("Attempting to detach:", ingredientForNutrientEdit.ingredient_id, nutrient.id);
                 return detachNutrition(ingredientForNutrientEdit.ingredient_id, nutrient.id); // Pass ingredient_id and nutrition_id
             });


             // Use Promise.allSettled to attempt all operations even if some fail
             const results = await Promise.allSettled([...addPromises, ...removePromises]);

             console.log("API Call Results:", results);

             // Check results and provide feedback
             const failedOps = results.filter(r => r.status === 'rejected');
             if (failedOps.length > 0) {
                 console.error("Some nutrient updates failed:", failedOps);
                 // TODO: Provide specific user feedback about which ones failed
             }

             // Update the main selectedNutritions state to reflect the desired state *after* API calls
             // This assumes the user wants the UI to reflect the intended state even if some API calls failed,
             // or you could refetch from the server for guaranteed consistency.
             setSelectedNutritions([...editingNutrientsList]); // Update main state from temp list

             console.log("Nutrient links updated (attempted).");
             handleCloseNutrientEdit(); // Close the edit mode

         } catch (error) {
             console.error("Unexpected error during bulk nutrient update:", error);
             // TODO: Add user feedback for unexpected errors
         } finally {
             // Hide loading state?
         }

     }, [ingredientForNutrientEdit, selectedNutritions, editingNutrientsList, handleCloseNutrientEdit]);

      // Handler to add a nutrient to the temporary list in edit mode
      const handleAddNutrientToEditList = useCallback(async (nutritionName: string) => {
         if (!ingredientForNutrientEdit) return null; // Should not happen if UI is correct

         try {
             const matchedNutrition = await getNutritionByName(nutritionName);
             if (matchedNutrition) {
                 // Check if already in the temporary list
                 if (editingNutrientsList.some(n => n.id === matchedNutrition.nutrient_id)) {
                     console.log(`Nutrition "${matchedNutrition.name}" is already in the list.`);
                     return null; // Indicate not added (already exists)
                 }
                 const newNutrient = { id: matchedNutrition.nutrient_id, name: matchedNutrition.name };
                 setEditingNutrientsList(prev => [...prev, newNutrient]);
                 console.log("Added to temp list:", newNutrient);
                 return newNutrient; // Return added item for UI update in caller
             } else {
                 console.log(`Nutrition with name "${nutritionName}" not found.`);
                 // TODO: Show user feedback (not found)
                 return null;
             }
         } catch (err) {
             console.error("Error searching for nutrition:", err);
             // TODO: Show user feedback (search error)
             return null;
         }
     }, [ingredientForNutrientEdit, editingNutrientsList]); // Dependencies

     // Handler to remove a nutrient from the temporary list in edit mode
     const handleRemoveNutrientFromEditList = useCallback((nutritionId: string) => {
         setEditingNutrientsList(prev => prev.filter(n => n.id !== nutritionId));
         console.log("Removed from temp list:", nutritionId);
     }, []);

    // --- Render Logic ---
    const selectedIngredientData = ingredients.find(ing => ing.ingredient_id === currentIngredientId);

    // JSX for the validation toggle button (only rendered if an item is selected AND not in nutrient edit mode)
    const validationToggleContent = !isNutrientEditModeOpen && currentIngredientId && selectedIngredientData ? (
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

     // --- Nutrient Edit Section Component (Placeholder) ---
     // This section is rendered conditionally when isNutrientEditModeOpen is true.
     // You should replace this with your actual UI component (e.g., a Modal or a dedicated form section).
     const renderNutrientEditSection = () => {
         if (!isNutrientEditModeOpen || !ingredientForNutrientEdit) return null;

         // ** IMPORTANT: Replace this div with your actual Nutrient Editing UI **
         // It should use `editingNutrientsList`, `handleAddNutrientToEditList`,
         // `handleRemoveNutrientFromEditList`, and call `handleSaveNutrients` on save.
         return (
             <div style={{ border: '1px solid #ccc', padding: '1rem', margin: '1rem 0', background: '#f9f9f9' }}>
                 <h4>Edit Nutrients for: {ingredientForNutrientEdit.name}</h4>

                 {/* Example: Use EntityLinkForm for searching/adding to the temp list */}
                 <EntityLinkForm
                     title="Add Nutrition"
                     placeholder="Enter Nutrition Name to Add"
                     // Pass empty array as selectedEntities to prevent display, we manage list below
                     selectedEntities={[]}
                      // We don't need setSelectedEntities for the form itself here
                     setSelectedEntities={() => {}}
                     // Disable if needed (e.g., during save)
                     disabled={false}
                     // Use onEntityAdd to add to our temporary list
                     onEntityAdd={handleAddNutrientToEditList} // Use the handler to add to temp list
                     // Hide the remove functionality of this specific form instance
                     onEntityRemove={() => {}}
                     // Make add button text specific
                     addButtonLabel="Add to List"
                />

                 <p style={{ marginTop: '1rem' }}>Current Nutrients for this Ingredient:</p>
                 {editingNutrientsList.length === 0 ? (
                     <p>No nutrients linked.</p>
                 ) : (
                     <ul style={{ listStyle: 'none', padding: 0 }}>
                         {editingNutrientsList.map(n => (
                             <li key={n.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <span>{n.name}</span>
                                 <button
                                     type="button"
                                     onClick={() => handleRemoveNutrientFromEditList(n.id)}
                                     style={{ marginLeft: '1rem', background: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: 'red', cursor: 'pointer', padding: '2px 5px' }}
                                     title={`Remove ${n.name}`}
                                 >
                                     Remove
                                 </button>
                            </li>
                        ))}
                     </ul>
                 )}

                 <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
                     <button
                        type="button" // Ensure it's not submitting any outer form
                        onClick={handleSaveNutrients}
                        style={{ padding: '8px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Save Nutrient Changes
                    </button>
                     <button
                        type="button"
                        onClick={handleCloseNutrientEdit}
                        style={{ padding: '8px 15px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                 </div>
             </div>
         );
     };


    // --- Main Return ---
    return (
        <ManagementContainer
            title="Manage Ingredients"
            actionButton={currentIngredientId && !isNutrientEditModeOpen ? ( // Show "New" only if not editing nutrients
                // Ensure button type is "button" to prevent accidental form submission
                <button type="button" onClick={clearSelection} aria-label="Add New Ingredient" className="your-button-styles"> {/* Add your button styling class */}
                    <Plus size={20} /> New
                </button>
            ) : null}
            headerContent={validationToggleContent} // Show validation toggle only if not editing nutrients
        >
            {/* Conditionally render the main form OR the nutrient edit section */}
            {!isNutrientEditModeOpen ? (
                 <>
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
                              {/* Original Nutrition Linking Form */}
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
                 </>
            ) : (
                 renderNutrientEditSection() // Render the dedicated nutrient editing UI
            )}


            {/* Ingredients Table */}
            <SimpleTable
                title="Ingredient List"
                 // Add a new column header for the Actions
                 columns={["Name", "Validated", "Diet Lvl", "Actions"]}
                data={ingredients.map((ing) => ({
                    id: ing.ingredient_id,
                    values: [
                        ing.name,
                        ing.validated ? (<CheckCircle2 size={18} style={{ color: 'green', verticalAlign: 'middle' }} />) : (<Circle size={18} style={{ color: 'orange', verticalAlign: 'middle' }} />), // Use icons for validated
                        ing.diet_level ?? '-',
                         // Add the "Edit Nutrients" button as the last element in the values array
                         <button
                             key={`edit-nutr-${ing.ingredient_id}`} // Unique key for React
                             onClick={(e) => {
                                e.stopPropagation(); // Prevent row click handler while clicking button
                                handleOpenNutrientEdit(ing);
                            }}
                            // Basic styling - use CSS classes ideally
                            style={{ padding: '4px 8px', cursor: 'pointer', background: '#eee', border: '1px solid #ccc', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title={`Edit Nutrients for ${ing.name}`}
                        >
                           <Edit size={14}/> Nutrients
                        </button>
                    ],
                }))}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage} // SimpleTable component handles page changes
                selectedRowId={selectedRowId}
                 // Pass the updated row click handler
                 onRowClick={(item) => {
                     const selectedIngredient = ingredients.find((ing) => ing.ingredient_id === item.id);
                     if (selectedIngredient) { handleRowClick(selectedIngredient); }
                 }}
             />
        </ManagementContainer>
    );
};

export default IngredientManagement;