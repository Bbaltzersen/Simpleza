# models/nutrient_recommendation.py
import uuid
from decimal import Decimal
from sqlalchemy import (
    Column, Numeric, ForeignKey, Index, String, Integer, Date, Text,
    Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
# Import Enums and the association table
from .enums import SexEnum, LifeStageEnum, RecommendationTypeEnum, EvidenceLevelEnum
from .recommendation_source import recommendation_source_association # Import association table

class NutrientRecommendation(Base):
    """
    Stores Dietary Reference Intakes (DRI) or other recommendations,
    enhanced with source linking and context.
    """
    __tablename__ = "nutrient_recommendations"

    recommendation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nutrient_id = Column(
        UUID(as_uuid=True),
        ForeignKey('nutrients.nutrient_id', ondelete='RESTRICT'),
        nullable=False,
        index=True
    )

    # --- Demographic / Group Criteria ---
    life_stage = Column(
        SQLEnum(LifeStageEnum, name='life_stage_enum', create_type=True, native_enum=True),
        nullable=False,
        index=True
    )
    # NEW: Specific condition or context beyond general life stage
    # e.g., 'Type 2 Diabetes', 'Smoker', 'Vegan Diet', 'High Altitude'
    # Could eventually link to a structured Conditions table.
    condition = Column(Text, nullable=True, index=True)

    # --- Recommendation Value ---
    recommendation_type = Column(
        SQLEnum(RecommendationTypeEnum, name='recommendation_type_enum', create_type=True, native_enum=True),
        nullable=False,
        index=True
    )
    value = Column(Numeric(12, 5), nullable=False)
    value_upper = Column(Numeric(12, 5), nullable=True)

    # --- Metadata & Credibility ---
    # Authority *issuing* this specific recommendation line (might be a study author/group)
    authority = Column(String(100), nullable=False, default='Default', index=True)
    effective_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True) # General commentary on the recommendation

    # NEW: Evidence level supporting this specific recommendation value
    evidence_level = Column(
        SQLEnum(EvidenceLevelEnum, name='evidence_level_enum', create_type=True, native_enum=True),
        nullable=True, # May not always be assessed
        index=True
    )

    # --- Relationships ---
    nutrient = relationship("Nutrient", back_populates="recommendations")
    # NEW: Many-to-Many relationship to source documents
    sources = relationship(
        "RecommendationSource",
        secondary=recommendation_source_association,
        back_populates="recommendations",
        lazy='selectin' # Consider 'selectin' loading for efficiency if often needed
    )

    __table_args__ = (
        # Ensure uniqueness for a given nutrient, group, context, type, and authority
        Index("uq_recommendation_context",
              "nutrient_id", "life_stage", "condition", "recommendation_type", "authority",
              unique=True),
    )

    def __repr__(self):
        life_stage_name = self.life_stage.name if self.life_stage else None
        rec_type_name = self.recommendation_type.name if self.recommendation_type else None
        condition_info = f", condition='{self.condition}'" if self.condition else ""
        return (f"<NutrientRecommendation(nutrient_id='{self.nutrient_id}', "
                f"life_stage='{life_stage_name}'{condition_info}, type='{rec_type_name}', value='{self.value}')>")