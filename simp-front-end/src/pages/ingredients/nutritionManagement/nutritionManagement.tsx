"use client";

import React, { useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";

interface FormField {
  name: keyof Nutrition;
  type: "text" | "number";
  placeholder: string;
  required?: boolean;
}

const NutritionManagement: React.FC = () => {
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [nutrition, setNutrition] = useState<Partial<Nutrition>>({
    name: "",
    measurement: "",
    recommended: undefined,
  });

  // Form Fields
  const nutritionFields: FormField[] = [
    { name: "name", type: "text", placeholder: "Nutrition Name", required: true },
    { name: "measurement", type: "text", placeholder: "Measurement (e.g., g, mg)", required: true },
    { name: "recommended", type: "number", placeholder: "Recommended Intake" },
  ];

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
    <div>
      <h2>Manage Nutrition</h2>

      {/* Use Reusable Form */}
      <SimpleForm
        title="Add Nutrition"
        fields={nutritionFields}
        state={nutrition}
        setState={setNutrition}
        onSubmit={handleSubmit}
        submitLabel="Add Nutrition"
      />

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
