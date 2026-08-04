from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import require_role
from database import get_db


router = APIRouter(
    prefix="/invoice-lines",
    tags=["Invoice Lines"],
)


def get_company_id(current_user: models.User) -> int:
    if current_user.CompanyId is None:
        raise HTTPException(
            status_code=400,
            detail="Current user does not have a company context",
        )

    return current_user.CompanyId


def recalculate_invoice_total(
    invoice_id: int,
    company_id: int,
    db: Session,
) -> None:
    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id,
        models.Invoice.CompanyId == company_id,
    ).first()

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    invoice_lines = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id,
        models.InvoiceLine.CompanyId == company_id,
    ).all()

    invoice.TotalAmount = sum(
        (
            Decimal(line.Quantity) * Decimal(line.Price)
            for line in invoice_lines
        ),
        Decimal("0.00"),
    )


@router.post("/", response_model=schemas.InvoiceLineResponse)
def create_invoice_line(
    invoice_line: schemas.InvoiceLineCreateRequest,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_line.InvoiceId,
        models.Invoice.CompanyId == company_id,
    ).first()

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    product = db.query(models.Product).filter(
        models.Product.ProductId == invoice_line.ProductId,
        models.Product.CompanyId == company_id,
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    line_price = (
        invoice_line.Price
        if invoice_line.Price is not None
        else Decimal(product.UnitPrice)
    )

    try:
        new_invoice_line = models.InvoiceLine(
            InvoiceId=invoice.InvoiceId,
            ProductId=product.ProductId,
            ItemName=product.ProductName,
            Quantity=invoice_line.Quantity,
            Price=line_price,
            CompanyId=company_id,
            UserId=current_user.UserId,
        )

        db.add(new_invoice_line)
        db.flush()

        recalculate_invoice_total(
            invoice.InvoiceId,
            company_id,
            db,
        )

        db.commit()
        db.refresh(new_invoice_line)

    except Exception:
        db.rollback()
        raise

    return new_invoice_line


@router.get(
    "/",
    response_model=list[schemas.InvoiceLineResponse],
)
def get_invoice_lines(
    current_user: Annotated[
        models.User,
        Depends(require_role("VIEW_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    return db.query(models.InvoiceLine).filter(
        models.InvoiceLine.CompanyId == company_id
    ).order_by(
        models.InvoiceLine.InvoiceLineId
    ).all()


@router.get(
    "/invoice/{invoice_id}",
    response_model=list[schemas.InvoiceLineResponse],
)
def get_lines_by_invoice(
    invoice_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("VIEW_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id,
        models.Invoice.CompanyId == company_id,
    ).first()

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    return db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id,
        models.InvoiceLine.CompanyId == company_id,
    ).order_by(
        models.InvoiceLine.InvoiceLineId
    ).all()


@router.put(
    "/{invoice_line_id}",
    response_model=schemas.InvoiceLineResponse,
)
def update_invoice_line(
    invoice_line_id: int,
    updated_line: schemas.InvoiceLineUpdate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice_line = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceLineId == invoice_line_id,
        models.InvoiceLine.CompanyId == company_id,
    ).first()

    if invoice_line is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice line not found",
        )

    update_data = updated_line.model_dump(exclude_unset=True)

    try:
        if (
            "ProductId" in update_data
            and update_data["ProductId"] is not None
        ):
            product = db.query(models.Product).filter(
                models.Product.ProductId
                == update_data["ProductId"],
                models.Product.CompanyId == company_id,
            ).first()

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail="Product not found",
                )

            invoice_line.ProductId = product.ProductId
            invoice_line.ItemName = product.ProductName

            if "Price" not in update_data:
                invoice_line.Price = product.UnitPrice

        if (
            "Quantity" in update_data
            and update_data["Quantity"] is not None
        ):
            invoice_line.Quantity = update_data["Quantity"]

        if (
            "Price" in update_data
            and update_data["Price"] is not None
        ):
            invoice_line.Price = update_data["Price"]

        invoice_line.UserId = current_user.UserId

        db.flush()

        recalculate_invoice_total(
            invoice_line.InvoiceId,
            company_id,
            db,
        )

        db.commit()
        db.refresh(invoice_line)

    except Exception:
        db.rollback()
        raise

    return invoice_line


@router.delete("/{invoice_line_id}")
def delete_invoice_line(
    invoice_line_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice_line = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceLineId == invoice_line_id,
        models.InvoiceLine.CompanyId == company_id,
    ).first()

    if invoice_line is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice line not found",
        )

    invoice_id = invoice_line.InvoiceId

    try:
        db.delete(invoice_line)
        db.flush()

        recalculate_invoice_total(
            invoice_id,
            company_id,
            db,
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {"message": "Invoice line deleted successfully"}