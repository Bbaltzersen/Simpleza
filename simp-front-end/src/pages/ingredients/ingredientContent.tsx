"use client";
import React, { useState } from "react";

function IngredientContent() {
  const [selectedEntity, setSelectedEntity] = useState<"Nutrition" | "Products" | "Ingredients"  | "Companies">(
    "Ingredients"
  );

  return (
    <div className="p-4">
      {/* Entity Selection Menu (At the Top) */}
      <div className="flex space-x-4 mb-4 border-b pb-2">
        {["Ingredients", "Nutrition", "Products", "Companies"].map((entity) => (
          <button
            key={entity}
            className={`p-2 ${
              selectedEntity === entity ? "bg-gray-200 font-bold" : "bg-white"
            }`}
            onClick={() => setSelectedEntity(entity as "Nutrition" | "Products" |"Ingredients" |  "Companies")}
          >
            {entity}
          </button>
        ))}
      </div>

      {/* Display Selected Entity Content Below the Menu */}
      <div className="mt-4">
        {selectedEntity === "Ingredients" && <div>Ingredients Management</div>}
        {selectedEntity === "Products" && <div>Product Management</div>}
        {selectedEntity === "Nutrition" && <div>Nutrition Management</div>}
        {selectedEntity === "Companies" && <div>Company Management</div>}
      </div>
    </div>
  );
}

export default IngredientContent;
