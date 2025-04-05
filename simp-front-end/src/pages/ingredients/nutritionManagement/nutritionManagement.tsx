// components/admin/NutrientManagement.tsx

"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { RotateCcw } from "lucide-react";

// Import types
import type {
  NutrientBase,
  NutrientCreatePayload,
  NutrientUpdatePayload,
  NutrientOut,
  PaginatedNutrients,
} from "@/lib/types/nutrient";

// Import API service functions
import {
  fetchNutrients,
  createNutrient,
  updateNutrient,
  getNutrientById,
} from "@/lib/api/admin/nutrients";

// Import child components and their types
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm, { FormField } from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";

const ITEMS_PER_PAGE = 10;

// Type for the form's state
type NutrientFormData = {
  [K in keyof NutrientBase]?: NutrientBase[K] | string | undefined;
} & { nutrient_id?: string };

// --- Initial Form State ---
const initialFormState: NutrientFormData = {
  nutrient_name: "",
  nutrient_symbol: "",
  unit: "",
  nutrient_decimals: 2,
  primary_group: "",
  secondary_group: "",
  tertiary_group: "",
  quaternary_group: "",
  description: "",
  sort_order: 9999,
};

// --- Component ---
const NutrientManagement: React.FC = () => {
  // State variables
  const [nutrients, setNutrients] = useState<NutrientOut[]>([]);
  const [totalNutrients, setTotalNutrients] = useState(0);
  const [currentPage, setCurrentPage] = useState(1); // Still 1-based for UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentNutrientId, setCurrentNutrientId] = useState<string | null>(null);
  const [nutrientFormState, setNutrientFormState] = useState<NutrientFormData>(initialFormState);

  // --- Corrected Fetching Logic with Safeguard ---
  const loadNutrients = useCallback(async (page: number, limit: number) => {
    // --- Safeguard Start ---
    // Ensure page is at least 1 before calculating skip
    const validatedPage = Math.max(1, page);
    // Log or handle if the original page number was invalid
    if (page !== validatedPage) {
      console.warn(`loadNutrients was called with an invalid page number: ${page}. Corrected to page 1.`);
      // Optionally, if the state itself could be wrong, reset it (but be cautious)
      // setCurrentPage(1); // This might cause an extra render if page was indeed < 1
    }
    // Calculate skip using the validated page number (ensures skip >= 0)
    const skip = (validatedPage - 1) * limit;
    // --- Safeguard End ---

    setIsLoading(true);
    setError(null);
    console.log(`Workspaceing nutrients page ${validatedPage}, skip ${skip}, limit ${limit}...`); // Log corrected values

    try {
      // Call the API function with guaranteed non-negative skip
      const data = await fetchNutrients(skip, limit);
      console.log("Fetched data:", data);
      setNutrients(data.items ?? []);
      setTotalNutrients(data.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch nutrients:", err);
      setError("Failed to load nutrients. Please try again.");
      setNutrients([]);
      setTotalNutrients(0);
    } finally {
      setIsLoading(false);
    }
  // It's usually better practice not to include `setCurrentPage` in the dependency array
  // unless absolutely necessary, as it can cause infinite loops if not handled carefully.
  // The function itself doesn't depend on it changing.
  }, []); // Keep dependency array empty or minimal

  // useEffect still uses the 1-based currentPage state variable
  useEffect(() => {
    // Pass the 1-based currentPage to loadNutrients
    loadNutrients(currentPage, ITEMS_PER_PAGE);
  }, [currentPage, loadNutrients]); // Depend on currentPage and the callback

  // --- Form State Handling (No change needed) ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setNutrientFormState(prev => ({ ...prev, [name]: value }));
  };

  const clearSelection = () => {
    setSelectedRowId(null);
    setCurrentNutrientId(null);
    setNutrientFormState(initialFormState);
    setError(null);
  };

  const handleRowClick = useCallback((nutrient: NutrientOut) => {
    setSelectedRowId(nutrient.nutrient_id);
    setCurrentNutrientId(nutrient.nutrient_id);
    setNutrientFormState({ /* ... populate form ... */
      nutrient_id: nutrient.nutrient_id, nutrient_name: nutrient.nutrient_name ?? "",
      nutrient_symbol: nutrient.nutrient_symbol ?? "", unit: nutrient.unit ?? "",
      nutrient_decimals: nutrient.nutrient_decimals ?? 2, primary_group: nutrient.primary_group ?? "",
      secondary_group: nutrient.secondary_group ?? "", tertiary_group: nutrient.tertiary_group ?? "",
      quaternary_group: nutrient.quaternary_group ?? "", description: nutrient.description ?? "",
      sort_order: nutrient.sort_order ?? 9999,
    });
    setError(null);
  }, []);

  // --- Prepare Payload Helper (No change needed) ---
  const preparePayload = (formData: NutrientFormData, isUpdate: boolean): NutrientCreatePayload | NutrientUpdatePayload => {
      const payload: any = {};
      const processValue = (key: keyof NutrientBase, value: any): string | number | null | undefined => {
          const trimmedValue = typeof value === 'string' ? value.trim() : value;
          if (trimmedValue === '' || trimmedValue === undefined) { return null; }
          if (key === 'nutrient_decimals' || key === 'sort_order') {
              const num = parseInt(String(trimmedValue), 10); return isNaN(num) ? null : num;
          }
          return String(trimmedValue);
      };
      for (const key of Object.keys(initialFormState) as Array<keyof NutrientBase>) {
          payload[key] = processValue(key, formData[key]);
      }
      if (!isUpdate) {
        if (!payload.nutrient_name) throw new Error("Nutrient Name is required.");
        if (!payload.unit) throw new Error("Unit is required.");
        if (payload.nutrient_decimals === null || payload.nutrient_decimals === undefined) payload.nutrient_decimals = 2;
        if (payload.sort_order === null || payload.sort_order === undefined) payload.sort_order = 9999;
      }
      return payload as NutrientCreatePayload | NutrientUpdatePayload;
  };

  // --- API Actions (No change needed) ---
  const handleAddNutrient = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); let payload: NutrientCreatePayload;
    try { payload = preparePayload(nutrientFormState, false) as NutrientCreatePayload; }
    catch (validationError: any) { setError(validationError.message); return; }
    setIsLoading(true);
    try {
      const newNutrient = await createNutrient(payload);
      if (newNutrient) { loadNutrients(currentPage, ITEMS_PER_PAGE); clearSelection(); }
      else { setError("Failed to create nutrient. API returned no data."); }
    } catch (err: any) { setError(`Failed to create nutrient: ${err.message || 'Unknown error'}`); }
    finally { setIsLoading(false); }
  };

  const handleEditNutrient = async (e: React.FormEvent) => {
    e.preventDefault(); if (!currentNutrientId) { setError("No nutrient selected to update."); return; };
    setError(null); let payload: NutrientUpdatePayload;
    try { payload = preparePayload(nutrientFormState, true) as NutrientUpdatePayload; }
    catch (validationError: any) { setError(validationError.message); return; }
    setIsLoading(true);
    try {
      const updatedNutrient = await updateNutrient(currentNutrientId, payload);
      if (updatedNutrient) {
        setNutrients((prev) => prev.map((n) => (n.nutrient_id === currentNutrientId ? updatedNutrient : n)));
        handleRowClick(updatedNutrient);
      } else { setError("Failed to update nutrient. API returned no data."); }
    } catch (err: any) { setError(`Failed to update nutrient: ${err.message || 'Unknown error'}`); }
    finally { setIsLoading(false); }
  };

  // --- Memos for Form Fields and Table Data (No change needed) ---
  const formFields: FormField<NutrientFormData>[] = useMemo(() => [
    { name: "nutrient_name", type: "text", placeholder: "Nutrient Name", required: true },
    { name: "nutrient_symbol", type: "text", placeholder: "Symbol (e.g., FAT, VITC)" },
    { name: "unit", type: "text", placeholder: "Unit (e.g., g, mg, %)", required: true },
    { name: "nutrient_decimals", type: "number", placeholder: "Decimal Places (0-10)", required: true },
    { name: "primary_group", type: "text", placeholder: "Primary Group (e.g., Macronutrient)" },
    { name: "secondary_group", type: "text", placeholder: "Secondary Group (e.g., Fat)" },
    { name: "tertiary_group", type: "text", placeholder: "Tertiary Group" },
    { name: "quaternary_group", type: "text", placeholder: "Quaternary Group" },
    { name: "description", type: "textarea", placeholder: "Description" },
    { name: "sort_order", type: "number", placeholder: "Sort Order (e.g., 10, 20)" },
  ], []);

  const tableColumns: string[] = useMemo(() => [
      "Name", "Symbol", "Unit", "Decimals", "Primary Group", "Secondary Group", "Sort Order"
  ], []);

  const tableData = useMemo(() => nutrients.map((nutrient) => ({
    id: nutrient.nutrient_id, values: [
      nutrient.nutrient_name, nutrient.nutrient_symbol ?? "-", nutrient.unit,
      nutrient.nutrient_decimals, nutrient.primary_group ?? "-", nutrient.secondary_group ?? "-",
      nutrient.sort_order ?? "-",
    ],
  })), [nutrients]);

  // --- Render (No change needed) ---
  return (
    <ManagementContainer
        title="Manage Nutrients"
        actionButton={currentNutrientId ? (<button onClick={clearSelection} /* ... */><RotateCcw size={18} /></button>) : null}
        isLoading={isLoading} errorMessage={error} >
      <SimpleForm /* ...props... */ fields={formFields} state={nutrientFormState} setState={setNutrientFormState} onAdd={handleAddNutrient} addLabel="Add Nutrient" isEditMode={!!currentNutrientId} onEdit={handleEditNutrient} editLabel="Update Nutrient" disabled={isLoading}/>
      <SimpleTable /* ...props... */ title="Nutrient List" columns={tableColumns} data={tableData} totalItems={totalNutrients} itemsPerPage={ITEMS_PER_PAGE} currentPage={currentPage} onPageChange={setCurrentPage} selectedRowId={selectedRowId} onRowClick={(item) => { const selected = nutrients.find((n) => n.nutrient_id === item.id); if (selected) { handleRowClick(selected); } }} isLoading={isLoading} />
    </ManagementContainer>
  );
};

export default NutrientManagement;