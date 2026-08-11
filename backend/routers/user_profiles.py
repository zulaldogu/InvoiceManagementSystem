from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import require_super_admin

router = APIRouter(
    prefix="/user-profiles",
    tags=["User Profiles"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]
SuperAdminUser = Annotated[
    models.User,
    Depends(require_super_admin),
]


def validate_active_company(
    company_id: int,
    db: Session,
) -> None:
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "User and profile must belong "
                "to an active company"
            ),
        )


@router.post(
    "/",
    response_model=schemas.UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_profile_to_user(
    user_profile_data: schemas.UserProfileCreate,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    user = (
        db.query(models.User)
        .filter(
            models.User.UserId
            == user_profile_data.UserId
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.IsActive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Profile cannot be assigned "
                "to an inactive user"
            ),
        )

    profile = (
        db.query(models.Profile)
        .filter(
            models.Profile.ProfileId
            == user_profile_data.ProfileId
        )
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    if (
        user.CompanyId is None
        or profile.CompanyId is None
        or user.CompanyId != profile.CompanyId
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "User and profile must belong "
                "to the same company"
            ),
        )

    validate_active_company(user.CompanyId, db)

    existing_relation = (
        db.query(models.UserProfile)
        .filter(
            models.UserProfile.UserId
            == user_profile_data.UserId,
            models.UserProfile.ProfileId
            == user_profile_data.ProfileId,
        )
        .first()
    )

    if existing_relation is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This profile is already assigned "
                "to the user"
            ),
        )

    user_profile = models.UserProfile(
        UserId=user.UserId,
        ProfileId=profile.ProfileId,
        CompanyId=user.CompanyId,
    )

    db.add(user_profile)
    db.commit()
    db.refresh(user_profile)

    return user_profile


@router.get(
    "/",
    response_model=list[schemas.UserProfileResponse],
)
def get_user_profiles(
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    return (
        db.query(models.UserProfile)
        .order_by(
            models.UserProfile.CompanyId,
            models.UserProfile.UserId,
            models.UserProfile.ProfileId,
        )
        .all()
    )


@router.get(
    "/user/{user_id}",
    response_model=list[schemas.UserProfileResponse],
)
def get_profiles_by_user(
    user_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    user = (
        db.query(models.User)
        .filter(models.User.UserId == user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return (
        db.query(models.UserProfile)
        .filter(models.UserProfile.UserId == user_id)
        .order_by(models.UserProfile.ProfileId)
        .all()
    )


@router.delete("/{user_profile_id}")
def delete_user_profile(
    user_profile_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    user_profile = (
        db.query(models.UserProfile)
        .filter(
            models.UserProfile.UserProfileId
            == user_profile_id
        )
        .first()
    )

    if user_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile relation not found",
        )

    db.delete(user_profile)
    db.commit()

    return {
        "message": "Profile removed from user successfully"
    }