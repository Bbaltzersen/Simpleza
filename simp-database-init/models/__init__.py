# models/__init__.py

# Assuming each class resides in a correspondingly named snake_case file
# e.g., class RecipeIngredient is in models/recipe_ingredient.py

from .base import Base
from .alcampo_product_link import Product_Link
from .user import User
from .recipe import Recipe
from .recipe_author import RecipeAuthor
from .recipe_ingredient import RecipeIngredient
from .recipe_tag import RecipeTag
from .recipe_image import RecipeImage
from .recipe_step import RecipeStep
from .recipe_favorite import RecipeFavorite
from .recipe_analytics import RecipeAnalytics
from .ingredient import Ingredient
from .ingredient_nutrient import IngredientNutrient
from .ingredient_alias import IngredientAlias
from .nutrient import Nutrient
from .ingredient_product import IngredientProduct
from .approximate_measurement import ApproximateMeasurement
from .density import Density # Assuming Density model exists in density.py
from .tag import Tag
from .product import Product
from .product_company import ProductCompany
from .company import Company
from .user_preference import UserPreference
from .cauldron import Cauldron
from .cauldron_data import CauldronData
# --- Added New Tables ---
from .nutrientRecommendation import NutrientRecommendation # For DRI/RDA values
from .recommendation_source import RecommendationSource # For sources of recommendations
# Note: The association table 'recommendation_source_association' is typically defined
# within recommendation_source.py or nutrient_recommendation.py and doesn't need
# to be explicitly imported here unless used directly elsewhere.


# Ensure __all__ matches the imported class names accurately
__all__ = [
    "Base",
    "Product_Link",
    "User",
    "Recipe",
    "RecipeAuthor",
    "RecipeIngredient",
    "RecipeTag",
    "RecipeImage",
    "RecipeStep",
    "RecipeFavorite",
    "RecipeAnalytics",
    "Ingredient",
    "IngredientNutrient",
    "IngredientAlias",
    "Nutrient",
    "IngredientProduct",
    "ApproximateMeasurement",
    "Density",
    "Tag",
    "Product",
    "ProductCompany",
    "Company",
    "UserPreference",
    "AlcampoProductID",
    "Cauldron",
    "CauldronData",
    # --- Added New Class Names ---
    "NutrientRecommendation",
    "RecommendationSource",
]