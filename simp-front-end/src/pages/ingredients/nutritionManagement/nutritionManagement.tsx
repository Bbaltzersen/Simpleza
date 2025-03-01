"use client";

import React from "react";
import { Nutrition } from "@/lib/types/nutrition";

const NutritionManagement: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Nutrition</h2>

      {/* Add Nutrition Form */}
      <div className="mb-4">
        <p>[Form for adding nutrition]</p>
      </div>

      {/* List of Nutrition Entries */}
      <ul className="border p-4">
        <p>[List of existing nutrition data]</p>
      </ul>
    </div>
  );
};

export default NutritionManagement;
