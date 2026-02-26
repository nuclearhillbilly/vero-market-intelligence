from sqlalchemy.orm import Session

from . import models, schemas


def create_country(db: Session, country: schemas.CountryCreate) -> models.Country:
    payload = country.model_dump() if hasattr(country, "model_dump") else country.dict()
    db_country = models.Country(**payload)
    db.add(db_country)
    db.commit()
    db.refresh(db_country)
    return db_country


def get_countries(db: Session) -> list[models.Country]:
    return db.query(models.Country).all()
