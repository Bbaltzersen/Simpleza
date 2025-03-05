"use client";

import React, { useEffect, useRef, useState } from "react";

// Replace these with your own types
import { Ingredient } from "@/lib/types/ingredient";
import { Product } from "@/lib/types/product";
import { Nutrition } from "@/lib/types/nutrition";

// Your custom components
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import SimpleForm from "@/components/managementComponent/simpleform";

// API Calls – adapt these to your actual API
import {
    fetchIngredients,
    createIngredient,
    deleteIngredient,
    linkIngredientToProduct,
    linkIngredientToNutrition,
    fetchIngredientProducts,
    fetchIngredientNutritions,
    detachProduct,
    detachNutrition,
} from "@/lib/api/ingredient/ingredient";
import { fetchProducts, getProductByRetailId } from "@/lib/api/ingredient/product";
import { getNutritionByName } from "@/lib/api/ingredient/nutrition";

const ITEMS_PER_PAGE = 10;

const IngredientManagement: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [nutritions, setNutritions] = useState<Nutrition[]>([]);

    // These arrays store the linked (selected) products and nutritions
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

    // Avoid multiple initial fetches
    const fetchedOnce = useRef(false);

    // 1. Fetch the ingredient list (paging)
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

    // 2. Load the details (linked products + nutritions) once we pick an ingredient
    useEffect(() => {
        if (!currentIngredientId) return;

        const loadIngredientDetails = async () => {
            try {
                const linkedProducts = await fetchIngredientProducts(currentIngredientId);
                const linkedNutritions = await fetchIngredientNutritions(currentIngredientId);

                setSelectedProducts(
                    linkedProducts.map((p) => ({
                        id: p.product_id,
                        name: p.english_name,
                    })) || []
                );

                setSelectedNutritions(
                    linkedNutritions.map((n) => ({
                        id: n.nutrition_id,
                        name: n.name,
                    })) || []
                );
            } catch (error) {
                console.error("Failed to fetch ingredient details:", error);
                setSelectedProducts([]);
                setSelectedNutritions([]);
            }
        };

        loadIngredientDetails();
    }, [currentIngredientId]);

    // 3. Creating a new ingredient
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
                // add to local array
                setIngredients((prev) => [...prev, newIngredient]);
                setTotalIngredients((prev) => prev + 1);
                setIngredient({ name: "", default_unit: "", calories_per_100g: undefined });
                setCurrentIngredientId(newIngredient.ingredient_id);
            }
        } catch (error) {
            console.error("Failed to create ingredient:", error);
        }
    };

    // 4. When user selects a row in the table, set it as current.
    const handleRowClick = (ing: Ingredient) => {
        setCurrentIngredientId(ing.ingredient_id);
        setIngredient({
            name: ing.name,
            default_unit: ing.default_unit,
            calories_per_100g: ing.calories_per_100g,
        });
    };

    // 5. Linking a product – or you can do the same logic as with nutritions
    const onProductAdd = async (retail_id: string) => {
        // Check if an ingredient is selected
        if (!currentIngredientId) return null;

        

        // Attempt to find the product in `products`
        const matchedProduct = await getProductByRetailId(retail_id);

        if (!matchedProduct) {
            console.log(`Product '${retail_id}' does not exist in the DB.`);
            return null;
        }

        // Link
        try {
            await linkIngredientToProduct(currentIngredientId, matchedProduct.product_id);
            return { id: matchedProduct.product_id, name: matchedProduct.english_name };
        } catch (error) {
            console.error("Failed to link product:", error);
            return null;
        }
    };

    const onNutritionAdd = async (nutritionName: string) => {
        if (!currentIngredientId) return null;

        try {
            // Step 1: Look up nutrition in the database
            const matchedNutrition = await getNutritionByName(nutritionName);

            if (!matchedNutrition) {
                console.log(`Nutrition '${nutritionName}' does not exist in the database.`);
                return null; // Prevent adding non-existent nutrition
            }

            // Step 2: Link nutrition to the ingredient
            const success = await linkIngredientToNutrition(currentIngredientId, matchedNutrition.name);
            if (!success) {
                console.log("Failed to link nutrition.");
                return null;
            }

            // Step 3: Return entity object for display
            return { id: matchedNutrition.nutrition_id, name: matchedNutrition.name };
        } catch (error) {
            console.error("Error linking nutrition:", error);
            return null;
        }
    };


    const onProductRemove = async (product: { id: string; name: string }) => {
        if (!currentIngredientId) return;
    
        const success = await detachProduct(currentIngredientId, product.id);
        if (success) {
          setSelectedProducts(selectedProducts.filter((p) => p.id !== product.id));
        }
      };
    
      const onNutritionRemove = async (nutrition: { id: string; name: string }) => {
        if (!currentIngredientId) return;
    
        const success = await detachNutrition(currentIngredientId, nutrition.id);
        if (success) {
          setSelectedNutritions(selectedNutritions.filter((n) => n.id !== nutrition.id));
        }
      };

    return (
        <ManagementContainer title="Manage Ingredients">
            {/* CREATE/EDIT INGREDIENT FORM */}
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

            {/* LINK PRODUCTS */}
            <EntityLinkForm
                title="Link Product to Ingredient"
                placeholder="Enter Product Name"
                selectedEntities={selectedProducts}
                setSelectedEntities={setSelectedProducts}
                disabled={!currentIngredientId}
                onEntityAdd={onProductAdd}
                onEntityRemove={onProductRemove}
            />

            <EntityLinkForm
                title="Link Nutrition to Ingredient"
                placeholder="Enter Nutrition Name"
                selectedEntities={selectedNutritions}
                setSelectedEntities={setSelectedNutritions}
                disabled={!currentIngredientId}
                onEntityAdd={onNutritionAdd}
                onEntityRemove={onNutritionRemove}
            />


            {/* TABLE OF INGREDIENTS */}
            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Default Unit", "Calories per 100g"]}
                data={ingredients.map((ing) => ({
                    ...ing,
                    id: ing.ingredient_id, // used by SimpleTable for row keys
                }))}
                totalItems={totalIngredients}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                searchableFields={["name"]} // if your table supports searching by name
                onRowClick={handleRowClick}
                renderRow={(ing) => (
                    <>
                        <td>{ing.name}</td>
                        <td>{ing.default_unit}</td>
                        <td>{ing.calories_per_100g}</td>
                    </>
                )}
            />
        </ManagementContainer>
    );
};

export default IngredientManagement;
