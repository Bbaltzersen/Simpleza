# models/__init__.py

# Assuming each class resides in a correspondingly named snake_case file
# e.g., class RecipeIngredient is in models/recipe_ingredient.py

from .base import Base
from .alcampo_product_link import Product_Link


# Ensure __all__ matches the imported class names accurately
__all__ = [
    "Base",
    "Product_Link",
]