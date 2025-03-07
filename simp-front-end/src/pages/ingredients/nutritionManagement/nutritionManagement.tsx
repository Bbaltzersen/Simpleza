"use client";

import React, { useEffect, useState } from "react";
import { Nutrition } from "@/lib/types/nutrition";
import { Ingredient } from "@/lib/types/ingredient";
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
import {
  fetchNutritions,
  createNutrition,
  deleteNutrition,
  updateNutrition,
} from "@/lib/api/ingredient/nutrition";
import { fetchIngredients } from "@/lib/api/ingredient/ingredient";

const ITEMS_PER_PAGE = 10;

const NutritionManagement: React.FC = () => {
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [totalNutritions, setTotalNutritions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
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

  const handleAdd = async (e: React.FormEvent) => {
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
        setCurrentNutritionId(newNutrition.nutrition_id);
        setNutrition({
          name: newNutrition.name,
          measurement: newNutrition.measurement,
          recommended: newNutrition.recommended,
        });
      }
    } catch (error) {
      console.error("Failed to create nutrition:", error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNutritionId || !nutrition.name?.trim() || !nutrition.measurement?.trim()) return;

    try {
      const updatedNutrition = await updateNutrition(currentNutritionId, {
        name: nutrition.name.trim(),
        measurement: nutrition.measurement.trim(),
        recommended: nutrition.recommended,
      });

      if (updatedNutrition) {
        setNutritions((prev) =>
          prev.map((n) => (n.nutrition_id === currentNutritionId ? updatedNutrition : n))
        );
      }
    } catch (error) {
      console.error("Failed to update nutrition:", error);
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
        }
      }
    } catch (error) {
      console.error("Failed to delete nutrition:", error);
    }
  };

  const handleRowClick = (nutrition: Nutrition) => {
    setSelectedRowId(nutrition.nutrition_id);
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
          { name: "recommended", type: "text", placeholder: "Recommended Intake" },
        ]}
        state={nutrition}
        setState={setNutrition}
        onAdd={handleAdd}
        addLabel="Add Nutrition"
        isEditMode={!!currentNutritionId}
        onEdit={handleEdit}
        editLabel="Update Nutrition"
      />

      <SimpleTable
        title="Nutrition List"
        columns={["Name", "Measurement", "Recommended Intake"]}
        data={nutritions.map((nutrition) => ({
          id: nutrition.nutrition_id,
          values: [
            nutrition.name,
            nutrition.measurement,
            nutrition.recommended ?? "N/A",
          ],
        }))}
        totalItems={totalNutritions}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedRowId={selectedRowId}
        onRowClick={(item) => {
          setSelectedRowId(item.id);
          const selectedNutrition = nutritions.find((n) => n.nutrition_id === item.id);
          if (selectedNutrition) {
            handleRowClick(selectedNutrition);
          }
        }}
      />
    </ManagementContainer>
  );
};

export default NutritionManagement;
