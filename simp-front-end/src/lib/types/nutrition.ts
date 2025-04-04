// src/lib/types/nutrition.ts

import {
  MeasurementUnitEnum,
  NutrientCategoryEnum,
  NutrientStatusEnum,
  AminoAcidTypeEnum,
  VitaminSolubilityEnum,
  FattyAcidSaturationEnum,
  SterolTypeEnum,
} from "@/lib/enums"; // Adjust path if necessary

// --- Main Nutrition Data Type (matches NutritionOut) ---
// (Keep this as it was, it should already include most fields)
export type Nutrition = {
  nutrient_id: string; // UUID
  name: string;
  storage_unit: MeasurementUnitEnum;
  category: NutrientCategoryEnum;
  status: NutrientStatusEnum;

  // Optional fields
  subtype?: string | null;
  description?: string | null;
  preferred_display_unit?: MeasurementUnitEnum | null;
  synonyms?: string[] | null;
  parent_id?: string | null; // UUID
  sort_order: number;
  efsa_id?: string | null;
  usda_nutrient_id?: string | null;
  cas_number?: string | null;
  conversion_factors?: Record<string, any> | null;
  amino_acid_type?: AminoAcidTypeEnum | null;
  vitamin_solubility?: VitaminSolubilityEnum | null;
  fatty_acid_saturation?: FattyAcidSaturationEnum | null;
  sterol_type?: SterolTypeEnum | null;
  is_essential?: boolean | null;
  is_sugar?: boolean | null;
  is_fiber?: boolean | null;
  is_eu_mandatory_nutrient?: boolean | null;
  is_eu_reference_intake_nutrient?: boolean | null;
  eu_reference_intake_value?: number | null; // From Optional[Decimal]
  eu_reference_intake_unit?: MeasurementUnitEnum | null;
  definition_source?: string | null;
};


// --- Payload for Creating (matches NutritionCreate backend schema) ---
export type NutritionCreatePayload = {
  // Required fields
  name: string;
  storage_unit: MeasurementUnitEnum;
  category: NutrientCategoryEnum;

  // --- ADD ALL OPTIONAL FIELDS handled by prepareApiPayload ---
  subtype?: string | null;
  efsa_id?: string | null;
  usda_nutrient_id?: string | null;
  cas_number?: string | null;
  synonyms?: string[] | null; // Expecting array from prepareApiPayload
  preferred_display_unit?: MeasurementUnitEnum | null;
  conversion_factors?: Record<string, any> | null; // Expecting object from prepareApiPayload
  amino_acid_type?: AminoAcidTypeEnum | null;
  vitamin_solubility?: VitaminSolubilityEnum | null;
  fatty_acid_saturation?: FattyAcidSaturationEnum | null;
  sterol_type?: SterolTypeEnum | null;
  is_essential?: boolean | null; // Expecting boolean
  is_sugar?: boolean | null; // Expecting boolean
  is_fiber?: boolean | null; // Expecting boolean
  parent_id?: string | null; // UUID string
  is_eu_mandatory_nutrient?: boolean | null; // Expecting boolean
  is_eu_reference_intake_nutrient?: boolean | null; // Expecting boolean
  eu_reference_intake_value?: number | null; // Expecting number
  eu_reference_intake_unit?: MeasurementUnitEnum | null;
  sort_order?: number | null; // Expecting number
  definition_source?: string | null;
  status?: NutrientStatusEnum | null;
  description?: string | null;
};

// --- Payload for Updating (matches NutritionUpdate backend schema) ---
// (All fields are optional)
export type NutritionUpdatePayload = {
  name?: string;
  storage_unit?: MeasurementUnitEnum | null;
  category?: NutrientCategoryEnum | null;

  // --- ADD ALL OPTIONAL FIELDS handled by prepareApiPayload ---
  subtype?: string | null;
  efsa_id?: string | null;
  usda_nutrient_id?: string | null;
  cas_number?: string | null;
  synonyms?: string[] | null; // Expecting array from prepareApiPayload
  preferred_display_unit?: MeasurementUnitEnum | null;
  conversion_factors?: Record<string, any> | null; // Expecting object from prepareApiPayload
  amino_acid_type?: AminoAcidTypeEnum | null;
  vitamin_solubility?: VitaminSolubilityEnum | null;
  fatty_acid_saturation?: FattyAcidSaturationEnum | null;
  sterol_type?: SterolTypeEnum | null;
  is_essential?: boolean | null; // Expecting boolean
  is_sugar?: boolean | null; // Expecting boolean
  is_fiber?: boolean | null; // Expecting boolean
  parent_id?: string | null; // UUID string
  is_eu_mandatory_nutrient?: boolean | null; // Expecting boolean
  is_eu_reference_intake_nutrient?: boolean | null; // Expecting boolean
  eu_reference_intake_value?: number | null; // Expecting number
  eu_reference_intake_unit?: MeasurementUnitEnum | null;
  sort_order?: number | null; // Expecting number
  definition_source?: string | null;
  status?: NutrientStatusEnum | null;
  description?: string | null;
};