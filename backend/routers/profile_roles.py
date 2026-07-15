from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/profile-roles",
    tags=["Profile Roles"]
)


@router.post("/", response_model=schemas.ProfileRoleResponse)
def assign_role_to_profile(
    profile_role: schemas.ProfileRoleCreate,
    db: Session = Depends(get_db)
):
    profile = db.query(models.Profile).filter(
        models.Profile.ProfileId == profile_role.ProfileId
    ).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    role = db.query(models.Role).filter(
        models.Role.RoleId == profile_role.RoleId
    ).first()

    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")

    existing_relation = db.query(models.ProfileRole).filter(
        models.ProfileRole.ProfileId == profile_role.ProfileId,
        models.ProfileRole.RoleId == profile_role.RoleId
    ).first()

    if existing_relation is not None:
        raise HTTPException(
            status_code=400,
            detail="This role is already assigned to the profile"
        )

    new_profile_role = models.ProfileRole(**profile_role.model_dump())

    db.add(new_profile_role)
    db.commit()
    db.refresh(new_profile_role)

    return new_profile_role


@router.get("/", response_model=list[schemas.ProfileRoleResponse])
def get_profile_roles(db: Session = Depends(get_db)):
    profile_roles = db.query(models.ProfileRole).all()
    return profile_roles


@router.get("/profile/{profile_id}", response_model=list[schemas.ProfileRoleResponse])
def get_roles_by_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.Profile).filter(
        models.Profile.ProfileId == profile_id
    ).first()

    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile_roles = db.query(models.ProfileRole).filter(
        models.ProfileRole.ProfileId == profile_id
    ).all()

    return profile_roles


@router.delete("/{profile_role_id}")
def delete_profile_role(profile_role_id: int, db: Session = Depends(get_db)):
    profile_role = db.query(models.ProfileRole).filter(
        models.ProfileRole.ProfileRoleId == profile_role_id
    ).first()

    if profile_role is None:
        raise HTTPException(status_code=404, detail="Profile role relation not found")

    db.delete(profile_role)
    db.commit()

    return {"message": "Role removed from profile successfully"}