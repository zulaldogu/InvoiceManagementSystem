from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import require_role
from database import get_db


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


def get_company_id(current_user: models.User) -> int:
    if current_user.CompanyId is None:
        raise HTTPException(
            status_code=400,
            detail="Current user does not have a company context",
        )

    return current_user.CompanyId


@router.post("/", response_model=schemas.ProductResponse)
def create_product(
    product: schemas.ProductCreate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_PRODUCTS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    if product.ProductCode is not None:
        existing_product = db.query(models.Product).filter(
            models.Product.CompanyId == company_id,
            models.Product.ProductCode == product.ProductCode,
        ).first()

        if existing_product is not None:
            raise HTTPException(
                status_code=400,
                detail="Product code already exists in this company",
            )

    new_product = models.Product(
        ProductCode=product.ProductCode,
        ProductName=product.ProductName,
        UnitPrice=product.UnitPrice,
        VatRate=product.VatRate,
        CompanyId=company_id,
        UserId=current_user.UserId,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


@router.get("/", response_model=list[schemas.ProductResponse])
def get_products(
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_PRODUCTS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    return db.query(models.Product).filter(
        models.Product.CompanyId == company_id
    ).order_by(
        models.Product.ProductName
    ).all()


@router.get(
    "/{product_id}",
    response_model=schemas.ProductResponse,
)
def get_product(
    product_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_PRODUCTS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    product = db.query(models.Product).filter(
        models.Product.ProductId == product_id,
        models.Product.CompanyId == company_id,
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product


@router.put(
    "/{product_id}",
    response_model=schemas.ProductResponse,
)
def update_product(
    product_id: int,
    updated_product: schemas.ProductUpdate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_PRODUCTS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    product = db.query(models.Product).filter(
        models.Product.ProductId == product_id,
        models.Product.CompanyId == company_id,
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    update_data = updated_product.model_dump(exclude_unset=True)

    if (
        "ProductCode" in update_data
        and update_data["ProductCode"] is not None
    ):
        existing_product = db.query(models.Product).filter(
            models.Product.CompanyId == company_id,
            models.Product.ProductCode == update_data["ProductCode"],
            models.Product.ProductId != product_id,
        ).first()

        if existing_product is not None:
            raise HTTPException(
                status_code=400,
                detail="Product code already exists in this company",
            )

    for field_name, value in update_data.items():
        setattr(product, field_name, value)

    product.UserId = current_user.UserId

    db.commit()
    db.refresh(product)

    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_PRODUCTS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    product = db.query(models.Product).filter(
        models.Product.ProductId == product_id,
        models.Product.CompanyId == company_id,
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    referenced_line = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.ProductId == product_id,
        models.InvoiceLine.CompanyId == company_id,
    ).first()

    if referenced_line is not None:
        raise HTTPException(
            status_code=409,
            detail="Product is used by an invoice line and cannot be deleted",
        )

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}