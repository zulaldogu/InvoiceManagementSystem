import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

import models
from database import get_db


JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)


def get_jwt_secret_key() -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")

    if secret_key is None or len(secret_key) < 32:
        raise RuntimeError(
            "JWT_SECRET_KEY must contain at least 32 characters."
        )

    return secret_key


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    stored_password: str,
) -> bool:
    if stored_password.startswith("$argon2"):
        return password_hash.verify(
            plain_password,
            stored_password,
        )

    return secrets.compare_digest(
        plain_password,
        stored_password,
    )


def authenticate_user(
    username: str,
    password: str,
    db: Session,
) -> models.User | None:
    user = db.query(models.User).filter(
        models.User.UserName == username
    ).first()

    if user is None or not user.IsActive:
        return None
    if not user.IsSuperAdmin:
        if user.CompanyId is None:
            return None

        company = db.query(models.Company).filter(
            models.Company.CompanyId == user.CompanyId,
            models.Company.IsActive.is_(True),
        ).first()

        if company is None:
            return None

    if not verify_password(password, user.Password):
        return None

    if not user.Password.startswith("$argon2"):
        user.Password = hash_password(password)
        db.commit()
        db.refresh(user)

    return user


def create_access_token(user: models.User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user.UserId),
        "company_id": user.CompanyId,
        "is_super_admin": bool(user.IsSuperAdmin),
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        get_jwt_secret_key(),
        algorithm=JWT_ALGORITHM,
    )


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            get_jwt_secret_key(),
            algorithms=[JWT_ALGORITHM],
        )

        subject = payload.get("sub")

        if subject is None:
            raise credentials_exception

        user_id = int(subject)

    except (InvalidTokenError, TypeError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.UserId == user_id
    ).first()

    if user is None or not user.IsActive:
        raise credentials_exception
    if not user.IsSuperAdmin:
        if user.CompanyId is None:
            raise credentials_exception

        company = db.query(models.Company).filter(
            models.Company.CompanyId == user.CompanyId,
            models.Company.IsActive.is_(True),
        ).first()

        if company is None:
            raise credentials_exception

    return user


def require_super_admin(
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
) -> models.User:
    if not current_user.IsSuperAdmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super administrator permission is required",
        )

    return current_user
