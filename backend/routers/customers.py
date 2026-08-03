from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import require_role
from database import get_db


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


def get_company_id(current_user: models.User) -> int:
    if current_user.CompanyId is None:
        raise HTTPException(
            status_code=400,
            detail="Current user does not have a company context",
        )

    return current_user.CompanyId


@router.post("/", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_CUSTOMERS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    tax_number = (
        customer.TaxNumber.strip()
        if customer.TaxNumber
        else None
    )

    if tax_number is not None:
        existing_customer = db.query(models.Customer).filter(
            models.Customer.CompanyId == company_id,
            models.Customer.TaxNumber == tax_number,
        ).first()

        if existing_customer is not None:
            raise HTTPException(
                status_code=400,
                detail="Tax number already exists in this company",
            )

    new_customer = models.Customer(
        TaxNumber=tax_number,
        Title=customer.Title.strip(),
        Address=customer.Address,
        EMail=customer.EMail,
        CompanyId=company_id,
        UserId=current_user.UserId,
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("/", response_model=list[schemas.CustomerResponse])
def get_customers(
    current_user: Annotated[
        models.User,
        Depends(require_role("VIEW_CUSTOMERS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    return db.query(models.Customer).filter(
        models.Customer.CompanyId == company_id
    ).order_by(
        models.Customer.Title
    ).all()


@router.get(
    "/{customer_id}",
    response_model=schemas.CustomerResponse,
)
def get_customer(
    customer_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("VIEW_CUSTOMERS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == customer_id,
        models.Customer.CompanyId == company_id,
    ).first()

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return customer


@router.put(
    "/{customer_id}",
    response_model=schemas.CustomerResponse,
)
def update_customer(
    customer_id: int,
    updated_customer: schemas.CustomerUpdate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_CUSTOMERS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == customer_id,
        models.Customer.CompanyId == company_id,
    ).first()

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    update_data = updated_customer.model_dump(exclude_unset=True)

    if "TaxNumber" in update_data:
        tax_number = (
            update_data["TaxNumber"].strip()
            if update_data["TaxNumber"]
            else None
        )

        if tax_number is not None:
            existing_customer = db.query(models.Customer).filter(
                models.Customer.CompanyId == company_id,
                models.Customer.TaxNumber == tax_number,
                models.Customer.CustomerId != customer_id,
            ).first()

            if existing_customer is not None:
                raise HTTPException(
                    status_code=400,
                    detail="Tax number already exists in this company",
                )

        update_data["TaxNumber"] = tax_number

    if (
        "Title" in update_data
        and update_data["Title"] is not None
    ):
        update_data["Title"] = update_data["Title"].strip()

    for field_name, value in update_data.items():
        setattr(customer, field_name, value)

    customer.UserId = current_user.UserId

    db.commit()
    db.refresh(customer)

    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_CUSTOMERS")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == customer_id,
        models.Customer.CompanyId == company_id,
    ).first()

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    referenced_invoice = db.query(models.Invoice).filter(
        models.Invoice.CustomerId == customer_id,
        models.Invoice.CompanyId == company_id,
    ).first()

    if referenced_invoice is not None:
        raise HTTPException(
            status_code=409,
            detail="Customer is used by an invoice and cannot be deleted",
        )

    db.delete(customer)
    db.commit()

    return {"message": "Customer deleted successfully"}