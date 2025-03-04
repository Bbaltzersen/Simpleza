"use client";

import React, { useEffect, useRef, useState } from "react";
import { Ingredient } from "@/lib/types/ingredient";
import { Product } from "@/lib/types/product";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import SimpleForm from "@/components/managementComponent/simpleform";
import {
    fetchIngredients,
    createIngredient,
    deleteIngredient,
    linkIngredientToProduct,
    linkIngredientToNutrition,
    fetchIngredientProducts,
    fetchIngredientNutritions,
} from "@/lib/api/ingredient/ingredient";
import { fetchProducts } from "@/lib/api/ingredient/product";
import { fetchNutritions } from "@/lib/api/ingredient/nutrition";

const ITEMS_PER_PAGE = 10;

const IngredientManagement: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [nutritions, setNutritions] = useState<Nutrition[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedNutritions, setSelectedNutritions] = useState<{ id: string; name: string }[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);

    const [ingredient, setIngredient] = useState<Partial<Ingredient>>({
        name: "",
        default_unit: "",
        calories_per_100g: undefined,
    });

    const fetchedOnce = useRef(false);

    useEffect(() => {
        const loadIngredients = async () => {
            try {
                const { ingredients, total } = await fetchIngredients(currentPage, ITEMS_PER_PAGE);
                setIngredients(ingredients);
                setTotalIngredients(total);
            } catch (error) {
                console.error("Failed to fetch ingredients:", error);
            }
        };
        if (!fetchedOnce.current) {
            loadIngredients();
            fetchedOnce.current = true;
        }
    }, [currentPage]);

    useEffect(() => {
        if (!currentIngredientId) return;

        const loadIngredientDetails = async () => {
            try {
                const linkedProducts = await fetchIngredientProducts(currentIngredientId);
                const linkedNutritions = await fetchIngredientNutritions(currentIngredientId);

                setSelectedProducts(
                    linkedProducts?.map((p) => ({
                        id: p,
                        name: products.find((prod) => prod.product_id === p)?.english_name || "Unknown",
                    })) || []
                );

                setSelectedNutritions(
                    linkedNutritions?.map((n) => ({
                        id: n.nutrition_id,
                        name: nutritions.find((nut) => nut.nutrition_id === n.nutrition_id)?.name || "Unknown",
                    })) || []
                );
            } catch (error) {
                console.error("Failed to fetch ingredient details:", error);
                setSelectedProducts([]);
                setSelectedNutritions([]);
            }
        };

        loadIngredientDetails();
    }, [currentIngredientId, products, nutritions]);

    const handleSubmit = async (e: React.FormEvent) => {
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
                setIngredient({ name: "", default_unit: "", calories_per_100g: undefined });
                setCurrentIngredientId(newIngredient.ingredient_id);
            }
        } catch (error) {
            console.error("Failed to create ingredient:", error);
        }
    };

    const handleProductLink = async (product: { id: string; name: string }) => {
        if (!currentIngredientId) return;
        try {
            await linkIngredientToProduct(currentIngredientId, product.id);
            setSelectedProducts((prev) => [...prev, product]);
        } catch (error) {
            console.error("Failed to link product:", error);
        }
    };

    const handleNutritionLink = async (nutrition: { name: string }): Promise<boolean> => {
        if (!currentIngredientId) return false;

        const matchedNutrition = nutritions.find((n) => n.name.toLowerCase() === nutrition.name.toLowerCase());

        if (!matchedNutrition) {
            console.error("Nutrition not found:", nutrition.name);
            return false;
        }

        try {
            const success = await linkIngredientToNutrition(currentIngredientId, matchedNutrition.name);
            if (success) {
                setSelectedNutritions((prev) => [...prev, { id: matchedNutrition.nutrition_id, name: matchedNutrition.name }]);
            }
            return success;
        } catch (error) {
            console.error("Failed to link nutrition:", error);
            return false;
        }
    };


    const handleRowClick = async (ingredient: Ingredient) => {
        setCurrentIngredientId(ingredient.ingredient_id);
        setIngredient({
            name: ingredient.name,
            default_unit: ingredient.default_unit,
            calories_per_100g: ingredient.calories_per_100g,
        });
    
        try {
            const linkedProducts = await fetchIngredientProducts(ingredient.ingredient_id);
            const linkedNutritions = await fetchIngredientNutritions(ingredient.ingredient_id);
    
            setSelectedProducts(linkedProducts.map((p) => {
                const product = products.find((prod) => prod.product_id === p);
                return {
                    id: product?.product_id || p,
                    name: product?.english_name || "Unknown"
                };
            }));
    
            setSelectedNutritions(linkedNutritions.map((n) => ({
                id: n.nutrition_id,
                name: n.name
            })));
    
        } catch (error) {
            console.error("Failed to fetch linked entities:", error);
            setSelectedProducts([]);
            setSelectedNutritions([]);
        }
    };

    return (
        <ManagementContainer title="Manage Ingredients">
            <SimpleForm
                fields={[
                    { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
                    { name: "default_unit", type: "text", placeholder: "Default Unit", required: true },
                    { name: "calories_per_100g", type: "number", placeholder: "Calories per 100g" },
                ]}
                state={ingredient}
                setState={setIngredient}
                onSubmit={handleSubmit}
                submitLabel="Add Ingredient"
            />

            <EntityLinkForm
                title="Link Product to Ingredient"
                placeholder="Enter Product Name"
                availableEntities={products.map((p) => ({ id: p.product_id, name: p.english_name }))}
                selectedEntities={selectedProducts}
                setSelectedEntities={async (updatedEntities) => {
                    const newProduct = updatedEntities.find((p) => !selectedProducts.some((sp) => sp.id === p.id));
                    if (newProduct) await handleProductLink(newProduct);
                }}
                disabled={!currentIngredientId}
            />

            <EntityLinkForm
                title="Link Nutrition to Ingredient"
                placeholder="Enter Nutrition Name"
                availableEntities={nutritions.map((n) => ({ id: n.nutrition_id, name: n.name }))}
                selectedEntities={selectedNutritions}
                setSelectedEntities={(updatedEntities) => {
                    const newNutrition = updatedEntities.find((n) => !selectedNutritions.some((sn) => sn.id === n.id));

                    if (newNutrition) {
                        handleNutritionLink(newNutrition).then((success) => {
                            if (success) {
                                setSelectedNutritions([...selectedNutritions, newNutrition]); // ✅ Ensure state updates correctly
                            }
                        });
                    }
                }}
                disabled={!currentIngredientId}
            />




            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Default Unit", "Calories per 100g"]}
                data={ingredients.map((ingredient) => ({
                    ...ingredient,
                    id: ingredient.ingredient_id,
                }))}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                searchableFields={["name"]}
                onRowClick={handleRowClick}
                renderRow={(ingredient, onClick) => (
                    <>
                        <td>{ingredient.name}</td>
                        <td>{ingredient.default_unit}</td>
                        <td>{ingredient.calories_per_100g}</td>
                    </>
                )}
            />

        </ManagementContainer>
    );
};

export default IngredientManagement;
