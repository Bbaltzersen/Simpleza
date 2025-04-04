# --- Imports ---
import uuid
import enum
from sqlalchemy import (
    Table, Column, ForeignKey, Numeric, Integer, String, Text, Boolean,
    TIMESTAMP, Enum as SQLAlchemyEnum, Index, UniqueConstraint
)
# Import ARRAY and JSONB for PostgreSQL specific types
from sqlalchemy.dialects.postgresql import UUID, TEXT, TSVECTOR, VARCHAR, ARRAY, JSONB
from sqlalchemy.orm import relationship, declarative_base, declared_attr
from sqlalchemy.sql import func

# --- Base Class (Handles table naming: singular Class -> plural table) ---
class Base:
    @declared_attr
    def __tablename__(cls):
        import re
        name = cls.__name__
        # Handle specific edge cases first if needed
        if name == 'Density':
            return 'densities'
        if name == 'Company':
             return 'companies'
        # General pluralization
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        name = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
        if name.endswith('y'):
             name = name[:-1] + 'ies'
        elif not name.endswith('s'):
            name += 's'
        return name

Base = declarative_base(cls=Base)

# --- Enums (Expanded) ---
class MeasurementUnitEnum(enum.Enum):
    GRAM = "g"
    MILLILITER = "ml"
    LITER = "l"
    KILOGRAM = "kg"
    PIECE = "piece"
    TEASPOON = "tsp"
    TABLESPOON = "tbsp"
    CUP = "cup"
    OUNCE = "oz"
    POUND = "lb"
    MILLIGRAM = "mg"
    MICROGRAM = "µg" # Represents micrograms
    IU = "IU" # International Units
    KCAL = "kcal" # Kilocalories

class UserRoleEnum(enum.Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class NutrientCategoryEnum(enum.Enum):
    MACRONUTRIENT = "Macronutrient"
    MICRONUTRIENT = "Micronutrient"
    BIOACTIVE_COMPOUND = "Bioactive Compound"
    WATER = "Water"

class VitaminSolubilityEnum(enum.Enum):
    FAT_SOLUBLE = "Fat-Soluble"
    WATER_SOLUBLE = "Water-Soluble"

class AminoAcidTypeEnum(enum.Enum):
    ESSENTIAL = "Essential"
    NON_ESSENTIAL = "Non-Essential"
    CONDITIONAL = "Conditional Essential"

class FattyAcidSaturationEnum(enum.Enum):
    SATURATED = "Saturated"
    MONOUNSATURATED = "Monounsaturated"
    POLYUNSATURATED = "Polyunsaturated"
    TRANS = "Trans"

class SterolTypeEnum(enum.Enum):
    ANIMAL = "Animal"
    PLANT = "Plant"
    FUNGAL = "Fungal"

# New Enums
class NutrientStatusEnum(enum.Enum):
    ACTIVE = "Active"
    ARCHIVED = "Archived"
    DRAFT = "Draft"

class PopulationGroupSexEnum(enum.Enum):
    MALE = "Male"
    FEMALE = "Female"
    ANY = "Any"

class PopulationGroupLifeStageEnum(enum.Enum):
    INFANT = "Infant"
    TODDLER = "Toddler"
    CHILD = "Child"
    ADOLESCENT = "Adolescent"
    ADULT = "Adult"
    ELDERLY = "Elderly"
    PREGNANT = "Pregnant"
    LACTATING = "Lactating"


# --- Models (Alphabetical Order, Final Optimized Version with DRV Tables) ---

class ApproximateMeasurement(Base):
    # __tablename__ = 'approximate_measurements'
    approximation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), nullable=False, index=True)
    measurement_type = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_approx"), nullable=False)
    value = Column(Numeric(10, 3), nullable=False)
    equivalent_in_grams = Column(Numeric(10, 3), nullable=False)

    ingredient = relationship("Ingredient")


class Cauldron(Base):
    # __tablename__ = 'cauldrons'
    cauldron_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False, index=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="RESTRICT"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="cauldrons")
    recipe = relationship("Recipe", back_populates="cauldrons")
    metrics = relationship("CauldronMetric", uselist=False, back_populates="cauldron", cascade="all, delete-orphan")
    # usage_logs = relationship("CauldronUsageLog", back_populates="cauldron", cascade="all, delete-orphan")


class CauldronMetric(Base):
    # __tablename__ = 'cauldron_metrics'
    cauldron_metric_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cauldron_id = Column(UUID(as_uuid=True), ForeignKey("cauldrons.cauldron_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    usage_count = Column(Integer, default=0, nullable=False)
    last_used_at = Column(TIMESTAMP(timezone=True), nullable=True)
    overall_rating = Column(Numeric(3, 2), nullable=True)
    taste_rating = Column(Numeric(3, 2), nullable=True)
    ease_rating = Column(Numeric(3, 2), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    cauldron = relationship("Cauldron", back_populates="metrics")


class Company(Base):
    # __tablename__ = 'companies'
    company_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)

    products = relationship("ProductCompany", back_populates="company")


class Density(Base):
    # __tablename__ = 'densities'
    density_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    density_g_ml = Column(Numeric(10, 4), nullable=False)

    ingredient = relationship("Ingredient", back_populates="density")


# *** NEW: Dietary Reference Value Table ***
class DietaryReferenceValue(Base):
    # __tablename__ = 'dietary_reference_values'
    drv_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) # Use UUID for consistency
    nutrient_id = Column(UUID(as_uuid=True), ForeignKey("nutrients.nutrient_id", ondelete="CASCADE"), nullable=False, index=True)
    population_group_id = Column(UUID(as_uuid=True), ForeignKey("population_groups.population_group_id", ondelete="CASCADE"), nullable=False, index=True)
    # Dietary Reference Intakes (DRIs) / Valor de Referencia de Nutriente (VRN)
    ear = Column(Numeric(14, 6), nullable=True) # Estimated Average Requirement
    ar = Column(Numeric(14, 6), nullable=True) # Average Requirement (EFSA term for EAR)
    pri = Column(Numeric(14, 6), nullable=True) # Population Reference Intake (EFSA term for RDA)
    rda = Column(Numeric(14, 6), nullable=True) # Recommended Dietary Allowance (US term)
    ai = Column(Numeric(14, 6), nullable=True) # Adequate Intake
    ul = Column(Numeric(14, 6), nullable=True) # Tolerable Upper Intake Level
    reference_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_drv"), nullable=False)
    notes = Column(TEXT, nullable=True) # e.g., specific conditions, source details

    # Relationships
    nutrient = relationship("Nutrient", back_populates="reference_values")
    population_group = relationship("PopulationGroup", back_populates="reference_values")

    # Ensure only one set of DRVs per nutrient/population group
    __table_args__ = (
        UniqueConstraint('nutrient_id', 'population_group_id', name='uq_nutrient_population_drv'),
    )


class Ingredient(Base):
    # __tablename__ = 'ingredients'
    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    name_tsv = Column(TSVECTOR)
    default_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_ingr"), nullable=False, default=MeasurementUnitEnum.GRAM)
    calories_per_100g = Column(Numeric(10, 2), nullable=True)
    validated = Column(Boolean, nullable=False, default=False, index=True)
    # diet_level = Column(Integer, nullable=False, default=4) # Kept if needed

    __table_args__ = (
        Index("idx_ingredient_name_tsv", "name_tsv", postgresql_using="gin"),
    )

    # Relationships
    nutrition_values = relationship("IngredientNutritionValue", back_populates="ingredient", cascade="all, delete-orphan", lazy="select")
    products = relationship("IngredientProduct", back_populates="ingredient", cascade="all, delete-orphan")
    recipe_associations = relationship("RecipeIngredient", back_populates="ingredient")
    density = relationship("Density", uselist=False, back_populates="ingredient", cascade="all, delete-orphan")
    # approx_measurements = relationship("ApproximateMeasurement", back_populates="ingredient")


class IngredientNutritionValue(Base):
    # __tablename__ = 'ingredient_nutrition_values'
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), primary_key=True)
    nutrient_id = Column(UUID(as_uuid=True), ForeignKey("nutrients.nutrient_id", ondelete="RESTRICT"), primary_key=True)
    amount_per_100g = Column(Numeric(16, 6), nullable=False)

    # Relationships
    ingredient = relationship("Ingredient", back_populates="nutrition_values", lazy="select")
    nutrient = relationship("Nutrient", back_populates="ingredient_values", lazy="select")

    __table_args__ = (
        Index("idx_ingredient_nutrient", "ingredient_id", "nutrient_id"),
    )


class IngredientProduct(Base):
    # __tablename__ = 'ingredient_products'
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)

    ingredient = relationship("Ingredient", back_populates="products")
    product = relationship("Product", back_populates="ingredients")


class Nutrient(Base):
    # __tablename__ = 'nutrients'
    nutrient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    # *** UPDATED ATTRIBUTES ***
    # Identification & Standardization
    efsa_id = Column(VARCHAR(50), nullable=True, index=True) # EFSA specific ID if available
    usda_nutrient_id = Column(VARCHAR(50), nullable=True, index=True) # USDA ID if available
    cas_number = Column(VARCHAR(20), nullable=True, index=True)
    synonyms = Column(ARRAY(TEXT), nullable=True) # PostgreSQL array for alternative names
    # Unit Handling
    storage_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_nutr"), nullable=False) # Unit stored in IngredientNutritionValue
    preferred_display_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_nutr_disp"), nullable=True) # Optional different unit for display
    conversion_factors = Column(JSONB, nullable=True) # Store conversion rules (e.g., for vitamins A, D, Niacin, Folate)
    # Type and Metadata
    category = Column(SQLAlchemyEnum(NutrientCategoryEnum, name="nutrient_category_enum"), nullable=False, index=True)
    subtype = Column(TEXT, nullable=True, index=True)
    amino_acid_type = Column(SQLAlchemyEnum(AminoAcidTypeEnum, name="amino_acid_type_enum"), nullable=True)
    vitamin_solubility = Column(SQLAlchemyEnum(VitaminSolubilityEnum, name="vitamin_solubility_enum"), nullable=True)
    fatty_acid_saturation = Column(SQLAlchemyEnum(FattyAcidSaturationEnum, name="fatty_acid_saturation_enum"), nullable=True)
    sterol_type = Column(SQLAlchemyEnum(SterolTypeEnum, name="sterol_type_enum"), nullable=True)
    is_essential = Column(Boolean, nullable=True)
    is_sugar = Column(Boolean, nullable=True)
    is_fiber = Column(Boolean, nullable=True)
    # Hierarchy
    parent_id = Column(UUID(as_uuid=True), ForeignKey("nutrients.nutrient_id", ondelete="SET NULL"), nullable=True, index=True)
    # Labeling (EU Specific)
    is_eu_mandatory_nutrient = Column(Boolean, nullable=True, default=False)
    is_eu_reference_intake_nutrient = Column(Boolean, nullable=True, default=False)
    eu_reference_intake_value = Column(Numeric(14, 6), nullable=True) # Value for 100% RI
    eu_reference_intake_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_nutr_ri"), nullable=True) # Unit for RI value
    # Management & Display
    sort_order = Column(Integer, nullable=False, default=0, index=True) # Control display order
    definition_source = Column(TEXT, nullable=True) # Source of this nutrient's definition/metadata
    status = Column(SQLAlchemyEnum(NutrientStatusEnum, name="nutrient_status_enum"), nullable=False, default=NutrientStatusEnum.ACTIVE, index=True)
    description = Column(TEXT, nullable=True) # General description

    # *** REMOVED recommended_daily_value ***

    # Relationships
    parent = relationship("Nutrient", remote_side=[nutrient_id], back_populates="children", lazy="select")
    children = relationship("Nutrient", back_populates="parent", cascade="all, delete-orphan")
    ingredient_values = relationship("IngredientNutritionValue", back_populates="nutrient")
    # Link to the new DRV table
    reference_values = relationship("DietaryReferenceValue", back_populates="nutrient", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Nutrient(name='{self.name}', category='{self.category.value if self.category else None}', status='{self.status.value}')>"


# *** NEW: Population Group Table ***
class PopulationGroup(Base):
    # __tablename__ = 'population_groups'
    population_group_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(TEXT, nullable=False, unique=True) # e.g., "EFSA Adult Male 19-64"
    source_authority = Column(VARCHAR(50), nullable=False, index=True) # e.g., "EFSA", "AESAN", "US_DRI"
    region = Column(VARCHAR(50), nullable=True, index=True) # e.g., "EU", "Spain", "US"
    age_min_months = Column(Integer, nullable=True)
    age_max_months = Column(Integer, nullable=True)
    sex = Column(SQLAlchemyEnum(PopulationGroupSexEnum, name="population_group_sex_enum"), nullable=False, default=PopulationGroupSexEnum.ANY)
    life_stage = Column(SQLAlchemyEnum(PopulationGroupLifeStageEnum, name="population_group_life_stage_enum"), nullable=True)

    # Relationship back to DRVs
    reference_values = relationship("DietaryReferenceValue", back_populates="population_group", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PopulationGroup(description='{self.description}', source='{self.source_authority}')>"


class Product(Base):
    # __tablename__ = 'products'
    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    retail_id = Column(VARCHAR(255), nullable=True, index=True)
    src_product_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    english_name = Column(TEXT, nullable=False)
    spanish_name = Column(TEXT, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False, default=1)
    weight = Column(Numeric(10, 2), nullable=True)
    measurement = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_prod"), nullable=True)

    ingredients = relationship("IngredientProduct", back_populates="product", cascade="all, delete-orphan")
    companies = relationship("ProductCompany", back_populates="product", cascade="all, delete-orphan")


class ProductCompany(Base):
    # __tablename__ = 'product_companies'
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"), primary_key=True)
    price = Column(Numeric(10, 2), nullable=True)

    product = relationship("Product", back_populates="companies")
    company = relationship("Company", back_populates="products")


class Recipe(Base):
    # __tablename__ = 'recipes'
    recipe_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(TEXT, nullable=False, index=True)
    description = Column(TEXT, nullable=True)
    front_image_url = Column(TEXT, nullable=True)
    # Author handled via RecipeAuthor M2M table
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    validated = Column(Boolean, nullable=False, default=False, index=True)

    # Relationships
    steps = relationship("RecipeStep", back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeStep.step_number", lazy="select")
    images = relationship("RecipeImage", back_populates="recipe", cascade="all, delete-orphan")
    ingredient_associations = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="recipe_tags", back_populates="recipes", lazy="select")
    analytics = relationship("RecipeAnalytic", uselist=False, back_populates="recipe", cascade="all, delete-orphan")
    cauldrons = relationship("Cauldron", back_populates="recipe")
    favorited_by_users = relationship("RecipeFavorite", back_populates="recipe", cascade="all, delete-orphan")
    author_associations = relationship("RecipeAuthor", back_populates="recipe", cascade="all, delete-orphan") # Link to join table


class RecipeAnalytic(Base):
    # __tablename__ = 'recipe_analytics'
    recipe_analytic_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    minimum_price = Column(Numeric(10, 2), nullable=True)
    total_calories = Column(Numeric(10, 2), nullable=True)
    prep_time_minutes = Column(Integer, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    total_time_minutes = Column(Integer, nullable=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    recipe = relationship("Recipe", back_populates="analytics")


class RecipeAuthor(Base):
    # __tablename__ = 'recipe_authors'
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    recipe = relationship("Recipe", back_populates="author_associations")
    user = relationship("User", back_populates="recipe_associations")


class RecipeFavorite(Base):
    # __tablename__ = 'recipe_favorites'
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    favorited_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="favorites")
    recipe = relationship("Recipe", back_populates="favorited_by_users")


class RecipeImage(Base):
    # __tablename__ = 'recipe_images'
    image_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(TEXT, nullable=False, unique=True)
    caption = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    recipe = relationship("Recipe", back_populates="images")


class RecipeIngredient(Base):
    # __tablename__ = 'recipe_ingredients'
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="RESTRICT"), primary_key=True)
    amount = Column(Numeric(10, 2), nullable=False)
    measurement = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_recipe"), nullable=False)
    position = Column(Integer, nullable=False)
    notes = Column(TEXT, nullable=True)

    recipe = relationship("Recipe", back_populates="ingredient_associations")
    ingredient = relationship("Ingredient", back_populates="recipe_associations")

    __table_args__ = (
        Index("idx_recipe_ingredient_position", "recipe_id", "position"),
    )


class RecipeStep(Base):
    # __tablename__ = 'recipe_steps'
    step_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True) # Time for this step
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    recipe = relationship("Recipe", back_populates="steps")

    __table_args__ = (
        Index("idx_recipe_step_number", "recipe_id", "step_number", unique=True),
    )


# Association Table for Recipe Tags (Many-to-Many)
RecipeTag = Table(
    "recipe_tags",
    Base.metadata,
    Column("recipe_id", UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.tag_id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    # __tablename__ = 'tags'
    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    name_tsv = Column(TSVECTOR)
    description = Column(TEXT, nullable=True)

    recipes = relationship("Recipe", secondary=RecipeTag, back_populates="tags")

    __table_args__ = (
        Index("idx_tag_name_tsv", "name_tsv", postgresql_using="gin"),
    )


class User(Base):
    # __tablename__ = 'users'
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLAlchemyEnum(UserRoleEnum, name="user_role_enum"), default=UserRoleEnum.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    recipe_associations = relationship("RecipeAuthor", back_populates="user")
    favorites = relationship("RecipeFavorite", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    cauldrons = relationship("Cauldron", back_populates="user")


class UserPreference(Base):
    # __tablename__ = 'user_preferences'
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    preference_key = Column(String(100), nullable=False, primary_key=True)
    preference_value = Column(TEXT, nullable=False) # Consider JSONB

    user = relationship("User", back_populates="preferences")