"use client";

import React, { useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";

const ITEMS_PER_PAGE = 20;

const NutritionManagement: React.FC = () => {
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [nutrition, setNutrition] = useState<Partial<Nutrition>>({
    name: "",
    measurement: "",
    recommended: undefined,
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Handle Nutrition Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newNutrition: Nutrition = {
      nutrition_id: crypto.randomUUID(),
      name: nutrition.name || "",
      measurement: nutrition.measurement || "",
      recommended: nutrition.recommended || 0,
    };
    setNutritions([...nutritions, newNutrition]); // Add nutrition to list
    setNutrition({ name: "", measurement: "", recommended: undefined }); // Reset input fields
  };

  // Filter nutrition based on search query
  const filteredNutritions = nutritions.filter((n) =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate the results
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedNutritions = filteredNutritions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Manage Nutrition</h2>

      {/* Nutrition Form */}
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Nutrition Name"
          value={nutrition.name || ""}
          onChange={(e) => setNutrition({ ...nutrition, name: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="Measurement (e.g., g, mg)"
          value={nutrition.measurement || ""}
          onChange={(e) => setNutrition({ ...nutrition, measurement: e.target.value })}
          className="border p-2 w-full"
          required
        />
        <input
          type="number"
          placeholder="Recommended Intake"
          value={nutrition.recommended || ""}
          onChange={(e) => setNutrition({ ...nutrition, recommended: Number(e.target.value) })}
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full">
          Add Nutrition
        </button>
      </form>

      <h2 className="text-xl font-bold mb-4">Nutrition List</h2>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search nutrition..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      {/* Nutrition Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Measurement</th>
              <th className="border p-2">Recommended Intake</th>
            </tr>
          </thead>
          <tbody>
            {paginatedNutritions.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-4">No nutrition found.</td>
              </tr>
            ) : (
              paginatedNutritions.map((nutrition) => (
                <tr key={nutrition.nutrition_id} className="border-b">
                  <td className="border p-2">{nutrition.name}</td>
                  <td className="border p-2">{nutrition.measurement}</td>
                  <td className="border p-2">{nutrition.recommended}</td>
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
          Page {currentPage} of {Math.ceil(filteredNutritions.length / ITEMS_PER_PAGE)}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredNutritions.length / ITEMS_PER_PAGE)))}
          disabled={currentPage >= Math.ceil(filteredNutritions.length / ITEMS_PER_PAGE)}
          className={`p-2 ${currentPage >= Math.ceil(filteredNutritions.length / ITEMS_PER_PAGE) ? "bg-gray-300" : "bg-blue-500 text-white"}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default NutritionManagement;