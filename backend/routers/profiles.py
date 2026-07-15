from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"]
)


@router.post("/", response_model=schemas.ProfileResponse)
def create_profile(profile: schemas.ProfileCreate, db: Session = Depends(get_db)):
    new_profile = models.Profile(**profile.model_dump())

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@router.get("/", response_model=list[schemas.ProfileResponse])
def get_profiles(db: Session = Depends(get_db)):
    profiles = db.query(models.Profile).all()
    return profiles


@router.get("/{profile_id}", response_model=schemas.ProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.ProfileId == profile_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


@router.put("/{profile_id}", response_model=schemas.ProfileResponse)
def update_profile(
    profile_id: int,
    updated_profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(models.Profile.ProfileId == profile_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = updated_profile.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return profile


@router.delete("/{profile_id}")
def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(models.Profile.ProfileId == profile_id).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.delete(profile)
    db.commit()

    return {"message": "Profile deleted successfully"}