// src/lib/enums.ts

// -------------------------
// Measurement Units
// -------------------------
export const MeasurementUnit = {
    GRAM: "GRAM",
    MILLILITER: "MILLILITER",
    LITER: "LITER",
    KILOGRAM: "KILOGRAM",
    PIECE: "PIECE",
    TEASPOON: "TEASPOON",
    TABLESPOON: "TABLESPOON",
    CUP: "CUP",
    OUNCE: "OUNCE",
    POUND: "POUND",
    MILLIGRAM: "MILLIGRAM",
    MICROGRAM: "MICROGRAM", // Represents micrograms
    IU: "IU", // International Units
    KCAL: "KCAL", // Kilocalories (often used like a unit)
} as const;

// Type representing the possible string values for MeasurementUnit
export type MeasurementUnitEnum = typeof MeasurementUnit[keyof typeof MeasurementUnit];

// -------------------------
// User Roles
// -------------------------
export const UserRole = {
    USER: "USER",
    ADMIN: "ADMIN",
    MODERATOR: "MODERATOR",
} as const;

export type UserRoleEnum = typeof UserRole[keyof typeof UserRole];

// -------------------------
// Nutrient Classification
// -------------------------
export const NutrientCategory = {
    MACRONUTRIENT: "Macronutrient",
    MICRONUTRIENT: "Micronutrient",
    BIOACTIVE_COMPOUND: "Bioactive Compound",
    WATER: "Water",
} as const;

export type NutrientCategoryEnum = typeof NutrientCategory[keyof typeof NutrientCategory];

export const VitaminSolubility = {
    FAT_SOLUBLE: "Fat-Soluble",
    WATER_SOLUBLE: "Water-Soluble",
} as const;

export type VitaminSolubilityEnum = typeof VitaminSolubility[keyof typeof VitaminSolubility];

export const AminoAcidType = {
    ESSENTIAL: "Essential",
    NON_ESSENTIAL: "Non-Essential",
    CONDITIONAL: "Conditional Essential",
} as const;

export type AminoAcidTypeEnum = typeof AminoAcidType[keyof typeof AminoAcidType];

export const FattyAcidSaturation = {
    SATURATED: "Saturated",
    MONOUNSATURATED: "Monounsaturated",
    POLYUNSATURATED: "Polyunsaturated",
    TRANS: "Trans",
} as const;

export type FattyAcidSaturationEnum = typeof FattyAcidSaturation[keyof typeof FattyAcidSaturation];

export const SterolType = {
    ANIMAL: "Animal",
    PLANT: "Plant",
    FUNGAL: "Fungal",
} as const;

export type SterolTypeEnum = typeof SterolType[keyof typeof SterolType];

// -------------------------
// Nutrient Management
// -------------------------
export const NutrientStatus = {
    ACTIVE: "Active",
    ARCHIVED: "Archived",
    DRAFT: "Draft",
} as const;

export type NutrientStatusEnum = typeof NutrientStatus[keyof typeof NutrientStatus];

// -------------------------
// Population Groups (for DRVs)
// -------------------------
export const PopulationGroupSex = {
    MALE: "Male",
    FEMALE: "Female",
    ANY: "Any",
} as const;

export type PopulationGroupSexEnum = typeof PopulationGroupSex[keyof typeof PopulationGroupSex];

export const PopulationGroupLifeStage = {
    INFANT: "Infant",
    TODDLER: "Toddler",
    CHILD: "Child",
    ADOLESCENT: "Adolescent",
    ADULT: "Adult",
    ELDERLY: "Elderly",
    PREGNANT: "Pregnant",
    LACTATING: "Lactating",
} as const;

export type PopulationGroupLifeStageEnum = typeof PopulationGroupLifeStage[keyof typeof PopulationGroupLifeStage];


export function getEnumValues<T extends Record<string, string>>(obj: T): T[keyof T][] {
    return Object.values(obj) as Array<T[keyof T]>;
}