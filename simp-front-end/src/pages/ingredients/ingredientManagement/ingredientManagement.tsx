"use client";

import React, { useEffect, useState, useCallback } from "react";

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
} from "@/lib/api/admin/ingredients";
import { getProductByRetailId } from "@/lib/api/admin/product";
import { getNutritionByName } from "@/lib/api/admin/nutrition";

// --- Components ---
import SimpleTable from "@/components/managementComponent/simpleTable"; // Assuming path is correct
import EntityLinkForm from "@/components/managementComponent/entityLinkForm"; // Assuming path is correct
import ManagementContainer from "@/components/managementComponent/managementContainer"; // Assuming path is correct
import SimpleForm from "@/components/managementComponent/simpleform"; // Assuming path is correct and component is updated

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
    const parseEuropeanNumber = useCallback((str: string | undefined): number | undefined => {
        if (!str?.trim()) { return undefined; }
        // Replace comma with period for parsing
        const normalizedStr = str.replace(',', '.');
        const num = parseFloat(normalizedStr);
        return isNaN(num) ? undefined : num;
    }, []);

    const parseIntNumber = useCallback((str: string | undefined): number | undefined => {
        if (!str?.trim()) { return undefined; }
        // Allow only digits for integers
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
    const prepareApiPayload = useCallback((): IngredientCreatePayload | IngredientUpdatePayload => {
        const caloriesNum = parseEuropeanNumber(ingredientForm.calories_per_100g);
        const densityNum = parseEuropeanNumber(ingredientForm.density_g_ml);
        const dietLevelNum = parseIntNumber(ingredientForm.diet_level);

        // Payload types accept string for default_unit (validated by backend)
        return {
            name: ingredientForm.name?.trim() || undefined, // Let backend handle required validation
            default_unit: ingredientForm.default_unit?.trim() || MeasurementUnit.GRAM, // Send string value, default if empty
            calories_per_100g: caloriesNum,
            density_g_ml: densityNum,
            diet_level: dietLevelNum,
             // 'validated' field is sent separately only on toggle update
        };
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
                // Assuming fetchIngredients takes page and limit (or modify API call)
                const { ingredients: fetchedIngredients, total } = await fetchIngredients(currentPage, ITEMS_PER_PAGE);
                console.log("Fetched ingredients:", fetchedIngredients);
                setIngredients(fetchedIngredients);
                setTotalIngredients(total);
            } catch (error) {
                 console.error("Failed to fetch ingredients:", error);
                 // Optionally set state to indicate error
                 setIngredients([]);
                 setTotalIngredients(0);
            }
        };
        loadIngredients();
    }, [currentPage]);

    // Fetch linked products/nutritions when an ingredient is selected
    useEffect(() => {
         if (!currentIngredientId) {
            setSelectedProducts([]);
            setSelectedNutritions([]);
            return;
        }
        const loadIngredientDetails = async () => {
             try {
                const [linkedProducts, linkedNutritions] = await Promise.all([
                    fetchIngredientProducts(currentIngredientId),
                    fetchIngredientNutritions(currentIngredientId)
                ]);
                // Correctly map response data (inferred types)
                setSelectedProducts(linkedProducts.map((p: { product_id: any; english_name: any; }) => ({
                    id: p.product_id,
                    name: p.english_name // Assuming Product type has english_name
                })) || []);
                setSelectedNutritions(linkedNutritions.map((n: { nutrient_id: any; name: any; }) => ({
                    id: n.nutrient_id, // Assuming Nutrition type has nutrient_id
                    name: n.name
                })) || []);
            } catch (error) {
                console.error("Failed to fetch ingredient details:", error);
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
        const payload = prepareApiPayload() as IngredientCreatePayload;
        payload.validated = false; // Set default validation state for new items
        if (!payload.name || !payload.default_unit) {
            console.warn("Name and Default Unit are required.");
            // TODO: Show user feedback (e.g., set an error state, highlight fields)
            return;
        }
        try {
            const newIngredient = await createIngredient(payload);
            if (newIngredient) {
                setIngredients((prev) => [newIngredient, ...prev].slice(0, ITEMS_PER_PAGE));
                setTotalIngredients((prev) => prev + 1);
                setSelectedRowId(newIngredient.ingredient_id);
                setCurrentIngredientId(newIngredient.ingredient_id);
                setIngredientForm(formatApiDataToFormState(newIngredient));
                setSelectedProducts([]); // Clear linked items display for new entry
                setSelectedNutritions([]);
                console.log("Ingredient created successfully:", newIngredient);
                 // Optionally reset to first page or navigate if needed
                 // setCurrentPage(1);
            } else {
                 console.error("Failed to create ingredient (API returned null).");
                 // TODO: Show user feedback
            }
        } catch (error) {
            console.error("Error during ingredient creation:", error);
             // TODO: Show user feedback
        }
    }, [prepareApiPayload, formatApiDataToFormState]); // Dependencies

    // Edit existing ingredient
    const handleEdit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentIngredientId) return;
        const payload = prepareApiPayload() as IngredientUpdatePayload;
        if (!payload.name || !payload.default_unit) {
             console.warn("Name and Default Unit are required.");
              // TODO: Show user feedback
             return;
        }
        try {
            const updatedIngredient = await updateIngredient(currentIngredientId, payload);
            if (updatedIngredient) {
                 setIngredients((prev) => prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing)) );
                 setIngredientForm(formatApiDataToFormState(updatedIngredient)); // Reflect saved data in form
                console.log("Ingredient updated successfully:", updatedIngredient);
            } else {
                console.error(`Failed to update ingredient ${currentIngredientId} (API returned null).`);
                 // TODO: Show user feedback
            }
        } catch (error) {
            console.error(`Error during ingredient update ${currentIngredientId}:`, error);
             // TODO: Show user feedback
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
                  // Update the single ingredient in the list state
                  setIngredients((prev) => prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing)) );
                 console.log("Validation status updated successfully");
             } else {
                 // Fallback: Update local state manually if API doesn't return the object
                  setIngredients((prev) => prev.map((ing) => ing.ingredient_id === currentIngredientId ? { ...ing, validated: newValidatedStatus } : ing ));
                  console.warn("Validation status updated, but API did not return updated object.");
                  // TODO: Show user feedback
             }
         } catch (error) {
             console.error("Failed to update validation status:", error);
              // TODO: Show user feedback
         } finally {
             setIsLoadingToggle(false);
         }
     }, [currentIngredientId, isLoadingToggle, ingredients]); // Dependencies

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
                <button type="button" onClick={clearSelection} aria-label="Add New Ingredient" className="your-button-styles">
                    <Plus size={20} /> New
                </button>
            ) : null}
            headerContent={validationToggleContent}
        >
            {/* SimpleForm handles its own optional <form> tag and submit */}
            <SimpleForm
                key={currentIngredientId || 'new-ingredient'} // Helps reset SimpleForm state if needed
                fields={[
                    { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
                    {
                        name: "default_unit",
                        type: "select", // Use the 'select' type handled by SimpleForm
                        placeholder: "Default Unit",
                        required: true,
                        options: measurementUnitOptions // Pass generated options
                    },
                    { name: "calories_per_100g", type: "number", placeholder: "Calories per 100g (e.g. 123,45)" },
                    { name: "density_g_ml", type: "number", placeholder: "Density (g/mL) (e.g. 1,05)" },
                    { name: "diet_level", type: "number", placeholder: "Diet Level (e.g. 4)" },
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

            {/* REMOVED outer <form>, standalone <select>, and standalone submit button */}

            {/* Link Forms - Render only when an ingredient is selected */}
            {currentIngredientId && (
                <>
                    <EntityLinkForm
                         title="Link Product to Ingredient"
                         placeholder="Enter Product Retail ID"
                         selectedEntities={selectedProducts}
                         setSelectedEntities={setSelectedProducts}
                         disabled={!currentIngredientId}
                         onEntityAdd={(retail_id) => getProductByRetailId(retail_id)
                           .then((matchedProduct: Product | null) => {
                             if (matchedProduct && currentIngredientId) {
                               return linkIngredientToProduct(currentIngredientId, matchedProduct.product_id)
                                 .then((linkSuccess: boolean) => {
                                     if(linkSuccess) {
                                         // Optimistically update UI or wait for useEffect to refresh
                                         // Returning data helps EntityLinkForm potentially update its display
                                          return { id: matchedProduct.product_id, name: matchedProduct.english_name };
                                     }
                                      console.warn(`Failed to link product ${matchedProduct.product_id} via API.`);
                                      return null;
                                 });
                             }
                             if (!matchedProduct) console.log(`Product with retail ID ${retail_id} not found.`);
                             return null;
                           }).catch((err: any) => { console.error("Error processing product link:", err); return null; })
                         }
                         onEntityRemove={(product) => currentIngredientId ? detachProduct(currentIngredientId, product.id).then((success: any) => {
                             if(success) {
                                 setSelectedProducts(prev => prev.filter(p => p.id !== product.id)); // Update local state on success
                                 console.log(`Detached product ${product.id}`);
                             } else {
                                  console.warn(`Failed to detach product ${product.id} via API.`);
                             }
                           }).catch((err: any) => console.error("Error detaching product:", err))
                            : Promise.resolve()
                         }
                    />
                    <EntityLinkForm
                         title="Link Nutrition to Ingredient"
                         placeholder="Enter Nutrition Name"
                         selectedEntities={selectedNutritions}
                         setSelectedEntities={setSelectedNutritions}
                         disabled={!currentIngredientId}
                         onEntityAdd={(nutritionName) => getNutritionByName(nutritionName)
                           .then((matchedNutrition: Nutrition | null) => {
                             if (matchedNutrition && currentIngredientId) {
                               const linkPayload: NutritionLinkPayload = { ingredient_id: currentIngredientId, nutrition_id: matchedNutrition.nutrient_id };
                               return linkIngredientToNutrition(linkPayload)
                                 .then((linkSuccess: boolean) => {
                                     if(linkSuccess) {
                                         return { id: matchedNutrition.nutrient_id, name: matchedNutrition.name };
                                     }
                                      console.warn(`Failed to link nutrition ${matchedNutrition.nutrient_id} via API.`);
                                      return null;
                                 });
                             }
                              if (!matchedNutrition) console.log(`Nutrition with name "${nutritionName}" not found.`);
                             return null;
                           }).catch((err: any) => { console.error("Error processing nutrition link:", err); return null; })
                         }
                         onEntityRemove={(nutrition) => currentIngredientId ? detachNutrition(currentIngredientId, nutrition.id).then((success: any) => {
                             if(success) {
                                 setSelectedNutritions(prev => prev.filter(n => n.id !== nutrition.id));
                                 console.log(`Detached nutrition ${nutrition.id}`);
                            } else {
                                 console.warn(`Failed to detach nutrition ${nutrition.id} via API.`);
                            }
                           }).catch((err: any) => console.error("Error detaching nutrition:", err))
                            : Promise.resolve()
                         }
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
                        ing.validated ? 'Yes' : 'No',
                        ing.diet_level // Added diet_level value
                    ],
                }))}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
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