"use client";

import React, { useEffect, useState } from "react";
import { Ingredient } from "@/lib/types/ingredient";
import { Product } from "@/lib/types/product";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import SimpleForm from "@/components/managementComponent/simpleform";
import { fetchIngredients, createIngredient, deleteIngredient } from "@/lib/api/ingredient/ingredient";

const ITEMS_PER_PAGE = 10;

const IngredientManagement: React.FC = () => {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [ingredient, setIngredient] = useState<Partial<Ingredient>>({
        name: "",
        default_unit: "",
        calories_per_100g: undefined,
    });

    const [totalIngredients, setTotalIngredients] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

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
            }
        } catch (error) {
            console.error("Failed to create ingredient:", error);
        }
    };

    const handleDelete = async (ingredient_id: string) => {
        try {
            const success = await deleteIngredient(ingredient_id);
            if (success) {
                setIngredients((prev) => prev.filter((i) => i.ingredient_id !== ingredient_id));
                setTotalIngredients((prev) => prev - 1);
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

            <SimpleTable
                title="Ingredient List"
                columns={["Name", "Default Unit", "Calories per 100g"]}
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
                    </tr>
                )}
            />
        </ManagementContainer>
    );
};

export default IngredientManagement;
