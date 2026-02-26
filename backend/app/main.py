from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


WEIGHTS = {
    "geological": 0.25,
    "political": 0.20,
    "legal": 0.15,
    "economic": 0.15,
    "market_access": 0.15,
    "security": 0.10,
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def calculate_score(country: schemas.Country) -> float:
    return (
        country.geological_score * WEIGHTS["geological"]
        + country.political_score * WEIGHTS["political"]
        + country.legal_score * WEIGHTS["legal"]
        + country.economic_score * WEIGHTS["economic"]
        + country.market_access_score * WEIGHTS["market_access"]
        + country.security_score * WEIGHTS["security"]
    )


@app.post("/countries", response_model=schemas.Country)
def add_country(country: schemas.CountryCreate, db: Session = Depends(get_db)):
    return crud.create_country(db=db, country=country)


@app.get("/countries", response_model=list[schemas.Country])
def list_countries(db: Session = Depends(get_db)):
    return crud.get_countries(db=db)


@app.post("/score")
def score_countries(db: Session = Depends(get_db)):
    countries = crud.get_countries(db=db)
    scored = []

    for country in countries:
        country_schema = (
            schemas.Country.model_validate(country)
            if hasattr(schemas.Country, "model_validate")
            else schemas.Country.from_orm(country)
        )
        scored.append(
            {
                "name": country_schema.name,
                "score": calculate_score(country_schema),
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored
