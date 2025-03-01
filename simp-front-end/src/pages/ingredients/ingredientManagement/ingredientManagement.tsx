"use client";

import React from "react";
import { Ingredient } from "@/lib/types/ingredient";

const IngredientManagement: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Manage Ingredients</h2>

      {/* Add Ingredient Form */}
      <div className="mb-4">
        <p>[Form for adding ingredients]</p>
      </div>

      {/* List of Ingredients */}
      <ul className="border p-4">
        <p>[List of existing ingredients]</p>
      </ul>
    </div>
  );
};

export default IngredientManagement;
