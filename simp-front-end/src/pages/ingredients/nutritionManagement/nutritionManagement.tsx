"use client";

import React, { useEffect, useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";
import { Ingredient } from "@/lib/types/ingredient";
import SimpleTable from "@/components/managementComponent/simpleTable";
import EntityLinkForm from "@/components/managementComponent/entityLinkForm";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import { fetchNutritions, createNutrition, deleteNutrition} from "@/lib/api/ingredient/nutrition";
import { fetchIngredients } from "@/lib/api/ingredient/ingredient";

const ITEMS_PER_PAGE = 10;

const NutritionManagement: React.FC = () => {
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<{ id: string; name: string }[]>([]);
  const [totalNutritions, setTotalNutritions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentNutritionId, setCurrentNutritionId] = useState<string | null>(null);

  const [nutrition, setNutrition] = useState<Partial<Nutrition>>({
    name: "",
    measurement: "",
    recommended: undefined,
  });

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

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const ingredientsData = await fetchIngredients();
        setIngredients(ingredientsData.ingredients || []);
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
      }
    };
    loadIngredients();
  }, []);

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
        setCurrentNutritionId(newNutrition.nutrition_id);
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
        if (currentNutritionId === nutrition_id) {
          setCurrentNutritionId(null);
          setSelectedIngredients([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete nutrition:", error);
    }
  };

  const handleRowClick = async (nutrition: Nutrition) => {
    setCurrentNutritionId(nutrition.nutrition_id);
    setNutrition({
      name: nutrition.name,
      measurement: nutrition.measurement,
      recommended: nutrition.recommended,
    });
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
        data={nutritions.map((nutrition) => ({
          ...nutrition,
          id: nutrition.nutrition_id,
        }))}
        totalItems={totalNutritions}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        searchableFields={["name", "measurement"]}
        onRowClick={handleRowClick}
        renderRow={(nutrition, onClick) => (
          <tr key={nutrition.nutrition_id} onClick={onClick} className="cursor-pointer hover:bg-gray-100">
            <td>{nutrition.name}</td>
            <td>{nutrition.measurement}</td>
            <td>{nutrition.recommended ?? "N/A"}</td>
          </tr>
        )}
      />
    </ManagementContainer>
  );
};

export default NutritionManagement;
