# models/recommendation_source.py
import uuid
from sqlalchemy import (
    Column, ForeignKey, Index, String, Text, Integer, Table,
    Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base
from .enums import SourceTypeEnum

# Association Table for Many-to-Many relationship
# between NutrientRecommendation and RecommendationSource
recommendation_source_association = Table(
    'recommendation_source_association',
    Base.metadata,
    Column('recommendation_id', UUID(as_uuid=True), ForeignKey('nutrient_recommendations.recommendation_id', ondelete='CASCADE'), primary_key=True),
    Column('source_id', UUID(as_uuid=True), ForeignKey('recommendation_sources.source_id', ondelete='CASCADE'), primary_key=True)
)

class RecommendationSource(Base):
    """
    Stores details about a source document (study, guideline, report)
    that supports one or more nutrient recommendations.
    """
    __tablename__ = "recommendation_sources"

    source_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    source_type = Column(
        SQLEnum(SourceTypeEnum, name='source_type_enum', create_type=True, native_enum=True),
        nullable=False,
        index=True
    )
    title = Column(Text, nullable=False)
    authors = Column(Text, nullable=True) # Consider comma-separated or JSON
    publication_year = Column(Integer, nullable=True, index=True)
    journal_or_publisher = Column(Text, nullable=True)
    # Identifiers for retrieval
    doi = Column(String(255), unique=True, nullable=True, index=True) # Digital Object Identifier
    pubmed_id = Column(String(50), unique=True, nullable=True, index=True) # PubMed ID
    url = Column(Text, nullable=True) # Link to full text or abstract
    # Brief summary or relevance note
    summary_snippet = Column(Text, nullable=True)
    # Optional: If this source *is* the issuing authority's main doc
    issuing_authority = Column(String(100), nullable=True, index=True)

    # --- Relationship ---
    # Recommendations that cite this source
    recommendations = relationship(
        "NutrientRecommendation",
        secondary=recommendation_source_association,
        back_populates="sources"
    )

    __table_args__ = (
        # Index potentially useful combinations
        Index("idx_source_authority_year", "issuing_authority", "publication_year"),
    )

    def __repr__(self):
        return f"<RecommendationSource(source_id='{self.source_id}', title='{self.title[:50]}...')>"