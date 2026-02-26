from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
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

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")


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


@app.get("/")
def serve_index():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.post("/countries", response_model=schemas.Country)
def add_country(country: schemas.CountryCreate, db: Session = Depends(get_db)):
    return crud.create_country(db=db, country=country)


@app.get("/countries", response_model=list[schemas.Country])
def list_countries(db: Session = Depends(get_db)):
    return crud.get_countries(db=db)


@app.get("/countries/{country_id}", response_model=schemas.Country)
def get_country(country_id: int, db: Session = Depends(get_db)):
    country = crud.get_country(db=db, country_id=country_id)
    if country is None:
        raise HTTPException(status_code=404, detail="Country not found")
    return country


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
                "id": country_schema.id,
                "name": country_schema.name,
                "score": round(calculate_score(country_schema), 2),
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored
