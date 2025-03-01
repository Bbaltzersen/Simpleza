"use client";

import React, { useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";

const NutritionManagement: React.FC = () => {
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [nutrition, setNutrition] = useState<Partial<Nutrition>>({
    name: "",
    measurement: "",
    recommended: undefined,
  });

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

      {/* Use Reusable Table */}
      <SimpleTable
        title="Nutrition List"
        columns={["Name", "Measurement", "Recommended Intake"]}
        data={nutritions}
        searchableFields={["name", "measurement"]}
        renderRow={(nutrition) => (
          <tr key={nutrition.nutrition_id} className="border-b">
            <td className="border p-2">{nutrition.name}</td>
            <td className="border p-2">{nutrition.measurement}</td>
            <td className="border p-2">{nutrition.recommended}</td>
          </tr>
        )}
      />
    </div>
  );
};

export default NutritionManagement;
