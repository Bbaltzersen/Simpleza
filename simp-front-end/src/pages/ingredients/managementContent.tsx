"use client";

import React, { useState } from "react";
import styles from "./managementContent.module.css"; // Import CSS module

import IngredientManagement from "./ingredientManagement/ingredientManagement";
import NutritionManagement from "./nutritionManagement/nutritionManagement";
import ProductManagement from "./productManagement/productManagement";
import CompanyManagement from "./companyManagement/companyManagement";

// Define entity names as a type
type EntityType = "Ingredients" | "Products" | "Nutrition" | "Companies";

const entityNames: EntityType[] = ["Ingredients", "Nutrition"];

const IngredientContent: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("Ingredients");

  return (
    <div className="p-4">
      {/* Horizontal Tabs with CSS Module */}
      <div className={styles.tabMenu}>
        {entityNames.map((entity) => (
          <div
            key={entity}
            className={`${styles.tab} ${selectedEntity === entity ? styles.activeTab : ""}`}
            onClick={() => setSelectedEntity(entity)}
          >
            {entity}
          </div>
        ))}
      </div>

      {/* Display Selected Entity */}
      <div className="mt-4">
        {selectedEntity === "Ingredients" && <IngredientManagement />}
        {/* {selectedEntity === "Products" && <ProductManagement />} */}
        {selectedEntity === "Nutrition" && <NutritionManagement />}
        {/* {selectedEntity === "Companies" && <CompanyManagement />} */}
      </div>
    </div>
  );
};

export default IngredientContent;
