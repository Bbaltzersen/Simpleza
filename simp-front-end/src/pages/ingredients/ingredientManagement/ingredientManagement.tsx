"use client";

import React, { useEffect, useState, useCallback } from "react";
// --- Assumed Imports ---
import { Ingredient } from "@/lib/types/ingredient";
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer"; // Assume this component can render headerContent in the top-right
import SimpleForm from "@/components/managementComponent/simpleform";
import {
    fetchIngredients, createIngredient, updateIngredient,
    fetchIngredientProducts, fetchIngredientNutritions,
    linkIngredientToProduct, linkIngredientToNutrition,
    detachProduct, detachNutrition,
} from "@/lib/api/ingredient/ingredient";
import { getProductByRetailId } from "@/lib/api/ingredient/product";
import { getNutritionByName } from "@/lib/api/ingredient/nutrition";
import { Plus, Circle, CheckCircle2 } from "lucide-react";

// --- Constants ---
const ITEMS_PER_PAGE = 10;

// --- Type Definitions ---
type IngredientFormState = {
    name?: string;
    default_unit?: string;
    calories_per_100g?: string;
    density_g_ml?: string;
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

    const initialFormState: IngredientFormState = {
        name: "", default_unit: "", calories_per_100g: "", density_g_ml: "",
    };
    const [ingredientForm, setIngredientForm] = useState<IngredientFormState>(initialFormState);

    // --- Utility Functions (parse/format numbers, prepare API data) ---
    const parseEuropeanNumber = useCallback((str: string | undefined): number | undefined => {
        if (!str) { return undefined; }
        const normalizedStr = str.replace(',', '.');
        const num = parseFloat(normalizedStr);
        return isNaN(num) ? undefined : num;
    }, []);

    const formatNumberToEuropeanString = useCallback((num: number | null | undefined): string => {
        if (num === undefined || num === null) { return ""; }
        return num.toString().replace('.', ',');
    }, []);

    const prepareApiData = useCallback((formState: IngredientFormState) => {
        const caloriesNum = parseEuropeanNumber(formState.calories_per_100g);
        const densityNum = parseEuropeanNumber(formState.density_g_ml);
        return {
            name: formState.name?.trim() ?? '',
            default_unit: formState.default_unit?.trim() ?? '',
            calories_per_100g: caloriesNum,
            density_g_ml: densityNum,
        };
    }, [parseEuropeanNumber]);

    // --- Effects (Fetching Data) ---
    useEffect(() => {
        const loadIngredients = async () => {
             try {
                const { ingredients: fetchedIngredients, total } = await fetchIngredients((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
                setIngredients(fetchedIngredients);
                setTotalIngredients(total);
            } catch (error) {
                console.error("Failed to fetch ingredients:", error);
            }
        };
        loadIngredients();
    }, [currentPage]);

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
                setSelectedProducts(linkedProducts.map((p) => ({ id: p.product_id, name: p.english_name })) || []);
                setSelectedNutritions(linkedNutritions.map((n) => ({ id: n.nutrition_id, name: n.name })) || []);
            } catch (error) {
                console.error("Failed to fetch ingredient details:", error);
                setSelectedProducts([]);
                setSelectedNutritions([]);
            }
        };
        loadIngredientDetails();
    }, [currentIngredientId]);

    // --- Event Handlers ---
    const handleAdd = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const apiData = prepareApiData(ingredientForm);
        if (!apiData.name || !apiData.default_unit) {
             console.warn("Name and Default Unit are required.");
             return;
        }
        try {
            const newIngredient = await createIngredient(apiData);
            if (newIngredient) {
                 setIngredients((prev) => [newIngredient, ...prev].slice(0, ITEMS_PER_PAGE));
                 setTotalIngredients((prev) => prev + 1);
                 setSelectedRowId(newIngredient.ingredient_id);
                 setCurrentIngredientId(newIngredient.ingredient_id);
                 setIngredientForm({
                    name: newIngredient.name,
                    default_unit: newIngredient.default_unit,
                    calories_per_100g: formatNumberToEuropeanString(newIngredient.calories_per_100g),
                    density_g_ml: formatNumberToEuropeanString(newIngredient.density_g_ml),
                });
                console.log("Ingredient created successfully:", newIngredient);
            }
        } catch (error) {
            console.error("Failed to create ingredient:", error);
        }
    }, [prepareApiData, ingredientForm, formatNumberToEuropeanString]);

    const handleEdit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentIngredientId) return;
        const apiData = prepareApiData(ingredientForm);
        if (!apiData.name || !apiData.default_unit) {
             console.warn("Name and Default Unit are required.");
             return;
        }
        try {
            const updatedIngredient = await updateIngredient(currentIngredientId, apiData);
            if (updatedIngredient) {
                 setIngredients((prev) =>
                    prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing))
                );
                 setIngredientForm({
                    name: updatedIngredient.name,
                    default_unit: updatedIngredient.default_unit,
                    calories_per_100g: formatNumberToEuropeanString(updatedIngredient.calories_per_100g),
                    density_g_ml: formatNumberToEuropeanString(updatedIngredient.density_g_ml),
                });
                console.log("Ingredient updated successfully:", updatedIngredient);
            }
        } catch (error) {
            console.error("Failed to update ingredient:", error);
        }
    }, [currentIngredientId, prepareApiData, ingredientForm, formatNumberToEuropeanString]);

    const handleRowClick = useCallback((ing: Ingredient) => {
        setSelectedRowId(ing.ingredient_id);
        setCurrentIngredientId(ing.ingredient_id);
        setIngredientForm({
            name: ing.name,
            default_unit: ing.default_unit,
            calories_per_100g: formatNumberToEuropeanString(ing.calories_per_100g),
            density_g_ml: formatNumberToEuropeanString(ing.density_g_ml),
        });
    }, [formatNumberToEuropeanString]);

    const clearSelection = useCallback(() => {
         setSelectedRowId(null);
         setCurrentIngredientId(null);
         setIngredientForm(initialFormState);
    }, []);

    const handleToggleValidated = useCallback(async () => {
        if (!currentIngredientId || isLoadingToggle) return;
        const currentIngredient = ingredients.find(ing => ing.ingredient_id === currentIngredientId);
        if (!currentIngredient) { console.error("Selected ingredient not found"); return; }
        const newValidatedStatus = !currentIngredient.validated;
        setIsLoadingToggle(true);
        try {
            const updatedIngredient = await updateIngredient(currentIngredientId, { validated: newValidatedStatus });
            if (updatedIngredient) {
                 setIngredients((prev) =>
                    prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing))
                );
                console.log("Validation status updated successfully");
            } else {
                 setIngredients((prev) => prev.map((ing) => ing.ingredient_id === currentIngredientId ? { ...ing, validated: newValidatedStatus } : ing ));
            }
        } catch (error) {
            console.error("Failed to update validation status:", error);
        } finally {
            setIsLoadingToggle(false);
        }
    }, [currentIngredientId, isLoadingToggle, ingredients]);

    const selectedIngredientData = ingredients.find(ing => ing.ingredient_id === currentIngredientId);

    // --- Define Validation Button JSX (conditionally) ---
    const validationToggleContent = currentIngredientId && selectedIngredientData ? (
        <div style={{ textAlign: 'center' }}> {/* Wrapper for alignment if needed */}
            <button
                onClick={handleToggleValidated}
                disabled={isLoadingToggle}
                title={selectedIngredientData.validated ? "Mark as Not Validated" : "Mark as Validated"}
                style={{
                    background: 'none', border: 'none', padding: '0 5px', /* Adjust padding */
                    cursor: 'pointer', opacity: isLoadingToggle ? 0.5 : 1,
                    display: 'inline-flex', // Align icon and potential text
                    alignItems: 'center',
                    verticalAlign: 'middle' // Align with other header items
                }}
            >
                {selectedIngredientData.validated ? (
                    <CheckCircle2 size={24} style={{ color: 'green' }} /> // Slightly smaller icon maybe
                ) : (
                    <Circle size={24} style={{ color: 'orange' }} />
                )}
                 {/* Optional: Add text label next to icon if desired */}
                 {/* <span style={{ marginLeft: '5px', fontSize: '0.9em', color: selectedIngredientData.validated ? 'green' : 'orange' }}>
                    {selectedIngredientData.validated ? 'Validated' : 'Not Validated'}
                 </span> */}
            </button>
         </div>
    ) : null; // Render nothing if no ingredient selected


    // --- Render ---
    return (
        <ManagementContainer
            title="Manage Ingredients"
            actionButton={currentIngredientId ? ( // "New" button still uses actionButton prop
                <button onClick={clearSelection} aria-label="Add New Ingredient" className="your-button-styles">
                    <Plus size={20} /> New
                </button>
            ) : null}
            // Pass the validation button JSX to the headerContent prop
            headerContent={validationToggleContent}
        >
            {/* --- Ingredient Add/Edit Form --- */}
            {/* REMOVED the outer flex div that previously held the form and button */}
            <SimpleForm
                 fields={[
                    { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
                    { name: "default_unit", type: "text", placeholder: "Default Unit (e.g., g, ml)", required: true },
                    { name: "calories_per_100g", type: "number", placeholder: "Calories per 100g (e.g. 123,45)" },
                    { name: "density_g_ml", type: "number", placeholder: "Density (g/mL) (e.g. 1,05)" },
                 ]}
                 state={ingredientForm}
                 setState={setIngredientForm}
                 onAdd={handleAdd}
                 onEdit={handleEdit}
                 addLabel="Add Ingredient"
                 editLabel="Update Ingredient"
                 isEditMode={!!currentIngredientId}
             />

            {/* REMOVED the Validation Toggle Button Area from here */}

            {/* --- Link Forms (conditionally rendered) --- */}
            {currentIngredientId && (
                <>
                    <EntityLinkForm
                        title="Link Product to Ingredient"
                        placeholder="Enter Product Retail ID"
                        selectedEntities={selectedProducts}
                        setSelectedEntities={setSelectedProducts}
                        disabled={!currentIngredientId}
                        onEntityAdd={(retail_id) => getProductByRetailId(retail_id)
                            .then(matchedProduct => matchedProduct && currentIngredientId ? linkIngredientToProduct(currentIngredientId, matchedProduct.product_id).then(() => ({ id: matchedProduct.product_id, name: matchedProduct.english_name })) : null)
                            .catch(err => { console.error("Error linking product:", err); return null; })
                        }
                        onEntityRemove={(product) => currentIngredientId ? detachProduct(currentIngredientId, product.id).then(() => setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))).catch(err => console.error("Error detaching product:", err))
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
                            .then(matchedNutrition => matchedNutrition && currentIngredientId ? linkIngredientToNutrition(currentIngredientId, matchedNutrition.name).then(() => ({ id: matchedNutrition.nutrition_id, name: matchedNutrition.name })) : null)
                            .catch(err => { console.error("Error linking nutrition:", err); return null; })
                        }
                        onEntityRemove={(nutrition) => currentIngredientId ? detachNutrition(currentIngredientId, nutrition.id).then(() => setSelectedNutritions((prev) => prev.filter((n) => n.id !== nutrition.id))).catch(err => console.error("Error detaching nutrition:", err))
                            : Promise.resolve()
                        }
                    />
                </>
            )}

            {/* --- Ingredients Table --- */}
            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Validated"]}
                data={ingredients.map((ing) => ({
                    id: ing.ingredient_id,
                    values: [
                        ing.name,
                        ing.validated ? 'Yes' : 'No'
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