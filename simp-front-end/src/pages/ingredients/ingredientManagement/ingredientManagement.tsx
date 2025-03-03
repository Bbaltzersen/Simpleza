"use client";

import React, { useEffect, useState } from "react";
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
    fetchIngredientNutritions
} from "@/lib/api/ingredient/ingredient";
import { fetchProducts } from "@/lib/api/ingredient/product";
import { fetchNutritions } from "@/lib/api/ingredient/nutrition";

const ITEMS_PER_PAGE = 10;

const IngredientManagement: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [nutritions, setNutritions] = useState<Nutrition[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedNutritions, setSelectedNutritions] = useState<{ id: string; name: string; quantity: number }[]>([]);
    const [totalIngredients, setTotalIngredients] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentIngredientId, setCurrentIngredientId] = useState<string | null>(null);

    const [ingredient, setIngredient] = useState<Partial<Ingredient>>({
        name: "",
        default_unit: "",
        calories_per_100g: undefined,
    });

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

        loadIngredients();
    }, [currentPage]);

    const loadIngredientDetails = async (ingredientId: string) => {
        try {
            const linkedProducts = await fetchIngredientProducts(ingredientId);
            const linkedNutritions = await fetchIngredientNutritions(ingredientId);
    
            setSelectedProducts(
                Array.isArray(linkedProducts) 
                    ? linkedProducts.map((p) => ({ id: p, name: "Loading..." })) 
                    : []
            );
    
            setSelectedNutritions(
                Array.isArray(linkedNutritions) 
                    ? linkedNutritions.map((n) => ({ id: n, name: "Loading...", quantity: 1 })) 
                    : []
            );
        } catch (error) {
            console.error("Failed to fetch ingredient details:", error);
            setSelectedProducts([]);
            setSelectedNutritions([]);
        }
    };    

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

                await loadIngredientDetails(newIngredient.ingredient_id);
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

    const handleNutritionLink = async (nutrition: { id: string; name: string; quantity: number }) => {
        if (!currentIngredientId) return;
        try {
            await linkIngredientToNutrition(currentIngredientId, nutrition.id, nutrition.quantity);
            setSelectedNutritions((prev) => [...prev, nutrition]);
        } catch (error) {
            console.error("Failed to link nutrition:", error);
        }
    };

    const handleDelete = async (ingredient_id: string) => {
        try {
            const success = await deleteIngredient(ingredient_id);
            if (success) {
                setIngredients((prev) => prev.filter((i) => i.ingredient_id !== ingredient_id));
                setTotalIngredients((prev) => prev - 1);
                if (currentIngredientId === ingredient_id) {
                    setCurrentIngredientId(null);
                    setSelectedProducts([]);
                    setSelectedNutritions([]);
                }
            }
        } catch (error) {
            console.error("Failed to delete ingredient:", error);
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
                availableEntities={nutritions.map((n) => ({ id: n.nutrition_id, name: n.name, quantity: 0 }))}
                selectedEntities={selectedNutritions}
                setSelectedEntities={async (updatedEntities) => {
                    const newNutrition = updatedEntities.find((n) => !selectedNutritions.some((sn) => sn.id === n.id));
                    if (newNutrition) await handleNutritionLink(newNutrition);
                }}
                allowQuantity={true}
                disabled={!currentIngredientId}
            />

            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Default Unit", "Calories per 100g", "Actions"]}
                data={ingredients}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                searchableFields={["name"]}
                renderRow={(ingredient) => (
                    <tr key={ingredient.ingredient_id}>
                        <td>{ingredient.name}</td>
                        <td>{ingredient.default_unit}</td>
                        <td>{ingredient.calories_per_100g}</td>
                        <td>
                            <button 
                                onClick={() => {
                                    setCurrentIngredientId(ingredient.ingredient_id);
                                    loadIngredientDetails(ingredient.ingredient_id);
                                }} 
                                className="text-blue-600"
                            >
                                Edit
                            </button>
                            <button onClick={() => handleDelete(ingredient.ingredient_id)} className="text-red-600 ml-2">
                                Delete
                            </button>
                        </td>
                    </tr>
                )}
            />
        </ManagementContainer>
    );
};

export default IngredientManagement;
