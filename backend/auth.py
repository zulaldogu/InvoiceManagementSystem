from typing import Annotated

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

import models
from database import get_db
from security import get_current_user


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
            models.Role.RoleId == models.ProfileRole.RoleId,
        )
        .join(
            models.UserProfile,
            models.ProfileRole.ProfileId
            == models.UserProfile.ProfileId,
        )
        .filter(
            models.UserProfile.UserId == current_user.UserId,
            models.UserProfile.CompanyId == current_user.CompanyId,
            models.ProfileRole.CompanyId == current_user.CompanyId,
            models.Role.CompanyId == current_user.CompanyId,
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