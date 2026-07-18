from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_role

router = APIRouter(
    prefix="/invoice-lines",
    tags=["Invoice Lines"]
)


def recalculate_invoice_total(invoice_id: int, db: Session):
    invoice_lines = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id
    ).all()

    total_amount = Decimal("0")

    for line in invoice_lines:
        total_amount += Decimal(line.Quantity) * Decimal(line.Price)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id
    ).first()

    if invoice is not None:
        invoice.TotalAmount = total_amount
        db.commit()
        db.refresh(invoice)


@router.post("/", response_model=schemas.InvoiceLineResponse)
def create_invoice_line(
    invoice_line: schemas.InvoiceLineCreate,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_INVOICES", db)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_line.InvoiceId
    ).first()

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    product = db.query(models.Product).filter(
        models.Product.ProductId == invoice_line.ProductId
    ).first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    new_invoice_line = models.InvoiceLine(
        InvoiceId=invoice_line.InvoiceId,
        ProductId=invoice_line.ProductId,
        ItemName=product.ProductName,
        Quantity=invoice_line.Quantity,
        Price=product.UnitPrice,
        UserId=invoice_line.UserId
    )

    db.add(new_invoice_line)
    db.commit()
    db.refresh(new_invoice_line)

    recalculate_invoice_total(invoice_line.InvoiceId, db)

    return new_invoice_line


@router.get("/", response_model=list[schemas.InvoiceLineResponse])
def get_invoice_lines(
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "VIEW_INVOICES", db)

    invoice_lines = db.query(models.InvoiceLine).all()
    return invoice_lines


@router.get("/invoice/{invoice_id}", response_model=list[schemas.InvoiceLineResponse])
def get_lines_by_invoice(
    invoice_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "VIEW_INVOICES", db)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id
    ).first()

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice_lines = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id
    ).all()

    return invoice_lines


@router.delete("/{invoice_line_id}")
def delete_invoice_line(
    invoice_line_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    require_role(user_id, "MANAGE_INVOICES", db)

    invoice_line = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceLineId == invoice_line_id
    ).first()

    if invoice_line is None:
        raise HTTPException(status_code=404, detail="Invoice line not found")

    invoice_id = invoice_line.InvoiceId

    db.delete(invoice_line)
    db.commit()

    recalculate_invoice_total(invoice_id, db)

    return {"message": "Invoice line deleted successfully"}