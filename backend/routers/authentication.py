from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
from auth import (
    get_user_profile_names,
    get_user_role_names,
)
from database import get_db
from security import (
    authenticate_user,
    create_access_token,
    get_current_user,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=schemas.TokenResponse,
)
def login(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends(),
    ],
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        form_data.username,
        form_data.password,
        db,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=schemas.UserResponse,
)
def get_me(
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
):
    return current_user


@router.get(
    "/me/authorization",
    response_model=schemas.CurrentAuthorizationResponse,
)
def get_my_authorization(
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
    db: Session = Depends(get_db),
):
    return schemas.CurrentAuthorizationResponse(
        UserId=current_user.UserId,
        CompanyId=current_user.CompanyId,
        IsSuperAdmin=current_user.IsSuperAdmin,
        Profiles=get_user_profile_names(
            current_user,
            db,
        ),
        Roles=get_user_role_names(
            current_user,
            db,
        ),
    )