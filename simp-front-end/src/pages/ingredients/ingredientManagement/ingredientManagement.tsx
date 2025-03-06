"use client";

import React, { useEffect, useState } from "react";
import { Ingredient } from "@/lib/types/ingredient";
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import SimpleForm from "@/components/managementComponent/simpleform";
import {
    fetchIngredients,
    createIngredient,
    updateIngredient,
    fetchIngredientProducts,
    fetchIngredientNutritions,
    linkIngredientToProduct,
    linkIngredientToNutrition,
    detachProduct,
    detachNutrition,
} from "@/lib/api/ingredient/ingredient";
import { getProductByRetailId } from "@/lib/api/ingredient/product";
import { getNutritionByName } from "@/lib/api/ingredient/nutrition";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const IngredientManagement: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedNutritions, setSelectedNutritions] = useState<{ id: string; name: string }[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
    const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);
    const [ingredient, setIngredient] = useState<Partial<Ingredient>>({
        name: "",
        default_unit: "",
        calories_per_100g: undefined,
    });

    useEffect(() => {
        const loadIngredients = async () => {
            try {
                const { ingredients, total } = await fetchIngredients((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
                setIngredients(ingredients);
                setTotalIngredients(total);
            } catch (error) {
                console.error("Failed to fetch ingredients:", error);
            }
        };

        loadIngredients();
    }, [currentPage]);

    useEffect(() => {
        if (!currentIngredientId) return;

        const loadIngredientDetails = async () => {
            try {
                const linkedProducts = await fetchIngredientProducts(currentIngredientId);
                const linkedNutritions = await fetchIngredientNutritions(currentIngredientId);

                setSelectedProducts(linkedProducts.map((p) => ({
                    id: p.product_id,
                    name: p.english_name,
                })) || []);

                setSelectedNutritions(linkedNutritions.map((n) => ({
                    id: n.nutrition_id,
                    name: n.name,
                })) || []);
            } catch (error) {
                console.error("Failed to fetch ingredient details:", error);
                setSelectedProducts([]);
                setSelectedNutritions([]);
            }
        };

        loadIngredientDetails();
    }, [currentIngredientId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ingredient.name?.trim() || !ingredient.default_unit?.trim()) return;

        try {
            const newIngredient = await createIngredient({
                name: ingredient.name.trim(),
                default_unit: ingredient.default_unit.trim(),
                calories_per_100g: ingredient.calories_per_100g,
            });

            if (newIngredient) {
                setIngredients((prev) => [...prev, newIngredient]);
                setTotalIngredients((prev) => prev + 1);

                // ✅ Set new ingredient as the selected row
                setSelectedRowId(newIngredient.ingredient_id);
                setCurrentIngredientId(newIngredient.ingredient_id);

                setIngredient({
                    ingredient_id: newIngredient.ingredient_id,
                    name: newIngredient.name,
                    default_unit: newIngredient.default_unit,
                    calories_per_100g: newIngredient.calories_per_100g,
                });
            }
        } catch (error) {
            console.error("Failed to create ingredient:", error);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentIngredientId || !ingredient.name?.trim() || !ingredient.default_unit?.trim()) return;

        try {
            const updatedIngredient = await updateIngredient(currentIngredientId, {
                name: ingredient.name.trim(),
                default_unit: ingredient.default_unit.trim(),
                calories_per_100g: ingredient.calories_per_100g,
            });

            if (updatedIngredient) {
                setIngredients((prev) =>
                    prev.map((ing) => (ing.ingredient_id === currentIngredientId ? updatedIngredient : ing))
                );
            }
        } catch (error) {
            console.error("Failed to update ingredient:", error);
        }
    };

    const handleRowClick = (ing: Ingredient) => {
        setSelectedRowId(ing.ingredient_id);
        setCurrentIngredientId(ing.ingredient_id);
        setIngredient({
            name: ing.name,
            default_unit: ing.default_unit,
            calories_per_100g: ing.calories_per_100g,
        });
    };

    const clearSelection = () => {
        setSelectedRowId(null);
        setCurrentIngredientId(null);
        setIngredient({ name: "", default_unit: "", calories_per_100g: undefined });
        setSelectedProducts([]);
        setSelectedNutritions([]);
    };

    return (
        <ManagementContainer
            title="Manage Ingredients"
            actionButton={currentIngredientId && (
                <a onClick={clearSelection} aria-label="Clear Fields">
                    <Plus size={20} />
                </a>
            )}
        >
            <SimpleForm
                fields={[
                    { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
                    { name: "default_unit", type: "text", placeholder: "Default Unit", required: true },
                    { name: "calories_per_100g", type: "number", placeholder: "Calories per 100g" },
                ]}
                state={ingredient}
                setState={setIngredient}
                onAdd={handleAdd}
                onEdit={handleEdit}
                addLabel="Add Ingredient"
                editLabel="Update Ingredient"
                isEditMode={!!currentIngredientId}
            />

            <EntityLinkForm
                title="Link Product to Ingredient"
                placeholder="Enter Product Retail ID"
                selectedEntities={selectedProducts}
                setSelectedEntities={setSelectedProducts}
                disabled={!currentIngredientId}
                onEntityAdd={(retail_id) => getProductByRetailId(retail_id)
                    .then(matchedProduct => matchedProduct
                        ? linkIngredientToProduct(currentIngredientId!, matchedProduct.product_id)
                            .then(() => ({ id: matchedProduct.product_id, name: matchedProduct.english_name }))
                        : null)}
                onEntityRemove={(product) =>
                    detachProduct(currentIngredientId!, product.id).then(() =>
                        setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))
                    )
                }
            />

            <EntityLinkForm
                title="Link Nutrition to Ingredient"
                placeholder="Enter Nutrition Name"
                selectedEntities={selectedNutritions}
                setSelectedEntities={setSelectedNutritions}
                disabled={!currentIngredientId}
                onEntityAdd={(nutritionName) => getNutritionByName(nutritionName)
                    .then(matchedNutrition => matchedNutrition
                        ? linkIngredientToNutrition(currentIngredientId!, matchedNutrition.name)
                            .then(() => ({ id: matchedNutrition.nutrition_id, name: matchedNutrition.name }))
                        : null)}
                onEntityRemove={(nutrition) =>
                    detachNutrition(currentIngredientId!, nutrition.id).then(() =>
                        setSelectedNutritions((prev) => prev.filter((n) => n.id !== nutrition.id))
                    )
                }
            />

            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Default Unit", "Calories per 100g"]}
                data={ingredients.map((ing) => ({
                    id: ing.ingredient_id,
                    values: [ing.name, ing.default_unit, ing.calories_per_100g],
                }))}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                selectedRowId={selectedRowId} // ✅ Pass selected row
                onRowClick={(item) => {
                    setSelectedRowId(item.id); // ✅ Update selected row state
                    const selectedIngredient = ingredients.find((ing) => ing.ingredient_id === item.id);
                    if (selectedIngredient) {
                        handleRowClick(selectedIngredient);
                    }
                }}
            />

        </ManagementContainer>
    );
};

export default IngredientManagement;
