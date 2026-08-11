from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import require_super_admin

router = APIRouter(
    prefix="/profiles",
    tags=["Profiles"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]
SuperAdminUser = Annotated[
    models.User,
    Depends(require_super_admin),
]


def get_active_company(
    company_id: int,
    db: Session,
) -> models.Company:
    company = (
        db.query(models.Company)
        .filter(
            models.Company.CompanyId == company_id,
            models.Company.IsActive.is_(True),
        )
        .first()
    )

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active company not found",
        )

    return company


def normalize_profile_name(profile_name: str) -> str:
    normalized_name = profile_name.strip()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Profile name cannot be empty",
        )

    return normalized_name


@router.post(
    "/",
    response_model=schemas.ProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_profile(
    profile_data: schemas.ProfileCreate,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    get_active_company(profile_data.CompanyId, db)

    profile_name = normalize_profile_name(
        profile_data.ProfileName
    )

    existing_profile = (
        db.query(models.Profile)
        .filter(
            models.Profile.CompanyId == profile_data.CompanyId,
            func.lower(models.Profile.ProfileName)
            == profile_name.lower(),
        )
        .first()
    )

    if existing_profile is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Profile name already exists "
                "in this company"
            ),
        )

    description = (
        profile_data.Description.strip()
        if profile_data.Description
        else None
    )

    profile = models.Profile(
        ProfileName=profile_name,
        Description=description,
        CompanyId=profile_data.CompanyId,
        UserId=current_user.UserId,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@router.get(
    "/",
    response_model=list[schemas.ProfileResponse],
)
def get_profiles(
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    return (
        db.query(models.Profile)
        .order_by(
            models.Profile.CompanyId,
            models.Profile.ProfileName,
        )
        .all()
    )


@router.get(
    "/{profile_id}",
    response_model=schemas.ProfileResponse,
)
def get_profile(
    profile_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    profile = (
        db.query(models.Profile)
        .filter(models.Profile.ProfileId == profile_id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    return profile


@router.put(
    "/{profile_id}",
    response_model=schemas.ProfileResponse,
)
def update_profile(
    profile_id: int,
    profile_data: schemas.ProfileUpdate,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    profile = (
        db.query(models.Profile)
        .filter(models.Profile.ProfileId == profile_id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    updates = profile_data.model_dump(exclude_unset=True)

    if "ProfileName" in updates:
        profile_name = normalize_profile_name(
            updates["ProfileName"]
        )

        duplicate_profile = (
            db.query(models.Profile)
            .filter(
                models.Profile.CompanyId == profile.CompanyId,
                func.lower(models.Profile.ProfileName)
                == profile_name.lower(),
                models.Profile.ProfileId
                != profile.ProfileId,
            )
            .first()
        )

        if duplicate_profile is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Profile name already exists "
                    "in this company"
                ),
            )

        profile.ProfileName = profile_name

    if "Description" in updates:
        description = updates["Description"]
        profile.Description = (
            description.strip()
            if description
            else None
        )

    db.commit()
    db.refresh(profile)

    return profile


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_profile(
    profile_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    profile = (
        db.query(models.Profile)
        .filter(models.Profile.ProfileId == profile_id)
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    assigned_role = (
        db.query(models.ProfileRole)
        .filter(
            models.ProfileRole.ProfileId == profile_id
        )
        .first()
    )

    assigned_user = (
        db.query(models.UserProfile)
        .filter(
            models.UserProfile.ProfileId == profile_id
        )
        .first()
    )

    if assigned_role is not None or assigned_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Profile has role or user assignments "
                "and cannot be deleted"
            ),
        )

    db.delete(profile)
    db.commit()

    return None