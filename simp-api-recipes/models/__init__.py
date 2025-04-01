# Assuming your models are defined in a file named 'database_tables.py'
# (or similar) in the same directory
from .database_tables import (
    Base,
    User,
    Recipe,
    RecipeAuthor,
    RecipeIngredient,
    RecipeTag,  # Note: This is a Table object, not a class
    RecipeImage,
    RecipeStep,
    RecipeFavorite,
    RecipeAnalytic,
    Ingredient,
    IngredientNutritionValue,
    Nutrient,
    IngredientProduct,
    ApproximateMeasurement,
    Density,
    Tag,
    Product,
    ProductCompany,
    Company,
    UserPreference,
    Cauldron,
    CauldronMetric,
    # --- Added new models ---
    PopulationGroup,
    DietaryReferenceValue
)

__all__ = [
    "Base",
    "User",
    "Recipe",
    "RecipeAuthor",
    "RecipeIngredient",
    "RecipeTag",  # Keep if direct import of the Table object is desired
    "RecipeImage",
    "RecipeStep",
    "RecipeFavorite",
    "RecipeAnalytic",
    "Ingredient",
    "IngredientNutritionValue",
    "Nutrient",
    "IngredientProduct",
    "ApproximateMeasurement",
    "Density",
    "Tag",
    "Product",
    "ProductCompany",
    "Company",
    "UserPreference",
    "Cauldron",
    "CauldronMetric",
    "PopulationGroup",
    "DietaryReferenceValue",
]