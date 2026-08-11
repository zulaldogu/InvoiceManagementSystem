from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import require_super_admin

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
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


def normalize_role_name(role_name: str) -> str:
    normalized_name = role_name.strip().upper()

    if not normalized_name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role name cannot be empty",
        )

    return normalized_name


@router.post(
    "/",
    response_model=schemas.RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    role_data: schemas.RoleCreate,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    get_active_company(role_data.CompanyId, db)

    role_name = normalize_role_name(role_data.RoleName)

    existing_role = (
        db.query(models.Role)
        .filter(
            models.Role.CompanyId == role_data.CompanyId,
            models.Role.RoleName == role_name,
        )
        .first()
    )

    if existing_role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role name already exists in this company",
        )

    description = (
        role_data.Description.strip()
        if role_data.Description
        else None
    )

    role = models.Role(
        RoleName=role_name,
        Description=description,
        CompanyId=role_data.CompanyId,
        UserId=current_user.UserId,
    )

    db.add(role)
    db.commit()
    db.refresh(role)

    return role


@router.get(
    "/",
    response_model=list[schemas.RoleResponse],
)
def get_roles(
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    return (
        db.query(models.Role)
        .order_by(
            models.Role.CompanyId,
            models.Role.RoleName,
        )
        .all()
    )


@router.get(
    "/{role_id}",
    response_model=schemas.RoleResponse,
)
def get_role(
    role_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    role = (
        db.query(models.Role)
        .filter(models.Role.RoleId == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    return role


@router.put(
    "/{role_id}",
    response_model=schemas.RoleResponse,
)
def update_role(
    role_id: int,
    role_data: schemas.RoleUpdate,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    role = (
        db.query(models.Role)
        .filter(models.Role.RoleId == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    updates = role_data.model_dump(exclude_unset=True)

    if "RoleName" in updates:
        role_name = normalize_role_name(updates["RoleName"])

        duplicate_role = (
            db.query(models.Role)
            .filter(
                models.Role.CompanyId == role.CompanyId,
                models.Role.RoleName == role_name,
                models.Role.RoleId != role.RoleId,
            )
            .first()
        )

        if duplicate_role is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists in this company",
            )

        role.RoleName = role_name

    if "Description" in updates:
        description = updates["Description"]
        role.Description = (
            description.strip()
            if description
            else None
        )

    db.commit()
    db.refresh(role)

    return role


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_role(
    role_id: int,
    db: DatabaseSession,
    current_user: SuperAdminUser,
):
    role = (
        db.query(models.Role)
        .filter(models.Role.RoleId == role_id)
        .first()
    )

    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    assigned_profile_role = (
        db.query(models.ProfileRole)
        .filter(models.ProfileRole.RoleId == role_id)
        .first()
    )

    if assigned_profile_role is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Role is assigned to a profile "
                "and cannot be deleted"
            ),
        )

    db.delete(role)
    db.commit()

    return None