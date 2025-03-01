"use client";

import React, { useState } from "react";
import { Ingredient } from "@/lib/types/ingredient";
import { Product } from "@/lib/types/product";
import { Nutrition } from "@/lib/types/nutrition";

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

  // Filter ingredients based on search query
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate the results
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedIngredients = filteredIngredients.slice(startIndex, startIndex + ITEMS_PER_PAGE);


  // Handle Ingredient Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIngredient = { ...ingredient, products: selectedProducts, nutritions: selectedNutritions };
    console.log("New Ingredient Data:", newIngredient);
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
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Ingredients</h2>

      {/* Ingredient Form */}
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Ingredient Name"
          value={ingredient.name || ""}
          onChange={(e) => setIngredient({ ...ingredient, name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Default Unit"
          value={ingredient.default_unit}
          onChange={(e) => setIngredient({ ...ingredient, default_unit: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          type="number"
          placeholder="Calories per 100g"
          value={ingredient.calories_per_100g || ""}
          onChange={(e) => setIngredient({ ...ingredient, calories_per_100g: Number(e.target.value) })}
          className="border p-2 w-full"
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

        <button type="submit" className="bg-blue-500 text-white p-2 w-full mt-4">
          Save Ingredient
        </button>
      </form>
    </div>
    <div className="p-4">
    <h2 className="text-xl font-bold mb-4">Ingredient List</h2>

    {/* Search Bar */}
    <input
      type="text"
      placeholder="Search ingredients..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="border p-2 w-full mb-4"
    />

    {/* Ingredients Table */}
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Default Unit</th>
            <th className="border p-2">Calories per 100g</th>
          </tr>
        </thead>
        <tbody>
          {paginatedIngredients.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center p-4">
                No ingredients found.
              </td>
            </tr>
          ) : (
            paginatedIngredients.map((ingredient) => (
              <tr key={ingredient.ingredient_id} className="border-b">
                <td className="border p-2">{ingredient.name}</td>
                <td className="border p-2">{ingredient.default_unit}</td>
                <td className="border p-2">{ingredient.calories_per_100g}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="flex justify-between mt-4">
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={`p-2 ${currentPage === 1 ? "bg-gray-300" : "bg-blue-500 text-white"}`}
      >
        Previous
      </button>
      <span className="p-2">
        Page {currentPage} of {Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE)}
      </span>
      <button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE)))}
        disabled={currentPage >= Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE)}
        className={`p-2 ${currentPage >= Math.ceil(filteredIngredients.length / ITEMS_PER_PAGE) ? "bg-gray-300" : "bg-blue-500 text-white"}`}
      >
        Next
      </button>
    </div>
  </div>
  </div>
  );
};

export default IngredientManagement;
