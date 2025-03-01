"use client";

import React, { useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";

const NutritionManagement: React.FC = () => {
  const [nutrition, setNutrition] = useState<Partial<Nutrition>>({
    name: "",
    measurement: "",
    recommended: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("New Nutrition:", nutrition);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Nutrition</h2>

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
    </div>
  );
};

export default NutritionManagement;
