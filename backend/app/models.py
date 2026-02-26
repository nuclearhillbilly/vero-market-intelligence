from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    geological_score = Column(Float, nullable=False)
    political_score = Column(Float, nullable=False)
    legal_score = Column(Float, nullable=False)
    economic_score = Column(Float, nullable=False)
    market_access_score = Column(Float, nullable=False)
    security_score = Column(Float, nullable=False)
