from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_role

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"]
)


@router.post("/", response_model=schemas.InvoiceResponse)
def create_invoice(
    invoice: schemas.InvoiceCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_INVOICES", db)

    customer = db.query(models.Customer).filter(
        models.Customer.CustomerId == invoice.CustomerId
    ).first()

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    invoice_data = invoice.model_dump(exclude={"Lines"})
    new_invoice = models.Invoice(**invoice_data)

    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    return new_invoice


@router.get("/", response_model=list[schemas.InvoiceResponse])
def get_invoices(
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "VIEW_INVOICES", db)

    invoices = db.query(models.Invoice).all()
    return invoices


@router.get("/{invoice_id}", response_model=schemas.InvoiceDetailResponse)
def get_invoice(invoice_id: int, user_id: int, db: Session = Depends(get_db)):
    require_role(user_id, "VIEW_INVOICES", db)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id
    ).first()

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    lines = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id
    ).all()

    invoice_data = {
        "InvoiceId": invoice.InvoiceId,
        "CustomerId": invoice.CustomerId,
        "InvoiceNumber": invoice.InvoiceNumber,
        "InvoiceDate": invoice.InvoiceDate,
        "TotalAmount": invoice.TotalAmount,
        "UserId": invoice.UserId,
        "RecordDate": invoice.RecordDate,
        "Lines": lines
    }

    return invoice_data


@router.put("/{invoice_id}", response_model=schemas.InvoiceResponse)
def update_invoice(
    invoice_id: int,
    updated_invoice: schemas.InvoiceUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_INVOICES", db)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id
    ).first()

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = updated_invoice.model_dump(exclude_unset=True)

    if "CustomerId" in update_data:
        customer = db.query(models.Customer).filter(
            models.Customer.CustomerId == update_data["CustomerId"]
        ).first()

        if customer is None:
            raise HTTPException(status_code=404, detail="Customer not found")

    for key, value in update_data.items():
        setattr(invoice, key, value)

    db.commit()
    db.refresh(invoice)

    return invoice


@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, user_id: int, db: Session = Depends(get_db)):
    require_role(user_id, "MANAGE_INVOICES", db)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id
    ).first()

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id
    ).delete()

    db.delete(invoice)
    db.commit()

    return {"message": "Invoice and related invoice lines deleted successfully"}