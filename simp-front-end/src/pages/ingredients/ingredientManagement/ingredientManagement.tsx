"use client";

import React, { useState } from "react";
import { Ingredient } from "@/lib/types/ingredient";
import { Product } from "@/lib/types/product";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";

const ITEMS_PER_PAGE = 20;

// Mock existing products and nutrition values (Replace with API calls later)
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

interface FormField {
  name: keyof Ingredient;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
}

const IngredientManagement: React.FC = () => {
    const [ingredient, setIngredient] = useState<Partial<Ingredient>>({
        name: "",
        default_unit: "g",
        calories_per_100g: undefined,
    });

    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [selectedNutritions, setSelectedNutritions] = useState<{ nutrition: Nutrition; amount: number }[]>([]);
    const [productInput, setProductInput] = useState<string>("");
    const [nutritionInput, setNutritionInput] = useState<string>("");
    const [nutritionAmount, setNutritionAmount] = useState<number>(0);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Form Fields
    const ingredientFields: FormField[] = [
      { name: "name", type: "text", placeholder: "Ingredient Name", required: true },
      { name: "default_unit", type: "text", placeholder: "Default Unit" },
      { name: "calories_per_100g", type: "number", placeholder: "Calories per 100g" },
    ];

    // Handle Ingredient Submission
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

    // Add Product by Name
    const addProduct = () => {
        const trimmedInput = productInput.trim().toLowerCase();
        if (!trimmedInput) return;
        const product = mockProducts.find((p) => p.english_name.toLowerCase() === trimmedInput);
        if (product && !selectedProducts.some((p) => p.product_id === product.product_id)) {
            setSelectedProducts([...selectedProducts, product]);
            setProductInput(""); // Reset input field
        } else {
            alert("Product not found or already added.");
        }
    };

    // Remove Product
    const removeProduct = (productId: string) => {
        setSelectedProducts(selectedProducts.filter((p) => p.product_id !== productId));
    };

    // Add Nutrition by Name
    const addNutrition = () => {
        const trimmedInput = nutritionInput.trim().toLowerCase();
        if (!trimmedInput || nutritionAmount <= 0) {
            alert("Enter a valid nutrition and amount.");
            return;
        }

        const nutrition = mockNutritions.find((n) => n.name.toLowerCase() === trimmedInput);

        if (nutrition && !selectedNutritions.some((n) => n.nutrition.nutrition_id === nutrition.nutrition_id)) {
            setSelectedNutritions([...selectedNutritions, { nutrition, amount: nutritionAmount }]);
            setNutritionInput(""); // Reset input field
            setNutritionAmount(0);
        } else {
            alert("Nutrition not found or already added.");
        }
    };

    // Remove Nutrition
    const removeNutrition = (nutritionId: string) => {
        setSelectedNutritions(selectedNutritions.filter((n) => n.nutrition.nutrition_id !== nutritionId));
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Ingredients</h2>

            {/* Use Reusable Form */}
            <SimpleForm
                title="Add Ingredient"
                fields={ingredientFields}
                state={ingredient}
                setState={setIngredient}
                onSubmit={handleSubmit}
                submitLabel="Save Ingredient"
            />

            {/* Product Input Field */}
            <div className="mt-4">
                <h3 className="text-lg font-semibold">Add Existing Product</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter Product Name"
                        value={productInput}
                        onChange={(e) => setProductInput(e.target.value)}
                        className="border p-2 flex-1"
                    />
                    <button type="button" onClick={addProduct} className="bg-green-500 text-white p-2">
                        Add
                    </button>
                </div>

                {/* Display Added Products */}
                <ul className="mt-2">
                    {selectedProducts.map((product) => (
                        <li key={product.product_id} className="flex justify-between p-1 border-b">
                            {product.english_name} ({product.measurement})
                            <button onClick={() => removeProduct(product.product_id)} className="text-red-500">X</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Nutrition Input Field */}
            <div className="mt-4">
                <h3 className="text-lg font-semibold">Add Existing Nutrition</h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="Enter Nutrition Name"
                        value={nutritionInput}
                        onChange={(e) => setNutritionInput(e.target.value)}
                        className="border p-2 flex-1"
                    />
                    <input
                        type="number"
                        placeholder="Amount"
                        value={nutritionAmount || ""}
                        onChange={(e) => setNutritionAmount(Number(e.target.value))}
                        className="border p-2 w-24"
                    />
                    <button type="button" onClick={addNutrition} className="bg-green-500 text-white p-2">
                        Add
                    </button>
                </div>

                {/* Display Added Nutritions */}
                <ul className="mt-2">
                    {selectedNutritions.map((item) => (
                        <li key={item.nutrition.nutrition_id} className="flex justify-between p-1 border-b">
                            {item.nutrition.name} ({item.amount} {item.nutrition.measurement})
                            <button onClick={() => removeNutrition(item.nutrition.nutrition_id)} className="text-red-500">X</button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Use Reusable Table */}
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
        </div>
    );
};

export default IngredientManagement;
