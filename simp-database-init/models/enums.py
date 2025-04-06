# models/enums.py
import enum

# Central place for defining Enum types used across models

class SexEnum(enum.Enum):
    MALE = 'Male'
    FEMALE = 'Female'
    ANY = 'Any' # Use when recommendation doesn't differ by sex

class LifeStageEnum(enum.Enum):
    INFANT_0_6 = 'Infant 0-6 months'
    INFANT_7_12 = 'Infant 7-12 months'
    CHILD_1_3 = 'Child 1-3 years'
    CHILD_4_8 = 'Child 4-8 years'
    MALE_9_13 = 'Male 9-13 years'
    FEMALE_9_13 = 'Female 9-13 years'
    MALE_14_18 = 'Male 14-18 years'
    FEMALE_14_18 = 'Female 14-18 years'
    MALE_19_30 = 'Male 19-30 years'
    FEMALE_19_30 = 'Female 19-30 years'
    MALE_31_50 = 'Male 31-50 years'
    FEMALE_31_50 = 'Female 31-50 years'
    MALE_51_70 = 'Male 51-70 years'
    FEMALE_51_70 = 'Female 51-70 years'
    MALE_71_PLUS = 'Male 71+ years'
    FEMALE_71_PLUS = 'Female 71+ years'
    PREGNANT_14_18 = 'Pregnant 14-18 years'
    PREGNANT_19_30 = 'Pregnant 19-30 years'
    PREGNANT_31_50 = 'Pregnant 31-50 years'
    LACTATING_14_18 = 'Lactating 14-18 years'
    LACTATING_19_30 = 'Lactating 19-30 years'
    LACTATING_31_50 = 'Lactating 31-50 years'
    ANY = 'Any' # Use when recommendation applies broadly

class RecommendationTypeEnum(enum.Enum):
    RDA = 'Recommended Dietary Allowance' # Goal for individuals
    AI = 'Adequate Intake' # Used when RDA cannot be determined
    UL = 'Tolerable Upper Intake Level' # Max intake unlikely to cause adverse effects
    EAR = 'Estimated Average Requirement' # Requirement for 50% of the group (used for assessing group intakes)
    AMDR = 'Acceptable Macronutrient Distribution Range' # % of energy intake

    # --- New Enums ---
class EvidenceLevelEnum(enum.Enum):
    """ Represents the quality or strength of evidence supporting a recommendation """
    GRADE_HIGH = 'High (GRADE)'
    GRADE_MODERATE = 'Moderate (GRADE)'
    GRADE_LOW = 'Low (GRADE)'
    GRADE_VERY_LOW = 'Very Low (GRADE)'
    EXPERT_OPINION = 'Expert Opinion'
    NOT_ASSESSED = 'Not Assessed'
    OTHER = 'Other'

class SourceTypeEnum(enum.Enum):
    """ Type of the source document """
    PUBLICATION = 'Peer-reviewed Publication'
    GUIDELINE = 'Official Guideline Document'
    DATABASE = 'Nutrient Database Source'
    WEBSITE = 'Reputable Website/Fact Sheet'
    REPORT = 'Technical Report'
    OTHER = 'Other'

class UnitNameEnum(enum.Enum):
    """ Defines standard units using full names. """
    GRAM = "gram"
    MILLIGRAM = "milligram"
    MICROGRAM = "microgram"
    KILOCALORIE = "kilocalorie"
    KILOJOULE = "kilojoule"
    MILLILITER = "milliliter"
    PERCENT = "percent"
    INTERNATIONAL_UNIT = "international unit"
    
class DietLevelEnum(enum.Enum):
    """ Defines diet classification levels. """
    VEGAN = 1
    VEGETARIAN = 2
    PESCATARIAN = 3
    OMNIVORE = 4
