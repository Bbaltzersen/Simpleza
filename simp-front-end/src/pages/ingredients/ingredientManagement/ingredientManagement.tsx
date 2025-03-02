"use client";

import React, { useState } from "react";
import { Ingredient } from "@/lib/types/ingredient";
import { Product } from "@/lib/types/product";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import SimpleForm from "@/components/managementComponent/simpleform";

interface FormField<T> {
    name: keyof T;
    type: "text" | "number";
    placeholder: string;
    required?: boolean;
}

const mockProducts: Product[] = [
    { product_id: "1", english_name: "Milk", spanish_name: "Leche", amount: 1, weight: 1000, measurement: "ml" },
    { product_id: "2", english_name: "Eggs", spanish_name: "Huevos", amount: 12, weight: 600, measurement: "g" },
    { product_id: "3", english_name: "Bread", spanish_name: "Pan", amount: 1, weight: 500, measurement: "g" },
];

const mockNutritions: Nutrition[] = [
    { nutrition_id: "1", name: "Protein", measurement: "g", recommended: 50 },
    { nutrition_id: "2", name: "Carbohydrates", measurement: "g", recommended: 300 },
    { nutrition_id: "3", name: "Fats", measurement: "g", recommended: 70 },
];

const IngredientManagement: React.FC = () => {
    const [ingredient, setIngredient] = useState<Partial<Ingredient>>({
        name: "",
        default_unit: "",
        calories_per_100g: undefined,
    });

    const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string }[]>([]);
    const [selectedNutritions, setSelectedNutritions] = useState<{ id: string; name: string; quantity: number }[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const ingredientFields: FormField<Ingredient>[] = [
        { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
        { name: "default_unit", type: "text", placeholder: "Default Unit" },
        { name: "calories_per_100g", type: "number", placeholder: "Calories per 100g" },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newIngredient: Ingredient = {
            ingredient_id: crypto.randomUUID(),
            name: ingredient.name || "",
            default_unit: ingredient.default_unit || "g",
            calories_per_100g: ingredient.calories_per_100g || 0,
        };
        setIngredients([...ingredients, newIngredient]); // Add ingredient to list
        setIngredient({ name: "", default_unit: "g", calories_per_100g: undefined }); // Reset input fields
    };

    return (
        <ManagementContainer title="Manage Ingredient">
            <SimpleForm
                // title="Ingredient Information"
                fields={ingredientFields}
                state={ingredient}
                setState={setIngredient}
                onSubmit={handleSubmit}
                submitLabel="Save Ingredient"
            />

            <EntityLinkForm
                title="Link product to Ingredient"
                placeholder="Enter Product Name"
                availableEntities={mockProducts.map((p) => ({ id: p.product_id, name: p.english_name }))}
                selectedEntities={selectedProducts}
                setSelectedEntities={setSelectedProducts}
            />

            <EntityLinkForm
                title="Link Nutrition to Ingredient"
                placeholder="Enter Nutrition Name"
                availableEntities={mockNutritions.map((n) => ({ id: n.nutrition_id, name: n.name, quantity: 0 }))}
                selectedEntities={selectedNutritions}
                setSelectedEntities={setSelectedNutritions}
                allowQuantity={true}
            />

            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Default Unit", "Calories per 100g"]}
                data={ingredients}
                searchableFields={["name"]}
                renderRow={(ingredient) => (
                    <tr key={ingredient.ingredient_id} className="border-b">
                        <td className="border p-2">{ingredient.name}</td>
                        <td className="border p-2">{ingredient.default_unit}</td>
                        <td className="border p-2">{ingredient.calories_per_100g}</td>
                    </tr>
                )}
            />
        </ManagementContainer>
    );
};

export default IngredientManagement;