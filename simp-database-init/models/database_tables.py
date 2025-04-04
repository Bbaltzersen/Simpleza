# models/database_tables.py
# Final version using VARCHAR storage via native_enum=False, length, AND values_callable

# --- Imports ---
import uuid
import enum
from sqlalchemy import (
    Table, Column, ForeignKey, Numeric, Integer, String, Text, Boolean,
    TIMESTAMP, Enum as SQLAlchemyEnum, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, TEXT, TSVECTOR, VARCHAR, ARRAY, JSONB
from sqlalchemy.orm import relationship, declarative_base, declared_attr
from sqlalchemy.sql import func

# --- Base Class ---
class Base:
    @declared_attr
    def __tablename__(cls):
        import re
        name = cls.__name__
        if name == 'Density': return 'densities'
        if name == 'Company': return 'companies'
        name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        name = re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()
        if name.endswith('y'): name = name[:-1] + 'ies'
        elif not name.endswith('s'): name += 's'
        return name

Base = declarative_base(cls=Base)

# --- Enums (Python Definitions) ---
# (These remain unchanged)
class MeasurementUnitEnum(enum.Enum):
    GRAM = "g"; MILLILITER = "ml"; LITER = "l"; KILOGRAM = "kg"; PIECE = "piece"
    TEASPOON = "tsp"; TABLESPOON = "tbsp"; CUP = "cup"; OUNCE = "oz"; POUND = "lb"
    MILLIGRAM = "mg"; MICROGRAM = "µg"; IU = "IU"; KCAL = "kcal"

class UserRoleEnum(enum.Enum):
    USER = "user"; ADMIN = "admin"; MODERATOR = "moderator"

class NutrientCategoryEnum(enum.Enum):
    MACRONUTRIENT = "Macronutrient"; MICRONUTRIENT = "Micronutrient"
    BIOACTIVE_COMPOUND = "Bioactive Compound"; WATER = "Water"

class VitaminSolubilityEnum(enum.Enum):
    FAT_SOLUBLE = "Fat-Soluble"; WATER_SOLUBLE = "Water-Soluble"

class AminoAcidTypeEnum(enum.Enum):
    ESSENTIAL = "Essential"; NON_ESSENTIAL = "Non-Essential"; CONDITIONAL = "Conditional Essential"

class FattyAcidSaturationEnum(enum.Enum):
    SATURATED = "Saturated"; MONOUNSATURATED = "Monounsaturated"; POLYUNSATURATED = "Polyunsaturated"; TRANS = "Trans"

class SterolTypeEnum(enum.Enum):
    ANIMAL = "Animal"; PLANT = "Plant"; FUNGAL = "Fungal"

class NutrientStatusEnum(enum.Enum):
    ACTIVE = "Active"; ARCHIVED = "Archived"; DRAFT = "Draft"

class PopulationGroupSexEnum(enum.Enum):
    MALE = "Male"; FEMALE = "Female"; ANY = "Any"

class PopulationGroupLifeStageEnum(enum.Enum):
    INFANT = "Infant"; TODDLER = "Toddler"; CHILD = "Child"; ADOLESCENT = "Adolescent"
    ADULT = "Adult"; ELDERLY = "Elderly"; PREGNANT = "Pregnant"; LACTATING = "Lactating"

# --- Callable for Enum values ---
enum_values = lambda x: [e.value for e in x]

# --- Models (Alphabetical Order, with native_enum=False, length, values_callable) ---

class ApproximateMeasurement(Base):
    approximation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), nullable=False, index=True)
    measurement_type = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_approx", native_enum=False, length=15, values_callable=enum_values), nullable=False)
    value = Column(Numeric(10, 3), nullable=False)
    equivalent_in_grams = Column(Numeric(10, 3), nullable=False)
    ingredient = relationship("Ingredient")

class Cauldron(Base):
    cauldron_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False, index=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="RESTRICT"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user = relationship("User", back_populates="cauldrons")
    recipe = relationship("Recipe", back_populates="cauldrons")
    metrics = relationship("CauldronMetric", uselist=False, back_populates="cauldron", cascade="all, delete-orphan")

class CauldronMetric(Base):
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
    company_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    products = relationship("ProductCompany", back_populates="company")

class Density(Base):
    density_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    density_g_ml = Column(Numeric(10, 4), nullable=False)
    ingredient = relationship("Ingredient", back_populates="density")

class DietaryReferenceValue(Base):
    drv_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nutrient_id = Column(UUID(as_uuid=True), ForeignKey("nutrients.nutrient_id", ondelete="CASCADE"), nullable=False, index=True)
    population_group_id = Column(UUID(as_uuid=True), ForeignKey("population_groups.population_group_id", ondelete="CASCADE"), nullable=False, index=True)
    ear = Column(Numeric(14, 6), nullable=True); ar = Column(Numeric(14, 6), nullable=True)
    pri = Column(Numeric(14, 6), nullable=True); rda = Column(Numeric(14, 6), nullable=True)
    ai = Column(Numeric(14, 6), nullable=True); ul = Column(Numeric(14, 6), nullable=True)
    reference_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_drv", native_enum=False, length=15, values_callable=enum_values), nullable=False)
    notes = Column(TEXT, nullable=True)
    nutrient = relationship("Nutrient", back_populates="reference_values")
    population_group = relationship("PopulationGroup", back_populates="reference_values")
    __table_args__ = ( UniqueConstraint('nutrient_id', 'population_group_id', name='uq_nutrient_population_drv'), )

class Ingredient(Base):
    ingredient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    name_tsv = Column(TSVECTOR)
    default_unit = Column(SQLAlchemyEnum(
        MeasurementUnitEnum, name="measurement_unit_enum_ingredient", native_enum=False, length=15, values_callable=enum_values), nullable=False)
    calories_per_100g = Column(Numeric(10, 2), nullable=True)
    validated = Column(Boolean, nullable=False, default=False, index=True)
    diet_level = Column(Integer, nullable=False, default=4)
    __table_args__ = ( Index("idx_ingredient_name_tsv", "name_tsv", postgresql_using="gin"), )
    nutrition_values = relationship("IngredientNutritionValue", back_populates="ingredient", cascade="all, delete-orphan", lazy="select")
    products = relationship("IngredientProduct", back_populates="ingredient", cascade="all, delete-orphan")
    recipe_associations = relationship("RecipeIngredient", back_populates="ingredient")
    density = relationship("Density", uselist=False, back_populates="ingredient", cascade="all, delete-orphan")
    # approximate_measurements = relationship("ApproximateMeasurement", back_populates="ingredient")

class IngredientNutritionValue(Base):
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), primary_key=True)
    nutrient_id = Column(UUID(as_uuid=True), ForeignKey("nutrients.nutrient_id", ondelete="RESTRICT"), primary_key=True)
    amount_per_100g = Column(Numeric(16, 6), nullable=False)
    ingredient = relationship("Ingredient", back_populates="nutrition_values", lazy="select")
    nutrient = relationship("Nutrient", back_populates="ingredient_values", lazy="select")
    __table_args__ = ( Index("idx_ingredient_nutrient", "ingredient_id", "nutrient_id"), )

class IngredientProduct(Base):
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)
    ingredient = relationship("Ingredient", back_populates="products")
    product = relationship("Product", back_populates="ingredients")

class Nutrient(Base):
    nutrient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(TEXT, unique=True, nullable=False, index=True)
    efsa_id = Column(VARCHAR(50), nullable=True, index=True)
    usda_nutrient_id = Column(VARCHAR(50), nullable=True, index=True)
    cas_number = Column(VARCHAR(20), nullable=True, index=True)
    synonyms = Column(ARRAY(TEXT), nullable=True)
    storage_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_nutr", native_enum=False, length=15, values_callable=enum_values), nullable=False)
    preferred_display_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_nutr_disp", native_enum=False, length=15, values_callable=enum_values), nullable=True)
    conversion_factors = Column(JSONB, nullable=True)
    category = Column(SQLAlchemyEnum(NutrientCategoryEnum, name="nutrient_category_enum", native_enum=False, length=25, values_callable=enum_values), nullable=False, index=True)
    subtype = Column(TEXT, nullable=True, index=True)
    amino_acid_type = Column(SQLAlchemyEnum(AminoAcidTypeEnum, name="amino_acid_type_enum", native_enum=False, length=25, values_callable=enum_values), nullable=True)
    vitamin_solubility = Column(SQLAlchemyEnum(VitaminSolubilityEnum, name="vitamin_solubility_enum", native_enum=False, length=20, values_callable=enum_values), nullable=True)
    fatty_acid_saturation = Column(SQLAlchemyEnum(FattyAcidSaturationEnum, name="fatty_acid_saturation_enum", native_enum=False, length=20, values_callable=enum_values), nullable=True)
    sterol_type = Column(SQLAlchemyEnum(SterolTypeEnum, name="sterol_type_enum", native_enum=False, length=10, values_callable=enum_values), nullable=True)
    is_essential = Column(Boolean, nullable=True)
    is_sugar = Column(Boolean, nullable=True)
    is_fiber = Column(Boolean, nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("nutrients.nutrient_id", ondelete="SET NULL"), nullable=True, index=True)
    is_eu_mandatory_nutrient = Column(Boolean, nullable=True, default=False)
    is_eu_reference_intake_nutrient = Column(Boolean, nullable=True, default=False)
    eu_reference_intake_value = Column(Numeric(14, 6), nullable=True)
    eu_reference_intake_unit = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_nutr_ri", native_enum=False, length=15, values_callable=enum_values), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, index=True)
    definition_source = Column(TEXT, nullable=True)
    status = Column(SQLAlchemyEnum(NutrientStatusEnum, name="nutrient_status_enum", native_enum=False, length=10, values_callable=enum_values), nullable=False, default=NutrientStatusEnum.ACTIVE, index=True)
    description = Column(TEXT, nullable=True)
    parent = relationship("Nutrient", remote_side=[nutrient_id], back_populates="children", lazy="select")
    children = relationship("Nutrient", back_populates="parent", cascade="all, delete-orphan")
    ingredient_values = relationship("IngredientNutritionValue", back_populates="nutrient")
    reference_values = relationship("DietaryReferenceValue", back_populates="nutrient", cascade="all, delete-orphan")
    def __repr__(self): return f"<Nutrient(name='{self.name}', category='{self.category.value if self.category else None}', status='{self.status.value}')>"

class PopulationGroup(Base):
    population_group_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    description = Column(TEXT, nullable=False, unique=True)
    source_authority = Column(VARCHAR(50), nullable=False, index=True)
    region = Column(VARCHAR(50), nullable=True, index=True)
    age_min_months = Column(Integer, nullable=True)
    age_max_months = Column(Integer, nullable=True)
    sex = Column(SQLAlchemyEnum(PopulationGroupSexEnum, name="population_group_sex_enum", native_enum=False, length=10, values_callable=enum_values), nullable=False, default=PopulationGroupSexEnum.ANY)
    life_stage = Column(SQLAlchemyEnum(PopulationGroupLifeStageEnum, name="population_group_life_stage_enum", native_enum=False, length=15, values_callable=enum_values), nullable=True)
    reference_values = relationship("DietaryReferenceValue", back_populates="population_group", cascade="all, delete-orphan")
    def __repr__(self): return f"<PopulationGroup(description='{self.description}', source='{self.source_authority}')>"

class Product(Base):
    product_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    retail_id = Column(VARCHAR(255), nullable=True, index=True)
    src_product_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    english_name = Column(TEXT, nullable=False)
    spanish_name = Column(TEXT, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False, default=1)
    weight = Column(Numeric(10, 2), nullable=True)
    measurement = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_prod", native_enum=False, length=15, values_callable=enum_values), nullable=True)
    ingredients = relationship("IngredientProduct", back_populates="product", cascade="all, delete-orphan")
    companies = relationship("ProductCompany", back_populates="product", cascade="all, delete-orphan")

class ProductCompany(Base):
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.company_id", ondelete="CASCADE"), primary_key=True)
    price = Column(Numeric(10, 2), nullable=True)
    product = relationship("Product", back_populates="companies")
    company = relationship("Company", back_populates="products")

class Recipe(Base):
    recipe_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(TEXT, nullable=False, index=True)
    description = Column(TEXT, nullable=True)
    front_image_url = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    validated = Column(Boolean, nullable=False, default=False, index=True)
    steps = relationship("RecipeStep", back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeStep.step_number", lazy="select")
    images = relationship("RecipeImage", back_populates="recipe", cascade="all, delete-orphan")
    ingredient_associations = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="recipe_tags", back_populates="recipes", lazy="select")
    analytics = relationship("RecipeAnalytic", uselist=False, back_populates="recipe", cascade="all, delete-orphan")
    cauldrons = relationship("Cauldron", back_populates="recipe")
    favorited_by_users = relationship("RecipeFavorite", back_populates="recipe", cascade="all, delete-orphan")
    author_associations = relationship("RecipeAuthor", back_populates="recipe", cascade="all, delete-orphan")

class RecipeAnalytic(Base):
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
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    recipe = relationship("Recipe", back_populates="author_associations")
    user = relationship("User", back_populates="recipe_associations")

class RecipeFavorite(Base):
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    favorited_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    user = relationship("User", back_populates="favorites")
    recipe = relationship("Recipe", back_populates="favorited_by_users")

class RecipeImage(Base):
    image_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(TEXT, nullable=False, unique=True)
    caption = Column(TEXT, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    recipe = relationship("Recipe", back_populates="images")

class RecipeIngredient(Base):
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.ingredient_id", ondelete="RESTRICT"), primary_key=True)
    amount = Column(Numeric(10, 2), nullable=False)
    measurement = Column(SQLAlchemyEnum(MeasurementUnitEnum, name="measurement_unit_enum_recipe", native_enum=False, length=15, values_callable=enum_values), nullable=False)
    position = Column(Integer, nullable=False)
    notes = Column(TEXT, nullable=True)
    recipe = relationship("Recipe", back_populates="ingredient_associations")
    ingredient = relationship("Ingredient", back_populates="recipe_associations")
    __table_args__ = ( Index("idx_recipe_ingredient_position", "recipe_id", "position"), )

class RecipeStep(Base):
    step_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id = Column(UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), nullable=False, index=True)
    step_number = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    recipe = relationship("Recipe", back_populates="steps")
    __table_args__ = ( Index("idx_recipe_step_number", "recipe_id", "step_number", unique=True), )

RecipeTag = Table(
    "recipe_tags", Base.metadata,
    Column("recipe_id", UUID(as_uuid=True), ForeignKey("recipes.recipe_id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.tag_id", ondelete="CASCADE"), primary_key=True),
)

class Tag(Base):
    tag_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    name_tsv = Column(TSVECTOR)
    description = Column(TEXT, nullable=True)
    recipes = relationship("Recipe", secondary=RecipeTag, back_populates="tags")
    __table_args__ = ( Index("idx_tag_name_tsv", "name_tsv", postgresql_using="gin"), )

class User(Base):
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLAlchemyEnum(UserRoleEnum, name="user_role_enum", native_enum=False, length=15, values_callable=enum_values), default=UserRoleEnum.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    recipe_associations = relationship("RecipeAuthor", back_populates="user")
    favorites = relationship("RecipeFavorite", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    cauldrons = relationship("Cauldron", back_populates="user")

class UserPreference(Base):
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    preference_key = Column(String(100), nullable=False, primary_key=True)
    preference_value = Column(TEXT, nullable=False)
    user = relationship("User", back_populates="preferences")