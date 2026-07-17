from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_role

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.post("/", response_model=schemas.CustomerResponse)
def create_customer(
    customer: schemas.CustomerCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_CUSTOMERS", db)

    new_customer = models.Customer(**customer.model_dump())

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    return new_customer


@router.get("/", response_model=list[schemas.CustomerResponse])
def get_customers(
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "VIEW_CUSTOMERS", db)

    customers = db.query(models.Customer).all()
    return customers


@router.get("/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(
    customer_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "VIEW_CUSTOMERS", db)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == customer_id
    ).first()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    return customer


@router.put("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(
    customer_id: int,
    updated_customer: schemas.CustomerUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_CUSTOMERS", db)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == customer_id
    ).first()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = updated_customer.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(customer, key, value)

    db.commit()
    db.refresh(customer)

    return customer


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_CUSTOMERS", db)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == customer_id
    ).first()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()

    return {"message": "Customer deleted successfully"}