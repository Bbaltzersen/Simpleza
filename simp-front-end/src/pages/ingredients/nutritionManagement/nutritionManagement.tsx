"use client";

import React, { useEffect, useState, useCallback } from "react";
// Import corrected types
import {
    Nutrition,
    NutritionCreatePayload,
    NutritionUpdatePayload
} from "@/lib/types/nutrition";
// Import API functions
import {
  fetchNutritions,
  createNutrition,
  deleteNutrition,
  updateNutrition,
  getNutritionByName
} from "@/lib/api/admin/nutrition";
// Import Base Components
import SimpleTable from "@/components/managementComponent/simpleTable";
import SimpleForm from "@/components/managementComponent/simpleform";
import ManagementContainer from "@/components/managementComponent/managementContainer";
// Import Enums and helper
import {
    MeasurementUnit, NutrientCategory, NutrientStatus, AminoAcidType,
    VitaminSolubility, FattyAcidSaturation, SterolType,
    MeasurementUnitEnum, NutrientCategoryEnum, NutrientStatusEnum,
    AminoAcidTypeEnum, VitaminSolubilityEnum, FattyAcidSaturationEnum, SterolTypeEnum,
    getEnumValues
} from "@/lib/enums"; // Adjust path
// Import Icons
import { Plus } from "lucide-react";

// --- Constants ---
const ITEMS_PER_PAGE = 10;

// --- Type Definitions ---
// Expanded Form State to include most optional fields as strings/booleans
type NutritionFormState = {
  name?: string; // Required
  storage_unit?: string; // Required (Enum value as string)
  category?: string; // Required (Enum value as string)
  status?: string; // Enum value as string

  // Optional Text/Number(string) fields handled by SimpleForm
  subtype?: string;
  description?: string;
  efsa_id?: string;
  usda_nutrient_id?: string;
  cas_number?: string;
  synonyms?: string; // Comma-separated string input
  preferred_display_unit?: string; // Enum value as string
  conversion_factors?: string; // JSON string input
  parent_id?: string; // UUID string
  eu_reference_intake_value?: string; // Comma-decimal string input
  eu_reference_intake_unit?: string; // Enum value as string
  sort_order?: string; // Integer string input
  definition_source?: string;

  // Optional Enum fields handled by separate <select>
  amino_acid_type?: string; // Enum value as string
  vitamin_solubility?: string; // Enum value as string
  fatty_acid_saturation?: string; // Enum value as string
  sterol_type?: string; // Enum value as string

  // Optional Boolean fields handled by separate <input type="checkbox">
  is_essential?: boolean;
  is_sugar?: boolean;
  is_fiber?: boolean;
  is_eu_mandatory_nutrient?: boolean;
  is_eu_reference_intake_nutrient?: boolean;
};

// --- Component ---
const NutritionManagement: React.FC = () => {
  // --- State Hooks ---
  const [nutritions, setNutritions] = useState<Nutrition[]>([]);
  const [totalNutritions, setTotalNutritions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [currentNutritionId, setCurrentNutritionId] = useState<string | null>(null);

  // Initialize expanded form state
  const initialFormState: NutritionFormState = {
    name: "",
    storage_unit: MeasurementUnit.MICROGRAM, // Default µg
    category: NutrientCategory.MICRONUTRIENT, // Default
    status: NutrientStatus.ACTIVE, // Default
    subtype: "",
    description: "",
    efsa_id: "",
    usda_nutrient_id: "",
    cas_number: "",
    synonyms: "",
    preferred_display_unit: "",
    conversion_factors: "", // Default empty JSON string? Or ""?
    amino_acid_type: "",
    vitamin_solubility: "",
    fatty_acid_saturation: "",
    sterol_type: "",
    is_essential: false,
    is_sugar: false,
    is_fiber: false,
    parent_id: "",
    is_eu_mandatory_nutrient: false,
    is_eu_reference_intake_nutrient: false,
    eu_reference_intake_value: "",
    eu_reference_intake_unit: "",
    sort_order: "0",
    definition_source: "",
  };
  const [nutritionForm, setNutritionForm] = useState<NutritionFormState>(initialFormState);

  // --- Effects ---
  useEffect(() => {
    const loadNutritions = async () => {
      try {
        const skip = (currentPage - 1) * ITEMS_PER_PAGE;
        const limit = ITEMS_PER_PAGE;
        const { nutritions: fetchedNutritions, total } = await fetchNutritions(currentPage, ITEMS_PER_PAGE); // Assuming API func takes page/limit
        setNutritions(fetchedNutritions);
        setTotalNutritions(total);
      } catch (error) {
        console.error("Failed to fetch nutritions:", error);
      }
    };
    loadNutritions();
  }, [currentPage]);

  // --- Utility Functions ---
  const parseEuropeanNumber = useCallback((str: string | undefined): number | undefined => {
      if (!str?.trim()) { return undefined; } // Check for empty or whitespace-only
      const normalizedStr = str.replace(',', '.');
      const num = parseFloat(normalizedStr);
      return isNaN(num) ? undefined : num;
  }, []);

  const parseIntNumber = useCallback((str: string | undefined): number | undefined => {
      if (!str?.trim()) { return undefined; }
      const digitsOnly = str.replace(/[^0-9]/g, '');
      if (digitsOnly === '') return undefined;
      const num = parseInt(digitsOnly, 10);
      return isNaN(num) ? undefined : num;
  }, []);

  const formatNumberToEuropeanString = useCallback((num: number | null | undefined): string => {
      if (num === undefined || num === null) { return ""; }
      return num.toString().replace('.', ',');
  }, []);

   const formatIntToString = useCallback((num: number | null | undefined): string => {
      if (num === undefined || num === null) { return ""; }
      return num.toString();
  }, []);

  // Expanded prepareApiPayload
  const prepareApiPayload = useCallback((): NutritionCreatePayload | NutritionUpdatePayload => {
      // Helper to parse comma-separated string to array
      const parseSynonyms = (s?: string): string[] | undefined => {
          if (!s || !s.trim()) return undefined;
          return s.split(',').map(syn => syn.trim()).filter(Boolean); // Trim and remove empty strings
      };

      // Helper to parse JSON string to object
       const parseJsonFactors = (s?: string): Record<string, any> | undefined => {
          if (!s || !s.trim()) return undefined;
          try {
              const parsed = JSON.parse(s);
              // Optional: Add validation to ensure it's an object
              if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                  return parsed;
              }
              console.warn("Invalid JSON format for conversion factors");
              return undefined;
          } catch (e) {
              console.warn("Error parsing conversion factors JSON:", e);
              return undefined;
          }
      };

      return {
          name: nutritionForm.name?.trim() || undefined,
          storage_unit: nutritionForm.storage_unit as MeasurementUnitEnum || undefined,
          category: nutritionForm.category as NutrientCategoryEnum || undefined,
          status: nutritionForm.status as NutrientStatusEnum || undefined,
          subtype: nutritionForm.subtype?.trim() || undefined,
          description: nutritionForm.description?.trim() || undefined,
          efsa_id: nutritionForm.efsa_id?.trim() || undefined,
          usda_nutrient_id: nutritionForm.usda_nutrient_id?.trim() || undefined,
          cas_number: nutritionForm.cas_number?.trim() || undefined,
          synonyms: parseSynonyms(nutritionForm.synonyms),
          preferred_display_unit: nutritionForm.preferred_display_unit as MeasurementUnitEnum || undefined,
          conversion_factors: parseJsonFactors(nutritionForm.conversion_factors),
          amino_acid_type: nutritionForm.amino_acid_type as AminoAcidTypeEnum || undefined,
          vitamin_solubility: nutritionForm.vitamin_solubility as VitaminSolubilityEnum || undefined,
          fatty_acid_saturation: nutritionForm.fatty_acid_saturation as FattyAcidSaturationEnum || undefined,
          sterol_type: nutritionForm.sterol_type as SterolTypeEnum || undefined,
          is_essential: nutritionForm.is_essential, // boolean value
          is_sugar: nutritionForm.is_sugar, // boolean value
          is_fiber: nutritionForm.is_fiber, // boolean value
          parent_id: nutritionForm.parent_id?.trim() || undefined, // Assuming UUID is sent as string
          is_eu_mandatory_nutrient: nutritionForm.is_eu_mandatory_nutrient, // boolean value
          is_eu_reference_intake_nutrient: nutritionForm.is_eu_reference_intake_nutrient, // boolean value
          eu_reference_intake_value: parseEuropeanNumber(nutritionForm.eu_reference_intake_value),
          eu_reference_intake_unit: nutritionForm.eu_reference_intake_unit as MeasurementUnitEnum || undefined,
          sort_order: parseIntNumber(nutritionForm.sort_order),
          definition_source: nutritionForm.definition_source?.trim() || undefined,
      };
  }, [nutritionForm, parseEuropeanNumber, parseIntNumber]); // Add parsers to dependency array


  // Expanded formatApiDataToFormState
  const formatApiDataToFormState = useCallback((nutritionData: Nutrition): NutritionFormState => {
        // Helper to format array to comma-separated string
        const formatSynonyms = (arr?: string[] | null): string => {
            if (!arr) return "";
            return arr.join(', ');
        };

        // Helper to format object to JSON string
        const formatJsonFactors = (obj?: Record<string, any> | null): string => {
            if (!obj) return "";
            try {
                return JSON.stringify(obj, null, 2); // Pretty print JSON
            } catch (e) {
                console.error("Error stringifying conversion factors:", e);
                return "";
            }
        };

      return {
          name: nutritionData.name ?? "",
          storage_unit: nutritionData.storage_unit ?? "",
          category: nutritionData.category ?? "",
          status: nutritionData.status ?? "",
          subtype: nutritionData.subtype ?? "",
          description: nutritionData.description ?? "",
          efsa_id: nutritionData.efsa_id ?? "",
          usda_nutrient_id: nutritionData.usda_nutrient_id ?? "",
          cas_number: nutritionData.cas_number ?? "",
          synonyms: formatSynonyms(nutritionData.synonyms),
          preferred_display_unit: nutritionData.preferred_display_unit ?? "",
          conversion_factors: formatJsonFactors(nutritionData.conversion_factors),
          amino_acid_type: nutritionData.amino_acid_type ?? "",
          vitamin_solubility: nutritionData.vitamin_solubility ?? "",
          fatty_acid_saturation: nutritionData.fatty_acid_saturation ?? "",
          sterol_type: nutritionData.sterol_type ?? "",
          is_essential: nutritionData.is_essential ?? false, // Default to false if null/undefined
          is_sugar: nutritionData.is_sugar ?? false,
          is_fiber: nutritionData.is_fiber ?? false,
          parent_id: nutritionData.parent_id ?? "",
          is_eu_mandatory_nutrient: nutritionData.is_eu_mandatory_nutrient ?? false,
          is_eu_reference_intake_nutrient: nutritionData.is_eu_reference_intake_nutrient ?? false,
          eu_reference_intake_value: formatNumberToEuropeanString(nutritionData.eu_reference_intake_value),
          eu_reference_intake_unit: nutritionData.eu_reference_intake_unit ?? "",
          sort_order: formatIntToString(nutritionData.sort_order),
          definition_source: nutritionData.definition_source ?? "",
      };
  }, [formatNumberToEuropeanString, formatIntToString]); // Add formatters to dependency array

  // Generic handler for SimpleForm inputs and standalone selects/textareas
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Handle checkboxes specifically to get boolean value
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setNutritionForm(prevState => ({
        ...prevState,
        [name]: newValue
    }));
  };


  // --- Event Handlers (Add, Edit, Delete, Click, Clear) ---
   const handleAdd = useCallback(async (e: React.FormEvent) => {
       e.preventDefault();
       const payload = prepareApiPayload() as NutritionCreatePayload;
       if (!payload.name || !payload.storage_unit || !payload.category) {
           console.warn("Name, Storage Unit, and Category are required."); return;
       }
       try {
           const newNutrition = await createNutrition(payload);
           if (newNutrition) {
               setNutritions((prev) => [newNutrition, ...prev].slice(0, ITEMS_PER_PAGE));
               setTotalNutritions((prev) => prev + 1);
               setSelectedRowId(newNutrition.nutrient_id);
               setCurrentNutritionId(newNutrition.nutrient_id);
               setNutritionForm(formatApiDataToFormState(newNutrition));
               console.log("Nutrition created successfully:", newNutrition);
           }
       } catch (error) { console.error("Failed to create nutrition:", error); }
   }, [prepareApiPayload, formatApiDataToFormState]);

   const handleEdit = useCallback(async (e: React.FormEvent) => {
       e.preventDefault();
       if (!currentNutritionId) return;
       const payload = prepareApiPayload() as NutritionUpdatePayload;
        if (!payload.name || !payload.storage_unit || !payload.category) {
            console.warn("Name, Storage Unit, and Category are required."); return;
        }
       try {
           const updatedNutrition = await updateNutrition(currentNutritionId, payload);
           if (updatedNutrition) {
               setNutritions((prev) => prev.map((n) => (n.nutrient_id === currentNutritionId ? updatedNutrition : n)));
               setNutritionForm(formatApiDataToFormState(updatedNutrition));
               console.log("Nutrition updated successfully:", updatedNutrition);
           }
       } catch (error) { console.error("Failed to update nutrition:", error); }
   }, [currentNutritionId, prepareApiPayload, formatApiDataToFormState]);

   const handleDelete = useCallback(async (idToDelete: string) => {
       // Optional confirmation dialog
       try {
           const success = await deleteNutrition(idToDelete);
           if (success) {
               setNutritions((prev) => prev.filter((n) => n.nutrient_id !== idToDelete));
               setTotalNutritions((prev) => prev - 1);
               if (currentNutritionId === idToDelete) clearSelection(); // Use clearSelection here
               console.log(`Nutrition ${idToDelete} deleted successfully.`);
           } else { console.error(`Failed to delete nutrition ${idToDelete} (API returned false).`); }
       } catch (error) { console.error(`Failed to delete nutrition ${idToDelete}:`, error); }
   }, [currentNutritionId]); // Removed clearSelection from deps

   const clearSelection = useCallback(() => {
       setSelectedRowId(null);
       setCurrentNutritionId(null);
       setNutritionForm(initialFormState);
   }, [initialFormState]);

   const handleRowClick = useCallback((nutritionData: Nutrition) => {
       setSelectedRowId(nutritionData.nutrient_id);
       setCurrentNutritionId(nutritionData.nutrient_id);
       setNutritionForm(formatApiDataToFormState(nutritionData));
   }, [formatApiDataToFormState]);

  // --- Render ---
  return (
    <ManagementContainer title="Manage Nutritions"
        actionButton={currentNutritionId ? (
            <button onClick={clearSelection} aria-label="Add New Nutrition" className="your-button-styles">
                <Plus size={20} /> New
            </button>
        ) : null}
    >
      {/* Use a standard form tag to wrap SimpleForm and custom inputs */}
      <form onSubmit={currentNutritionId ? handleEdit : handleAdd}>
            {/* --- SimpleForm for basic text/number-like inputs --- */}
            <SimpleForm
                // Prevent SimpleForm from rendering its own form tag if it does
                // Pass submit handler via prop if SimpleForm expects it, otherwise outer form handles it
                // Or modify SimpleForm to not render <form>
                fields={[
                    { name: "name", type: "text", placeholder: "Nutrition Name", required: true },
                    // Keep only text/number-like fields here
                    { name: "subtype", type: "text", placeholder: "Subtype (e.g., Omega-3)" },
                    { name: "efsa_id", type: "text", placeholder: "EFSA ID" },
                    { name: "usda_nutrient_id", type: "text", placeholder: "USDA Nutrient ID" },
                    { name: "cas_number", type: "text", placeholder: "CAS Number" },
                    { name: "synonyms", type: "text", placeholder: "Synonyms (comma-separated)" },
                    { name: "parent_id", type: "text", placeholder: "Parent Nutrient ID (UUID)" },
                    { name: "eu_reference_intake_value", type: "number", placeholder: "EU RI Value (e.g. 800,0)" },
                    { name: "sort_order", type: "number", placeholder: "Sort Order (e.g. 10)" },
                    { name: "definition_source", type: "text", placeholder: "Definition Source" },
                    // Textarea might need special handling or separate component
                    // { name: "description", type: "textarea", placeholder: "Description" },
                    // { name: "conversion_factors", type: "textarea", placeholder: "Conversion Factors (JSON format)" },
                ]}
                state={nutritionForm}
                 // Only pass relevant part of state if SimpleForm isn't aware of all keys
                 // setState function needs careful handling if SimpleForm doesn't use names directly
                setState={(update) => setNutritionForm(prev => ({ ...prev, ...update }))}
                // Remove submit handlers from SimpleForm if outer form handles it
                onAdd={() => {}} // No-op if outer form handles
                onEdit={() => {}} // No-op if outer form handles
                addLabel="" // Hide SimpleForm button
                editLabel="" // Hide SimpleForm button
                isEditMode={!!currentNutritionId}
            />

             {/* --- Custom Inputs for Selects, Textareas, Checkboxes --- */}
             {/* Example using CSS Grid for layout (requires setup) or just stack them */}
             <div className="custom-form-grid" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

                {/* Selects for Enums */}
                <div>
                    <label htmlFor="storage_unit">Storage Unit*:</label>
                    <select id="storage_unit" name="storage_unit" value={nutritionForm.storage_unit} onChange={handleFormChange} required>
                        <option value="" disabled>Select Unit</option>
                        {getEnumValues(MeasurementUnit).map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="category">Category*:</label>
                    <select id="category" name="category" value={nutritionForm.category} onChange={handleFormChange} required>
                         <option value="" disabled>Select Category</option>
                         {getEnumValues(NutrientCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div>
                     <label htmlFor="status">Status:</label>
                     <select id="status" name="status" value={nutritionForm.status} onChange={handleFormChange}>
                         {getEnumValues(NutrientStatus).map(stat => <option key={stat} value={stat}>{stat}</option>)}
                     </select>
                 </div>
                 <div>
                     <label htmlFor="preferred_display_unit">Preferred Display Unit:</label>
                     <select id="preferred_display_unit" name="preferred_display_unit" value={nutritionForm.preferred_display_unit} onChange={handleFormChange}>
                          <option value="">Default (same as storage)</option>
                         {getEnumValues(MeasurementUnit).map(unit => <option key={unit} value={unit}>{unit}</option>)}
                     </select>
                 </div>
                 <div>
                     <label htmlFor="amino_acid_type">Amino Acid Type:</label>
                     <select id="amino_acid_type" name="amino_acid_type" value={nutritionForm.amino_acid_type} onChange={handleFormChange}>
                          <option value="">Not Applicable</option>
                         {getEnumValues(AminoAcidType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>
                 <div>
                     <label htmlFor="vitamin_solubility">Vitamin Solubility:</label>
                     <select id="vitamin_solubility" name="vitamin_solubility" value={nutritionForm.vitamin_solubility} onChange={handleFormChange}>
                          <option value="">Not Applicable</option>
                         {getEnumValues(VitaminSolubility).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>
                 <div>
                     <label htmlFor="fatty_acid_saturation">Fatty Acid Saturation:</label>
                     <select id="fatty_acid_saturation" name="fatty_acid_saturation" value={nutritionForm.fatty_acid_saturation} onChange={handleFormChange}>
                          <option value="">Not Applicable</option>
                         {getEnumValues(FattyAcidSaturation).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>
                 <div>
                     <label htmlFor="sterol_type">Sterol Type:</label>
                     <select id="sterol_type" name="sterol_type" value={nutritionForm.sterol_type} onChange={handleFormChange}>
                           <option value="">Not Applicable</option>
                          {getEnumValues(SterolType).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                 </div>
                <div>
                     <label htmlFor="eu_reference_intake_unit">EU RI Unit:</label>
                     <select id="eu_reference_intake_unit" name="eu_reference_intake_unit" value={nutritionForm.eu_reference_intake_unit} onChange={handleFormChange}>
                           <option value="">Not Applicable</option>
                          {getEnumValues(MeasurementUnit).map(unit => <option key={unit} value={unit}>{unit}</option>)}
                     </select>
                 </div>

                 {/* Textareas */}
                 <div style={{ gridColumn: 'span 2' }}> {/* Example spanning two columns */}
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" name="description" value={nutritionForm.description} onChange={handleFormChange} rows={3}></textarea>
                 </div>
                 <div style={{ gridColumn: 'span 2' }}>
                     <label htmlFor="conversion_factors">Conversion Factors (JSON):</label>
                     <textarea id="conversion_factors" name="conversion_factors" value={nutritionForm.conversion_factors} onChange={handleFormChange} rows={3} placeholder='e.g., {"IU_to_mcg_RAE": 0.3}'></textarea>
                 </div>


                 {/* Checkboxes for Booleans */}
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="is_essential" name="is_essential" checked={!!nutritionForm.is_essential} onChange={handleFormChange} />
                    <label htmlFor="is_essential">Is Essential?</label>
                 </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <input type="checkbox" id="is_sugar" name="is_sugar" checked={!!nutritionForm.is_sugar} onChange={handleFormChange} />
                     <label htmlFor="is_sugar">Is Sugar?</label>
                 </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <input type="checkbox" id="is_fiber" name="is_fiber" checked={!!nutritionForm.is_fiber} onChange={handleFormChange} />
                     <label htmlFor="is_fiber">Is Fiber?</label>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <input type="checkbox" id="is_eu_mandatory_nutrient" name="is_eu_mandatory_nutrient" checked={!!nutritionForm.is_eu_mandatory_nutrient} onChange={handleFormChange} />
                     <label htmlFor="is_eu_mandatory_nutrient">EU Mandatory?</label>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <input type="checkbox" id="is_eu_reference_intake_nutrient" name="is_eu_reference_intake_nutrient" checked={!!nutritionForm.is_eu_reference_intake_nutrient} onChange={handleFormChange} />
                     <label htmlFor="is_eu_reference_intake_nutrient">Has EU RI?</label>
                 </div>
             </div>

             {/* Submit Button for the outer form */}
             <button type="submit" className="your-main-submit-button-styles" style={{ marginTop: '1rem' }}>
                 {currentNutritionId ? "Update Nutrition" : "Add Nutrition"}
             </button>
         </form>


      <SimpleTable
        title="Nutrition List"
        columns={["Name", "Unit", "Category", "Status", "Subtype"]} // Expanded columns
        data={nutritions.map((n) => ({
          id: n.nutrient_id,
          values: [
            n.name,
            n.storage_unit,
            n.category,
            n.status,
            n.subtype ?? "N/A", // Display subtype or N/A
          ],
        }))}
        totalItems={totalNutritions}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        selectedRowId={selectedRowId}
        onRowClick={(item) => {
          const selectedNutrition = nutritions.find((n) => n.nutrient_id === item.id);
          if (selectedNutrition) { handleRowClick(selectedNutrition); }
        }}
        // If SimpleTable supports delete action:
        // onDeleteClick={handleDelete} // Pass handler
      />
    </ManagementContainer>
  );
};

export default NutritionManagement;