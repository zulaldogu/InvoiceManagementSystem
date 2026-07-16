from fastapi import HTTPException
from sqlalchemy.orm import Session

import models


def user_has_role(user_id: int, role_name: str, db: Session) -> bool:
    role = (
        db.query(models.Role)
        .join(models.ProfileRole, models.Role.RoleId == models.ProfileRole.RoleId)
        .join(models.UserProfile, models.ProfileRole.ProfileId == models.UserProfile.ProfileId)
        .filter(models.UserProfile.UserId == user_id)
        .filter(models.Role.RoleName == role_name)
        .first()
    )

    return role is not None


def require_role(user_id: int, role_name: str, db: Session):
    user = db.query(models.User).filter(models.User.UserId == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if not user_has_role(user_id, role_name, db):
        raise HTTPException(
            status_code=403,
            detail=f"User does not have required role: {role_name}"
        )