from typing import Annotated

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from security import get_current_user


def get_user_profile_names(
    current_user: models.User,
    db: Session,
) -> list[str]:
    if current_user.IsSuperAdmin:
        return ["SUPER_ADMIN"]

    if current_user.CompanyId is None:
        return []

    rows = (
        db.query(models.Profile.ProfileName)
        .join(
            models.UserProfile,
            models.Profile.ProfileId
            == models.UserProfile.ProfileId,
        )
        .filter(
            models.UserProfile.UserId
            == current_user.UserId,
            models.UserProfile.CompanyId
            == current_user.CompanyId,
            models.Profile.CompanyId
            == current_user.CompanyId,
        )
        .distinct()
        .order_by(models.Profile.ProfileName)
        .all()
    )

    return [profile_name for (profile_name,) in rows]


def get_user_role_names(
    current_user: models.User,
    db: Session,
) -> list[str]:
    if current_user.IsSuperAdmin:
        return ["*"]

    if current_user.CompanyId is None:
        return []

    rows = (
        db.query(models.Role.RoleName)
        .join(
            models.ProfileRole,
            models.Role.RoleId
            == models.ProfileRole.RoleId,
        )
        .join(
            models.Profile,
            models.Profile.ProfileId
            == models.ProfileRole.ProfileId,
        )
        .join(
            models.UserProfile,
            models.Profile.ProfileId
            == models.UserProfile.ProfileId,
        )
        .filter(
            models.UserProfile.UserId
            == current_user.UserId,
            models.UserProfile.CompanyId
            == current_user.CompanyId,
            models.Profile.CompanyId
            == current_user.CompanyId,
            models.ProfileRole.CompanyId
            == current_user.CompanyId,
            models.Role.CompanyId
            == current_user.CompanyId,
        )
        .distinct()
        .order_by(models.Role.RoleName)
        .all()
    )

    return [role_name for (role_name,) in rows]


def user_has_role(
    current_user: models.User,
    role_name: str,
    db: Session,
) -> bool:
    if current_user.IsSuperAdmin:
        return True

    if current_user.CompanyId is None:
        return False

    role = (
        db.query(models.Role)
        .join(
            models.ProfileRole,
            models.Role.RoleId
            == models.ProfileRole.RoleId,
        )
        .join(
            models.Profile,
            models.Profile.ProfileId
            == models.ProfileRole.ProfileId,
        )
        .join(
            models.UserProfile,
            models.Profile.ProfileId
            == models.UserProfile.ProfileId,
        )
        .filter(
            models.UserProfile.UserId
            == current_user.UserId,
            models.UserProfile.CompanyId
            == current_user.CompanyId,
            models.Profile.CompanyId
            == current_user.CompanyId,
            models.ProfileRole.CompanyId
            == current_user.CompanyId,
            models.Role.CompanyId
            == current_user.CompanyId,
            models.Role.RoleName == role_name,
        )
        .first()
    )

    return role is not None


def require_role(role_name: str):
    def role_dependency(
        current_user: Annotated[
            models.User,
            Depends(get_current_user),
        ],
        db: Session = Depends(get_db),
    ) -> models.User:
        if not user_has_role(current_user, role_name, db):
            raise HTTPException(
                status_code=403,
                detail=(
                    "Current user does not have required role: "
                    f"{role_name}"
                ),
            )

        return current_user

    return role_dependency