from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.UserName == user.UserName
    ).first()

    if existing_user is not None:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = models.User(**user.model_dump())

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return users


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.UserId == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    updated_user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.UserId == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.UserName = updated_user.UserName
    user.Password = updated_user.Password

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.UserId == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}