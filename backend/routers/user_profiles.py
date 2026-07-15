from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/user-profiles",
    tags=["User Profiles"]
)


@router.post("/", response_model=schemas.UserProfileResponse)
def assign_profile_to_user(
    user_profile: schemas.UserProfileCreate,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.UserId == user_profile.UserId
    ).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(models.Profile).filter(
        models.Profile.ProfileId == user_profile.ProfileId
    ).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    existing_relation = db.query(models.UserProfile).filter(
        models.UserProfile.UserId == user_profile.UserId,
        models.UserProfile.ProfileId == user_profile.ProfileId
    ).first()

    if existing_relation is not None:
        raise HTTPException(
            status_code=400,
            detail="This profile is already assigned to the user"
        )

    new_user_profile = models.UserProfile(**user_profile.model_dump())

    db.add(new_user_profile)
    db.commit()
    db.refresh(new_user_profile)

    return new_user_profile


@router.get("/", response_model=list[schemas.UserProfileResponse])
def get_user_profiles(db: Session = Depends(get_db)):
    user_profiles = db.query(models.UserProfile).all()
    return user_profiles


@router.get("/user/{user_id}", response_model=list[schemas.UserProfileResponse])
def get_profiles_by_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.UserId == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user_profiles = db.query(models.UserProfile).filter(
        models.UserProfile.UserId == user_id
    ).all()

    return user_profiles


@router.delete("/{user_profile_id}")
def delete_user_profile(user_profile_id: int, db: Session = Depends(get_db)):
    user_profile = db.query(models.UserProfile).filter(
        models.UserProfile.UserProfileId == user_profile_id
    ).first()

    if user_profile is None:
        raise HTTPException(status_code=404, detail="User profile relation not found")

    db.delete(user_profile)
    db.commit()

    return {"message": "Profile removed from user successfully"}