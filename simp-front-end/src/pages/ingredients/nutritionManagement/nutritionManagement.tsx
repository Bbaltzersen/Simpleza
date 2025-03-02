"use client";

import React, { useEffect, useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchNutritions, createNutrition, deleteNutrition } from "@/lib/api/ingredient/nutrition";

const ITEMS_PER_PAGE = 10;

const NutritionManagement: React.FC = () => {
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [nutrition, setNutrition] = useState<Partial<Nutrition>>({
    name: "",
    measurement: "",
    recommended: undefined,
  });

  const [totalNutritions, setTotalNutritions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadNutritions = async () => {
      try {
        const { nutritions, total } = await fetchNutritions(currentPage, ITEMS_PER_PAGE);
        setNutritions(nutritions);
        setTotalNutritions(total);
      } catch (error) {
        console.error("Failed to fetch nutritions:", error);
      }
    };

    loadNutritions();
  }, [currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nutrition.name?.trim() || !nutrition.measurement?.trim()) return;

    try {
      const newNutrition = await createNutrition({
        name: nutrition.name.trim(),
        measurement: nutrition.measurement.trim(),
        recommended: nutrition.recommended,
      });

      if (newNutrition) {
        setNutritions((prev) => [...prev, newNutrition]);
        setTotalNutritions((prev) => prev + 1);
        setNutrition({ name: "", measurement: "", recommended: undefined });
      }
    } catch (error) {
      console.error("Failed to create nutrition:", error);
    }
  };

  const handleDelete = async (nutrition_id: string) => {
    try {
      const success = await deleteNutrition(nutrition_id);
      if (success) {
        setNutritions((prev) => prev.filter((n) => n.nutrition_id !== nutrition_id));
        setTotalNutritions((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to delete nutrition:", error);
    }
  };

  return (
    <ManagementContainer title="Manage Nutrition">
      <SimpleForm
        fields={[
          { name: "name", type: "text", placeholder: "Nutrition Name", required: true },
          { name: "measurement", type: "text", placeholder: "Measurement (e.g., g, mg)", required: true },
          { name: "recommended", type: "number", placeholder: "Recommended Intake" },
        ]}
        state={nutrition}
        setState={setNutrition}
        onSubmit={handleSubmit}
        submitLabel="Add Nutrition"
      />

      <SimpleTable
        title="Nutrition List"
        columns={["Name", "Measurement", "Recommended Intake", "Actions"]}
        data={nutritions}
        totalItems={totalNutritions}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchableFields={["name", "measurement"]}
        renderRow={(nutrition) => (
          <tr key={nutrition.nutrition_id}>
            <td>{nutrition.name}</td>
            <td>{nutrition.measurement}</td>
            <td>{nutrition.recommended}</td>
            <td><button onClick={() => handleDelete(nutrition.nutrition_id)}>Delete</button></td>
          </tr>
        )}
      />
    </ManagementContainer>
  );
};

export default NutritionManagement;
