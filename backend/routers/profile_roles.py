from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import require_super_admin

router = APIRouter(
    prefix="/profile-roles",
    tags=["Profile Roles"],
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
                "Profile and role must belong "
                "to an active company"
            ),
        )


@router.post(
    "/",
    response_model=schemas.ProfileRoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_role_to_profile(
    profile_role_data: schemas.ProfileRoleCreate,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    profile = (
        db.query(models.Profile)
        .filter(
            models.Profile.ProfileId
            == profile_role_data.ProfileId
        )
        .first()
    )

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    role = (
        db.query(models.Role)
        .filter(
            models.Role.RoleId
            == profile_role_data.RoleId
        )
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    if (
        profile.CompanyId is None
        or role.CompanyId is None
        or profile.CompanyId != role.CompanyId
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Profile and role must belong "
                "to the same company"
            ),
        )

    validate_active_company(profile.CompanyId, db)

    existing_relation = (
        db.query(models.ProfileRole)
        .filter(
            models.ProfileRole.ProfileId
            == profile_role_data.ProfileId,
            models.ProfileRole.RoleId
            == profile_role_data.RoleId,
        )
        .first()
    )

    if existing_relation is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "This role is already assigned "
                "to the profile"
            ),
        )

    profile_role = models.ProfileRole(
        ProfileId=profile.ProfileId,
        RoleId=role.RoleId,
        CompanyId=profile.CompanyId,
        UserId=current_user.UserId,
    )

    db.add(profile_role)
    db.commit()
    db.refresh(profile_role)

    return profile_role


@router.get(
    "/",
    response_model=list[schemas.ProfileRoleResponse],
)
def get_profile_roles(
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    return (
        db.query(models.ProfileRole)
        .order_by(
            models.ProfileRole.CompanyId,
            models.ProfileRole.ProfileId,
            models.ProfileRole.RoleId,
        )
        .all()
    )


@router.get(
    "/profile/{profile_id}",
    response_model=list[schemas.ProfileRoleResponse],
)
def get_roles_by_profile(
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

    return (
        db.query(models.ProfileRole)
        .filter(
            models.ProfileRole.ProfileId == profile_id
        )
        .order_by(models.ProfileRole.RoleId)
        .all()
    )


@router.delete("/{profile_role_id}")
def delete_profile_role(
    profile_role_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    profile_role = (
        db.query(models.ProfileRole)
        .filter(
            models.ProfileRole.ProfileRoleId
            == profile_role_id
        )
        .first()
    )

    if profile_role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile role relation not found",
        )

    db.delete(profile_role)
    db.commit()

    return {
        "message": "Role removed from profile successfully"
    }