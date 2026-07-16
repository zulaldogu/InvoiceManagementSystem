from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_role

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_PRODUCTS", db)

    new_product = models.Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.get("/", response_model=list[schemas.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.ProductId == product_id).first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    return product


@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    updated_product: schemas.ProductUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_PRODUCTS", db)
    product = db.query(models.Product).filter(models.Product.ProductId == product_id).first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = updated_product.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_PRODUCTS", db)
    product = db.query(models.Product).filter(models.Product.ProductId == product_id).first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}