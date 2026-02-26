from pydantic import BaseModel, Field


class CountryBase(BaseModel):
    name: str
    geological_score: float = Field(..., ge=0, le=10)
    political_score: float = Field(..., ge=0, le=10)
    legal_score: float = Field(..., ge=0, le=10)
    economic_score: float = Field(..., ge=0, le=10)
    market_access_score: float = Field(..., ge=0, le=10)
    security_score: float = Field(..., ge=0, le=10)


class CountryCreate(CountryBase):
    pass


class Country(CountryBase):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True
