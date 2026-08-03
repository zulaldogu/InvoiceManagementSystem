from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import (
    get_current_user,
    hash_password,
    require_super_admin,
)


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post("/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    current_user: Annotated[
        models.User,
        Depends(require_super_admin),
    ],
    db: Session = Depends(get_db),
):
    existing_user = db.query(models.User).filter(
        models.User.UserName == user.UserName
    ).first()

    if existing_user is not None:
        raise HTTPException(
            status_code=400,
            detail="Username already exists",
        )

    if not user.IsSuperAdmin and user.CompanyId is None:
        raise HTTPException(
            status_code=400,
            detail="CompanyId is required for company users",
        )

    if user.CompanyId is not None:
        company = db.query(models.Company).filter(
            models.Company.CompanyId == user.CompanyId,
            models.Company.IsActive.is_(True),
        ).first()

        if company is None:
            raise HTTPException(
                status_code=404,
                detail="Active company not found",
            )

    new_user = models.User(
        UserName=user.UserName,
        Password=hash_password(user.Password),
        CompanyId=user.CompanyId,
        IsSuperAdmin=user.IsSuperAdmin,
        IsActive=user.IsActive,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
    db: Session = Depends(get_db),
):
    query = db.query(models.User)

    if not current_user.IsSuperAdmin:
        query = query.filter(
            models.User.CompanyId == current_user.CompanyId
        )

    return query.all()


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
    db: Session = Depends(get_db),
):
    query = db.query(models.User).filter(
        models.User.UserId == user_id
    )

    if not current_user.IsSuperAdmin:
        query = query.filter(
            models.User.CompanyId == current_user.CompanyId
        )

    user = query.first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    updated_user: schemas.UserUpdate,
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.UserId == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if not current_user.IsSuperAdmin and current_user.UserId != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own account",
        )

    if updated_user.UserName is not None:
        existing_user = db.query(models.User).filter(
            models.User.UserName == updated_user.UserName,
            models.User.UserId != user_id,
        ).first()

        if existing_user is not None:
            raise HTTPException(
                status_code=400,
                detail="Username already exists",
            )

        user.UserName = updated_user.UserName

    if updated_user.Password is not None:
        user.Password = hash_password(updated_user.Password)

    if updated_user.IsActive is not None:
        if not current_user.IsSuperAdmin:
            raise HTTPException(
                status_code=403,
                detail="Only a super administrator can change account status",
            )

        user.IsActive = updated_user.IsActive

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_super_admin),
    ],
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(
        models.User.UserId == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.UserId == current_user.UserId:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    user.IsActive = False
    db.commit()

    return {"message": "User account deactivated successfully"}
